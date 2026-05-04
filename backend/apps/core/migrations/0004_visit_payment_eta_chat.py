from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0003_add_review"),
        ("payments", "0001_initial"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # Add new fields to TechnicalVisitRequest
        migrations.AddField(
            model_name="technicalvisitrequest",
            name="payment_order",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="technical_visits",
                to="payments.paymentorder",
            ),
        ),
        migrations.AddField(
            model_name="technicalvisitrequest",
            name="estimated_eta_minutes",
            field=models.IntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="technicalvisitrequest",
            name="cancelled_by",
            field=models.CharField(
                blank=True,
                choices=[("consumer", "Consumidor"), ("provider", "Prestador")],
                max_length=10,
                null=True,
            ),
        ),
        migrations.AlterField(
            model_name="technicalvisitrequest",
            name="status",
            field=models.CharField(
                choices=[
                    ("awaiting_payment", "Aguardando Pagamento"),
                    ("pending", "Pendente"),
                    ("accepted", "Aceito"),
                    ("refused", "Recusado"),
                    ("completed", "Concluído"),
                    ("cancelled", "Cancelado"),
                ],
                default="awaiting_payment",
                max_length=20,
            ),
        ),
        # Create VisitMessage model
        migrations.CreateModel(
            name="VisitMessage",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True, primary_key=True, serialize=False, verbose_name="ID"
                    ),
                ),
                ("content", models.TextField()),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "sender",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="visit_messages_sent",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "visit",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="messages",
                        to="core.technicalvisitrequest",
                    ),
                ),
            ],
            options={
                "db_table": "visit_messages",
                "ordering": ["created_at"],
            },
        ),
    ]
