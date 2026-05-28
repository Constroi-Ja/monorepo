import secrets
from datetime import timedelta

from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone


def default_specialties():
    """Default factory for specialties field."""
    return []


class User(AbstractUser):
    """Custom user model."""

    USER_TYPE_CHOICES = [
        ("consumer", "Consumidor"),
        ("provider", "Prestador"),
        ("company", "Empresa"),
        ("admin", "Administrador"),
    ]

    email = models.EmailField(unique=True, db_index=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    is_verified = models.BooleanField(default=False)
    user_type = models.CharField(max_length=10, choices=USER_TYPE_CHOICES, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    profile_photo = models.ImageField(upload_to="profile_photos/", null=True, blank=True, verbose_name="Foto de Perfil")

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    class Meta:
        db_table = "users"
        verbose_name = "User"
        verbose_name_plural = "Users"
        ordering = ["-created_at"]

    def __str__(self):
        return self.email


class EmailConfirmationToken(models.Model):
    """Token for email confirmation."""

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="email_confirmation_tokens")
    token = models.CharField(max_length=64, unique=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    used = models.BooleanField(default=False)

    class Meta:
        db_table = "email_confirmation_tokens"
        ordering = ["-created_at"]

    def save(self, *args, **kwargs):
        if not self.token:
            self.token = secrets.token_urlsafe(32)
        if not self.expires_at:
            self.expires_at = timezone.now() + timedelta(days=7)
        super().save(*args, **kwargs)

    def is_valid(self):
        return not self.used and timezone.now() < self.expires_at


class PasswordResetToken(models.Model):
    """Token for password reset."""

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="password_reset_tokens")
    token = models.CharField(max_length=64, unique=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    used = models.BooleanField(default=False)

    class Meta:
        db_table = "password_reset_tokens"
        ordering = ["-created_at"]

    def save(self, *args, **kwargs):
        if not self.token:
            self.token = secrets.token_urlsafe(32)
        if not self.expires_at:
            self.expires_at = timezone.now() + timedelta(hours=24)
        super().save(*args, **kwargs)

    def is_valid(self):
        return not self.used and timezone.now() < self.expires_at


class Consumer(models.Model):
    """Consumer profile model."""

    GENDER_CHOICES = [
        ("M", "Masculino"),
        ("F", "Feminino"),
        ("O", "Outro"),
        ("P", "Prefiro não informar"),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="consumer_profile")
    full_name = models.CharField(max_length=255)
    cep = models.CharField(max_length=9)
    street = models.CharField(max_length=255)  # Rua (preenchido pelo CEP)
    number = models.CharField(max_length=20)
    complement = models.CharField(max_length=255, blank=True, null=True)  # Complemento
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=2)
    cpf = models.CharField(max_length=14, unique=True)
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES)
    phone = models.CharField(max_length=20)
    birth_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "consumers"
        verbose_name = "Consumer"
        verbose_name_plural = "Consumers"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.full_name} ({self.user.email})"


class Provider(models.Model):
    """Provider profile model."""

    GENDER_CHOICES = [
        ("M", "Masculino"),
        ("F", "Feminino"),
        ("O", "Outro"),
        ("P", "Prefiro não informar"),
    ]

    SPECIALTY_CHOICES = [
        ("eletricista", "Eletricista"),
        ("pedreiro", "Pedreiro"),
        ("vidraceiro", "Vidraceiro"),
        ("pintor", "Pintor"),
        ("encanador", "Encanador"),
        ("carpinteiro", "Carpinteiro"),
        ("serralheiro", "Serralheiro"),
        ("gesseiro", "Gesseiro"),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="provider_profile")
    full_name = models.CharField(max_length=255)
    specialties = models.JSONField(default=default_specialties, blank=True)  # Array de especialidades
    criminal_record = models.FileField(upload_to="criminal_records/", null=True, blank=True)
    cep = models.CharField(max_length=9)
    street = models.CharField(max_length=255)  # Rua (preenchido pelo CEP)
    number = models.CharField(max_length=20)
    complement = models.CharField(max_length=255, blank=True, null=True)  # Complemento
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=2)
    cpf = models.CharField(max_length=14, unique=True)
    cnpj = models.CharField(max_length=18, blank=True, null=True)
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES)
    phone = models.CharField(max_length=20)
    birth_date = models.DateField()
    verified = models.BooleanField(default=False)  # Alterado apenas por banco
    is_available = models.BooleanField(default=False)  # Status de disponibilidade
    coverage_radius_km = models.DecimalField(max_digits=5, decimal_places=2, default=50, verbose_name="Raio de Atendimento (km)")
    rating_average = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    rating_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "providers"
        verbose_name = "Provider"
        verbose_name_plural = "Providers"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.full_name} ({self.user.email})"


class Company(models.Model):
    """Company profile model."""

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="company_profile")
    company_name = models.CharField(max_length=255)
    cep = models.CharField(max_length=9)
    street = models.CharField(max_length=255)  # Rua (preenchido pelo CEP)
    number = models.CharField(max_length=20)
    complement = models.CharField(max_length=255, blank=True, null=True)  # Complemento
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=2)
    cnpj = models.CharField(max_length=18, unique=True)
    segment = models.CharField(max_length=255)
    phone = models.CharField(max_length=20)
    logo = models.ImageField(upload_to="company_logos/", null=True, blank=True, verbose_name="Logo")
    opening_time = models.TimeField(null=True, blank=True)
    closing_time = models.TimeField(null=True, blank=True)
    display_radius_km = models.DecimalField(max_digits=5, decimal_places=2, default=20)
    avg_minutes_per_km = models.DecimalField(max_digits=5, decimal_places=2, default=4)
    PIX_KEY_TYPE_CHOICES = [
        ("cpf", "CPF"),
        ("cnpj", "CNPJ"),
        ("email", "E-mail"),
        ("telefone", "Telefone"),
        ("aleatoria", "Chave Aleatória"),
    ]
    pix_key_type = models.CharField(max_length=20, choices=PIX_KEY_TYPE_CHOICES, blank=True, default="")
    pix_key = models.CharField(max_length=255, blank=True, default="")
    onboarding_completed = models.BooleanField(default=False)
    rating_average = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    rating_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "companies"
        verbose_name = "Company"
        verbose_name_plural = "Companies"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.company_name} ({self.user.email})"
