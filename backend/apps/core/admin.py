from django.contrib import admin
from .models import Item


@admin.register(Item)
class ItemAdmin(admin.ModelAdmin):
    """Admin configuration for Item model."""

    list_display = [
        "name",
        "company",
        "price",
        "shipping_type",
        "is_for_sale",
        "created_at",
    ]
    list_filter = ["shipping_type", "is_for_sale", "created_at"]
    search_fields = ["name", "description", "company__email"]
    readonly_fields = ["created_at", "updated_at"]
    fieldsets = (
        (
            "Informações Básicas",
            {
                "fields": (
                    "company",
                    "name",
                    "description",
                    "price",
                    "shipping_type",
                    "is_for_sale",
                )
            },
        ),
        ("Imagem", {"fields": ("photo",)}),
        ("Datas", {"fields": ("created_at", "updated_at")}),
    )
