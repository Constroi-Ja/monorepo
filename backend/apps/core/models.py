from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Item(models.Model):
    """Item model for company products."""

    SHIPPING_TYPE_CHOICES = [
        ("leve", "Leve"),
        ("medio", "Médio"),
        ("meio-pesado", "Meio-Pesado"),
        ("pesado", "Pesado"),
    ]

    company = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="items",
        limit_choices_to={"user_type": "company"},
    )
    name = models.CharField(max_length=255, verbose_name="Nome do Produto")
    description = models.TextField(blank=True, null=True, verbose_name="Descrição")
    price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Preço")
    shipping_type = models.CharField(
        max_length=20,
        choices=SHIPPING_TYPE_CHOICES,
        default="medio",
        verbose_name="Tipo de Envio",
    )
    photo = models.ImageField(
        upload_to="items/", blank=True, null=True, verbose_name="Foto"
    )
    is_for_sale = models.BooleanField(default=True, verbose_name="À Venda")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "items"
        verbose_name = "Item"
        verbose_name_plural = "Items"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name} - {self.company.company_profile.company_name if hasattr(self.company, 'company_profile') else self.company.email}"
