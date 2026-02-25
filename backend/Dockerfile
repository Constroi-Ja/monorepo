# Use Python 3.11 slim image
FROM python:3.11-slim

LABEL org.opencontainers.image.authors="João Eduardo Braga <joaoeduardobraga2@gmail.com>"

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    postgresql-client \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install uv
RUN pip install --no-cache-dir uv

# Copy dependency files
COPY pyproject.toml README.md ./

# Install dependencies
RUN uv lock --extra api --extra postgres || true
RUN uv sync --extra api --extra postgres

# Copy project
COPY . .

# Collect static files
RUN uv run python manage.py collectstatic --noinput || true

# Create a non-root user
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# Expose port
EXPOSE 8000

# Run gunicorn
CMD ["uv", "run", "gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "4"]
