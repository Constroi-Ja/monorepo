from django.utils import timezone
from rest_framework import status, generics, serializers
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from apps.authentication.models import Company, Provider
from .models import CartItem, Deliverer, Item, TechnicalVisitRequest
from .serializers import (
    CartItemSerializer,
    DelivererSerializer,
    ItemCreateSerializer,
    ItemSerializer,
    ItemUpdateSerializer,
    PublicItemSerializer,
    TechnicalVisitRequestSerializer,
)

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

    companies = Company.objects.all()
    stores = []
    for company in companies:
        distance = estimate_distance_km(user_cep, company.cep)
        if distance > float(company.display_radius_km):
            continue
        avg_minutes_per_km = float(company.avg_minutes_per_km or 4)
        eta_minutes = max(5, int(round(distance * avg_minutes_per_km)))
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
                "image_url": None,
            }
        )

    stores.sort(key=lambda x: (not x["is_open"], -x["rating_count"], x["eta_minutes"]))
    return Response(stores)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def nearby_providers(request):
    """Get nearby providers - only available and verified providers."""
    user_cep = request.user.consumer_profile.cep if hasattr(request.user, "consumer_profile") else ""
    providers = Provider.objects.filter(verified=True, is_available=True)

    provider_list = []
    for provider in providers:
        distance = estimate_distance_km(user_cep, provider.cep)
        eta_minutes = max(5, int(round(distance * 5.0)))
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
                "image_url": None,
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
    for company in Company.objects.all():
        distance = estimate_distance_km(user_cep, company.cep)
        if distance > float(company.display_radius_km):
            continue
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
                "image_url": None,
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
    """Consumer creates technical visit request for provider."""
    if request.user.user_type != "consumer":
        return Response(
            {"error": "Somente consumidores podem solicitar visita técnica."},
            status=status.HTTP_403_FORBIDDEN,
        )

    serializer = TechnicalVisitRequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    serializer.save(consumer=request.user)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def provider_visit_panel(request):
    """Provider panel with grouped technical visit requests."""
    if request.user.user_type != "provider":
        return Response(
            {"error": "Somente prestadores possuem painel de visitas."},
            status=status.HTTP_403_FORBIDDEN,
        )

    visits = TechnicalVisitRequest.objects.filter(provider=request.user).select_related(
        "consumer", "consumer__consumer_profile"
    )
    data = {
        "pending": TechnicalVisitRequestSerializer(
            visits.filter(status="pending"), many=True
        ).data,
        "accepted": TechnicalVisitRequestSerializer(
            visits.filter(status="accepted"), many=True
        ).data,
        "refused": TechnicalVisitRequestSerializer(
            visits.filter(status="refused"), many=True
        ).data,
        "completed": TechnicalVisitRequestSerializer(
            visits.filter(status="completed"), many=True
        ).data,
    }
    return Response(data)


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def update_visit_status(request, visit_id: int):
    """Provider updates visit status."""
    if request.user.user_type != "provider":
        return Response(
            {"error": "Somente prestadores podem atualizar visitas."},
            status=status.HTTP_403_FORBIDDEN,
        )
    status_value = request.data.get("status")
    allowed = {"accepted", "refused", "completed"}
    if status_value not in allowed:
        return Response(
            {"error": "Status inválido."}, status=status.HTTP_400_BAD_REQUEST
        )

    visit = TechnicalVisitRequest.objects.filter(id=visit_id, provider=request.user).first()
    if not visit:
        return Response(
            {"error": "Solicitação não encontrada."}, status=status.HTTP_404_NOT_FOUND
        )
    visit.status = status_value
    visit.save(update_fields=["status", "updated_at"])
    return Response(TechnicalVisitRequestSerializer(visit).data)
