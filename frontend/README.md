# ConstróiJa Frontend

Frontend do projeto ConstróiJa construído com Next.js 14, TypeScript e Tailwind CSS.

## 🚀 Tecnologias

- **Next.js 14** - Framework React com App Router
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização utilitária
- **Axios** - Cliente HTTP
- **js-cookie** - Gerenciamento de cookies
- **Zod** - Validação de schemas

## 📁 Estrutura do Projeto

```text
frontend/
├── src/
│   ├── app/              # App Router (páginas e layouts)
│   │   ├── layout.tsx    # Layout raiz
│   │   ├── page.tsx      # Página inicial
│   │   ├── login/        # Página de login
│   │   ├── register/     # Página de registro
│   │   └── dashboard/    # Dashboard
│   ├── components/       # Componentes reutilizáveis
│   │   ├── ui/           # Componentes de UI básicos
│   │   ├── layout/       # Componentes de layout
│   │   └── features/     # Componentes de funcionalidades
│   ├── contexts/         # React Contexts
│   │   └── AuthContext.tsx
│   ├── hooks/            # Custom React Hooks
│   │   └── useAuth.ts
│   ├── lib/              # Bibliotecas e utilitários
│   │   ├── api-client.ts # Cliente API
│   │   └── auth.ts       # Serviços de autenticação
│   ├── types/            # TypeScript types
│   │   └── index.ts
│   ├── utils/            # Funções utilitárias
│   └── middleware.ts     # Next.js middleware
├── public/               # Arquivos estáticos
├── .env.local            # Variáveis de ambiente (não versionado)
└── package.json
```

## 🛠️ Configuração

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

Copie o arquivo `.env.local.example` para `.env.local` e configure:

```bash
cp .env.local.example .env.local
```

Edite `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Executar em desenvolvimento

```bash
npm run dev
```

A aplicação estará disponível em `http://localhost:3000`

## 🔐 Autenticação

O projeto está integrado com a API de autenticação Django REST Framework usando JWT.

### Endpoints utilizados

- `POST /api/auth/login/` - Login
- `POST /api/auth/register/` - Registro
- `POST /api/auth/token/refresh/` - Atualizar token
- `GET /api/auth/me/` - Obter usuário atual
- `PUT /api/auth/me/update/` - Atualizar perfil

### Fluxo de autenticação

1. Usuário faz login/registro
2. Tokens JWT são armazenados em cookies
3. Token de acesso é enviado automaticamente nas requisições
4. Token é renovado automaticamente quando expira
5. Middleware protege rotas privadas

## 📝 Scripts Disponíveis

- `npm run dev` - Inicia servidor de desenvolvimento
- `npm run build` - Cria build de produção
- `npm run start` - Inicia servidor de produção
- `npm run lint` - Executa ESLint
- `npm run type-check` - Verifica tipos TypeScript
- `npm run format` - Formata código com Prettier

## 🏗️ Boas Práticas

### Estrutura de Diretórios

- **App Router**: Use o App Router do Next.js 14 para páginas
- **Componentes**: Organize por funcionalidade, não por tipo
- **Hooks**: Custom hooks para lógica reutilizável
- **Contexts**: Para estado global compartilhado
- **Types**: Definições TypeScript centralizadas

### Código

- Use TypeScript para tipagem forte
- Componentes funcionais com hooks
- Separação de concerns (lógica, UI, dados)
- Tratamento de erros consistente
- Validação de formulários

### Performance

- Use `next/image` para imagens
- Lazy loading quando apropriado
- Code splitting automático do Next.js
- Otimização de bundle

## 🔄 Integração com Backend

O frontend está configurado para se comunicar com o backend Django em `http://localhost:8000`.

Certifique-se de que:

1. O backend está rodando
2. CORS está configurado no backend para `http://localhost:3000`
3. As variáveis de ambiente estão corretas

## 🐳 Docker

O projeto inclui configuração Docker completa para desenvolvimento e produção.

### Desenvolvimento

```bash
# Usar docker-compose da raiz do projeto (recomendado)
cd ..
docker-compose up -d

# Ou apenas o frontend
cd frontend
docker-compose up -d
```

### Produção

```bash
cd frontend
docker build -t constroija-frontend:latest .
docker run -d -p 3000:3000 \
  -e NEXT_PUBLIC_API_URL=http://seu-backend:8000 \
  constroija-frontend:latest
```

Veja [DOCKER.md](./DOCKER.md) para mais detalhes.

## 📦 Deploy

### Build de produção (sem Docker)

```bash
npm run build
npm start
```

### Variáveis de ambiente em produção

Configure as variáveis de ambiente no seu provedor de hospedagem (Vercel, Netlify, etc.):

- `NEXT_PUBLIC_API_URL` - URL da API backend
- `NEXT_PUBLIC_APP_URL` - URL da aplicação frontend

## 🤝 Contribuindo

1. Siga a estrutura de diretórios estabelecida
2. Use TypeScript para todos os arquivos
3. Mantenha componentes pequenos e focados
4. Documente código complexo
5. Siga as convenções de código (ESLint, Prettier)
