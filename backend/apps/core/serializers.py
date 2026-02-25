from rest_framework import serializers
from django.contrib.auth import get_user_model

from .models import Item

User = get_user_model()


class ItemSerializer(serializers.ModelSerializer):
    """Serializer for Item model."""

    photo_url = serializers.SerializerMethodField()
    shipping_type_display = serializers.CharField(
        source="get_shipping_type_display", read_only=True
    )

    class Meta:
        model = Item
        fields = [
            "id",
            "name",
            "description",
            "price",
            "shipping_type",
            "shipping_type_display",
            "photo",
            "photo_url",
            "is_for_sale",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at", "photo_url"]

    def get_photo_url(self, obj):
        """Return the full URL of the photo if it exists."""
        if obj.photo and hasattr(obj.photo, "url"):
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.photo.url)
            return obj.photo.url
        return None

    def validate_company(self, value):
        """Ensure the user is a company."""
        if not hasattr(value, "company_profile"):
            raise serializers.ValidationError("Apenas empresas podem criar itens.")
        return value


class ItemCreateSerializer(ItemSerializer):
    """Serializer for creating items."""

    class Meta(ItemSerializer.Meta):
        fields = ItemSerializer.Meta.fields

    def create(self, validated_data):
        """Create item and associate with company."""
        request = self.context.get("request")
        if request and request.user:
            validated_data["company"] = request.user
        return super().create(validated_data)


class ItemUpdateSerializer(ItemSerializer):
    """Serializer for updating items."""

    class Meta(ItemSerializer.Meta):
        fields = ItemSerializer.Meta.fields
        extra_kwargs = {
            "photo": {"required": False},
        }
