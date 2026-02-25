from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Custom user admin."""

    list_display = [
        "email",
        "username",
        "first_name",
        "last_name",
        "is_verified",
        "is_staff",
        "is_active",
        "date_joined",
    ]
    list_filter = ["is_staff", "is_active", "is_verified", "date_joined"]
    search_fields = ["email", "username", "first_name", "last_name"]
    ordering = ["-date_joined"]
