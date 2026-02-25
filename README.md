# ConstróiJa

Projeto full-stack de construção com Django (backend) e Next.js (frontend).

## 🏗️ Estrutura do Projeto

```
constroija/
├── backend/          # API Django REST Framework
├── frontend/         # Aplicação Next.js
├── mobile/           # Aplicação mobile (futuro)
└── docker-compose.yml # Orquestração completa
```

## 🚀 Início Rápido

### Pré-requisitos

- Docker e Docker Compose instalados
- Ou Node.js 20+ e Python 3.11+ (para desenvolvimento local)

### Usando Docker (Recomendado)

1. **Clone o repositório:**
```bash
git clone <repo-url>
cd constroija
```

2. **Configure as variáveis de ambiente:**

Backend (`backend/.env`):
```env
SECRET_KEY=sua-secret-key
POSTGRES_DB=constroija_db
POSTGRES_USER=constroija_user
POSTGRES_PASSWORD=constroija_password
```

Frontend (`frontend/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

3. **Inicie todos os serviços:**
```bash
docker-compose up -d
```

Isso iniciará:
- ✅ Frontend em `http://localhost:3000`
- ✅ Backend em `http://localhost:8000`
- ✅ Banco de dados PostgreSQL
- ✅ MailHog para emails em `http://localhost:8025`

4. **Acesse a aplicação:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/api/
- API Docs: http://localhost:8000/api/docs/
- MailHog UI: http://localhost:8025

### Desenvolvimento Local (sem Docker)

#### Backend

```bash
cd backend
# Configure ambiente virtual e instale dependências
# Veja backend/README.md para detalhes
python manage.py runserver
```

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

## 📚 Documentação

- [Backend README](./backend/README.md) - Documentação completa do backend
- [Frontend README](./frontend/README.md) - Documentação completa do frontend
- [Frontend Docker Guide](./frontend/DOCKER.md) - Guia Docker do frontend

## 🛠️ Comandos Úteis

### Docker Compose

```bash
# Iniciar todos os serviços
docker-compose up -d

# Ver logs
docker-compose logs -f

# Parar serviços
docker-compose down

# Rebuild após mudanças
docker-compose up -d --build

# Ver status
docker-compose ps
```

### Backend

```bash
cd backend
# Veja backend/Makefile para comandos disponíveis
make help
```

### Frontend

```bash
cd frontend
# Veja frontend/Makefile para comandos disponíveis
make help
```

## 🔐 Autenticação

O sistema usa JWT (JSON Web Tokens) para autenticação:

1. **Registro**: `POST /api/auth/register/`
2. **Login**: `POST /api/auth/login/`
3. **Refresh Token**: `POST /api/auth/token/refresh/`
4. **Perfil**: `GET /api/auth/me/`

O frontend gerencia tokens automaticamente via cookies.

## 🧪 Testes

### Backend
```bash
cd backend
python manage.py test
```

### Frontend
```bash
cd frontend
npm test  # Quando configurado
```

## 📦 Deploy

### Produção com Docker

1. Configure variáveis de ambiente de produção
2. Use os Dockerfiles de produção:
   - `backend/Dockerfile`
   - `frontend/Dockerfile`

3. Build e deploy:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Deploy Manual

- **Backend**: Veja `backend/README.md`
- **Frontend**: Veja `frontend/README.md`

## 🤝 Contribuindo

1. Siga a estrutura de diretórios estabelecida
2. Use TypeScript no frontend
3. Siga as convenções de código (ESLint, Prettier, Black)
4. Documente código complexo
5. Escreva testes quando apropriado

## 📝 Licença

[Adicione informações de licença aqui]

## 👥 Autores

- João Eduardo Braga <joaoeduardobraga2@gmail.com>
