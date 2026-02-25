from django.urls import path
from .views import health_check, readiness_check

app_name = "core"

urlpatterns = [
    path("health/", health_check, name="health"),
    path("ready/", readiness_check, name="readiness"),
]
