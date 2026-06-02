from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0009_remove_review_unique_together"),
    ]

    operations = [
        migrations.AddField(
            model_name="order",
            name="shipping_cost",
            field=models.DecimalField(decimal_places=2, default=0, max_digits=8),
        ),
        migrations.AddField(
            model_name="order",
            name="shipping_type",
            field=models.CharField(blank=True, default="", max_length=20),
        ),
    ]
