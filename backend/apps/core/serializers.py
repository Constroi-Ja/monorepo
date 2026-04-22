from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import CartItem, Deliverer, Item, Review, TechnicalVisitRequest

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


class PublicItemSerializer(ItemSerializer):
    """Public item serializer with company details."""

    company_name = serializers.SerializerMethodField()
    company_id = serializers.IntegerField(source="company.company_profile.id", read_only=True)

    class Meta(ItemSerializer.Meta):
        fields = ItemSerializer.Meta.fields + ["company_name", "company_id"]

    def get_company_name(self, obj):
        if hasattr(obj.company, "company_profile"):
            return obj.company.company_profile.company_name
        return obj.company.email


class CartItemSerializer(serializers.ModelSerializer):
    """Serializer for cart items."""

    item = PublicItemSerializer(read_only=True)
    item_id = serializers.PrimaryKeyRelatedField(
        source="item",
        queryset=Item.objects.filter(is_for_sale=True),
        write_only=True,
    )
    total = serializers.SerializerMethodField()

    class Meta:
        model = CartItem
        fields = ["id", "item", "item_id", "quantity", "total", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at", "total", "item"]

    def get_total(self, obj):
        return float(obj.item.price) * obj.quantity

    def create(self, validated_data):
        user = self.context["request"].user
        item = validated_data["item"]
        quantity = validated_data.get("quantity", 1)
        cart_item, created = CartItem.objects.get_or_create(
            user=user,
            item=item,
            defaults={"quantity": quantity},
        )
        if not created:
            cart_item.quantity += quantity
            cart_item.save(update_fields=["quantity", "updated_at"])
        return cart_item


class DelivererSerializer(serializers.ModelSerializer):
    """Serializer for Deliverer model."""

    level_display = serializers.CharField(source="get_level_display", read_only=True)

    class Meta:
        model = Deliverer
        fields = ["id", "name", "level", "level_display", "phone", "is_available", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at", "level_display"]


class ReviewSerializer(serializers.ModelSerializer):
    reviewer_name = serializers.SerializerMethodField()
    target_name = serializers.SerializerMethodField()

    def get_reviewer_name(self, obj):
        if hasattr(obj.reviewer, "consumer_profile"):
            return obj.reviewer.consumer_profile.full_name
        if hasattr(obj.reviewer, "provider_profile"):
            return obj.reviewer.provider_profile.full_name
        return obj.reviewer.email

    def get_target_name(self, obj):
        if hasattr(obj.target_user, "provider_profile"):
            return obj.target_user.provider_profile.full_name
        if hasattr(obj.target_user, "company_profile"):
            return obj.target_user.company_profile.company_name
        return obj.target_user.email

    class Meta:
        model = Review
        fields = [
            "id", "reviewer_name", "target_name", "target_type",
            "rating", "comment", "created_at",
        ]
        read_only_fields = ["id", "reviewer_name", "target_name", "created_at"]


class TechnicalVisitRequestSerializer(serializers.ModelSerializer):
    """Serializer for technical visit requests."""

    consumer_name = serializers.SerializerMethodField(read_only=True)
    provider_name = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = TechnicalVisitRequest
        fields = [
            "id",
            "consumer",
            "provider",
            "consumer_name",
            "provider_name",
            "notes",
            "preferred_date",
            "address",
            "status",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "status",
            "created_at",
            "updated_at",
            "consumer_name",
            "provider_name",
            "consumer",
        ]

    def get_consumer_name(self, obj):
        if hasattr(obj.consumer, "consumer_profile"):
            return obj.consumer.consumer_profile.full_name
        return obj.consumer.email

    def get_provider_name(self, obj):
        if hasattr(obj.provider, "provider_profile"):
            return obj.provider.provider_profile.full_name
        return obj.provider.email

    def validate_provider(self, provider):
        if provider.user_type != "provider":
            raise serializers.ValidationError("Prestador inválido.")
        if not hasattr(provider, "provider_profile") or not provider.provider_profile.is_available:
            raise serializers.ValidationError("Prestador indisponível no momento.")
        return provider
