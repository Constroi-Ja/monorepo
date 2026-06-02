from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("authentication", "0006_company_pix_key_company_pix_key_type"),
    ]

    operations = [
        migrations.AddField(
            model_name="company",
            name="base_price_leve",
            field=models.DecimalField(decimal_places=2, default=0, max_digits=8),
        ),
        migrations.AddField(
            model_name="company",
            name="base_price_medio",
            field=models.DecimalField(decimal_places=2, default=0, max_digits=8),
        ),
        migrations.AddField(
            model_name="company",
            name="base_price_meio_pesado",
            field=models.DecimalField(decimal_places=2, default=0, max_digits=8),
        ),
        migrations.AddField(
            model_name="company",
            name="base_price_pesado",
            field=models.DecimalField(decimal_places=2, default=0, max_digits=8),
        ),
    ]
