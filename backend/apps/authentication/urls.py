from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    CompanyRegisterView,
    ConsumerRegisterView,
    CustomTokenObtainPairView,
    ProviderRegisterView,
    confirm_email,
    confirm_password_reset,
    me,
    request_password_reset,
    update_profile,
    update_consumer_profile,
    update_provider_profile,
    update_company_profile,
    get_provider_availability,
    update_provider_availability,
)

app_name = "authentication"

urlpatterns = [
    path("register/consumer/", ConsumerRegisterView.as_view(), name="register_consumer"),
    path("register/provider/", ProviderRegisterView.as_view(), name="register_provider"),
    path("register/company/", CompanyRegisterView.as_view(), name="register_company"),
    path("login/", CustomTokenObtainPairView.as_view(), name="login"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("confirm-email/", confirm_email, name="confirm_email"),
    path("password-reset/", request_password_reset, name="password_reset_request"),
    path("password-reset/confirm/", confirm_password_reset, name="password_reset_confirm"),
    path("me/", me, name="me"),
    path("me/update/", update_profile, name="update_profile"),
    path("profile/consumer/", update_consumer_profile, name="update_consumer_profile"),
    path("profile/provider/", update_provider_profile, name="update_provider_profile"),
    path("profile/company/", update_company_profile, name="update_company_profile"),
    path("providers/availability/", get_provider_availability, name="get_provider_availability"),
    path("providers/availability/update/", update_provider_availability, name="update_provider_availability"),
]
