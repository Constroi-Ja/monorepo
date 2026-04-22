from django.contrib.auth import get_user_model
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import Company, Consumer, Provider

User = get_user_model()


class ConsumerSerializer(serializers.ModelSerializer):
    """Consumer profile serializer."""

    class Meta:
        model = Consumer
        fields = [
            "full_name",
            "cep",
            "street",
            "number",
            "complement",
            "city",
            "state",
            "cpf",
            "gender",
            "phone",
            "birth_date",
        ]


class ProviderSerializer(serializers.ModelSerializer):
    """Provider profile serializer."""

    criminal_record_url = serializers.SerializerMethodField()

    def get_criminal_record_url(self, obj):
        if obj.criminal_record:
            return obj.criminal_record.url
        return None

    class Meta:
        model = Provider
        fields = [
            "full_name",
            "specialties",
            "criminal_record",
            "criminal_record_url",
            "cep",
            "street",
            "number",
            "complement",
            "city",
            "state",
            "cpf",
            "cnpj",
            "gender",
            "phone",
            "birth_date",
            "verified",
            "is_available",
            "coverage_radius_km",
            "rating_average",
            "rating_count",
        ]
        read_only_fields = ["verified", "rating_average", "rating_count", "criminal_record_url"]


class CompanySerializer(serializers.ModelSerializer):
    """Company profile serializer."""

    class Meta:
        model = Company
        fields = [
            "company_name",
            "cep",
            "street",
            "number",
            "complement",
            "city",
            "state",
            "cnpj",
            "segment",
            "phone",
            "logo",
            "opening_time",
            "closing_time",
            "display_radius_km",
            "avg_minutes_per_km",
            "onboarding_completed",
            "rating_average",
            "rating_count",
        ]
        read_only_fields = ["rating_average", "rating_count"]


class UserSerializer(serializers.ModelSerializer):
    """User serializer."""

    consumer_profile = ConsumerSerializer(read_only=True)
    provider_profile = ProviderSerializer(read_only=True)
    company_profile = CompanySerializer(read_only=True)
    profile_photo_url = serializers.SerializerMethodField()

    def get_profile_photo_url(self, obj):
        if obj.profile_photo:
            return obj.profile_photo.url
        return None

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "username",
            "first_name",
            "last_name",
            "phone",
            "is_verified",
            "user_type",
            "date_joined",
            "profile_photo_url",
            "consumer_profile",
            "provider_profile",
            "company_profile",
        ]
        read_only_fields = ["id", "is_verified", "date_joined"]


class ConsumerRegistrationSerializer(serializers.Serializer):
    """Consumer registration serializer."""

    # User fields
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True, min_length=8)

    # Consumer fields
    full_name = serializers.CharField(max_length=255)
    cep = serializers.CharField(max_length=9)
    street = serializers.CharField(max_length=255)
    number = serializers.CharField(max_length=20)
    complement = serializers.CharField(max_length=255, required=False, allow_blank=True, allow_null=True)
    city = serializers.CharField(max_length=100)
    state = serializers.CharField(max_length=2)
    cpf = serializers.CharField(max_length=14)
    gender = serializers.CharField(max_length=1)
    phone = serializers.CharField(max_length=20)
    birth_date = serializers.DateField()

    def validate(self, attrs):
        if attrs["password"] != attrs["confirm_password"]:
            raise serializers.ValidationError({"password": "As senhas não coincidem."})
        return attrs

    def create(self, validated_data):
        validated_data.pop("confirm_password")
        consumer_data = {
            "full_name": validated_data.pop("full_name"),
            "cep": validated_data.pop("cep"),
            "street": validated_data.pop("street"),
            "number": validated_data.pop("number"),
            "complement": validated_data.pop("complement", None),
            "city": validated_data.pop("city"),
            "state": validated_data.pop("state"),
            "cpf": validated_data.pop("cpf"),
            "gender": validated_data.pop("gender"),
            "phone": validated_data.pop("phone"),
            "birth_date": validated_data.pop("birth_date"),
        }
        password = validated_data.pop("password")
        user = User.objects.create_user(
            username=validated_data["email"], user_type="consumer", **validated_data
        )
        user.set_password(password)
        user.save()
        Consumer.objects.create(user=user, **consumer_data)
        return user


class ProviderRegistrationSerializer(serializers.Serializer):
    """Provider registration serializer."""

    # User fields
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True, min_length=8)

    # Provider fields
    full_name = serializers.CharField(max_length=255)
    specialties = serializers.ListField(child=serializers.CharField())
    criminal_record = serializers.FileField(required=False, allow_null=True)
    cep = serializers.CharField(max_length=9)
    street = serializers.CharField(max_length=255)
    number = serializers.CharField(max_length=20)
    complement = serializers.CharField(max_length=255, required=False, allow_blank=True, allow_null=True)
    city = serializers.CharField(max_length=100)
    state = serializers.CharField(max_length=2)
    cpf = serializers.CharField(max_length=14)
    cnpj = serializers.CharField(max_length=18, required=False, allow_blank=True, allow_null=True)
    gender = serializers.CharField(max_length=1)
    phone = serializers.CharField(max_length=20)
    birth_date = serializers.DateField()

    def validate(self, attrs):
        if attrs["password"] != attrs["confirm_password"]:
            raise serializers.ValidationError({"password": "As senhas não coincidem."})
        return attrs

    def create(self, validated_data):
        validated_data.pop("confirm_password")
        provider_data = {
            "full_name": validated_data.pop("full_name"),
            "specialties": validated_data.pop("specialties", []),
            "criminal_record": validated_data.pop("criminal_record", None),
            "cep": validated_data.pop("cep"),
            "street": validated_data.pop("street"),
            "number": validated_data.pop("number"),
            "complement": validated_data.pop("complement", None),
            "city": validated_data.pop("city"),
            "state": validated_data.pop("state"),
            "cpf": validated_data.pop("cpf"),
            "cnpj": validated_data.pop("cnpj", None),
            "gender": validated_data.pop("gender"),
            "phone": validated_data.pop("phone"),
            "birth_date": validated_data.pop("birth_date"),
        }
        password = validated_data.pop("password")
        user = User.objects.create_user(
            username=validated_data["email"], user_type="provider", **validated_data
        )
        user.set_password(password)
        user.save()
        Provider.objects.create(user=user, **provider_data)
        return user


class CompanyRegistrationSerializer(serializers.Serializer):
    """Company registration serializer."""

    # User fields
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True, min_length=8)

    # Company fields
    company_name = serializers.CharField(max_length=255)
    cep = serializers.CharField(max_length=9)
    street = serializers.CharField(max_length=255)
    number = serializers.CharField(max_length=20)
    complement = serializers.CharField(max_length=255, required=False, allow_blank=True, allow_null=True)
    city = serializers.CharField(max_length=100)
    state = serializers.CharField(max_length=2)
    cnpj = serializers.CharField(max_length=18)
    segment = serializers.CharField(max_length=255)
    phone = serializers.CharField(max_length=20)

    def validate(self, attrs):
        if attrs["password"] != attrs["confirm_password"]:
            raise serializers.ValidationError({"password": "As senhas não coincidem."})
        return attrs

    def create(self, validated_data):
        validated_data.pop("confirm_password")
        company_data = {
            "company_name": validated_data.pop("company_name"),
            "cep": validated_data.pop("cep"),
            "street": validated_data.pop("street"),
            "number": validated_data.pop("number"),
            "complement": validated_data.pop("complement", None),
            "city": validated_data.pop("city"),
            "state": validated_data.pop("state"),
            "cnpj": validated_data.pop("cnpj"),
            "segment": validated_data.pop("segment"),
            "phone": validated_data.pop("phone"),
        }
        password = validated_data.pop("password")
        user = User.objects.create_user(
            username=validated_data["email"], user_type="company", **validated_data
        )
        user.set_password(password)
        user.save()
        Company.objects.create(user=user, **company_data)
        return user


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Custom token serializer with user data."""

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["email"] = user.email
        token["username"] = user.username
        token["user_type"] = user.user_type
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        if not self.user.is_verified:
            raise serializers.ValidationError(
                {
                    "error": "Email não confirmado. Por favor, confirme seu email antes de fazer login."
                }
            )
        data["user"] = UserSerializer(self.user).data
        return data


class AdminUserListSerializer(serializers.ModelSerializer):
    """Serializer for admin user listing."""

    consumer_profile = ConsumerSerializer(read_only=True)
    provider_profile = ProviderSerializer(read_only=True)
    company_profile = CompanySerializer(read_only=True)
    profile_photo_url = serializers.SerializerMethodField()

    def get_profile_photo_url(self, obj):
        if obj.profile_photo:
            return obj.profile_photo.url
        return None

    class Meta:
        model = User
        fields = [
            "id", "email", "username", "first_name", "last_name",
            "user_type", "is_verified", "is_active", "date_joined",
            "profile_photo_url", "consumer_profile", "provider_profile", "company_profile",
        ]


class PasswordResetRequestSerializer(serializers.Serializer):
    """Password reset request serializer."""

    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    """Password reset confirm serializer."""

    token = serializers.CharField()
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True, min_length=8)

    def validate(self, attrs):
        if attrs["password"] != attrs["confirm_password"]:
            raise serializers.ValidationError({"password": "As senhas não coincidem."})
        return attrs
