from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Bill, CartItem, Deliverer, InventoryEntry, Item, Order, OrderItem, OrderMessage, Review, TechnicalVisitRequest, VisitMessage

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
            "marca",
            "peso",
            "stock_count",
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
    payment_status = serializers.SerializerMethodField(read_only=True)

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
            "cancelled_by",
            "estimated_eta_minutes",
            "payment_status",
            "pending_since",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "status",
            "cancelled_by",
            "estimated_eta_minutes",
            "payment_status",
            "pending_since",
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

    def get_payment_status(self, obj):
        if obj.payment_order_id:
            return obj.payment_order.status
        return None

    def validate_provider(self, provider):
        if provider.user_type != "provider":
            raise serializers.ValidationError("Prestador inválido.")
        if not hasattr(provider, "provider_profile") or not provider.provider_profile.is_available:
            raise serializers.ValidationError("Prestador indisponível no momento.")
        return provider


class CreateVisitWithPaymentSerializer(serializers.Serializer):
    """Validates input for creating a technical visit with integrated payment."""

    provider = serializers.PrimaryKeyRelatedField(queryset=User.objects.filter(user_type="provider"))
    address = serializers.CharField(max_length=255)
    notes = serializers.CharField(required=False, allow_blank=True, default="")
    preferred_date = serializers.DateField(required=False, allow_null=True)
    payment_method = serializers.ChoiceField(choices=["pix", "credit_card"])
    payer_email = serializers.EmailField()
    payer_first_name = serializers.CharField(max_length=100)
    payer_last_name = serializers.CharField(max_length=100)
    payer_cpf = serializers.CharField(max_length=20)
    # Card-only fields
    token = serializers.CharField(required=False, allow_blank=True)
    installments = serializers.IntegerField(required=False, default=1, min_value=1, max_value=12)
    payment_method_id = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        if attrs.get("payment_method") == "credit_card":
            if not attrs.get("token"):
                raise serializers.ValidationError({"token": "Token do cartão é obrigatório."})
            if not attrs.get("payment_method_id"):
                raise serializers.ValidationError({"payment_method_id": "Bandeira do cartão é obrigatória."})
        provider = attrs["provider"]
        if not hasattr(provider, "provider_profile") or not provider.provider_profile.is_available:
            raise serializers.ValidationError({"provider": "Prestador indisponível no momento."})
        return attrs


class VisitMessageSerializer(serializers.ModelSerializer):
    """Serializer for visit chat messages."""

    sender_name = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = VisitMessage
        fields = ["id", "sender_name", "content", "created_at"]
        read_only_fields = ["id", "sender_name", "created_at"]

    def get_sender_name(self, obj):
        user = obj.sender
        if hasattr(user, "consumer_profile"):
            return user.consumer_profile.full_name
        if hasattr(user, "provider_profile"):
            return user.provider_profile.full_name
        return user.email


class OrderItemSerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(source="item.name", read_only=True)
    item_marca = serializers.CharField(source="item.marca", read_only=True)
    item_photo_url = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = ["id", "item", "item_name", "item_marca", "item_photo_url", "quantity", "unit_price"]

    def get_item_photo_url(self, obj):
        if obj.item.photo and hasattr(obj.item.photo, "url"):
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.item.photo.url)
            return obj.item.photo.url
        return None


class OrderMessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.SerializerMethodField(read_only=True)
    is_mine = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = OrderMessage
        fields = ["id", "sender_name", "is_mine", "content", "created_at"]
        read_only_fields = ["id", "sender_name", "is_mine", "created_at"]

    def get_sender_name(self, obj):
        user = obj.sender
        if hasattr(user, "consumer_profile"):
            return user.consumer_profile.full_name
        if hasattr(user, "provider_profile"):
            return user.provider_profile.full_name
        if hasattr(user, "company_profile"):
            return user.company_profile.company_name
        return user.email

    def get_is_mine(self, obj):
        request = self.context.get("request")
        return request and obj.sender_id == request.user.id


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    company_name = serializers.SerializerMethodField()
    buyer_name = serializers.SerializerMethodField()
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    payment_status = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            "id", "buyer", "buyer_name", "company", "company_name",
            "status", "status_display", "total_amount",
            "shipping_cost", "shipping_type",
            "payment_status", "items", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "buyer", "company", "status", "total_amount", "shipping_cost", "shipping_type", "created_at", "updated_at"]

    def get_company_name(self, obj):
        if hasattr(obj.company, "company_profile"):
            return obj.company.company_profile.company_name
        return obj.company.email

    def get_buyer_name(self, obj):
        if hasattr(obj.buyer, "consumer_profile"):
            return obj.buyer.consumer_profile.full_name
        if hasattr(obj.buyer, "provider_profile"):
            return obj.buyer.provider_profile.full_name
        return obj.buyer.email

    def get_payment_status(self, obj):
        if obj.payment_id:
            return obj.payment.status
        return None


class CreateOrderSerializer(serializers.Serializer):
    """Input for creating a product order with PIX payment."""

    items = serializers.ListField(
        child=serializers.DictField(), min_length=1
    )
    payer_email = serializers.EmailField()
    payer_first_name = serializers.CharField(max_length=100)
    payer_last_name = serializers.CharField(max_length=100)
    payer_cpf = serializers.CharField(max_length=20)

    def validate_items(self, value):
        for entry in value:
            if "item_id" not in entry or "quantity" not in entry:
                raise serializers.ValidationError("Cada item deve ter 'item_id' e 'quantity'.")
            try:
                Item.objects.get(id=entry["item_id"], is_for_sale=True)
            except Item.DoesNotExist:
                raise serializers.ValidationError(f"Item {entry['item_id']} não encontrado ou fora de venda.")
        return value


class BillSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source="get_category_display", read_only=True)

    class Meta:
        model = Bill
        fields = [
            "id", "description", "amount", "due_date",
            "category", "category_display", "paid", "created_at",
        ]
        read_only_fields = ["id", "created_at", "category_display"]


class InventoryEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = InventoryEntry
        fields = [
            "id", "name", "category", "quantity", "unit",
            "min_quantity", "purchase_price", "notes",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
