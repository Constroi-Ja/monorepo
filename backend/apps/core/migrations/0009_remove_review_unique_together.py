from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0008_inventoryentry"),
    ]

    operations = [
        migrations.AlterUniqueTogether(
            name="review",
            unique_together=set(),
        ),
    ]
