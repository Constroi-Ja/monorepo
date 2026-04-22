from django.utils import timezone
from rest_framework import status, generics, serializers
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from apps.authentication.models import Company, Provider
from django.db.models import Avg
from .models import CartItem, Deliverer, Item, Review, TechnicalVisitRequest
from .serializers import (
    CartItemSerializer,
    DelivererSerializer,
    ItemCreateSerializer,
    ItemSerializer,
    ItemUpdateSerializer,
    PublicItemSerializer,
    ReviewSerializer,
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
    providers = Provider.objects.filter(is_available=True)

    provider_list = []
    for provider in providers:
        distance = estimate_distance_km(user_cep, provider.cep)
        if float(provider.coverage_radius_km or 50) < distance:
            continue
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
                "verified": provider.verified,
                "coverage_radius_km": float(provider.coverage_radius_km or 50),
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
