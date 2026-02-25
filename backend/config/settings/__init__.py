"""
Django settings module.

This module imports the appropriate settings based on the DJANGO_SETTINGS_MODULE
environment variable. Defaults to development settings.
"""

import os

# Determine which settings to use
SETTINGS_MODULE = os.environ.get("DJANGO_SETTINGS_MODULE", "config.settings.development")

if SETTINGS_MODULE.endswith(".development"):
    from .development import *  # noqa: F403, F401
elif SETTINGS_MODULE.endswith(".production"):
    from .production import *  # noqa: F403, F401
elif SETTINGS_MODULE.endswith(".testing"):
    from .testing import *  # noqa: F403, F401
else:
    from .development import *  # noqa: F403, F401
