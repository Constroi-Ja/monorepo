#!/bin/bash
set -e

echo "Waiting for PostgreSQL to be ready..."
while ! nc -z db 5432; do
  sleep 0.1
done

echo "PostgreSQL is ready!"

# Always ensure dependencies are installed (volume mount may have overwritten .venv)
echo "Ensuring dependencies are installed..."
cd /app
uv sync --extra api --extra postgres --group dev

# Verify rest_framework is installed
if ! uv run python -c "import rest_framework" 2>/dev/null; then
  echo "ERROR: rest_framework not found! Reinstalling dependencies..."
  rm -rf .venv
  uv sync --extra api --extra postgres --group dev
fi

# Run migrations
echo "Running migrations..."
uv run python manage.py migrate --noinput

# Collect static files (if needed)
echo "Collecting static files..."
uv run python manage.py collectstatic --noinput || true

# Execute the main command
exec "$@"
