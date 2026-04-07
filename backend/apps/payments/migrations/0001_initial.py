from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="PaymentOrder",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "mp_payment_id",
                    models.CharField(
                        blank=True,
                        max_length=100,
                        null=True,
                        verbose_name="ID do Pagamento (MP)",
                    ),
                ),
                (
                    "mp_preference_id",
                    models.CharField(
                        blank=True,
                        max_length=100,
                        null=True,
                        verbose_name="Preference ID (MP)",
                    ),
                ),
                (
                    "method",
                    models.CharField(
                        choices=[("pix", "PIX"), ("credit_card", "Cartão de Crédito")],
                        max_length=20,
                        verbose_name="Método",
                    ),
                ),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("pending", "Pendente"),
                            ("approved", "Aprovado"),
                            ("rejected", "Rejeitado"),
                            ("cancelled", "Cancelado"),
                            ("refunded", "Estornado"),
                        ],
                        default="pending",
                        max_length=20,
                        verbose_name="Status",
                    ),
                ),
                (
                    "amount",
                    models.DecimalField(
                        decimal_places=2, max_digits=10, verbose_name="Valor"
                    ),
                ),
                (
                    "pix_qr_code",
                    models.TextField(
                        blank=True, null=True, verbose_name="QR Code PIX (base64)"
                    ),
                ),
                (
                    "pix_qr_code_text",
                    models.TextField(
                        blank=True, null=True, verbose_name="Copia e Cola PIX"
                    ),
                ),
                (
                    "pix_expiration",
                    models.DateTimeField(
                        blank=True, null=True, verbose_name="Validade PIX"
                    ),
                ),
                (
                    "description",
                    models.CharField(
                        blank=True, max_length=255, verbose_name="Descrição"
                    ),
                ),
                (
                    "external_reference",
                    models.CharField(
                        blank=True, max_length=100, verbose_name="Referência externa"
                    ),
                ),
                (
                    "raw_response",
                    models.JSONField(blank=True, null=True, verbose_name="Resposta raw MP"),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="payment_orders",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "verbose_name": "Pedido de Pagamento",
                "verbose_name_plural": "Pedidos de Pagamento",
                "db_table": "payment_orders",
                "ordering": ["-created_at"],
            },
        ),
    ]
