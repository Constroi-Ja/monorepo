from django.conf import settings
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Item(models.Model):
    """Item model for company products."""

    SHIPPING_TYPE_CHOICES = [
        ("leve", "Leve"),
        ("medio", "Médio"),
        ("meio-pesado", "Meio-Pesado"),
        ("pesado", "Pesado"),
    ]

    company = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="items",
        limit_choices_to={"user_type": "company"},
    )
    name = models.CharField(max_length=255, verbose_name="Nome do Produto")
    description = models.TextField(blank=True, null=True, verbose_name="Descrição")
    price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Preço")
    shipping_type = models.CharField(
        max_length=20,
        choices=SHIPPING_TYPE_CHOICES,
        default="medio",
        verbose_name="Tipo de Envio",
    )
    photo = models.ImageField(
        upload_to="items/", blank=True, null=True, verbose_name="Foto"
    )
    is_for_sale = models.BooleanField(default=True, verbose_name="À Venda")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "items"
        verbose_name = "Item"
        verbose_name_plural = "Items"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name} - {self.company.company_profile.company_name if hasattr(self.company, 'company_profile') else self.company.email}"


class CartItem(models.Model):
    """Shopping cart item for consumer/provider users."""

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="cart_items")
    item = models.ForeignKey(Item, on_delete=models.CASCADE, related_name="cart_entries")
    quantity = models.PositiveIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "cart_items"
        unique_together = ("user", "item")
        ordering = ["-updated_at"]

    def __str__(self):
        return f"{self.user.email} - {self.item.name} ({self.quantity})"


class Deliverer(models.Model):
    """Deliverer/courier registered by a company."""

    LEVEL_CHOICES = [
        ("leve", "Leve"),
        ("medio", "Médio"),
        ("meio-pesado", "Meio-Pesado"),
        ("pesado", "Pesado"),
    ]

    company = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="deliverers",
        limit_choices_to={"user_type": "company"},
    )
    name = models.CharField(max_length=255, verbose_name="Nome")
    level = models.CharField(
        max_length=20,
        choices=LEVEL_CHOICES,
        default="medio",
        verbose_name="Nível",
    )
    phone = models.CharField(max_length=20, blank=True, null=True, verbose_name="Telefone")
    is_available = models.BooleanField(default=True, verbose_name="Disponível")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "deliverers"
        verbose_name = "Entregador"
        verbose_name_plural = "Entregadores"
        ordering = ["name"]

    def __str__(self):
        company_name = self.company.company_profile.company_name if hasattr(self.company, "company_profile") else self.company.email
        return f"{self.name} - {company_name}"


class Review(models.Model):
    """Review/rating for providers and companies."""

    class TargetType(models.TextChoices):
        PROVIDER = "provider", "Prestador"
        COMPANY = "company", "Empresa"

    reviewer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="reviews_given",
        verbose_name="Avaliador",
    )
    target_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="reviews_received",
        verbose_name="Avaliado",
    )
    target_type = models.CharField(
        max_length=10,
        choices=TargetType.choices,
        verbose_name="Tipo do Avaliado",
    )
    rating = models.PositiveSmallIntegerField(
        verbose_name="Nota",
        help_text="Nota de 1 a 5",
    )
    comment = models.TextField(blank=True, verbose_name="Comentário")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "reviews"
        verbose_name = "Avaliação"
        verbose_name_plural = "Avaliações"
        ordering = ["-created_at"]
        unique_together = [("reviewer", "target_user")]

    def __str__(self):
        return f"Review by {self.reviewer.email} → {self.target_user.email}: {self.rating}★"


class TechnicalVisitRequest(models.Model):
    """Technical visit request from consumers to providers."""

    STATUS_CHOICES = [
        ("awaiting_payment", "Aguardando Pagamento"),
        ("pending", "Pendente"),
        ("accepted", "Aceito"),
        ("refused", "Recusado"),
        ("completed", "Concluído"),
        ("cancelled", "Cancelado"),
    ]

    CANCELLED_BY_CHOICES = [
        ("consumer", "Consumidor"),
        ("provider", "Prestador"),
    ]

    consumer = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="technical_visit_requests",
        limit_choices_to={"user_type": "consumer"},
    )
    provider = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="technical_visit_assigned",
        limit_choices_to={"user_type": "provider"},
    )
    payment_order = models.ForeignKey(
        "payments.PaymentOrder",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="technical_visits",
    )
    notes = models.TextField(blank=True, null=True)
    preferred_date = models.DateField(blank=True, null=True)
    address = models.CharField(max_length=255)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="awaiting_payment")
    estimated_eta_minutes = models.IntegerField(null=True, blank=True)
    cancelled_by = models.CharField(
        max_length=10,
        choices=CANCELLED_BY_CHOICES,
        null=True,
        blank=True,
    )
    pending_since = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "technical_visit_requests"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Visita #{self.id} - {self.consumer.email} -> {self.provider.email}"


class VisitMessage(models.Model):
    """Chat message exchanged between consumer and provider in a technical visit."""

    visit = models.ForeignKey(
        TechnicalVisitRequest,
        on_delete=models.CASCADE,
        related_name="messages",
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="visit_messages_sent",
    )
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "visit_messages"
        ordering = ["created_at"]

    def __str__(self):
        return f"Msg#{self.id} visita#{self.visit_id} de {self.sender.email}"
