from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("core", "0007_order_item_peso_item_stock_count_ordermessage_and_more"),
    ]

    operations = [
        migrations.CreateModel(
            name="InventoryEntry",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=255)),
                ("category", models.CharField(blank=True, default="", max_length=100)),
                ("quantity", models.DecimalField(decimal_places=2, default=0, max_digits=10)),
                (
                    "unit",
                    models.CharField(
                        choices=[
                            ("un", "Unidade"),
                            ("kg", "Kilograma"),
                            ("L", "Litro"),
                            ("m", "Metro"),
                            ("m2", "Metro²"),
                            ("m3", "Metro³"),
                            ("cx", "Caixa"),
                        ],
                        default="un",
                        max_length=10,
                    ),
                ),
                ("min_quantity", models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True)),
                ("purchase_price", models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True)),
                ("notes", models.TextField(blank=True, default="")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "company",
                    models.ForeignKey(
                        limit_choices_to={"user_type": "company"},
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="inventory_entries",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "db_table": "inventory_entries",
                "ordering": ["name"],
            },
        ),
    ]
