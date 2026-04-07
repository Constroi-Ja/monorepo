from django.contrib import admin

from .models import PaymentOrder


@admin.register(PaymentOrder)
class PaymentOrderAdmin(admin.ModelAdmin):
    list_display = ["id", "user", "method", "status", "amount", "mp_payment_id", "created_at"]
    list_filter = ["status", "method", "created_at"]
    search_fields = ["user__email", "mp_payment_id", "external_reference"]
    readonly_fields = ["mp_payment_id", "pix_qr_code", "pix_qr_code_text", "raw_response", "created_at", "updated_at"]
    ordering = ["-created_at"]
