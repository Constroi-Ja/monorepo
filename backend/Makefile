.PHONY: help install migrate run test docker-up docker-down docker-build

help:
	@echo "Available commands:"
	@echo "  make install     - Install dependencies"
	@echo "  make migrate    - Run migrations"
	@echo "  make run        - Run development server"
	@echo "  make test       - Run tests"
	@echo "  make docker-up   - Start Docker containers"
	@echo "  make docker-down - Stop Docker containers"
	@echo "  make docker-build - Build Docker image"

install:
	uv sync --extra api --extra postgres --group dev

migrate:
	uv run python manage.py makemigrations
	uv run python manage.py migrate

run:
	uv run python manage.py runserver

test:
	uv run pytest

docker-up:
	docker-compose up -d

docker-down:
	docker-compose down

docker-build:
	docker-compose build

docker-logs:
	docker-compose logs -f

shell:
	uv run python manage.py shell

superuser:
	uv run python manage.py createsuperuser
