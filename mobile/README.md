# ConstróiJá Mobile

App React Native do marketplace **ConstróiJá** — materiais de construção e serviços residenciais. Funciona como iFood, mas para o setor de construção e reformas.

---

## Perfis de usuário

| Perfil | O que faz |
|--------|-----------|
| **Consumidor** | Compra materiais, contrata prestadores, acompanha pedidos e visitas |
| **Prestador** | Gerencia disponibilidade, aceita visitas técnicas, compra materiais |
| **Empresa** | Vende materiais, gerencia catálogo, pedidos, estoque e finanças |
| **Admin** | Supervisiona usuários, verifica prestadores, monitora a plataforma |

---

## Stack

| Biblioteca | Versão | Finalidade |
|-----------|--------|-----------|
| `expo` | ~52.0.0 | SDK base (Managed Workflow) |
| `expo-router` | ~4.0.0 | Navegação file-based (React Navigation v7) |
| `expo-secure-store` | ~14.0.0 | Armazenamento seguro de tokens JWT |
| `expo-image` | ~2.0.0 | Componente de imagem otimizado |
| `expo-image-picker` | ~16.0.0 | Seleção de foto (galeria/câmera) |
| `expo-document-picker` | ~13.0.0 | Upload de PDF (antecedentes criminais) |
| `expo-notifications` | ~0.29.0 | Push notifications |
| `expo-clipboard` | ~7.0.0 | Copiar código PIX |
| `expo-haptics` | ~14.0.0 | Feedback háptico |
| `expo-font` | ~13.0.0 | Fonte Inter |
| `react-native` | 0.76.5 | Framework base |
| `react-native-gesture-handler` | ~2.22.0 | Gestos nativos |
| `react-native-reanimated` | ~3.17.0 | Animações performáticas |
| `react-native-safe-area-context` | ~4.14.0 | Safe area (notch, home indicator) |
| `react-native-screens` | ~4.4.0 | Otimização de telas nativas |
| `@gorhom/bottom-sheet` | ^5.0.0 | Bottom sheets/modais |
| `@shopify/flash-list` | ^1.7.0 | FlatList de alto desempenho |
| `@react-native-community/netinfo` | ^11.0.0 | Detecção de conectividade |
| `react-native-mask-input` | ^1.3.3 | Máscaras (CPF, CNPJ, CEP, telefone) |
| `zustand` | ^5.0.0 | Estado global (auth, cart, UI) |
| `axios` | ^1.7.9 | HTTP com interceptores JWT |
| `react-hook-form` | ^7.54.0 | Formulários com validação |
| `zod` | ^3.23.8 | Schema de validação |
| `@hookform/resolvers` | ^3.10.0 | Integração zod + react-hook-form |
| `victory-native` | ^41.0.0 | Gráficos (Skia) |
| `@shopify/react-native-skia` | ^1.5.0 | Canvas 2D (usado pelo victory-native) |

---

## Pré-requisitos

- **Node.js** ≥ 20 e **npm** ≥ 10
- **Expo CLI**: `npm install -g expo`
- **EAS CLI**: `npm install -g eas-cli`
- **iOS**: macOS + Xcode ≥ 15
- **Android**: Android Studio + SDK 34

---

## Rodar localmente

```bash
# 1. Instalar dependências
cd mobile
npm install

# 2. Configurar variáveis de ambiente
cp .env.example .env
# Editar .env: definir EXPO_PUBLIC_API_URL (ex: http://192.168.1.x:8000)

# 3. Iniciar o Metro bundler
npx expo start

# 4. Escanear o QR com o app Expo Go (iOS/Android)
# ou pressionar 'i' para iOS Simulator / 'a' para Android Emulator

# 5. Build nativo (necessário para expo-secure-store, expo-notifications)
npx expo run:ios    # requer macOS + Xcode
npx expo run:android
```

---

## Estrutura de pastas

```
mobile/
├── app/                        # expo-router: rotas file-based
│   ├── _layout.tsx             # RootLayout: fontes + hydrate + splash
│   ├── index.tsx               # Redirect por user_type
│   ├── (auth)/                 # Login, registro, recuperação de senha
│   └── (app)/
│       ├── (consumer)/         # Bottom Tabs: Início|Buscar|Carrinho|Pedidos|Perfil
│       ├── (provider)/         # Bottom Tabs: Painel|Visitas|Compras|Pedidos|Perfil
│       ├── (company)/          # Bottom Tabs: Início|Pedidos|Estoque|Financeiro|Perfil
│       └── (admin)/            # Bottom Tabs escuros: Overview|Usuários|Prestadores|Lojas
│
└── src/
    ├── api/                    # Camada HTTP (Axios + interceptores JWT)
    │   ├── client.ts           # Axios: interceptores, refresh de token
    │   ├── auth.ts             # Endpoints de autenticação
    │   ├── stores.ts, orders.ts, cart.ts, visits.ts, payments.ts
    │   ├── company.ts          # Items, deliverers, inventory, bills
    │   └── admin.ts            # Stats, usuários, prestadores (admin)
    ├── components/
    │   └── shared/             # Button, Input, OrderCard, StoreCard, PixQRCard...
    ├── hooks/                  # useCEP, usePolling, usePaymentStatus, useVisitMessages
    ├── store/                  # Zustand: authStore, cartStore, uiStore
    ├── theme/                  # Colors, Typography, Spacing, Radius, Shadows
    ├── types/                  # Tipos TypeScript (porta de frontend/src/types)
    └── utils/                  # formatters, currency, date
```

---

## Convenções de código

- **Arquivos**: kebab-case (`order-card.tsx`)
- **Componentes**: PascalCase (`OrderCard`)
- **Funções/variáveis**: camelCase (`formatCurrency`)
- **UI/labels**: PT-BR (`"Meus Pedidos"`, `"Confirmar"`)
- **Código**: EN (`getMyOrders`, `handleSubmit`, `isLoading`)
- **Comentários**: apenas quando o porquê não é óbvio

---

## Autenticação JWT

Fluxo:
1. `authStore.hydrate()` no boot: lê access/refresh do `SecureStore` → coloca em memória
2. Interceptor de request lê access token da memória (síncrono) → injeta no `Authorization`
3. Em 401: interceptor chama `/auth/token/refresh/` automaticamente
4. Logout: deleta tokens do `SecureStore` e zera memória

```
EXPO_PUBLIC_API_URL=http://localhost:8000   # URL base do backend Django
EXPO_PUBLIC_APP_ENV=development             # "development" | "production"
```

---

## Scripts

```bash
npm start              # Metro bundler
npm run android        # Android (emulador/dispositivo)
npm run ios            # iOS (simulador, requer macOS)
npm run build:preview  # EAS Build interno (APK + TestFlight)
npm run build:production # EAS Build para lojas
npm run update         # EAS Update (OTA)
npm run type-check     # TypeScript sem emitir
npm run lint           # ESLint
```

---

## Build e distribuição (EAS)

```bash
# Login EAS
eas login

# Build de preview (APK Android + IPA iOS)
eas build --profile preview

# Build de produção
eas build --profile production

# Publicar update OTA (sem passar pela loja)
eas update --branch production --message "Hotfix pagamento PIX"
```

Perfis definidos em `eas.json`:
- `development`: simulador + development client
- `preview`: distribuição interna (APK/TestFlight)
- `production`: App Store + Google Play

---

## Variáveis de ambiente

| Variável | Obrigatória | Descrição |
|----------|------------|-----------|
| `EXPO_PUBLIC_API_URL` | ✅ | URL base da API (`http://192.168.x.x:8000`) |
| `EXPO_PUBLIC_APP_ENV` | ❌ | Ambiente (`development`/`production`) |
