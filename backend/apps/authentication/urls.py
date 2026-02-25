from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    RegisterView,
    CustomTokenObtainPairView,
    me,
    update_profile,
)

app_name = "authentication"

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", CustomTokenObtainPairView.as_view(), name="login"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("me/", me, name="me"),
    path("me/update/", update_profile, name="update_profile"),
]
