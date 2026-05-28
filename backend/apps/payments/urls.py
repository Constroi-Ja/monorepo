from django.urls import path

from .views import (
    CreateCardPaymentView,
    CreatePixPaymentView,
    MyPaymentsView,
    PaymentStatusView,
    PaymentWebhookView,
    SimulateApproveView,
)

urlpatterns = [
    path("", MyPaymentsView.as_view(), name="payments-list"),
    path("pix/", CreatePixPaymentView.as_view(), name="payments-pix"),
    path("card/", CreateCardPaymentView.as_view(), name="payments-card"),
    path("webhook/", PaymentWebhookView.as_view(), name="payments-webhook"),
    path("<int:pk>/", PaymentStatusView.as_view(), name="payments-status"),
    path("<str:mp_payment_id>/simulate-approve/", SimulateApproveView.as_view(), name="simulate-approve"),
]
