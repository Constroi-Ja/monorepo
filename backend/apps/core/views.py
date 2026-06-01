import logging
import re

import mercadopago
from django.conf import settings
from django.db.models import Avg, Q
from django.utils import timezone
from rest_framework import generics, serializers, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth import get_user_model

from apps.authentication.models import Company, Provider
from apps.payments.models import PaymentOrder

from .models import Bill, CartItem, Deliverer, InventoryEntry, Item, Order, OrderItem, OrderMessage, Review, TechnicalVisitRequest, VisitMessage
from .serializers import (
    BillSerializer,
    CartItemSerializer,
    CreateOrderSerializer,
    CreateVisitWithPaymentSerializer,
    DelivererSerializer,
    InventoryEntrySerializer,
    ItemCreateSerializer,
    ItemSerializer,
    ItemUpdateSerializer,
    OrderMessageSerializer,
    OrderSerializer,
    PublicItemSerializer,
    ReviewSerializer,
    TechnicalVisitRequestSerializer,
    VisitMessageSerializer,
)

logger = logging.getLogger(__name__)


def _mp_sdk() -> mercadopago.SDK:
    return mercadopago.SDK(settings.MERCADOPAGO_ACCESS_TOKEN)


def _clean_cpf(cpf: str) -> str:
    return re.sub(r"[^\d]", "", cpf)


def _refund_payment_order(payment_order: PaymentOrder) -> bool:
    """Cancel or refund a PaymentOrder. Mirrors logic in payments.views.refund_payment."""
    if not payment_order.mp_payment_id:
        payment_order.status = PaymentOrder.Status.CANCELLED
        payment_order.save(update_fields=["status", "updated_at"])
        return True
    sdk = _mp_sdk()
    try:
        if payment_order.status == PaymentOrder.Status.PENDING:
            result = sdk.payment().update(payment_order.mp_payment_id, {"status": "cancelled"})
            if result.get("status") in (200, 201):
                payment_order.status = PaymentOrder.Status.CANCELLED
                payment_order.save(update_fields=["status", "updated_at"])
                return True
        elif payment_order.status == PaymentOrder.Status.APPROVED:
            result = sdk.refund().create({"payment_id": payment_order.mp_payment_id})
            if result.get("status") in (200, 201):
                payment_order.status = PaymentOrder.Status.REFUNDED
                payment_order.save(update_fields=["status", "updated_at"])
                return True
    except Exception as exc:
        logger.exception("Erro ao reembolsar pagamento %s: %s", payment_order.id, exc)
    return False


def _cancel_expired_pending_visits() -> None:
    """Auto-cancel pending visits that exceeded the 20-minute acceptance window."""
    from datetime import timedelta
    deadline = timezone.now() - timedelta(minutes=20)
    expired = (
        TechnicalVisitRequest.objects.filter(
            status="pending",
            pending_since__isnull=False,
            pending_since__lt=deadline,
        )
        .select_related("payment_order")
    )
    for visit in expired:
        if visit.payment_order_id:
            _refund_payment_order(visit.payment_order)
        visit.status = "cancelled"
        visit.cancelled_by = None
        visit.save(update_fields=["status", "cancelled_by", "updated_at"])

User = get_user_model()


def estimate_distance_km(origin_cep: str, destination_cep: str) -> float:
    """Estimate distance from CEPs when geolocation data is unavailable."""
    origin_digits = "".join([c for c in (origin_cep or "") if c.isdigit()])
    destination_digits = "".join([c for c in (destination_cep or "") if c.isdigit()])
    if len(origin_digits) < 4 or len(destination_digits) < 4:
        return 12.0
    origin_value = int(origin_digits[-4:])
    destination_value = int(destination_digits[-4:])
    distance = abs(origin_value - destination_value) / 140
    return round(max(0.8, min(distance, 60.0)), 1)


def is_company_open(company: Company) -> bool:
    if not company.opening_time or not company.closing_time:
        return True
    now_time = timezone.localtime().time()
    return company.opening_time <= now_time <= company.closing_time


@api_view(["GET"])
@permission_classes([AllowAny])
def health_check(request):
    """Health check endpoint."""
    return Response({"status": "ok"})


@api_view(["GET"])
@permission_classes([AllowAny])
def readiness_check(request):
    """Readiness check endpoint."""
    return Response({"status": "ready"})


class ItemListCreateView(generics.ListCreateAPIView):
    """List and create items for authenticated company users."""

    permission_classes = [IsAuthenticated]
    serializer_class = ItemSerializer

    def get_queryset(self):
        """Return items for the authenticated company user."""
        if not hasattr(self.request.user, "company_profile"):
            return Item.objects.none()
        return Item.objects.filter(company=self.request.user).order_by("-created_at")

    def get_serializer_class(self):
        """Return appropriate serializer based on request method."""
        if self.request.method == "POST":
            return ItemCreateSerializer
        return ItemSerializer

    def get_serializer_context(self):
        """Add request to serializer context."""
        context = super().get_serializer_context()
        context["request"] = self.request
        return context

    def perform_create(self, serializer):
        """Associate item with the authenticated company user."""
        if not hasattr(self.request.user, "company_profile"):
            raise serializers.ValidationError(
                {"error": "Apenas empresas podem criar itens."}
            )
        serializer.save(company=self.request.user)


class ItemDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete an item."""

    permission_classes = [IsAuthenticated]
    serializer_class = ItemSerializer

    def get_queryset(self):
        """Return items for the authenticated company user."""
        if not hasattr(self.request.user, "company_profile"):
            return Item.objects.none()
        return Item.objects.filter(company=self.request.user)

    def get_serializer_class(self):
        """Return appropriate serializer based on request method."""
        if self.request.method in ["PUT", "PATCH"]:
            return ItemUpdateSerializer
        return ItemSerializer

    def update(self, request, *args, **kwargs):
        """Handle partial updates for file uploads."""
        partial = kwargs.pop("partial", True)
        instance = self.get_object()
        serializer = self.get_serializer(
            instance, data=request.data, partial=partial, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def featured_stores(request):
    """Get featured stores."""
    user = request.user
    user_cep = ""
    if hasattr(user, "consumer_profile"):
        user_cep = user.consumer_profile.cep
    elif hasattr(user, "provider_profile"):
        user_cep = user.provider_profile.cep

    companies = Company.objects.all().select_related("user")
    stores = []
    for company in companies:
        distance = estimate_distance_km(user_cep, company.cep)
        if distance > float(company.display_radius_km):
            continue
        avg_minutes_per_km = float(company.avg_minutes_per_km or 4)
        eta_minutes = max(5, int(round(distance * avg_minutes_per_km)))
        image_url = None
        if company.logo:
            try:
                image_url = company.logo.url
            except Exception:
                pass
        elif company.user.profile_photo:
            try:
                image_url = company.user.profile_photo.url
            except Exception:
                pass
        stores.append(
            {
                "id": company.id,
                "company_name": company.company_name,
                "category": company.segment,
                "distance": distance,
                "rating": float(company.rating_average or 0),
                "rating_count": company.rating_count,
                "is_open": is_company_open(company),
                "opening_time": company.opening_time.strftime("%H:%M") if company.opening_time else None,
                "closing_time": company.closing_time.strftime("%H:%M") if company.closing_time else None,
                "eta_minutes": eta_minutes,
                "image_url": image_url,
            }
        )

    stores.sort(key=lambda x: (not x["is_open"], -x["rating_count"], x["eta_minutes"]))
    return Response(stores)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def nearby_providers(request):
    """Get nearby providers - only available and verified providers."""
    user_cep = request.user.consumer_profile.cep if hasattr(request.user, "consumer_profile") else ""
    providers = Provider.objects.filter(is_available=True).select_related("user")

    provider_list = []
    for provider in providers:
        distance = estimate_distance_km(user_cep, provider.cep)
        if float(provider.coverage_radius_km or 50) < distance:
            continue
        eta_minutes = max(5, int(round(distance * 5.0)))
        image_url = None
        if provider.user.profile_photo:
            try:
                image_url = provider.user.profile_photo.url
            except Exception:
                pass
        provider_list.append(
            {
                "id": provider.user_id,
                "full_name": provider.full_name,
                "specialties": provider.specialties,
                "distance": round(distance, 1),
                "rating": float(provider.rating_average or 0),
                "rating_count": provider.rating_count,
                "eta_minutes": eta_minutes,
                "is_available": provider.is_available,
                "verified": provider.verified,
                "coverage_radius_km": float(provider.coverage_radius_km or 50),
                "image_url": image_url,
            }
        )

    provider_list.sort(key=lambda x: (-x["rating_count"], x["eta_minutes"]))
    return Response(provider_list)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def stores_for_provider(request):
    """Get open stores that deliver to provider's address."""
    if request.user.user_type != "provider" or not hasattr(request.user, "provider_profile"):
        return Response([], status=status.HTTP_200_OK)

    user_cep = request.user.provider_profile.cep
    stores = []
    for company in Company.objects.all().select_related("user"):
        distance = estimate_distance_km(user_cep, company.cep)
        if distance > float(company.display_radius_km):
            continue
        image_url = None
        if company.logo:
            try:
                image_url = company.logo.url
            except Exception:
                pass
        elif company.user.profile_photo:
            try:
                image_url = company.user.profile_photo.url
            except Exception:
                pass
        stores.append(
            {
                "id": company.id,
                "company_name": company.company_name,
                "category": company.segment,
                "distance": distance,
                "rating": float(company.rating_average or 0),
                "rating_count": company.rating_count,
                "is_open": is_company_open(company),
                "eta_minutes": max(5, int(round(distance * float(company.avg_minutes_per_km or 4)))),
                "image_url": image_url,
            }
        )
    stores.sort(key=lambda x: (not x["is_open"], x["distance"]))
    return Response(stores)


class PublicItemListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = PublicItemSerializer

    def get_queryset(self):
        queryset = (
            Item.objects.filter(is_for_sale=True, company__company_profile__isnull=False)
            .select_related("company", "company__company_profile")
            .order_by("-created_at")
        )
        company_id = self.request.query_params.get("company_id")
        if company_id:
            queryset = queryset.filter(company__company_profile__id=company_id)
        return queryset


class CartItemListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = CartItemSerializer

    def get_queryset(self):
        return CartItem.objects.filter(user=self.request.user).select_related(
            "item", "item__company", "item__company__company_profile"
        )

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["request"] = self.request
        return context


class CartItemDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = CartItemSerializer

    def get_queryset(self):
        return CartItem.objects.filter(user=self.request.user).select_related(
            "item", "item__company", "item__company__company_profile"
        )


class DelivererListCreateView(generics.ListCreateAPIView):
    """List and create deliverers for authenticated company users."""

    permission_classes = [IsAuthenticated]
    serializer_class = DelivererSerializer

    def get_queryset(self):
        if not hasattr(self.request.user, "company_profile"):
            return Deliverer.objects.none()
        return Deliverer.objects.filter(company=self.request.user)

    def perform_create(self, serializer):
        if not hasattr(self.request.user, "company_profile"):
            raise serializers.ValidationError(
                {"error": "Apenas empresas podem cadastrar entregadores."}
            )
        serializer.save(company=self.request.user)


class DelivererDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update or delete a deliverer."""

    permission_classes = [IsAuthenticated]
    serializer_class = DelivererSerializer

    def get_queryset(self):
        if not hasattr(self.request.user, "company_profile"):
            return Deliverer.objects.none()
        return Deliverer.objects.filter(company=self.request.user)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_technical_visit(request):
    """Consumer creates a technical visit request integrated with payment."""
    if request.user.user_type != "consumer":
        return Response(
            {"error": "Somente consumidores podem solicitar visita técnica."},
            status=status.HTTP_403_FORBIDDEN,
        )

    serializer = CreateVisitWithPaymentSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    consumer_cep = getattr(getattr(request.user, "consumer_profile", None), "cep", "")
    provider_user = data["provider"]
    provider_cep = getattr(getattr(provider_user, "provider_profile", None), "cep", "")
    distance = estimate_distance_km(consumer_cep, provider_cep)
    eta = max(30, round(distance * 15))

    visit = TechnicalVisitRequest.objects.create(
        consumer=request.user,
        provider=provider_user,
        address=data["address"],
        notes=data.get("notes") or "",
        preferred_date=data.get("preferred_date"),
        status="awaiting_payment",
        estimated_eta_minutes=eta,
    )

    sdk = _mp_sdk()
    payment_method = data["payment_method"]
    external_ref = f"visit_{visit.id}"
    amount = 0.10
    description = "Visita técnica"

    try:
        if payment_method == "pix":
            mp_payload = {
                "transaction_amount": amount,
                "description": description,
                "external_reference": external_ref,
                "payment_method_id": "pix",
                "payer": {
                    "email": data["payer_email"],
                    "first_name": data["payer_first_name"],
                    "last_name": data["payer_last_name"],
                    "identification": {"type": "CPF", "number": _clean_cpf(data["payer_cpf"])},
                },
            }
            result = sdk.payment().create(mp_payload)
            response_data = result.get("response", {})
            if result.get("status") not in (200, 201):
                visit.delete()
                mp_msg = response_data.get("message") or response_data.get("error") or "Erro desconhecido"
                return Response(
                    {"error": f"Erro ao criar pagamento PIX: {mp_msg}"},
                    status=status.HTTP_502_BAD_GATEWAY,
                )
            tx = response_data.get("point_of_interaction", {}).get("transaction_data", {})
            order = PaymentOrder.objects.create(
                user=request.user,
                mp_payment_id=str(response_data.get("id", "")),
                method=PaymentOrder.Method.PIX,
                status=PaymentOrder.Status.PENDING,
                amount=amount,
                description=description,
                external_reference=external_ref,
                pix_qr_code=tx.get("qr_code_base64", ""),
                pix_qr_code_text=tx.get("qr_code", ""),
                raw_response=response_data,
            )
            visit.payment_order = order
            visit.save(update_fields=["payment_order"])
            return Response(
                {
                    "visit": TechnicalVisitRequestSerializer(visit).data,
                    "payment": {
                        "payment_id": order.id,
                        "method": "pix",
                        "status": order.status,
                        "qr_code_base64": order.pix_qr_code,
                        "qr_code_text": order.pix_qr_code_text,
                        "amount": str(order.amount),
                    },
                },
                status=status.HTTP_201_CREATED,
            )

        # credit_card
        mp_payload = {
            "transaction_amount": amount,
            "token": data["token"],
            "description": description,
            "external_reference": external_ref,
            "installments": data.get("installments", 1),
            "payment_method_id": data["payment_method_id"],
            "payer": {
                "email": data["payer_email"],
                "identification": {"type": "CPF", "number": _clean_cpf(data["payer_cpf"])},
            },
        }
        result = sdk.payment().create(mp_payload)
        response_data = result.get("response", {})
        if result.get("status") not in (200, 201):
            visit.delete()
            mp_msg = response_data.get("message") or response_data.get("error") or "Erro desconhecido"
            return Response(
                {"error": f"Erro ao processar pagamento: {mp_msg}"},
                status=status.HTTP_502_BAD_GATEWAY,
            )
        mp_status = response_data.get("status", "pending")
        order_status = {
            "approved": PaymentOrder.Status.APPROVED,
            "rejected": PaymentOrder.Status.REJECTED,
            "cancelled": PaymentOrder.Status.CANCELLED,
        }.get(mp_status, PaymentOrder.Status.PENDING)
        order = PaymentOrder.objects.create(
            user=request.user,
            mp_payment_id=str(response_data.get("id", "")),
            method=PaymentOrder.Method.CREDIT_CARD,
            status=order_status,
            amount=amount,
            description=description,
            external_reference=external_ref,
            raw_response=response_data,
        )
        visit.payment_order = order
        update_fields = ["payment_order", "status"]
        if order_status == PaymentOrder.Status.APPROVED:
            visit.status = "pending"
            visit.pending_since = timezone.now()
            update_fields.append("pending_since")
        visit.save(update_fields=update_fields)
        return Response(
            {
                "visit": TechnicalVisitRequestSerializer(visit).data,
                "payment": {
                    "payment_id": order.id,
                    "method": "credit_card",
                    "status": order.status,
                    "status_detail": response_data.get("status_detail", ""),
                    "amount": str(order.amount),
                },
            },
            status=status.HTTP_201_CREATED,
        )

    except Exception as exc:
        logger.exception("Erro inesperado ao criar pagamento para visita %s: %s", visit.id, exc)
        visit.delete()
        return Response(
            {"error": "Erro de comunicação com o Mercado Pago. Tente novamente."},
            status=status.HTTP_502_BAD_GATEWAY,
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def my_visits(request):
    """Consumer lists their own technical visit requests."""
    if request.user.user_type != "consumer":
        return Response(
            {"error": "Acesso negado."}, status=status.HTTP_403_FORBIDDEN
        )
    visits = (
        TechnicalVisitRequest.objects.filter(consumer=request.user)
        .select_related("payment_order", "provider", "provider__provider_profile")
        .order_by("-created_at")
    )
    return Response(TechnicalVisitRequestSerializer(visits, many=True).data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def visit_detail(request, visit_id: int):
    """Consumer or provider retrieves a single technical visit."""
    _cancel_expired_pending_visits()
    user = request.user
    visit = (
        TechnicalVisitRequest.objects.filter(
            Q(consumer=user) | Q(provider=user), id=visit_id
        )
        .select_related("payment_order", "consumer__consumer_profile", "provider__provider_profile")
        .first()
    )
    if not visit:
        return Response({"error": "Visita não encontrada."}, status=status.HTTP_404_NOT_FOUND)
    return Response(TechnicalVisitRequestSerializer(visit).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def cancel_visit(request, visit_id: int):
    """Consumer cancels a visit and triggers refund."""
    if request.user.user_type != "consumer":
        return Response({"error": "Acesso negado."}, status=status.HTTP_403_FORBIDDEN)

    visit = (
        TechnicalVisitRequest.objects.filter(id=visit_id, consumer=request.user)
        .select_related("payment_order")
        .first()
    )
    if not visit:
        return Response({"error": "Visita não encontrada."}, status=status.HTTP_404_NOT_FOUND)
    if visit.status not in ("awaiting_payment", "pending", "accepted"):
        return Response(
            {"error": "Esta visita não pode ser cancelada."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if visit.payment_order_id:
        _refund_payment_order(visit.payment_order)

    visit.status = "cancelled"
    visit.cancelled_by = "consumer"
    visit.save(update_fields=["status", "cancelled_by", "updated_at"])
    return Response(TechnicalVisitRequestSerializer(visit).data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def provider_visit_panel(request):
    """Provider panel with grouped technical visit requests."""
    if request.user.user_type != "provider":
        return Response(
            {"error": "Somente prestadores possuem painel de visitas."},
            status=status.HTTP_403_FORBIDDEN,
        )

    _cancel_expired_pending_visits()

    visits = TechnicalVisitRequest.objects.filter(provider=request.user).select_related(
        "consumer", "consumer__consumer_profile", "payment_order"
    )
    groups = ["awaiting_payment", "pending", "accepted", "refused", "completed", "cancelled"]
    data = {
        grp: TechnicalVisitRequestSerializer(visits.filter(status=grp), many=True).data
        for grp in groups
    }
    return Response(data)


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def update_visit_status(request, visit_id: int):
    """Provider accepts or refuses a visit. Refunds automatically on refusal."""
    if request.user.user_type != "provider":
        return Response(
            {"error": "Somente prestadores podem atualizar visitas."},
            status=status.HTTP_403_FORBIDDEN,
        )
    status_value = request.data.get("status")
    allowed = {"accepted", "refused"}
    if status_value not in allowed:
        return Response({"error": "Status inválido."}, status=status.HTTP_400_BAD_REQUEST)

    visit = (
        TechnicalVisitRequest.objects.filter(id=visit_id, provider=request.user, status="pending")
        .select_related("payment_order")
        .first()
    )
    if not visit:
        return Response({"error": "Solicitação não encontrada ou não está pendente."}, status=status.HTTP_404_NOT_FOUND)

    if status_value == "refused" and visit.payment_order_id:
        _refund_payment_order(visit.payment_order)
        visit.cancelled_by = "provider"

    visit.status = status_value
    update_fields = ["status", "updated_at"]
    if status_value == "refused":
        update_fields.append("cancelled_by")
    visit.save(update_fields=update_fields)
    return Response(TechnicalVisitRequestSerializer(visit).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def complete_visit(request, visit_id: int):
    """Consumer marks an accepted visit as completed."""
    if request.user.user_type != "consumer":
        return Response({"error": "Apenas o consumidor pode encerrar a visita."}, status=status.HTTP_403_FORBIDDEN)

    visit = TechnicalVisitRequest.objects.filter(
        id=visit_id, consumer=request.user, status="accepted"
    ).first()
    if not visit:
        return Response(
            {"error": "Visita não encontrada ou não pode ser encerrada."},
            status=status.HTTP_404_NOT_FOUND,
        )
    visit.status = "completed"
    visit.save(update_fields=["status", "updated_at"])
    return Response(TechnicalVisitRequestSerializer(visit).data)


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def visit_messages(request, visit_id: int):
    """List or send chat messages for a technical visit."""
    user = request.user
    visit = TechnicalVisitRequest.objects.filter(
        Q(consumer=user) | Q(provider=user), id=visit_id
    ).first()
    if not visit:
        return Response({"error": "Visita não encontrada."}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "GET":
        msgs = VisitMessage.objects.filter(visit=visit).select_related("sender")
        return Response(VisitMessageSerializer(msgs, many=True).data)

    serializer = VisitMessageSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    msg = serializer.save(visit=visit, sender=user)
    return Response(VisitMessageSerializer(msg).data, status=status.HTTP_201_CREATED)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_review(request):
    """Create or update a review for a provider or company."""
    target_user_id = request.data.get("target_user_id")
    rating = request.data.get("rating")
    comment = request.data.get("comment", "")
    target_type = request.data.get("target_type")  # "provider" or "company"

    if not all([target_user_id, rating, target_type]):
        return Response({"error": "target_user_id, rating e target_type são obrigatórios."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        target_user = User.objects.get(id=target_user_id)
    except User.DoesNotExist:
        return Response({"error": "Usuário não encontrado."}, status=status.HTTP_404_NOT_FOUND)

    review, created = Review.objects.update_or_create(
        reviewer=request.user,
        target_user=target_user,
        defaults={"rating": rating, "comment": comment, "target_type": target_type},
    )

    # Update rating average on target
    if target_type == "provider" and hasattr(target_user, "provider_profile"):
        provider = target_user.provider_profile
        reviews = Review.objects.filter(target_user=target_user)
        provider.rating_average = reviews.aggregate(avg=Avg("rating"))["avg"] or 0
        provider.rating_count = reviews.count()
        provider.save(update_fields=["rating_average", "rating_count"])
    elif target_type == "company" and hasattr(target_user, "company_profile"):
        company = target_user.company_profile
        reviews = Review.objects.filter(target_user=target_user)
        company.rating_average = reviews.aggregate(avg=Avg("rating"))["avg"] or 0
        company.rating_count = reviews.count()
        company.save(update_fields=["rating_average", "rating_count"])

    return Response(ReviewSerializer(review).data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_reviews(request):
    """List reviews. Admin sees all; others see reviews for a specific target."""
    if request.user.user_type == "admin":
        queryset = Review.objects.select_related(
            "reviewer", "target_user",
            "reviewer__consumer_profile", "reviewer__provider_profile",
            "target_user__provider_profile", "target_user__company_profile",
        ).order_by("-created_at")
        target_type = request.query_params.get("target_type")
        if target_type:
            queryset = queryset.filter(target_type=target_type)
    else:
        target_user_id = request.query_params.get("target_user_id")
        if not target_user_id:
            return Response([])
        queryset = Review.objects.filter(target_user_id=target_user_id).select_related(
            "reviewer", "reviewer__consumer_profile"
        )

    return Response(ReviewSerializer(queryset, many=True).data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def admin_stats(request):
    """Admin dashboard stats."""
    if request.user.user_type != "admin":
        return Response({"error": "Acesso negado."}, status=status.HTTP_403_FORBIDDEN)

    from apps.authentication.models import Consumer, Provider, Company

    return Response({
        "total_users": User.objects.count(),
        "consumers": Consumer.objects.count(),
        "providers": Provider.objects.count(),
        "companies": Company.objects.count(),
        "providers_verified": Provider.objects.filter(verified=True).count(),
        "providers_unverified": Provider.objects.filter(verified=False).count(),
        "total_items": Item.objects.count(),
        "total_reviews": Review.objects.count(),
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def admin_providers_list(request):
    """Admin: list providers with criminal record info."""
    if request.user.user_type != "admin":
        return Response({"error": "Acesso negado."}, status=status.HTTP_403_FORBIDDEN)

    from apps.authentication.models import Provider

    queryset = Provider.objects.select_related("user").order_by("-user__date_joined")
    verified = request.query_params.get("verified")
    if verified is not None:
        queryset = queryset.filter(verified=verified.lower() == "true")

    data = []
    for p in queryset:
        data.append({
            "id": p.id,
            "user_id": p.user_id,
            "full_name": p.full_name,
            "email": p.user.email,
            "specialties": p.specialties,
            "verified": p.verified,
            "is_available": p.is_available,
            "criminal_record_url": p.criminal_record.url if p.criminal_record else None,
            "rating_average": float(p.rating_average),
            "rating_count": p.rating_count,
            "coverage_radius_km": float(p.coverage_radius_km or 50),
            "created_at": p.user.date_joined.isoformat(),
        })
    return Response(data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def admin_stores_list(request):
    """Admin: list companies with their products."""
    if request.user.user_type != "admin":
        return Response({"error": "Acesso negado."}, status=status.HTTP_403_FORBIDDEN)

    from apps.authentication.models import Company

    queryset = Company.objects.select_related("user").order_by("-user__date_joined")
    search = request.query_params.get("search")
    if search:
        queryset = queryset.filter(company_name__icontains=search)

    data = []
    for c in queryset:
        items = Item.objects.filter(company=c.user, is_for_sale=True).values("id", "name", "price", "shipping_type")
        data.append({
            "id": c.id,
            "user_id": c.user_id,
            "company_name": c.company_name,
            "email": c.user.email,
            "segment": c.segment,
            "cnpj": c.cnpj,
            "city": c.city,
            "state": c.state,
            "rating_average": float(c.rating_average),
            "rating_count": c.rating_count,
            "logo_url": c.logo.url if c.logo else None,
            "total_items": len(list(items)),
            "items": list(items),
            "created_at": c.user.date_joined.isoformat(),
        })
    return Response(data)


# ---------------------------------------------------------------------------
# Orders
# ---------------------------------------------------------------------------

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_order(request):
    """Create a product order and generate a PIX payment."""
    if request.user.user_type not in ("consumer", "provider"):
        return Response({"error": "Apenas consumidores e prestadores podem realizar compras."}, status=status.HTTP_403_FORBIDDEN)

    serializer = CreateOrderSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    items_data = data["items"]
    items_objs = [(Item.objects.get(id=e["item_id"]), int(e["quantity"])) for e in items_data]

    companies = {item.company_id for item, _ in items_objs}
    if len(companies) > 1:
        return Response({"error": "Todos os itens devem ser da mesma empresa."}, status=status.HTTP_400_BAD_REQUEST)

    company_user_id = companies.pop()
    company_user = User.objects.get(id=company_user_id)
    total = sum(float(item.price) * qty for item, qty in items_objs)

    order = Order.objects.create(buyer=request.user, company=company_user, total_amount=total)
    for item, qty in items_objs:
        OrderItem.objects.create(order=order, item=item, quantity=qty, unit_price=item.price)

    sdk = _mp_sdk()
    external_ref = f"order_{order.id}"
    cpf = _clean_cpf(data["payer_cpf"]) or "00000000000"
    mp_payload = {
        "transaction_amount": float(total),
        "description": f"Pedido #{order.id}",
        "external_reference": external_ref,
        "payment_method_id": "pix",
        "payer": {
            "email": data["payer_email"],
            "first_name": data["payer_first_name"],
            "last_name": data["payer_last_name"],
            "identification": {"type": "CPF", "number": cpf},
        },
    }

    try:
        result = sdk.payment().create(mp_payload)
        response_data = result.get("response", {})
        if result.get("status") not in (200, 201):
            logger.error("MP PIX order error: %s", response_data)
            order.delete()
            mp_msg = response_data.get("message") or response_data.get("error") or "Erro desconhecido"
            return Response({"error": f"Erro ao gerar PIX: {mp_msg}"}, status=status.HTTP_502_BAD_GATEWAY)

        tx = response_data.get("point_of_interaction", {}).get("transaction_data", {})
        payment = PaymentOrder.objects.create(
            user=request.user,
            mp_payment_id=str(response_data.get("id", "")),
            method=PaymentOrder.Method.PIX,
            status=PaymentOrder.Status.PENDING,
            amount=total,
            description=f"Pedido #{order.id}",
            external_reference=external_ref,
            pix_qr_code=tx.get("qr_code_base64", ""),
            pix_qr_code_text=tx.get("qr_code", ""),
            raw_response=response_data,
        )
        order.payment = payment
        order.save(update_fields=["payment"])
        CartItem.objects.filter(user=request.user).delete()
    except Exception as exc:
        logger.exception("Erro ao criar pagamento PIX para pedido %s: %s", order.id, exc)
        order.delete()
        return Response({"error": "Erro de comunicação com Mercado Pago."}, status=status.HTTP_502_BAD_GATEWAY)

    return Response(
        {
            "order": OrderSerializer(order, context={"request": request}).data,
            "payment": {
                "payment_id": payment.id,
                "mp_payment_id": payment.mp_payment_id,
                "method": "pix",
                "status": payment.status,
                "qr_code_base64": payment.pix_qr_code,
                "qr_code_text": payment.pix_qr_code_text,
                "amount": str(payment.amount),
            },
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def my_orders(request):
    """Buyer lists their own product orders."""
    if request.user.user_type not in ("consumer", "provider"):
        return Response({"error": "Acesso negado."}, status=status.HTTP_403_FORBIDDEN)
    orders = (
        Order.objects.filter(buyer=request.user)
        .select_related("payment", "company__company_profile")
        .prefetch_related("items__item")
        .order_by("-created_at")
    )
    return Response(OrderSerializer(orders, many=True, context={"request": request}).data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def company_orders(request):
    """Company lists orders placed at their store."""
    if request.user.user_type != "company":
        return Response({"error": "Acesso negado."}, status=status.HTTP_403_FORBIDDEN)
    orders = (
        Order.objects.filter(company=request.user)
        .select_related("payment", "buyer__consumer_profile", "buyer__provider_profile")
        .prefetch_related("items__item")
        .order_by("-created_at")
    )
    return Response(OrderSerializer(orders, many=True, context={"request": request}).data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def order_detail(request, order_id: int):
    """Buyer or company retrieves a single order."""
    user = request.user
    order = (
        Order.objects.filter(Q(buyer=user) | Q(company=user), id=order_id)
        .select_related("payment", "company__company_profile", "buyer__consumer_profile", "buyer__provider_profile")
        .prefetch_related("items__item")
        .first()
    )
    if not order:
        return Response({"error": "Pedido não encontrado."}, status=status.HTTP_404_NOT_FOUND)
    return Response(OrderSerializer(order, context={"request": request}).data)


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def update_order_status(request, order_id: int):
    """Advance order status. Company: pendente→confirmado→enviado. Buyer: enviado→entregue."""
    user = request.user
    order = Order.objects.filter(Q(buyer=user) | Q(company=user), id=order_id).first()
    if not order:
        return Response({"error": "Pedido não encontrado."}, status=status.HTTP_404_NOT_FOUND)

    new_status = request.data.get("status")
    if not new_status:
        return Response({"error": "Campo 'status' obrigatório."}, status=status.HTTP_400_BAD_REQUEST)

    if user.user_type == "company" and order.company_id == user.id:
        allowed = {"pendente": "confirmado", "confirmado": "enviado"}
    elif order.buyer_id == user.id:
        allowed = {"enviado": "entregue"}
    else:
        return Response({"error": "Sem permissão."}, status=status.HTTP_403_FORBIDDEN)

    if new_status != allowed.get(order.status):
        return Response(
            {"error": f"Transição inválida: {order.status} → {new_status}"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    order.status = new_status
    order.save(update_fields=["status", "updated_at"])
    return Response(OrderSerializer(order, context={"request": request}).data)


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def order_messages(request, order_id: int):
    """GET: list messages. POST: send a message."""
    user = request.user
    order = Order.objects.filter(Q(buyer=user) | Q(company=user), id=order_id).first()
    if not order:
        return Response({"error": "Pedido não encontrado."}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "GET":
        msgs = OrderMessage.objects.filter(order=order).select_related("sender")
        return Response(OrderMessageSerializer(msgs, many=True, context={"request": request}).data)

    content = request.data.get("content", "").strip()
    if not content:
        return Response({"error": "Mensagem não pode ser vazia."}, status=status.HTTP_400_BAD_REQUEST)
    msg = OrderMessage.objects.create(order=order, sender=user, content=content)
    return Response(OrderMessageSerializer(msg, context={"request": request}).data, status=status.HTTP_201_CREATED)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def order_stats(request):
    """Company dashboard: revenue and order statistics."""
    if request.user.user_type != "company":
        return Response({"error": "Acesso negado."}, status=status.HTTP_403_FORBIDDEN)

    from django.db.models import Sum
    from django.db.models.functions import TruncDate
    import datetime

    period = request.query_params.get("period", "month")
    today = datetime.date.today()
    if period == "week":
        since = today - datetime.timedelta(days=7)
    elif period == "year":
        since = today - datetime.timedelta(days=365)
    else:
        since = today - datetime.timedelta(days=30)

    orders_qs = Order.objects.filter(company=request.user, created_at__date__gte=since)

    revenue_by_day = list(
        orders_qs.filter(status="entregue")
        .annotate(date=TruncDate("created_at"))
        .values("date")
        .annotate(total=Sum("total_amount"))
        .order_by("date")
        .values("date", "total")
    )

    orders_by_status = {val: orders_qs.filter(status=val).count() for val, _ in Order.STATUS_CHOICES}

    top_products = list(
        OrderItem.objects.filter(order__company=request.user, order__created_at__date__gte=since)
        .values("item__name")
        .annotate(quantity=Sum("quantity"), revenue=Sum("unit_price"))
        .order_by("-quantity")[:5]
    )

    return Response({
        "revenue_by_day": [{"date": str(r["date"]), "total": float(r["total"])} for r in revenue_by_day],
        "orders_by_status": orders_by_status,
        "top_products": [{"name": r["item__name"], "quantity": r["quantity"], "revenue": float(r["revenue"])} for r in top_products],
    })


# ---------------------------------------------------------------------------
# Bills (Contas a Pagar)
# ---------------------------------------------------------------------------

@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def bills_list_create(request):
    """List or create bills for the authenticated company."""
    if request.user.user_type != "company":
        return Response({"error": "Acesso negado."}, status=status.HTTP_403_FORBIDDEN)

    if request.method == "GET":
        bills = Bill.objects.filter(company=request.user)
        paid_param = request.query_params.get("paid")
        if paid_param is not None:
            bills = bills.filter(paid=paid_param.lower() == "true")
        category = request.query_params.get("category")
        if category:
            bills = bills.filter(category=category)
        return Response(BillSerializer(bills, many=True).data)

    serializer = BillSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    bill = serializer.save(company=request.user)
    return Response(BillSerializer(bill).data, status=status.HTTP_201_CREATED)


@api_view(["PATCH", "DELETE"])
@permission_classes([IsAuthenticated])
def bill_detail(request, bill_id: int):
    """Update or delete a bill."""
    if request.user.user_type != "company":
        return Response({"error": "Acesso negado."}, status=status.HTTP_403_FORBIDDEN)

    bill = Bill.objects.filter(id=bill_id, company=request.user).first()
    if not bill:
        return Response({"error": "Conta não encontrada."}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "DELETE":
        bill.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    serializer = BillSerializer(bill, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(BillSerializer(bill).data)


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def inventory_list_create(request):
    """List or create inventory entries for the authenticated company."""
    if request.user.user_type != "company":
        return Response({"error": "Acesso negado."}, status=status.HTTP_403_FORBIDDEN)

    if request.method == "GET":
        entries = InventoryEntry.objects.filter(company=request.user)
        return Response(InventoryEntrySerializer(entries, many=True).data)

    serializer = InventoryEntrySerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    entry = serializer.save(company=request.user)
    return Response(InventoryEntrySerializer(entry).data, status=status.HTTP_201_CREATED)


@api_view(["GET", "PATCH", "DELETE"])
@permission_classes([IsAuthenticated])
def inventory_detail(request, entry_id: int):
    """Retrieve, update or delete an inventory entry."""
    if request.user.user_type != "company":
        return Response({"error": "Acesso negado."}, status=status.HTTP_403_FORBIDDEN)

    entry = InventoryEntry.objects.filter(id=entry_id, company=request.user).first()
    if not entry:
        return Response({"error": "Entrada não encontrada."}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "DELETE":
        entry.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    serializer = InventoryEntrySerializer(entry, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(InventoryEntrySerializer(entry).data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def store_detail(request, store_id: int):
    """GET /core/stores/<store_id>/ — Perfil completo da loja com seus produtos."""
    try:
        company = Company.objects.get(id=store_id)
    except Company.DoesNotExist:
        return Response({"detail": "Loja não encontrada."}, status=status.HTTP_404_NOT_FOUND)

    user_cep = ""
    if hasattr(request.user, "consumer_profile"):
        user_cep = getattr(request.user.consumer_profile, "cep", "")
    elif hasattr(request.user, "provider_profile"):
        user_cep = getattr(request.user.provider_profile, "cep", "")

    distance = estimate_distance_km(user_cep, company.cep or "")

    image_url = None
    if company.logo:
        try:
            image_url = company.logo.url
        except Exception:
            pass

    items = Item.objects.filter(company=company.user)
    items_data = ItemSerializer(items, many=True, context={"request": request}).data

    return Response({
        "id": company.id,
        "company_name": company.company_name,
        "category": company.segment,
        "phone": getattr(company, "phone", None),
        "address": f"{company.street}, {company.number}" if company.street else None,
        "city": company.city,
        "state": company.state,
        "distance": round(distance, 1),
        "rating": float(company.rating_average or 0),
        "rating_count": company.rating_count,
        "is_open": is_company_open(company),
        "opening_time": company.opening_time.strftime("%H:%M") if company.opening_time else None,
        "closing_time": company.closing_time.strftime("%H:%M") if company.closing_time else None,
        "image_url": image_url,
        "items": items_data,
    })
