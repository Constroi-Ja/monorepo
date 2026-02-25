from rest_framework import status, generics, serializers
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from apps.authentication.models import Company, Provider
from .models import Item
from .serializers import ItemSerializer, ItemCreateSerializer, ItemUpdateSerializer

User = get_user_model()


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
    # For now, return mock data. Later you can implement real filtering
    companies = Company.objects.all()[:3]
    
    stores = []
    for company in companies:
        # Calculate distance (mock for now)
        distance = 1.2 + (company.id * 0.5)
        
        stores.append({
            "id": company.id,
            "company_name": company.company_name,
            "category": company.segment,
            "distance": round(distance, 1),
            "rating": 4.7 + (company.id * 0.1),
            "image_url": None,
        })
    
    return Response(stores)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def nearby_providers(request):
    """Get nearby providers - only available and verified providers."""
    # Filter only verified and available providers
    providers = Provider.objects.filter(verified=True, is_available=True)[:4]
    
    provider_list = []
    for provider in providers:
        # Calculate distance (mock for now)
        distance = 0.8 + (provider.id * 0.3)
        
        provider_list.append({
            "id": provider.id,
            "full_name": provider.full_name,
            "specialties": provider.specialties,
            "distance": round(distance, 1),
            "rating": 4.6 + (provider.id * 0.1),
            "image_url": None,
        })
    
    return Response(provider_list)
