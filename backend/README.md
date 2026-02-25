# ConstroiJa Backend

Backend Django para o projeto ConstroiJa com API REST profissional.

## 🚀 Tecnologias

- **Django 4.2** - Framework web
- **Django REST Framework** - API REST
- **PostgreSQL** - Banco de dados
- **JWT Authentication** - Autenticação com tokens
- **Docker & Docker Compose** - Containerização
- **MailHog** - Servidor de email para desenvolvimento
- **uv** - Gerenciador de pacotes Python moderno

## 📋 Pré-requisitos

- Python 3.11+
- [uv](https://github.com/astral-sh/uv) instalado
- Docker e Docker Compose (opcional, para desenvolvimento com containers)

## 🛠️ Instalação

### Desenvolvimento Local

1. Clone o repositório e entre no diretório:
```bash
cd backend
```

2. Crie e ative o ambiente virtual:
```bash
uv venv
source .venv/bin/activate  # Linux/Mac
# ou
.venv\Scripts\activate  # Windows
```

3. Instale as dependências:
```bash
uv sync --extra api --extra postgres --group dev
```

4. Copie o arquivo de ambiente:
```bash
cp .env.example .env
```

5. Configure o arquivo `.env` com suas variáveis de ambiente.

6. Execute as migrações:
```bash
uv run python manage.py migrate
```

7. Crie um superusuário (opcional):
```bash
uv run python manage.py createsuperuser
```

8. Execute o servidor de desenvolvimento:
```bash
uv run python manage.py runserver
```

### Docker Compose

1. Copie o arquivo de ambiente:
```bash
cp .env.example .env
```

2. Configure o arquivo `.env` com suas variáveis de ambiente.

3. Inicie os containers:
```bash
docker-compose up -d
```

4. Execute as migrações:
```bash
docker-compose exec backend uv run python manage.py migrate
```

5. Crie um superusuário (opcional):
```bash
docker-compose exec backend uv run python manage.py createsuperuser
```

O backend estará disponível em `http://localhost:8000`

## 📚 Estrutura do Projeto

```
backend/
├── apps/                    # Aplicações Django
│   └── authentication/      # App de autenticação
│       ├── models.py       # Modelo de usuário customizado
│       ├── serializers.py  # Serializers da API
│       ├── views.py        # Views da API
│       └── urls.py         # URLs da app
├── config/                  # Configurações do projeto
│   ├── settings/           # Settings por ambiente
│   │   ├── base.py        # Configurações base
│   │   ├── development.py # Configurações de desenvolvimento
│   │   ├── production.py  # Configurações de produção
│   │   └── testing.py     # Configurações de testes
│   ├── urls.py            # URLs principais
│   ├── wsgi.py            # WSGI config
│   └── asgi.py            # ASGI config
├── static/                 # Arquivos estáticos
├── media/                  # Arquivos de mídia
├── templates/              # Templates HTML
├── Dockerfile              # Dockerfile para produção
├── Dockerfile.dev          # Dockerfile para desenvolvimento
├── docker-compose.yml      # Docker Compose config
├── pyproject.toml          # Dependências e configurações
└── manage.py              # Script de gerenciamento Django
```

## 🔐 API de Autenticação

### Endpoints Disponíveis

- `POST /api/auth/register/` - Registrar novo usuário
- `POST /api/auth/login/` - Login e obter tokens JWT
- `POST /api/auth/token/refresh/` - Atualizar token de acesso
- `GET /api/auth/me/` - Obter informações do usuário atual
- `PUT /api/auth/me/update/` - Atualizar perfil do usuário

### Exemplo de Uso

#### Registrar Usuário
```bash
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "username": "user",
    "password": "password123",
    "password_confirm": "password123"
  }'
```

#### Login
```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

#### Acessar Endpoint Protegido
```bash
curl -X GET http://localhost:8000/api/auth/me/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 🐳 Serviços Docker

- **backend** - Aplicação Django (porta 8000)
- **db** - PostgreSQL (porta 5432)
- **mailhog** - Servidor de email (SMTP: 1025, Web UI: 8025)

## 📝 Comandos Úteis

```bash
# Instalar dependências
make install

# Executar migrações
make migrate

# Executar servidor
make run

# Executar testes
make test

# Docker
make docker-up      # Iniciar containers
make docker-down    # Parar containers
make docker-build   # Construir imagens
make docker-logs    # Ver logs

# Django
make shell          # Abrir shell Django
make superuser      # Criar superusuário
```

## 🔧 Variáveis de Ambiente

Veja o arquivo `.env.example` para todas as variáveis de ambiente necessárias.

Principais variáveis:
- `SECRET_KEY` - Chave secreta do Django
- `DEBUG` - Modo debug (True/False)
- `POSTGRES_*` - Configurações do PostgreSQL
- `EMAIL_*` - Configurações de email

## 📖 Documentação Adicional

Consulte o arquivo [SETUP_DJANGO.md](./SETUP_DJANGO.md) para instruções detalhadas de setup inicial.

## 🤝 Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT.
