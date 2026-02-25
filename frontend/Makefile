.PHONY: help build dev up down logs clean

help: ## Mostra esta mensagem de ajuda
	@echo "Comandos disponíveis:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

install: ## Instala as dependências
	npm install

dev: ## Inicia o servidor de desenvolvimento
	npm run dev

build: ## Cria o build de produção
	npm run build

start: ## Inicia o servidor de produção
	npm start

lint: ## Executa o linter
	npm run lint

type-check: ## Verifica os tipos TypeScript
	npm run type-check

format: ## Formata o código com Prettier
	npm run format

# Docker commands
docker-build: ## Constrói a imagem Docker de desenvolvimento
	docker-compose build

docker-up: ## Inicia os containers Docker
	docker-compose up -d

docker-down: ## Para os containers Docker
	docker-compose down

docker-logs: ## Mostra os logs dos containers
	docker-compose logs -f

docker-clean: ## Remove containers, volumes e imagens
	docker-compose down -v --rmi all

docker-prod-build: ## Constrói a imagem Docker de produção
	docker build -t constroija-frontend:latest .

docker-prod-up: ## Inicia o container de produção
	docker-compose -f docker-compose.prod.yml up -d

docker-prod-down: ## Para o container de produção
	docker-compose -f docker-compose.prod.yml down
