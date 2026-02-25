"""
URL configuration for config project.
"""

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)

urlpatterns = [
    path("admin/", admin.site.urls),
    # API Documentation (Swagger/OpenAPI)
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path(
        "api/docs/",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="swagger-ui",
    ),
    path(
        "api/redoc/",
        SpectacularRedocView.as_view(url_name="schema"),
        name="redoc",
    ),
    # Health checks
    path("api/", include("apps.core.urls")),
    # Authentication
    path("api/auth/", include("apps.authentication.urls")),
]

# Serve media files in development
if settings.DEBUG:  # noqa: F405
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)  # noqa: F405
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)  # noqa: F405

    # Django Debug Toolbar
    if "debug_toolbar" in settings.INSTALLED_APPS:  # noqa: F405
        import debug_toolbar  # noqa: F401

        urlpatterns = [
            path("__debug__/", include(debug_toolbar.urls)),
        ] + urlpatterns
