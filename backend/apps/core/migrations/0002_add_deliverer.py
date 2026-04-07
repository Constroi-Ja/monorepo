# Generated manually — adds Deliverer model

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("core", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="Deliverer",
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
                ("name", models.CharField(max_length=255, verbose_name="Nome")),
                (
                    "level",
                    models.CharField(
                        choices=[
                            ("leve", "Leve"),
                            ("medio", "Médio"),
                            ("meio-pesado", "Meio-Pesado"),
                            ("pesado", "Pesado"),
                        ],
                        default="medio",
                        max_length=20,
                        verbose_name="Nível",
                    ),
                ),
                (
                    "phone",
                    models.CharField(
                        blank=True, max_length=20, null=True, verbose_name="Telefone"
                    ),
                ),
                (
                    "is_available",
                    models.BooleanField(default=True, verbose_name="Disponível"),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "company",
                    models.ForeignKey(
                        limit_choices_to={"user_type": "company"},
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="deliverers",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "verbose_name": "Entregador",
                "verbose_name_plural": "Entregadores",
                "db_table": "deliverers",
                "ordering": ["name"],
            },
        ),
    ]
