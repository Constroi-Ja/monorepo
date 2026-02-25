from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.db import connection
from django.http import JsonResponse


@api_view(["GET"])
@permission_classes([AllowAny])
def health_check(request):
    """
    Health check endpoint.
    
    Returns the status of the API and database connection.
    """
    try:
        # Check database connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            db_status = "healthy"
    except Exception:
        db_status = "unhealthy"

    health_data = {
        "status": "healthy" if db_status == "healthy" else "degraded",
        "service": "constroija-backend",
        "version": "1.0.0",
        "checks": {
            "database": db_status,
        },
    }

    http_status = (
        status.HTTP_200_OK if health_data["status"] == "healthy" else status.HTTP_503_SERVICE_UNAVAILABLE
    )

    return Response(health_data, status=http_status)


@api_view(["GET"])
@permission_classes([AllowAny])
def readiness_check(request):
    """
    Readiness check endpoint.
    
    Checks if the service is ready to accept traffic.
    """
    try:
        # Check database connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        
        return Response(
            {"status": "ready", "service": "constroija-backend"},
            status=status.HTTP_200_OK,
        )
    except Exception:
        return Response(
            {"status": "not ready", "service": "constroija-backend"},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )
