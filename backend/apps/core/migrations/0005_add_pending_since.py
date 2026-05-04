from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0004_visit_payment_eta_chat"),
    ]

    operations = [
        migrations.AddField(
            model_name="technicalvisitrequest",
            name="pending_since",
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
