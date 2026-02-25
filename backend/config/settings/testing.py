"""
Testing settings for ConstroiJa project.
"""

from .base import *  # noqa: F403, F401

# Use SQLite for testing (faster)
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": ":memory:",
    }
}

# Disable migrations during tests
class DisableMigrations:
    def __contains__(self, item):
        return True

    def __getitem__(self, item):
        return None


MIGRATION_MODULES = DisableMigrations()

# Password hashers (faster for testing)
PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.MD5PasswordHasher",
]

# Email backend (in-memory for testing)
EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"
