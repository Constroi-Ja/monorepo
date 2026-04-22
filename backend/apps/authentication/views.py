from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import EmailConfirmationToken, PasswordResetToken, Consumer, Provider, Company
from .serializers import (
    AdminUserListSerializer,
    CompanyRegistrationSerializer,
    CompanySerializer,
    ConsumerRegistrationSerializer,
    ConsumerSerializer,
    CustomTokenObtainPairSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    ProviderRegistrationSerializer,
    ProviderSerializer,
    UserSerializer,
)

User = get_user_model()


def send_confirmation_email(user):
    """Send email confirmation token to user."""
    token_obj = EmailConfirmationToken.objects.create(user=user)
    confirmation_url = f"{settings.FRONTEND_URL}/confirm-email/{token_obj.token}"
    
    subject = "Confirme seu email - ConstroiJa"
    message = render_to_string(
        "emails/email_confirmation.html",
        {
            "user": user,
            "confirmation_url": confirmation_url,
        },
    )
    
    send_mail(
        subject=subject,
        message="",
        html_message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=False,
    )


def send_password_reset_email(user):
    """Send password reset token to user."""
    token_obj = PasswordResetToken.objects.create(user=user)
    reset_url = f"{settings.FRONTEND_URL}/reset-password/{token_obj.token}"
    
    subject = "Recuperação de senha - ConstroiJa"
    message = render_to_string(
        "emails/password_reset.html",
        {
            "user": user,
            "reset_url": reset_url,
        },
    )
    
    send_mail(
        subject=subject,
        message="",
        html_message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=False,
    )


class ConsumerRegisterView(generics.CreateAPIView):
    """Consumer registration endpoint."""

    serializer_class = ConsumerRegistrationSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        send_confirmation_email(user)
        return Response(
            {
                "message": "Cadastro realizado com sucesso. Por favor, confirme seu email.",
                "user": UserSerializer(user).data,
            },
            status=status.HTTP_201_CREATED,
        )


class ProviderRegisterView(generics.CreateAPIView):
    """Provider registration endpoint."""

    serializer_class = ProviderRegistrationSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        send_confirmation_email(user)
        return Response(
            {
                "message": "Cadastro realizado com sucesso. Por favor, confirme seu email.",
                "user": UserSerializer(user).data,
            },
            status=status.HTTP_201_CREATED,
        )


class CompanyRegisterView(generics.CreateAPIView):
    """Company registration endpoint."""

    serializer_class = CompanyRegistrationSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        send_confirmation_email(user)
        return Response(
            {
                "message": "Cadastro realizado com sucesso. Por favor, confirme seu email.",
                "user": UserSerializer(user).data,
            },
            status=status.HTTP_201_CREATED,
        )


class CustomTokenObtainPairView(TokenObtainPairView):
    """Custom token obtain view with user data."""

    serializer_class = CustomTokenObtainPairSerializer


@api_view(["POST", "GET"])
@permission_classes([permissions.AllowAny])
def confirm_email(request):
    """Confirm user email with token."""
    # Accept token from POST body or GET query parameter
    if request.method == "POST":
        token = request.data.get("token")
    else:  # GET
        token = request.query_params.get("token")
    
    if not token:
        return Response(
            {"error": "Token é obrigatório."}, status=status.HTTP_400_BAD_REQUEST
        )

    try:
        token_obj = EmailConfirmationToken.objects.get(token=token)
        if not token_obj.is_valid():
            return Response(
                {"error": "Token inválido ou expirado."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = token_obj.user
        user.is_verified = True
        user.save()

        token_obj.used = True
        token_obj.save()

        return Response(
            {"message": "Email confirmado com sucesso."}, status=status.HTTP_200_OK
        )
    except EmailConfirmationToken.DoesNotExist:
        return Response(
            {"error": "Token inválido."}, status=status.HTTP_400_BAD_REQUEST
        )


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def request_password_reset(request):
    """Request password reset email."""
    serializer = PasswordResetRequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    email = serializer.validated_data["email"]
    try:
        user = User.objects.get(email=email)
        # Invalidate any existing unused tokens for this user
        PasswordResetToken.objects.filter(user=user, used=False).update(used=True)
        send_password_reset_email(user)
        return Response(
            {"message": "Email de recuperação de senha enviado."},
            status=status.HTTP_200_OK,
        )
    except User.DoesNotExist:
        # Não revelar se o email existe ou não por segurança
        return Response(
            {"message": "Se o email existir, um link de recuperação será enviado."},
            status=status.HTTP_200_OK,
        )


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def confirm_password_reset(request):
    """Confirm password reset with token."""
    serializer = PasswordResetConfirmSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    token = serializer.validated_data["token"]
    password = serializer.validated_data["password"]

    try:
        token_obj = PasswordResetToken.objects.get(token=token)
        if not token_obj.is_valid():
            return Response(
                {"error": "Token inválido ou expirado."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = token_obj.user
        user.set_password(password)
        user.save()

        token_obj.used = True
        token_obj.save()

        return Response(
            {"message": "Senha alterada com sucesso."}, status=status.HTTP_200_OK
        )
    except PasswordResetToken.DoesNotExist:
        return Response(
            {"error": "Token inválido."}, status=status.HTTP_400_BAD_REQUEST
        )


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def me(request):
    """Get current user information."""
    serializer = UserSerializer(request.user)
    return Response(serializer.data)


@api_view(["PUT", "PATCH"])
@permission_classes([permissions.IsAuthenticated])
def update_profile(request):
    """Update current user profile."""
    serializer = UserSerializer(
        request.user, data=request.data, partial=True
    )
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(serializer.data)


@api_view(["PUT", "PATCH"])
@permission_classes([permissions.IsAuthenticated])
def update_consumer_profile(request):
    """Update consumer profile."""
    if request.user.user_type != "consumer":
        return Response(
            {"error": "Usuário não é um consumidor."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        consumer = request.user.consumer_profile
    except Consumer.DoesNotExist:
        return Response(
            {"error": "Perfil de consumidor não encontrado."},
            status=status.HTTP_404_NOT_FOUND,
        )

    data = request.data.copy()

    # Handle password update
    if "password" in data and data["password"]:
        request.user.set_password(data.pop("password"))
        request.user.save()

    # Update consumer profile
    serializer = ConsumerSerializer(consumer, data=data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()

    # Handle profile photo
    if "profile_photo" in request.FILES:
        request.user.profile_photo = request.FILES["profile_photo"]
        request.user.save(update_fields=["profile_photo"])

    # Update user email if provided
    if "email" in data:
        request.user.email = data["email"]
        request.user.save()

    return Response(UserSerializer(request.user).data)


@api_view(["PUT", "PATCH"])
@permission_classes([permissions.IsAuthenticated])
def update_provider_profile(request):
    """Update provider profile."""
    if request.user.user_type != "provider":
        return Response(
            {"error": "Usuário não é um prestador."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        provider = request.user.provider_profile
    except Provider.DoesNotExist:
        return Response(
            {"error": "Perfil de prestador não encontrado."},
            status=status.HTTP_404_NOT_FOUND,
        )

    data = request.data.copy()

    # Handle password update
    if "password" in data and data["password"]:
        request.user.set_password(data.pop("password"))
        request.user.save()

    # Handle specialties (convert from JSON string if needed)
    if "specialties" in data and isinstance(data["specialties"], str):
        import json
        data["specialties"] = json.loads(data["specialties"])

    # Update provider profile
    serializer = ProviderSerializer(provider, data=data, partial=True, context={"request": request})
    serializer.is_valid(raise_exception=True)
    serializer.save()

    # Handle profile photo
    if "profile_photo" in request.FILES:
        request.user.profile_photo = request.FILES["profile_photo"]
        request.user.save(update_fields=["profile_photo"])

    # Update user email if provided
    if "email" in data:
        request.user.email = data["email"]
        request.user.save()

    return Response(UserSerializer(request.user).data)


@api_view(["PUT", "PATCH"])
@permission_classes([permissions.IsAuthenticated])
def update_company_profile(request):
    """Update company profile."""
    if request.user.user_type != "company":
        return Response(
            {"error": "Usuário não é uma empresa."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        company = request.user.company_profile
    except Company.DoesNotExist:
        return Response(
            {"error": "Perfil de empresa não encontrado."},
            status=status.HTTP_404_NOT_FOUND,
        )

    data = request.data.copy()

    # Handle password update
    if "password" in data and data["password"]:
        request.user.set_password(data.pop("password"))
        request.user.save()

    # Update company profile
    serializer = CompanySerializer(company, data=data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()

    # Handle logo and profile photo
    if "logo" in request.FILES:
        company.logo = request.FILES["logo"]
        company.save(update_fields=["logo"])
    if "profile_photo" in request.FILES:
        request.user.profile_photo = request.FILES["profile_photo"]
        request.user.save(update_fields=["profile_photo"])

    # Update user email if provided
    if "email" in data:
        request.user.email = data["email"]
        request.user.save()

    return Response(UserSerializer(request.user).data)


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def get_provider_availability(request):
    """Get provider availability status."""
    if request.user.user_type != "provider":
        return Response(
            {"error": "Usuário não é um prestador."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        provider = request.user.provider_profile
        return Response({"is_available": provider.is_available})
    except Provider.DoesNotExist:
        return Response(
            {"error": "Perfil de prestador não encontrado."},
            status=status.HTTP_404_NOT_FOUND,
        )


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def update_provider_availability(request):
    """Update provider availability status."""
    if request.user.user_type != "provider":
        return Response(
            {"error": "Usuário não é um prestador."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        provider = request.user.provider_profile
        is_available = request.data.get("is_available", False)
        provider.is_available = is_available
        provider.save()
        return Response({"is_available": is_available})
    except Provider.DoesNotExist:
        return Response(
            {"error": "Perfil de prestador não encontrado."},
            status=status.HTTP_404_NOT_FOUND,
        )


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def admin_user_list(request):
    """Admin: list all users with filters."""
    if request.user.user_type != "admin":
        return Response({"error": "Acesso negado."}, status=status.HTTP_403_FORBIDDEN)

    queryset = User.objects.select_related(
        "consumer_profile", "provider_profile", "company_profile"
    ).order_by("-date_joined")

    user_type = request.query_params.get("user_type")
    if user_type:
        queryset = queryset.filter(user_type=user_type)

    search = request.query_params.get("search")
    if search:
        queryset = queryset.filter(
            email__icontains=search
        ) | queryset.filter(
            provider_profile__full_name__icontains=search
        ) | queryset.filter(
            consumer_profile__full_name__icontains=search
        ) | queryset.filter(
            company_profile__company_name__icontains=search
        )

    serializer = AdminUserListSerializer(queryset, many=True)
    return Response(serializer.data)


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def admin_verify_provider(request, provider_id: int):
    """Admin: verify or unverify a provider."""
    if request.user.user_type != "admin":
        return Response({"error": "Acesso negado."}, status=status.HTTP_403_FORBIDDEN)

    try:
        provider = Provider.objects.get(id=provider_id)
    except Provider.DoesNotExist:
        return Response({"error": "Prestador não encontrado."}, status=status.HTTP_404_NOT_FOUND)

    verified = request.data.get("verified", True)
    provider.verified = verified
    provider.save(update_fields=["verified"])
    return Response({"verified": provider.verified})
