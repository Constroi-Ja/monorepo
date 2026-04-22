from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("authentication", "0004_company_provider_marketplace_fields"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="profile_photo",
            field=models.ImageField(blank=True, null=True, upload_to="profile_photos/", verbose_name="Foto de Perfil"),
        ),
        migrations.AddField(
            model_name="provider",
            name="coverage_radius_km",
            field=models.DecimalField(decimal_places=2, default=50, max_digits=5, verbose_name="Raio de Atendimento (km)"),
        ),
        migrations.AddField(
            model_name="company",
            name="logo",
            field=models.ImageField(blank=True, null=True, upload_to="company_logos/", verbose_name="Logo"),
        ),
        migrations.AlterField(
            model_name="user",
            name="user_type",
            field=models.CharField(
                blank=True,
                choices=[
                    ("consumer", "Consumidor"),
                    ("provider", "Prestador"),
                    ("company", "Empresa"),
                    ("admin", "Administrador"),
                ],
                max_length=10,
                null=True,
            ),
        ),
    ]
