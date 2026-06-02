import logging
import re

import mercadopago
from django.conf import settings
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import PaymentOrder
from .serializers import (
    CreateCardPaymentSerializer,
    CreatePixPaymentSerializer,
    PaymentOrderSerializer,
)

logger = logging.getLogger(__name__)


def _mp_sdk() -> mercadopago.SDK:
    return mercadopago.SDK(settings.MERCADOPAGO_ACCESS_TOKEN)


def _clean_cpf(cpf: str) -> str:
    return re.sub(r"[^\d]", "", cpf)


def refund_payment(payment_order: PaymentOrder) -> bool:
    """Cancel or refund a PaymentOrder via Mercado Pago. Returns True on success."""
    if not payment_order.mp_payment_id:
        payment_order.status = PaymentOrder.Status.CANCELLED
        payment_order.save(update_fields=["status", "updated_at"])
        return True
    sdk = _mp_sdk()
    try:
        if payment_order.status == PaymentOrder.Status.PENDING:
            result = sdk.payment().update(payment_order.mp_payment_id, {"status": "cancelled"})
            if result.get("status") in (200, 201):
                payment_order.status = PaymentOrder.Status.CANCELLED
                payment_order.save(update_fields=["status", "updated_at"])
                return True
        elif payment_order.status == PaymentOrder.Status.APPROVED:
            result = sdk.refund().create({"payment_id": payment_order.mp_payment_id})
            if result.get("status") in (200, 201):
                payment_order.status = PaymentOrder.Status.REFUNDED
                payment_order.save(update_fields=["status", "updated_at"])
                return True
    except Exception as exc:
        logger.exception("Erro ao reembolsar pagamento %s: %s", payment_order.id, exc)
    return False


class CreatePixPaymentView(APIView):
    """POST /api/payments/pix/  — cria um pagamento PIX e retorna QR Code."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CreatePixPaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        sdk = _mp_sdk()
        payment_data = {
            "transaction_amount": float(data["amount"]),
            "description": data["description"],
            "external_reference": data.get("external_reference", ""),
            "payment_method_id": "pix",
            "payer": {
                "email": data["payer_email"],
                "first_name": data["payer_first_name"],
                "last_name": data["payer_last_name"],
                "entity_type": "individual",
                "identification": {
                    "type": "CPF",
                    "number": _clean_cpf(data["payer_cpf"]),
                },
            },
        }

        result = sdk.payment().create(payment_data)
        response_data = result.get("response", {})

        if result.get("status") not in (200, 201):
            cause = response_data.get("cause", [])
            cause_desc = ", ".join(c.get("description", "") for c in cause) if cause else ""
            logger.error("MP PIX error status=%s body=%s", result.get("status"), response_data)
            return Response(
                {"detail": "Erro ao criar pagamento PIX", "mp_error": response_data, "cause": cause_desc},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        point_of_interaction = response_data.get("point_of_interaction", {})
        transaction_data = point_of_interaction.get("transaction_data", {})

        order = PaymentOrder.objects.create(
            user=request.user,
            mp_payment_id=str(response_data.get("id", "")),
            method=PaymentOrder.Method.PIX,
            status=PaymentOrder.Status.PENDING,
            amount=data["amount"],
            description=data["description"],
            external_reference=data.get("external_reference", ""),
            pix_qr_code=transaction_data.get("qr_code_base64", ""),
            pix_qr_code_text=transaction_data.get("qr_code", ""),
            raw_response=response_data,
        )

        return Response(
            {
                "payment_id": order.id,
                "mp_payment_id": order.mp_payment_id,
                "status": order.status,
                "qr_code_base64": order.pix_qr_code,
                "qr_code_text": order.pix_qr_code_text,
                "amount": str(order.amount),
            },
            status=status.HTTP_201_CREATED,
        )


class CreateCardPaymentView(APIView):
    """POST /api/payments/card/  — processa pagamento com cartão via token do MP.js."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CreateCardPaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        sdk = _mp_sdk()
        payment_data = {
            "transaction_amount": float(data["amount"]),
            "token": data["token"],
            "description": data["description"],
            "external_reference": data.get("external_reference", ""),
            "installments": data["installments"],
            "payment_method_id": data["payment_method_id"],
            "payer": {
                "email": data["payer_email"],
                "identification": {
                    "type": "CPF",
                    "number": _clean_cpf(data["payer_cpf"]),
                },
            },
        }

        result = sdk.payment().create(payment_data)
        response_data = result.get("response", {})

        if result.get("status") not in (200, 201):
            logger.error("MP card error: %s", response_data)
            return Response(
                {"detail": "Erro ao processar pagamento", "mp_error": response_data},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        mp_status = response_data.get("status", "pending")
        order_status = {
            "approved": PaymentOrder.Status.APPROVED,
            "rejected": PaymentOrder.Status.REJECTED,
            "cancelled": PaymentOrder.Status.CANCELLED,
        }.get(mp_status, PaymentOrder.Status.PENDING)

        order = PaymentOrder.objects.create(
            user=request.user,
            mp_payment_id=str(response_data.get("id", "")),
            method=PaymentOrder.Method.CREDIT_CARD,
            status=order_status,
            amount=data["amount"],
            description=data["description"],
            external_reference=data.get("external_reference", ""),
            raw_response=response_data,
        )

        return Response(
            {
                "payment_id": order.id,
                "mp_payment_id": order.mp_payment_id,
                "status": order.status,
                "status_detail": response_data.get("status_detail", ""),
                "amount": str(order.amount),
            },
            status=status.HTTP_201_CREATED,
        )


class PaymentStatusView(generics.RetrieveAPIView):
    """GET /api/payments/<id>/  — consulta status de um pagamento."""

    permission_classes = [IsAuthenticated]
    serializer_class = PaymentOrderSerializer

    def get_queryset(self):
        return PaymentOrder.objects.filter(user=self.request.user)

    def retrieve(self, request, *args, **kwargs):
        order = self.get_object()

        # Sync status from MP if still pending
        if order.status == PaymentOrder.Status.PENDING and order.mp_payment_id:
            sdk = _mp_sdk()
            result = sdk.payment().get(order.mp_payment_id)
            if result.get("status") == 200:
                mp_status = result["response"].get("status", "pending")
                new_status = {
                    "approved": PaymentOrder.Status.APPROVED,
                    "rejected": PaymentOrder.Status.REJECTED,
                    "cancelled": PaymentOrder.Status.CANCELLED,
                }.get(mp_status, PaymentOrder.Status.PENDING)
                if new_status != order.status:
                    order.status = new_status
                    order.save(update_fields=["status", "updated_at"])
                    if new_status == PaymentOrder.Status.APPROVED:
                        from apps.core.models import TechnicalVisitRequest, Order as CoreOrder
                        CoreOrder.objects.filter(payment=order, status="pendente").update(status="confirmado")
                        TechnicalVisitRequest.objects.filter(
                            payment_order=order, status="awaiting_payment"
                        ).update(status="pending")

        return Response(PaymentOrderSerializer(order).data)


class PaymentWebhookView(APIView):
    """POST /api/payments/webhook/  — recebe notificações do Mercado Pago."""

    permission_classes = [AllowAny]

    def post(self, request):
        topic = request.data.get("type") or request.query_params.get("topic")
        resource_id = request.data.get("data", {}).get("id") or request.query_params.get("id")

        if topic == "payment" and resource_id:
            try:
                sdk = _mp_sdk()
                result = sdk.payment().get(resource_id)
                if result.get("status") == 200:
                    mp_data = result["response"]
                    mp_status = mp_data.get("status", "pending")
                    new_status = {
                        "approved": PaymentOrder.Status.APPROVED,
                        "rejected": PaymentOrder.Status.REJECTED,
                        "cancelled": PaymentOrder.Status.CANCELLED,
                        "refunded": PaymentOrder.Status.REFUNDED,
                    }.get(mp_status, PaymentOrder.Status.PENDING)

                    PaymentOrder.objects.filter(mp_payment_id=str(resource_id)).update(
                        status=new_status,
                        raw_response=mp_data,
                    )

                    # Activate visit or confirm order when payment is approved
                    if new_status == PaymentOrder.Status.APPROVED:
                        from django.utils import timezone as tz
                        from apps.core.models import TechnicalVisitRequest, Order
                        payment_order = PaymentOrder.objects.filter(mp_payment_id=str(resource_id)).first()
                        if payment_order:
                            TechnicalVisitRequest.objects.filter(
                                payment_order=payment_order, status="awaiting_payment"
                            ).update(status="pending", pending_since=tz.now())
                            Order.objects.filter(
                                payment=payment_order, status="pendente"
                            ).update(status="confirmado")
            except Exception as exc:
                logger.exception("Webhook processing error: %s", exc)

        return Response(status=status.HTTP_200_OK)


class SimulateApproveView(APIView):
    """POST /api/payments/<mp_payment_id>/simulate-approve/
    Simulates MP payment approval. Only works with TEST- access token.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request, mp_payment_id):
        token = getattr(settings, "MERCADOPAGO_ACCESS_TOKEN", "")
        if not token.startswith("TEST-"):
            return Response(
                {"detail": "Simulação disponível apenas em modo de teste."},
                status=status.HTTP_403_FORBIDDEN,
            )

        payment_order = PaymentOrder.objects.filter(mp_payment_id=str(mp_payment_id)).first()
        if not payment_order:
            return Response({"detail": "Pagamento não encontrado."}, status=status.HTTP_404_NOT_FOUND)

        sdk = _mp_sdk()
        try:
            result = sdk.payment().update(str(mp_payment_id), {"status": "approved"})
            if result.get("status") not in (200, 201):
                logger.error("MP simulate approve error: %s", result.get("response", {}))
                return Response(
                    {"detail": "Erro ao simular aprovação.", "mp_error": result.get("response", {})},
                    status=status.HTTP_502_BAD_GATEWAY,
                )
        except Exception as exc:
            logger.exception("Simulate approve error: %s", exc)
            return Response({"detail": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        payment_order.status = PaymentOrder.Status.APPROVED
        payment_order.save(update_fields=["status", "updated_at"])

        from django.utils import timezone as tz
        from apps.core.models import TechnicalVisitRequest, Order
        TechnicalVisitRequest.objects.filter(
            payment_order=payment_order, status="awaiting_payment"
        ).update(status="pending", pending_since=tz.now())
        Order.objects.filter(
            payment=payment_order, status="pendente"
        ).update(status="confirmado")

        return Response({"ok": True, "status": "approved"})


class MyPaymentsView(generics.ListAPIView):
    """GET /api/payments/  — lista pagamentos do usuário autenticado."""

    permission_classes = [IsAuthenticated]
    serializer_class = PaymentOrderSerializer

    def get_queryset(self):
        return PaymentOrder.objects.filter(user=self.request.user)
