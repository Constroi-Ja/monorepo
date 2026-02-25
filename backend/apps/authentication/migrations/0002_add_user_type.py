# Generated manually

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("authentication", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="user_type",
            field=models.CharField(
                blank=True,
                choices=[
                    ("consumer", "Consumidor"),
                    ("provider", "Prestador"),
                    ("company", "Empresa"),
                ],
                max_length=10,
                null=True,
            ),
        ),
    ]
