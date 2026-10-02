from datetime import datetime, time
from types import SimpleNamespace
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from apps.authentication.models import Company, Consumer

from .models import Item
from .views import is_company_open

User = get_user_model()


class CompanyOpeningHoursTests(TestCase):
    def test_interval_until_midnight_is_open_before_midnight(self):
        company = SimpleNamespace(opening_time=time(12), closing_time=time(0))

        with patch(
            "apps.core.views.timezone.localtime",
            return_value=datetime(2026, 10, 1, 21, 35),
        ):
            self.assertTrue(is_company_open(company))

    def test_interval_crossing_midnight_is_open_after_midnight(self):
        company = SimpleNamespace(opening_time=time(22), closing_time=time(2))

        with patch(
            "apps.core.views.timezone.localtime",
            return_value=datetime(2026, 10, 2, 1, 30),
        ):
            self.assertTrue(is_company_open(company))

    def test_equal_opening_and_closing_times_mean_open_all_day(self):
        company = SimpleNamespace(opening_time=time(0), closing_time=time(0))

        with patch(
            "apps.core.views.timezone.localtime",
            return_value=datetime(2026, 10, 1, 12, 0),
        ):
            self.assertTrue(is_company_open(company))


class PublicStoreAvailabilityTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.consumer = User.objects.create_user(
            username="consumer",
            email="consumer@example.com",
            password="Password123!",
            user_type="consumer",
        )
        self.company_user = User.objects.create_user(
            username="company",
            email="company@example.com",
            password="Password123!",
            user_type="company",
        )
        self.company = Company.objects.create(
            user=self.company_user,
            company_name="Loja Teste",
            cep="01000000",
            street="Rua Teste",
            number="10",
            city="São Paulo",
            state="SP",
            cnpj="12345678000199",
            segment="Materiais",
            phone="11999999999",
            opening_time=time(12),
            closing_time=time(0),
        )
        self.item = Item.objects.create(
            company=self.company_user,
            name="Item aberto",
            price="10.00",
        )
        self.client.force_authenticate(user=self.consumer)

    @patch(
        "apps.core.views.timezone.localtime",
        return_value=datetime(2026, 10, 1, 21, 35),
    )
    def test_open_store_and_items_are_public(self, localtime):
        stores_response = self.client.get("/api/core/stores/featured/")
        items_response = self.client.get("/api/core/items/public/")

        self.assertEqual(stores_response.status_code, 200)
        self.assertEqual(items_response.status_code, 200)
        self.assertEqual(len(stores_response.data), 1)
        self.assertEqual(len(items_response.data), 1)

    @patch(
        "apps.core.views.timezone.localtime",
        return_value=datetime(2026, 10, 1, 21, 35),
    )
    def test_closed_store_and_items_are_hidden(self, localtime):
        self.company.opening_time = time(8)
        self.company.closing_time = time(18)
        self.company.save(update_fields=["opening_time", "closing_time"])

        stores_response = self.client.get("/api/core/stores/featured/")
        items_response = self.client.get(
            f"/api/core/items/public/?company_id={self.company.id}"
        )

        self.assertEqual(stores_response.status_code, 200)
        self.assertEqual(items_response.status_code, 200)
        self.assertEqual(stores_response.data, [])
        self.assertEqual(items_response.data, [])

    @patch(
        "apps.core.views.timezone.localtime",
        return_value=datetime(2026, 10, 1, 21, 35),
    )
    def test_items_not_for_sale_are_hidden(self, localtime):
        self.item.is_for_sale = False
        self.item.save(update_fields=["is_for_sale"])

        response = self.client.get("/api/core/items/public/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data, [])

    @patch(
        "apps.core.views.timezone.localtime",
        return_value=datetime(2026, 10, 1, 21, 35),
    )
    def test_items_outside_delivery_radius_are_hidden(self, localtime):
        Consumer.objects.create(
            user=self.consumer,
            full_name="Consumidor Teste",
            cep="99999999",
            street="Rua do Consumidor",
            number="123",
            city="São Paulo",
            state="SP",
            cpf="11122233344",
            gender="M",
            phone="11999999999",
            birth_date="1998-01-01",
        )
        self.company.display_radius_km = 5
        self.company.save(update_fields=["display_radius_km"])

        stores_response = self.client.get("/api/core/stores/featured/")
        items_response = self.client.get("/api/core/items/public/")

        self.assertEqual(stores_response.status_code, 200)
        self.assertEqual(items_response.status_code, 200)
        self.assertEqual(stores_response.data, [])
        self.assertEqual(items_response.data, [])