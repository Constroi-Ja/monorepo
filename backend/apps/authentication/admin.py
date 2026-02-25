from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import (
    User,
    Consumer,
    Provider,
    Company,
    EmailConfirmationToken,
    PasswordResetToken,
)


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Custom user admin."""

    list_display = [
        "email",
        "username",
        "first_name",
        "last_name",
        "user_type",
        "is_verified",
        "is_staff",
        "is_active",
        "date_joined",
    ]
    list_filter = ["is_staff", "is_active", "is_verified", "user_type", "date_joined"]
    search_fields = ["email", "username", "first_name", "last_name"]
    ordering = ["-date_joined"]


@admin.register(Consumer)
class ConsumerAdmin(admin.ModelAdmin):
    """Consumer admin."""

    list_display = ["full_name", "user", "cpf", "city", "state", "created_at"]
    list_filter = ["state", "gender", "created_at"]
    search_fields = ["full_name", "cpf", "user__email"]
    readonly_fields = ["created_at", "updated_at"]


@admin.register(Provider)
class ProviderAdmin(admin.ModelAdmin):
    """Provider admin."""

    list_display = ["full_name", "user", "cpf", "verified", "city", "state", "created_at"]
    list_filter = ["verified", "state", "gender", "created_at"]
    search_fields = ["full_name", "cpf", "cnpj", "user__email"]
    readonly_fields = ["verified", "created_at", "updated_at"]
    
    # Nota: O campo 'verified' deve ser alterado apenas diretamente no banco de dados


@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    """Company admin."""

    list_display = ["company_name", "user", "cnpj", "segment", "city", "state", "created_at"]
    list_filter = ["state", "segment", "created_at"]
    search_fields = ["company_name", "cnpj", "user__email"]
    readonly_fields = ["created_at", "updated_at"]


@admin.register(EmailConfirmationToken)
class EmailConfirmationTokenAdmin(admin.ModelAdmin):
    """Email confirmation token admin."""

    list_display = ["user", "token", "used", "created_at", "expires_at"]
    list_filter = ["used", "created_at"]
    search_fields = ["user__email", "token"]
    readonly_fields = ["token", "created_at", "expires_at"]


@admin.register(PasswordResetToken)
class PasswordResetTokenAdmin(admin.ModelAdmin):
    """Password reset token admin."""

    list_display = ["user", "token", "used", "created_at", "expires_at"]
    list_filter = ["used", "created_at"]
    search_fields = ["user__email", "token"]
    readonly_fields = ["token", "created_at", "expires_at"]
