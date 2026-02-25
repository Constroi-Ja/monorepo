from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model

from .serializers import (
    UserSerializer,
    UserRegistrationSerializer,
    CustomTokenObtainPairSerializer,
)

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    """User registration endpoint."""

    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            {
                "message": "User registered successfully.",
                "user": UserSerializer(user).data,
            },
            status=status.HTTP_201_CREATED,
        )


class CustomTokenObtainPairView(TokenObtainPairView):
    """Custom token obtain view with user data."""

    serializer_class = CustomTokenObtainPairSerializer


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
