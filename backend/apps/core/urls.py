from django.urls import path
from .views import (
    health_check,
    readiness_check,
    featured_stores,
    nearby_providers,
    ItemListCreateView,
    ItemDetailView,
)

app_name = "core"

urlpatterns = [
    path("health/", health_check, name="health"),
    path("ready/", readiness_check, name="readiness"),
    path("stores/featured/", featured_stores, name="featured_stores"),
    path("providers/nearby/", nearby_providers, name="nearby_providers"),
    path("items/", ItemListCreateView.as_view(), name="item_list_create"),
    path("items/<int:pk>/", ItemDetailView.as_view(), name="item_detail"),
]
