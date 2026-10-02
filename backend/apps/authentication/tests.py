from unittest.mock import patch

from django.core import mail
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from .models import PasswordResetToken, User


@override_settings(
    EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
    FRONTEND_URL="https://frontend.test",
)
class PasswordResetFlowTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="reset-user",
            email="user@example.com",
            password="OldPassword123!",
        )

    def test_request_sends_email_with_frontend_reset_url(self):
        response = self.client.post(
            "/api/auth/password-reset/",
            {"email": "user@example.com"},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, ["user@example.com"])

        token = PasswordResetToken.objects.get(user=self.user)
        html = mail.outbox[0].alternatives[0][0]
        self.assertIn(f"https://frontend.test/reset-password/{token.token}", html)

    def test_request_is_case_insensitive_and_does_not_enumerate_users(self):
        response = self.client.post(
            "/api/auth/password-reset/",
            {"email": "USER@EXAMPLE.COM"},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.data["message"],
            "Se o email existir, um link de recuperação será enviado.",
        )
        self.assertEqual(len(mail.outbox), 1)

        mail.outbox.clear()
        response = self.client.post(
            "/api/auth/password-reset/",
            {"email": "missing@example.com"},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.data["message"],
            "Se o email existir, um link de recuperação será enviado.",
        )
        self.assertEqual(len(mail.outbox), 0)

    @patch("apps.authentication.views.send_mail", side_effect=RuntimeError("SMTP down"))
    def test_smtp_failure_is_logged_without_exposing_account_existence(self, send_mail):
        response = self.client.post(
            "/api/auth/password-reset/",
            {"email": "user@example.com"},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.data["message"],
            "Se o email existir, um link de recuperação será enviado.",
        )
        send_mail.assert_called_once()
        self.assertEqual(len(mail.outbox), 0)
        self.assertTrue(PasswordResetToken.objects.get(user=self.user).used)

    def test_confirm_password_reset_changes_password_and_consumes_token(self):
        token = PasswordResetToken.objects.create(user=self.user)

        response = self.client.post(
            "/api/auth/password-reset/confirm/",
            {
                "token": token.token,
                "password": "NewPassword123!",
                "confirm_password": "NewPassword123!",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.user.refresh_from_db()
        token.refresh_from_db()
        self.assertTrue(self.user.check_password("NewPassword123!"))
        self.assertTrue(token.used)

        response = self.client.post(
            "/api/auth/password-reset/confirm/",
            {
                "token": token.token,
                "password": "AnotherPassword123!",
                "confirm_password": "AnotherPassword123!",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 400)