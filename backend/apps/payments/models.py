from django.conf import settings
from django.db import models


class PaymentOrder(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pendente"
        APPROVED = "approved", "Aprovado"
        REJECTED = "rejected", "Rejeitado"
        CANCELLED = "cancelled", "Cancelado"
        REFUNDED = "refunded", "Estornado"

    class Method(models.TextChoices):
        PIX = "pix", "PIX"
        CREDIT_CARD = "credit_card", "Cartão de Crédito"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="payment_orders",
    )
    mp_payment_id = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name="ID do Pagamento (MP)",
    )
    mp_preference_id = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name="Preference ID (MP)",
    )
    method = models.CharField(
        max_length=20,
        choices=Method.choices,
        verbose_name="Método",
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        verbose_name="Status",
    )
    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name="Valor",
    )
    # PIX fields
    pix_qr_code = models.TextField(blank=True, null=True, verbose_name="QR Code PIX (base64)")
    pix_qr_code_text = models.TextField(blank=True, null=True, verbose_name="Copia e Cola PIX")
    pix_expiration = models.DateTimeField(blank=True, null=True, verbose_name="Validade PIX")

    # Metadata
    description = models.CharField(max_length=255, blank=True, verbose_name="Descrição")
    external_reference = models.CharField(
        max_length=100, blank=True, verbose_name="Referência externa"
    )
    raw_response = models.JSONField(blank=True, null=True, verbose_name="Resposta raw MP")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "payment_orders"
        verbose_name = "Pedido de Pagamento"
        verbose_name_plural = "Pedidos de Pagamento"
        ordering = ["-created_at"]

    def __str__(self):
        return f"PaymentOrder#{self.id} {self.method} {self.status} R${self.amount}"
