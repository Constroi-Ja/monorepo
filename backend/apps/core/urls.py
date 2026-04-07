from django.urls import path
from .views import (
    CartItemDetailView,
    CartItemListCreateView,
    DelivererDetailView,
    DelivererListCreateView,
    health_check,
    readiness_check,
    featured_stores,
    nearby_providers,
    stores_for_provider,
    PublicItemListView,
    ItemListCreateView,
    ItemDetailView,
    create_technical_visit,
    provider_visit_panel,
    update_visit_status,
)

app_name = "core"

urlpatterns = [
    path("health/", health_check, name="health"),
    path("ready/", readiness_check, name="readiness"),
    path("stores/featured/", featured_stores, name="featured_stores"),
    path("providers/nearby/", nearby_providers, name="nearby_providers"),
    path("stores/provider/", stores_for_provider, name="stores_for_provider"),
    path("items/public/", PublicItemListView.as_view(), name="public_item_list"),
    path("items/", ItemListCreateView.as_view(), name="item_list_create"),
    path("items/<int:pk>/", ItemDetailView.as_view(), name="item_detail"),
    path("cart/", CartItemListCreateView.as_view(), name="cart_list_create"),
    path("cart/<int:pk>/", CartItemDetailView.as_view(), name="cart_detail"),
    path("deliverers/", DelivererListCreateView.as_view(), name="deliverer_list_create"),
    path("deliverers/<int:pk>/", DelivererDetailView.as_view(), name="deliverer_detail"),
    path("technical-visits/", create_technical_visit, name="technical_visit_create"),
    path("technical-visits/provider-panel/", provider_visit_panel, name="technical_visit_provider_panel"),
    path("technical-visits/<int:visit_id>/", update_visit_status, name="technical_visit_update"),
]
