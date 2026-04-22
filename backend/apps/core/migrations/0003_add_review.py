from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("core", "0002_add_deliverer"),
    ]

    operations = [
        migrations.CreateModel(
            name="Review",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                (
                    "target_type",
                    models.CharField(
                        choices=[("provider", "Prestador"), ("company", "Empresa")],
                        max_length=10,
                        verbose_name="Tipo do Avaliado",
                    ),
                ),
                ("rating", models.PositiveSmallIntegerField(help_text="Nota de 1 a 5", verbose_name="Nota")),
                ("comment", models.TextField(blank=True, verbose_name="Comentário")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "reviewer",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="reviews_given",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="Avaliador",
                    ),
                ),
                (
                    "target_user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="reviews_received",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="Avaliado",
                    ),
                ),
            ],
            options={
                "verbose_name": "Avaliação",
                "verbose_name_plural": "Avaliações",
                "db_table": "reviews",
                "ordering": ["-created_at"],
                "unique_together": {("reviewer", "target_user")},
            },
        ),
    ]
