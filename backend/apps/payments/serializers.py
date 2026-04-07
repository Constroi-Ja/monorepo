from rest_framework import serializers

from .models import PaymentOrder


class PaymentOrderSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    method_display = serializers.CharField(source="get_method_display", read_only=True)

    class Meta:
        model = PaymentOrder
        fields = [
            "id",
            "mp_payment_id",
            "method",
            "method_display",
            "status",
            "status_display",
            "amount",
            "pix_qr_code",
            "pix_qr_code_text",
            "pix_expiration",
            "description",
            "external_reference",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "mp_payment_id",
            "status",
            "pix_qr_code",
            "pix_qr_code_text",
            "pix_expiration",
            "created_at",
            "updated_at",
        ]


class CreatePixPaymentSerializer(serializers.Serializer):
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    description = serializers.CharField(max_length=255, default="Pagamento ConstróiJa")
    external_reference = serializers.CharField(max_length=100, required=False, default="")
    payer_email = serializers.EmailField()
    payer_first_name = serializers.CharField(max_length=100)
    payer_last_name = serializers.CharField(max_length=100)
    payer_cpf = serializers.CharField(max_length=14)  # "123.456.789-09" or "12345678909"


class CreateCardPaymentSerializer(serializers.Serializer):
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    description = serializers.CharField(max_length=255, default="Pagamento ConstróiJa")
    external_reference = serializers.CharField(max_length=100, required=False, default="")
    token = serializers.CharField()  # card token from MP.js SDK
    installments = serializers.IntegerField(min_value=1, max_value=12, default=1)
    payment_method_id = serializers.CharField()  # e.g. "visa", "master"
    payer_email = serializers.EmailField()
    payer_cpf = serializers.CharField(max_length=14)
