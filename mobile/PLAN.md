# Plano: Migração ConstróiJá Web → React Native

## Contexto

O produto **ConstróiJá** é um marketplace de materiais de construção e serviços residenciais — similar ao iFood, mas para o setor de construção e reformas. O frontend web existe em Next.js 14 (`monorepo/frontend/`) com Tailwind CSS, Axios, React Context API e backend Django REST Framework. O app mobile deve ser criado do zero em `monorepo/mobile/`, replicando 100% das funcionalidades do web com cara nativa (bottom tabs, gestos, bottom sheets), cobrindo os três perfis de usuário: **Consumidor**, **Prestador** e **Empresa**, além do perfil **Admin**.

---

## PASSO 0 — Análise do Código-Fonte (concluída)

### Módulos encontrados no web (mapeados por perfil)

| # | Módulo | Perfil(is) | Rota(s) web |
|---|--------|-----------|------------|
| 1 | Auth (login, registro, confirmação, senha) | Todos | `/login`, `/register/*`, `/confirm-email/*`, `/forgot-password/*` |
| 2 | Dashboard — Consumidor | Consumidor | `/dashboard/consumer` |
| 3 | Dashboard — Prestador | Prestador | `/dashboard/provider` |
| 4 | Dashboard — Empresa | Empresa | `/dashboard/company` |
| 5 | Dashboard — Admin | Admin | `/dashboard/admin/*` |
| 6 | Descoberta de Materiais e Lojas | Consumidor, Prestador | `/materials`, `/stores` |
| 7 | Detalhe da Loja + Produtos | Consumidor, Prestador | `/stores/[storeId]` |
| 8 | Descoberta de Prestadores | Consumidor | `/providers` |
| 9 | Carrinho | Consumidor, Prestador | `/cart` |
| 10 | Checkout + Pagamento PIX | Consumidor, Prestador | `/checkout` |
| 11 | Pedidos — Consumidor/Prestador | Consumidor, Prestador | `/my-orders`, `/my-orders/[id]` |
| 12 | Visitas Técnicas — Consumidor | Consumidor | `/minhas-visitas`, `/visitas/[id]` |
| 13 | Visitas Técnicas — Prestador | Prestador | `/dashboard/provider/visits` |
| 14 | Gestão de Produtos/Itens | Empresa | `/dashboard/company/items` |
| 15 | Gestão de Entregas | Empresa | `/dashboard/company/deliveries` |
| 16 | Gestão de Pedidos — Empresa | Empresa | `/dashboard/company/orders` |
| 17 | Controle de Estoque | Empresa | `/dashboard/company/inventory` |
| 18 | Rastreamento de Receitas | Empresa | `/dashboard/company/revenue` |
| 19 | Contas a Pagar | Empresa | `/dashboard/company/bills` |
| 20 | Configurações — Consumidor | Consumidor | `/settings/consumer` |
| 21 | Configurações — Prestador | Prestador | `/settings/provider` |
| 22 | Configurações — Empresa | Empresa | `/settings/company` |
| 23 | Admin — Gestão de Usuários | Admin | `/dashboard/admin/users` |
| 24 | Admin — Verificação de Prestadores | Admin | `/dashboard/admin/providers` |
| 25 | Admin — Gestão de Lojas | Admin | `/dashboard/admin/stores` |
| 26 | Admin — Gestão de Avaliações | Admin | `/dashboard/admin/reviews` |

### Stack web relevante para migração
- **HTTP**: Axios com interceptores JWT (cookie → SecureStore no mobile)
- **Auth**: JWT access (1 dia) + refresh (7 dias), `user_type` determina perfil
- **Estado**: React Context apenas (sem Zustand/Redux)
- **UI**: Tailwind puro, sem biblioteca de componentes
- **Cores**: Orange #f97316 (primária), gray-900 #111827 (sidebar/dark)
- **Fonte**: Inter (Regular, Medium, SemiBold, Bold)
- **Pagamentos**: Mercado Pago PIX via REST (sem SDK nativo)
- **CEP**: ViaCEP (API pública gratuita)
- **Gráficos**: Recharts (LineChart, BarChart, PieChart) — substituir no mobile
- **Tipos**: `src/types/index.ts` — portável 100% para o mobile

---

## FUNDAÇÃO (Passos 1–5)

---

### Passo 1 — Setup do Projeto (Expo Managed + EAS)

**Decisão: Expo SDK 52, Managed Workflow + EAS Build**

Justificativa: nenhuma funcionalidade do app exige módulos nativos fora do ecossistema Expo SDK. Pagamento PIX é 100% server-side (polling REST + base64 QR); câmera/documentos usam `expo-image-picker` e `expo-document-picker`; push notifications usam `expo-notifications`. OTA updates via EAS Update são essenciais para hotfixes em fluxos de pagamento sem aguardar revisão de loja.

**Entregáveis**

- `monorepo/mobile/` criado como workspace Yarn/npm dentro do monorepo existente
- `app.json` com `scheme: "constroija"`, `plugins: ["expo-router"]`, ícone e splash screen em laranja (#f97316)
- `eas.json` com perfis: `development` (internal distribution), `preview` (TestFlight/APK), `production`
- `tsconfig.json` com `baseUrl: "."` e path alias `"@/*": ["src/*"]`
- `.env` via `expo-constants` + `react-native-dotenv`: `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_APP_ENV`
- ESLint + Prettier espelhando `.prettierrc` do frontend
- `babel.config.js` com `babel-plugin-module-resolver` para o alias `@/`
- `package.json` com todas as dependências listadas abaixo

**Dependências principais**

```
expo ~52.0.0               expo-router ~4.0.0
expo-secure-store ~14.0.0  expo-image ~2.0.0
expo-image-picker ~16.0.0  expo-document-picker ~13.0.0
expo-notifications ~0.29.0 expo-clipboard ~7.0.0
expo-haptics ~14.0.0       expo-font ~13.0.0
expo-splash-screen ~0.29.0 expo-linking ~7.0.0
react-native 0.76.5        react-native-gesture-handler ~2.22.0
react-native-reanimated ~3.17.0  react-native-safe-area-context ~4.14.0
react-native-screens ~4.4.0      @gorhom/bottom-sheet ^5.0.0
@shopify/flash-list ^1.7.0       @react-native-community/netinfo ^11.0.0
react-native-mask-input ^1.3.3   zustand ^5.0.0
axios ^1.7.9               react-hook-form ^7.54.0
zod ^3.23.8                @hookform/resolvers ^3.10.0
victory-native ^41.0.0     @shopify/react-native-skia ^1.5.0
```

**Revisão/Teste**
- `npx expo start` sem erros de bundling
- `expo-doctor` sem warnings críticos
- Builds de preview Android + iOS via EAS

---

### Passo 2 — Sistema de Navegação e Arquitetura de Pastas

**Decisão: expo-router v4 (file-based, built on React Navigation v7)**

expo-router elimina boilerplate de registro de rotas e mapeia deep links 1:1 com os caminhos de arquivo. O `app/_layout.tsx` lê `user.user_type` do auth store e redireciona para o grupo correto — mesma lógica do `middleware.ts` e do `Sidebar.tsx` do web.

**Estrutura de arquivos — `app/`**

```
app/
  _layout.tsx                        ← RootLayout: AuthProvider + redireciona por user_type
  (auth)/
    _layout.tsx                      ← Stack (sem tab bar)
    login.tsx
    register/
      select-type.tsx
      consumer.tsx                   ← form multi-passo (3 etapas)
      provider.tsx
      company.tsx
      success.tsx
    confirm-email/[token].tsx
    forgot-password/
      index.tsx
      confirm.tsx
  (app)/
    (consumer)/
      _layout.tsx                    ← Bottom Tabs: Início | Buscar | Carrinho | Pedidos | Perfil
      index.tsx                      ← Dashboard
      stores/
        index.tsx                    ← Lista de lojas + materiais
        [storeId]/index.tsx          ← Detalhe da loja + produtos
      providers/index.tsx            ← Descoberta de prestadores
      cart/
        index.tsx
        checkout.tsx
      orders/
        index.tsx
        [orderId].tsx
      visits/
        index.tsx
        [id].tsx
      settings/index.tsx
    (provider)/
      _layout.tsx                    ← Bottom Tabs: Painel | Visitas | Compras | Pedidos | Perfil
      index.tsx
      visits/
        index.tsx
        [id].tsx
      stores/index.tsx               ← Compartilhado com consumer
      stores/[storeId]/index.tsx
      cart/index.tsx
      cart/checkout.tsx
      orders/index.tsx
      orders/[orderId].tsx
      settings/index.tsx
    (company)/
      _layout.tsx                    ← Bottom Tabs: Início | Pedidos | Estoque | Financeiro | Perfil
      index.tsx                      ← Dashboard + onboarding check
      orders/
        index.tsx
        [orderId].tsx
      items/
        index.tsx
        [itemId].tsx
      inventory/index.tsx
      deliveries/index.tsx
      revenue/index.tsx
      bills/index.tsx
      settings/index.tsx
    (admin)/
      _layout.tsx                    ← Bottom Tabs escuros: Overview | Usuários | Prestadores | Lojas
      index.tsx
      users/index.tsx
      providers/index.tsx
      stores/index.tsx
      reviews/index.tsx
```

**Estrutura de arquivos — `src/`**

```
src/
  api/
    client.ts          ← Axios + SecureStore interceptores (porta api-client.ts do web)
    auth.ts            ← endpoints de auth
    stores.ts          ← stores + items
    orders.ts          ← pedidos
    visits.ts          ← visitas técnicas
    payments.ts        ← polling de pagamento
    company.ts         ← items CRUD, deliverers, inventory, bills
    admin.ts           ← admin endpoints
  components/
    shared/            ← Button, Input, Select, MultiSelect, Tag, EmptyState, LoadingScreen,
                          Logo, ProgressIndicator, InfoBox, FileUpload, StatusBadge,
                          PixQRCard, OrderCard, StoreCard, ProviderCard, ProductCard
    sheets/            ← UpgradeSheet, ProviderDetailSheet, PendingVerificationSheet,
                          OnboardingSheet, StoreReviewsSheet
    consumer/          ← CartItemRow, VisitRequestForm, ShippingEstimateCard
    provider/          ← AvailabilityToggle, VisitGroup, PendingCountdown
    company/           ← AlertCard, FeatureCard, RevenueChart, ItemForm, DelivererForm
    admin/             ← UserRow, ProviderVerificationCard
  hooks/
    useAuth.ts         ← lê do authStore
    useCEP.ts          ← porta do web (ViaCEP)
    useMultiStepForm.ts← porta do web
    usePolling.ts      ← extrai setInterval pattern dos fluxos de visita e pagamento
    usePaymentStatus.ts← polling /payments/:id/ a cada 5s
    useVisitMessages.ts← polling /technical-visits/:id/messages/ a cada 8s
    useCartCount.ts
  store/
    authStore.ts       ← Zustand: user, tokens, login, logout, refreshUser
    cartStore.ts       ← Zustand: count (badge only)
    uiStore.ts         ← Zustand: toast queue
  theme/
    colors.ts          ← escala completa: brand, neutral, semantic, surface, tabBar
    typography.ts      ← fontFamily, fontSize, lineHeight, estilos semânticos
    spacing.ts         ← grid de 4px + aliases semânticos
    radius.ts          ← escala de border radius
    shadows.ts         ← shadow iOS + elevation Android
  types/
    index.ts           ← porta DIRETA de frontend/src/types/index.ts
  utils/
    formatters.ts      ← porta DIRETA de frontend/src/utils/formatters.ts (CPF, CEP, phone)
    currency.ts        ← formatCurrency para BRL
  notifications/
    handler.ts         ← registro expo-notifications + push token
    deeplink.ts        ← mapeia payload de notificação → expo-router href
```

**Tabs por perfil**

| Perfil | Tab 1 | Tab 2 | Tab 3 | Tab 4 | Tab 5 |
|--------|-------|-------|-------|-------|-------|
| Consumidor | Início | Buscar (lojas/materiais) | Carrinho (badge) | Pedidos | Perfil |
| Prestador | Painel | Visitas (badge pendente) | Compras | Pedidos | Perfil |
| Empresa | Início | Pedidos (badge) | Estoque | Financeiro | Perfil |
| Admin | Visão Geral | Usuários | Prestadores | Lojas | — |

**Revisão/Teste**
- Navegar entre todos os grupos de perfil em simulador iOS e Android
- Testar deep link `constroija:///app/(consumer)/orders/123` abrindo a tela correta
- Verificar SafeAreaInsets em iPhone com notch e Android com barra de status

---

### Passo 3 — Design System Mobile

**O que é**: Tradução fiel da identidade visual do web para React Native — sem Tailwind, sem CSS; tudo em `StyleSheet.create()` com tokens.

**Tokens de cor** (`src/theme/colors.ts`)

```typescript
export const Colors = {
  brand: {
    50: '#fff7ed', 100: '#ffedd5', 200: '#fed7aa', 300: '#fdba74',
    400: '#fb923c', 500: '#f97316',  // PRIMÁRIA
    600: '#ea580c', 700: '#c2410c', 800: '#9a3412', 900: '#7c2d12',
  },
  neutral: {
    0: '#ffffff', 50: '#f9fafb', 100: '#f3f4f6', 200: '#e5e7eb',
    300: '#d1d5db', 400: '#9ca3af', 500: '#6b7280', 600: '#4b5563',
    700: '#374151', 800: '#1f2937', 900: '#111827',  // bg-gray-900 equivalente
  },
  success:  { light: '#dcfce7', base: '#22c55e', dark: '#15803d' },
  warning:  { light: '#fef9c3', base: '#eab308', dark: '#a16207' },
  error:    { light: '#fee2e2', base: '#ef4444', dark: '#b91c1c' },
  info:     { light: '#dbeafe', base: '#3b82f6', dark: '#1d4ed8' },
  surface:  { background: '#f9fafb', card: '#ffffff', overlay: 'rgba(0,0,0,0.5)' },
  tabBar:   { bg: '#ffffff', bgDark: '#111827', active: '#f97316', inactive: '#9ca3af', badge: '#ef4444' },
};
```

**Tipografia**: Inter via `expo-font` com as quatro variantes. Escala: xs(10) sm(12) base(14) md(16) lg(18) xl(20) 2xl(24) 3xl(28). Estilos semânticos nomeados: `h1`–`h4`, `bodyLg`/`bodyMd`/`bodySm`, `labelLg`/`labelMd`, `caption`.

**Espaçamento**: Grid de 4px, aliases `screenHorizontal: 16`, `cardPadding: 16`, `sectionGap: 24`, `tabBarSafeBuffer: 84`.

**Sombras**: Escala xs→xl com `shadowColor`, `shadowOffset`, `shadowOpacity`, `shadowRadius` (iOS) + `elevation` (Android).

**Componentes base a construir** (porta de `src/components/ui/` do web):

| Componente web | Componente mobile | Notas de implementação |
|---------------|-------------------|------------------------|
| `Button.tsx` | `Button` | Pressable + Animated.Value scale 0.97 no press; variantes: primary/outline/ghost/destructive |
| `Input.tsx` | `Input` | TextInput com label, error state, ícone; `underlineColorAndroid: 'transparent'` |
| `Select.tsx` | `Select` | Dispara BottomSheet com FlatList de opções; sem `<Picker>` nativo |
| `MultiSelect.tsx` | `MultiSelect` | BottomSheet com checkboxes; chips selecionados no trigger |
| `Tag.tsx` | `Chip` | Variantes: filled/outlined/category; removable com X |
| `FileUpload.tsx` | `FileUpload` | ActionSheet (Câmera/Galeria/Arquivo) → FormData `{ uri, name, type }` |
| `Breadcrumb.tsx` | — | Substituído por headers de navegação do React Navigation |
| `LoadingScreen.tsx` | `LoadingScreen` | Logo com pulso Animated + ActivityIndicator laranja |
| `Logo.tsx` | `Logo` | SVG blocos de construção + wordmark "ConstróiJá"; variantes full/icon-only |
| `ProgressIndicator.tsx` | `ProgressIndicator` | Barra animada via Animated.timing + círculos numerados |
| `InfoBox.tsx` | `InfoBox` | Cores por tipo: info/success/warning/error; borderLeft 4px |
| `EmptyState.tsx` | `EmptyState` | Ícone contextual + título + subtítulo + botão CTA |
| — (modal) | `BottomSheet` (5 sheets) | `@gorhom/bottom-sheet` v5; substitui os 5 modais do web |

**Bottom Sheets** (substitutos dos modais):
1. `UpgradeSheet` — planos de assinatura, altura 85%
2. `ProviderDetailSheet` — perfil + grade de disponibilidade + booking, snap 45%/92%
3. `PendingVerificationSheet` — status de verificação, altura 50%, não dispensável quando pending
4. `OnboardingSheet` — empresa: horários + PIX, full-screen, multi-step com ProgressIndicator
5. `StoreReviewsSheet` — avaliações com gráfico de barras, altura 85%

**Revisão/Teste**
- Storybook ou tela de catálogo mostrando todos os componentes nos dois temas de cor
- Verificar tamanho mínimo de toque (44pt) em todos os elementos interativos
- Checar contraste WCAG AA nos textos sobre os fundos de cor

---

### Passo 4 — Autenticação e Roteamento por Perfil

**O que é**: Fluxo completo de autenticação, persistência de tokens e roteamento baseado em `user_type`.

**Ciclo**: Fundação — pré-requisito absoluto para todos os módulos subsequentes.

**Perfis**: Todos (cada um tem seu próprio formulário de registro).

**Como portar para React Native**

`authStore.ts` (Zustand):
```typescript
interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  hydrate: () => Promise<void>; // lê SecureStore ao iniciar
}
```

Fluxo de tokens: ler do `SecureStore` durante `hydrate()` no app start e guardar em variáveis de memória (`accessTokenRef`). O interceptor de request lê da memória (síncrono). SecureStore é escrito apenas no login, refresh e deletado no logout. Isso evita interceptors async que causariam race conditions.

**Telas mobile**

| Tela | Origem web | Notas mobile |
|------|-----------|--------------|
| Login | `/login/page.tsx` | Input com ícone, botão "Entrar", link "Esqueceu a senha?"; autofoco no email |
| Seleção de tipo | `/register/select-type/page.tsx` | 3 cards grandes com ícone: Consumidor / Prestador / Empresa |
| Registro Consumidor | `/register/consumer/page.tsx` | 3 etapas: (1) dados pessoais (2) endereço c/ autopreenchimento CEP (3) senha — `useMultiStepForm` + `react-hook-form` + Zod |
| Registro Prestador | `/register/provider/page.tsx` | Dados + especialidades (MultiSelect) + upload documento |
| Registro Empresa | `/register/company/page.tsx` | Dados empresa + CNPJ + segmento |
| Sucesso | `/register/success/page.tsx` | Animação Lottie check + instrução de verificação de e-mail |
| Confirmar e-mail | `/confirm-email/[token]/page.tsx` | Recebe token via deep link `constroija:///confirm-email/TOKEN` |
| Esqueci a senha | `/forgot-password/page.tsx` | Input de e-mail + envio |
| Redefinir senha | `/forgot-password/confirm/page.tsx` | Recebe token via deep link; nova senha + confirmação |

**Máscaras de input** (`react-native-mask-input`): CPF `###.###.###-##`, CNPJ `##.###.###/####-##`, CEP `#####-###`, telefone `(##) #####-####`, data `##/##/####`.

**Roteamento pós-login** em `app/_layout.tsx`:
```typescript
switch (user.user_type) {
  case 'consumer': return <Redirect href="/(app)/(consumer)" />;
  case 'provider': return <Redirect href="/(app)/(provider)" />;
  case 'company':  return <Redirect href="/(app)/(company)" />;
  case 'admin':    return <Redirect href="/(app)/(admin)" />;
}
```

**API**: `POST /auth/login/`, `POST /auth/register/{consumer,provider,company}/`, `GET /auth/me/`, `POST /auth/confirm-email/`, `POST /auth/password-reset/`, `POST /auth/token/refresh/`

**Revisão/Teste**
- Login com credenciais inválidas mostra erro inline (não alert nativo)
- Token refresh automático em 401 sem logout inesperado
- Deep links de confirmação de e-mail e redefinição de senha funcionando em ambas plataformas
- Formulários de registro passam validação Zod em cada etapa antes de avançar

---

### Passo 5 — Camada de Dados/API e Estado Global

**O que é**: Infraestrutura de comunicação com o backend e gerenciamento de estado global.

**Ciclo**: Fundação — paralelo ao Passo 4.

**Perfis**: Todos.

**Como portar para React Native**

`src/api/client.ts` — porta direta de `frontend/src/lib/api-client.ts` com estas substituições:
- `Cookies.get()` → variável de memória alimentada pelo `authStore`
- `Cookies.set()` → `SecureStore.setItemAsync()` dentro do `authStore`
- `window.location.href = '/login'` → `router.replace('/(auth)/login')` via `RouterRef`

`src/api/auth.ts` — porta direta de `frontend/src/lib/auth.ts`.

`src/hooks/useCEP.ts` — porta direta de `frontend/src/hooks/useCEP.ts` (usa `fetch` padrão, não Axios; compatível RN).

`src/hooks/useMultiStepForm.ts` — porta direta de `frontend/src/hooks/useMultiStepForm.ts`.

`src/hooks/usePolling.ts` — abstrai o padrão `setInterval` + `clearInterval` em `useEffect` cleanup usado em visitas e pagamentos:
```typescript
function usePolling(callback: () => void, intervalMs: number, active: boolean) {
  useEffect(() => {
    if (!active) return;
    const id = setInterval(callback, intervalMs);
    return () => clearInterval(id);
  }, [active, intervalMs]);
}
```

**NetInfo**: banner de sem conexão usando `@react-native-community/netinfo`. Exibir `InfoBox` (warning) no topo da tela quando `isConnected === false`.

**Revisão/Teste**
- Simular 401 e verificar refresh silencioso
- Simular perda de conexão e ver banner aparecer/sumir
- Garantir que `clearInterval` é chamado no unmount de cada screen com polling

---

## MÓDULOS — SPRINT 1: Consumer MVP (Passos 6–11)

---

### Passo 6 — Dashboard do Consumidor

**O que faz**: Tela inicial do Consumidor com acesso rápido a lojas em destaque, prestadores próximos, alertas de pedidos ativos e atalhos para os principais módulos.

**Por que existe**: É o ponto de entrada diário do usuário; reduz o caminho para as ações mais frequentes (comprar material, agendar visita, ver pedido).

**Ciclo**: Descoberta — porta de entrada após login; conecta ao módulo de Lojas (Passo 7), Prestadores (Passo 12) e Pedidos (Passo 11).

**Perfis**: Consumidor apenas.

**Como portar**

Tela: `app/(app)/(consumer)/index.tsx` — `FlatList` com `ListHeaderComponent` contendo:
1. Barra de busca (tappable → navega para tela de busca, não inline)
2. Banner promocional (PagerView horizontal, auto-scroll 4s)
3. Chips de categoria (FlatList horizontal)
4. Seção "Lojas em destaque" (FlatList horizontal de `StoreCard` — 200x120, foto de capa, rating badge)
5. Seção "Prestadores próximos" (FlatList horizontal de `ProviderCard` — 140x180)
6. Alerta de pedido ativo (se `orders[0].status !== 'entregue'`)
7. Alerta de visita pendente (se `visits.any(v => v.status === 'pending')`)

Diferença do web: o web tem sidebar + lista vertical. O mobile tem FlatList compositional estilo iFood com seções horizontais aninhadas.

**API**: `GET /stores/featured/`, `GET /providers/nearby/`, `GET /orders/my/?limit=1`, `GET /technical-visits/my/?limit=3`

**Estado**: local (`useState` + `useEffect`); pull-to-refresh com `RefreshControl` laranja.

**Ponto de atenção**: nested FlatLists (horizontais dentro de vertical) — desabilitar scroll no eixo correto para evitar conflito de gesto; usar `nestedScrollEnabled` no Android.

**Revisão/Teste**
- Tela carrega sem crash em lista vazia (usuário recém-registrado)
- PagerView não trava scroll vertical
- Banner de pedido/visita aparece/desaparece corretamente conforme estado

---

### Passo 7 — Descoberta de Materiais e Lojas *(SHARED: Consumidor + Prestador)*

**O que faz**: Permite navegar lojas de materiais e produtos de construção, pesquisar por nome e filtrar por categoria, e ver o perfil detalhado de uma loja com suas avaliações.

**Por que existe**: Módulo central de descoberta e compra; é o equivalente do "cardápio de restaurante" no iFood.

**Ciclo**: Descoberta → Carrinho; alimenta o Passo 8 (detalhe de loja) e o Passo 9 (adicionar ao carrinho).

**Perfis**: Consumidor e Prestador (telas idênticas).

**Como portar**

Telas:
- `stores/index.tsx` — lista de lojas com busca + filtros de categoria
- `stores/[storeId]/index.tsx` — detalhe da loja (Passo 8)

Padrão de lista: `FlashList` (numColumns: 2 para produtos; numColumns: 1 para lojas). Pull-to-refresh. Skeleton placeholder durante loading com `@shopify/flash-list` shimmer.

Filtros abrem BottomSheet (55% de altura):
- Categoria: checkboxes verticais
- Preço: range slider duplo (biblioteca `@miblanchard/react-native-slider`)
- Avaliação mínima: botões de estrela (1–5)
- Ordenação: radio buttons (Relevância / Mais próximas / Melhor avaliação / Menor preço)

Diferença do web: o web combina tudo em `materials/page.tsx` (24KB, uma página com tabs). No mobile são telas separadas com navegação em stack.

**API**: `GET /stores/featured/`, `GET /items/public/?search=X&category=Y`

**Revisão/Teste**
- Busca debounced (300ms) sem chamadas excessivas
- FlashList sem flickering em scroll rápido
- Filtros aplicados corretamente na URL de query

---

### Passo 8 — Detalhe da Loja e Produtos

**O que faz**: Exibe perfil completo de uma loja (nome, endereço, horário, rating, se aberta), lista seus produtos com filtro, e permite adicionar itens ao carrinho. Também exibe as avaliações via `StoreReviewsSheet`.

**Por que existe**: Equivalente à página de restaurante no iFood — o consumidor decide comprar aqui.

**Ciclo**: Descoberta → Carrinho; conectado ao Passo 7 (entrada) e Passo 9 (saída via "adicionar ao carrinho").

**Perfis**: Consumidor e Prestador (idênticos).

**Como portar**

Tela: `stores/[storeId]/index.tsx`

Layout:
- Header colapsível: foto de capa (16:7), sobre ela: nome, rating, badge "Aberta/Fechada" (calculado de `opening_time`/`closing_time`), distância, endereço
- Abaixo do header: barra de busca de produto + chips de sub-categoria
- `FlashList` de produtos em 2 colunas: `ProductCard` (foto + nome + preço em laranja + botão circular "+" )
- Toque no "+" → `cartStore.incrementCount()` + `POST /cart/` + haptic light + toast "Adicionado ao carrinho"
- Toque no card → `ProductQuickViewSheet` (BottomSheet 55%): foto grande, descrição completa, tipo de frete (badge: Leve/Médio/Pesado), seletor de quantidade, "Adicionar ao carrinho"
- Botão "Avaliações (127)" no header → abre `StoreReviewsSheet`

Diferença do web: o web renderiza tudo em `stores/[storeId]/page.tsx`. O mobile tem header colapsível com `Animated.ScrollView` e `interpolate` para a foto.

**API**: `GET /stores/{storeId}/`, `GET /items/public/?company_id={storeId}`, `POST /cart/`

**Revisão/Teste**
- Badge Aberta/Fechada calculado corretamente no fuso horário do usuário
- Adicionar o mesmo produto duas vezes incrementa quantidade no carrinho (PATCH, não POST duplo)
- `StoreReviewsSheet` mostra avaliações paginadas sem crash em lista vazia

---

### Passo 9 — Carrinho de Compras *(SHARED: Consumidor + Prestador)*

**O que faz**: Exibe os itens no carrinho agrupados por empresa, permite ajustar quantidade, remover itens, ver estimativa de frete e prosseguir para o checkout.

**Por que existe**: Ponto de revisão antes do pagamento; garante que o usuário confirme o pedido antes de pagar.

**Ciclo**: Descoberta → **Carrinho** → Checkout; conecta Passos 7/8 ao Passo 10.

**Perfis**: Consumidor e Prestador (idênticos).

**Como portar**

Tela: `cart/index.tsx`

Layout:
- Header: "Meu Carrinho (N itens)"
- `FlatList` de `CartItemRow` com Reanimated swipe-to-delete (direita → painel vermelho "Remover"):
  - Imagem produto (70x70), nome (2 linhas), nome da loja em cinza, stepper quantidade (−/+), preço em laranja
  - Animação de remoção: height colapsa para 0 com `Animated.timing` + haptic medium
- Seção "Resumo": subtotal, frete (ou "Calcular frete" → input de CEP), total em bold 20px
- Seção "Cupom de desconto": Input + botão "Aplicar"
- Painel fixo no bottom (acima da tab bar): total + botão "Finalizar pedido" (primary, height 52)

Diferença do web: sem scroll horizontal de grupos; tudo em lista vertical simples. Swipe-to-delete é nativo (Reanimated), não botão de X como no web.

**API**: `GET /cart/`, `PATCH /cart/{id}/`, `DELETE /cart/{id}/`, `GET /cart/shipping-estimate/`

**Estado**: local + `cartStore.count` para badge na tab.

**Revisão/Teste**
- Swipe-to-delete funciona em iOS (gesto nativo) e Android
- Stepper não permite quantidade < 1 (último item usa botão de remoção)
- Carrinho vazio mostra `EmptyState` com CTA "Ver materiais"
- `cartStore.count` sincroniza com total de itens do backend

---

### Passo 10 — Checkout e Pagamento PIX *(SHARED: Consumidor + Prestador)*

**O que faz**: Fluxo de dois passos: (1) revisão do pedido + dados do pagador; (2) QR Code PIX + polling de confirmação.

**Por que existe**: Módulo de monetização central. Sem checkout funcionando o produto não tem valor.

**Ciclo**: Carrinho → **Checkout** → Pedidos; módulo de maior risco técnico do projeto.

**Perfis**: Consumidor e Prestador (idênticos para compra de materiais). O mesmo padrão de PIX é reutilizado na solicitação de visita técnica (Passo 12).

**Como portar**

Tela: `cart/checkout.tsx` — estado `step: 'review' | 'pix'`

**Etapa 1 — Revisão + Dados do Pagador**:
- Lista resumida de itens (não editável)
- Form pré-preenchido: email, nome completo, CPF (mascarado), endereço de entrega
- Estimativa de frete final
- Total em destaque
- Botão "Pagar com PIX" → `POST /orders/` → recebe `{ order, payment: { id, qr_code_base64, qr_code_text } }` → avança para etapa 2

**Etapa 2 — QR Code PIX**:
- `expo-image` com `source={{ uri: 'data:image/png;base64,' + qr_code_base64 }}` (240x240 centralizado)
- Botão "Copiar código PIX" (`expo-clipboard` + haptic success + texto muda para "Copiado!")
- Instruções: "Abra o app do seu banco, vá em PIX > Pagar e escaneie o código"
- Timer de expiração (15 min, countdown visual)
- **Polling**: `usePaymentStatus(paymentId)` → `GET /payments/{id}/` a cada 5s
  - `approved` → navegar para `orders/[orderId]` com animação de sucesso
  - `cancelled` → mostrar `InfoBox` error + botão "Tentar novamente"
- **Apenas em desenvolvimento**: botão "Simular aprovação" → `POST /payments/{id}/simulate-approve/`

`usePaymentStatus` hook:
```typescript
function usePaymentStatus(paymentId: string, onApproved: () => void) {
  const pollingActive = useRef(true);
  useEffect(() => {
    const interval = setInterval(async () => {
      if (!pollingActive.current) return;
      const status = await paymentsApi.getStatus(paymentId);
      if (status === 'approved') {
        pollingActive.current = false;
        clearInterval(interval);
        onApproved();
      }
    }, 5000);
    return () => { pollingActive.current = false; clearInterval(interval); };
  }, [paymentId]);
}
```

**Pausa do polling quando app vai para background**:
```typescript
useEffect(() => {
  const sub = AppState.addEventListener('change', state => {
    pollingActive.current = state === 'active';
  });
  return () => sub.remove();
}, []);
```

**API**: `POST /orders/`, `GET /payments/{id}/`, `POST /payments/{id}/simulate-approve/`

**Revisão/Teste**
- QR code renderiza em ambos dispositivos físicos iOS + Android
- Polling para ao sair da tela (sem memory leak)
- Polling pausa quando app vai para background
- Fluxo completo testado de ponta a ponta com `simulate-approve`

---

### Passo 11 — Gestão de Pedidos — Consumidor e Prestador *(SHARED)*

**O que faz**: Lista de todos os pedidos do usuário com filtro por status, e tela de detalhe com rastreamento em timeline, itens do pedido e possibilidade de avaliar após entrega.

**Por que existe**: Pós-compra — transparência de status é essencial para confiança e redução de suporte.

**Ciclo**: Pós-compra — alimentado pelo Passo 10 (checkout cria pedidos); conecta ao fluxo de avaliação.

**Perfis**: Consumidor e Prestador (mesmas telas; empresa tem tela própria no Passo 21).

**Como portar**

Telas:
- `orders/index.tsx` — lista com chips de filtro horizontal (Todos / Pendente / Confirmado / Enviado / Entregue / Cancelado)
- `orders/[orderId].tsx` — detalhe com timeline

**Lista**: `FlashList` de `OrderCard` (card com borda-esquerda colorida por status, nome da loja, N itens, total, data, badge de status). Pull-to-refresh. Chips de filtro scrooláveis.

**Detalhe — Timeline**:
```
Pedido criado → Pagamento aprovado → Separando materiais → Em rota → Entregue
```
Cada etapa: círculo (laranja preenchido se concluído, outline pulsando se atual, cinza se futuro) + linha conectora colorida + label + timestamp.

Abaixo da timeline:
- Lista de itens (foto thumb + nome + qtd + preço)
- Endereço de entrega
- Valor total + frete
- Botão "Cancelar pedido" (apenas em `pendente`) → dialog de confirmação → `PATCH /orders/{id}/status/`
- Botão "Avaliar pedido" (apenas após `entregue`) → `RatingSheet` (BottomSheet 50%: estrelas + comentário → `POST /reviews/`)

**API**: `GET /orders/my/`, `PATCH /orders/{id}/status/`, `POST /reviews/`

**Revisão/Teste**
- Status de cada etapa atualiza corretamente ao fazer pull-to-refresh
- Botão de cancelamento só aparece em `pendente`
- RatingSheet fecha ao submeter com sucesso
- Timeline exibe corretamente para pedidos em qualquer etapa

---

## MÓDULOS — SPRINT 2: Consumer Completo + Prestador (Passos 12–17)

---

### Passo 12 — Descoberta de Prestadores (Consumidor)

**O que faz**: Lista prestadores de serviço próximos com filtro por especialidade. Toque no card abre `ProviderDetailSheet` com perfil completo, disponibilidade e fluxo de solicitação de visita técnica (incluindo pagamento PIX).

**Por que existe**: Principal diferencial do produto além do e-commerce — conectar consumidores a profissionais de construção qualificados.

**Ciclo**: Descoberta → Contratação de serviço → Visitas (Passo 13).

**Perfis**: Consumidor apenas.

**Como portar**

Tela: `providers/index.tsx` — lista de `ProviderCard` com busca + filtro por especialidade.

`ProviderDetailSheet` (BottomSheet, snap 45%/92%):
- **Colapsado (45%)**: avatar, nome, especialidades (chips), rating, distância, botão "Ver disponibilidade"
- **Expandido (92%)**: grade semanal de disponibilidade (Seg–Dom, slots de horário como pills — laranja se disponível, cinza se ocupado), reviews dos últimos 3, botão "Solicitar visita" fixo no bottom

**Fluxo de solicitação de visita** (dentro do Sheet, multi-step):
- Etapa 1: notas do serviço, endereço (com preenchimento via CEP), data preferencial
- Etapa 2: confirmação de dados + preço da visita (R$80 fixo)
- Etapa 3: QR PIX — mesmo componente `PixQRCard` do Passo 10; `usePaymentStatus` idêntico
- Após aprovação: navegar para `visits/[id]`

**API**: `GET /providers/nearby/?specialty=X`, `POST /technical-visits/`, `GET /payments/{id}/`

**Ponto de atenção**: `ProviderDetailSheet` tem navegação interna de steps — usar `useState` para step dentro do Sheet, não navigation stack, para manter o Sheet aberto durante todo o fluxo.

**Revisão/Teste**
- Sheet não fecha ao mudar de step
- Filtro de especialidade filtra lista corretamente
- Após PIX aprovado, Sheet fecha e usuário é navegado para visita criada

---

### Passo 13 — Visitas Técnicas — Consumidor (Lista + Detalhe + Chat)

**O que faz**: Lista todas as visitas técnicas do consumidor com status visual, e tela de detalhe com timeline de status, possibilidade de cancelar e chat em tempo real com o prestador.

**Por que existe**: Acompanhamento pós-contratação — transparência e comunicação direta são diferenciais críticos.

**Ciclo**: Pós-contratação de serviço — criado no Passo 12; fechado com avaliação após conclusão.

**Perfis**: Consumidor (prestador tem painel próprio no Passo 16).

**Como portar**

Telas:
- `visits/index.tsx` — lista de `VisitCard` com borda-esquerda colorida por status (azul pending, laranja accepted, verde completed, vermelho cancelled)
- `visits/[id].tsx` — detalhe completo

**Detalhe**:
- Timeline de status: Solicitado → Confirmado → Em andamento → Concluído → Avaliado
- Info da visita: prestador (avatar + nome), endereço, data preferencial, notas, preço pago
- Botão "Cancelar" (apenas em `pending`/`accepted`) → dialog → `POST /technical-visits/{id}/cancel/`
- **Chat**: `FlatList` invertida de `ChatBubble` (bolha do consumidor: direita, laranja; prestador: esquerda, cinza)
- Input de mensagem fixo no bottom com `KeyboardAvoidingView`
- **Polling**: `useVisitMessages(visitId)` → `GET /technical-visits/{id}/messages/` a cada 8s
- Após `completed`: botão "Avaliar visita" → `RatingSheet` → `POST /reviews/`

**API**: `GET /technical-visits/my/`, `GET /technical-visits/{id}/`, `GET /technical-visits/{id}/messages/`, `POST /technical-visits/{id}/messages/`, `POST /technical-visits/{id}/cancel/`, `POST /reviews/`

**Revisão/Teste**
- Chat polling para ao sair da tela
- Mensagens enviadas aparecem imediatamente na FlatList (otimistic UI) sem duplicação no próximo poll
- Timeline atualiza via pull-to-refresh

---

### Passo 14 — Configurações do Consumidor

**O que faz**: Permite ao consumidor atualizar foto de perfil, dados pessoais (nome, CPF, telefone, gênero, data de nascimento), endereço (com CEP autocomplete) e alterar senha.

**Por que existe**: Dados pessoais corretos são obrigatórios para checkout (CPF) e entrega (endereço).

**Ciclo**: Configuração de perfil — acesso via tab "Perfil".

**Perfis**: Consumidor.

**Como portar**

Tela: `settings/index.tsx` — `ScrollView` com seções:
1. **Foto**: avatar 80px circular; toque → ActionSheet (Câmera / Galeria) → `expo-image-picker` → FormData → `PUT /auth/me/update/`
2. **Dados pessoais**: `react-hook-form` com Zod; campos: nome, CPF (mascarado), telefone, gênero (Select), data de nascimento (DatePicker)
3. **Endereço**: CEP (mascarado) com `useCEP` → preenchimento automático; complemento manual
4. **Segurança**: senha atual + nova senha + confirmação
5. Botão "Salvar" por seção (não um único botão global)

**API**: `PUT /auth/profile/consumer/`, `PUT /auth/me/update/`

**Revisão/Teste**
- Photo upload funciona em iOS (PHPhotoLibrary permission) e Android (READ_EXTERNAL_STORAGE)
- CEP autocomplete preenche campos sem sobrescrever edições manuais
- Validação Zod bloqueia CPF inválido antes de chamar API

---

### Passo 15 — Dashboard do Prestador

**O que faz**: Tela inicial do Prestador com toggle de disponibilidade, alerta de visitas pendentes, acesso a lojas de materiais e banner de verificação pendente (quando `verified: false`).

**Por que existe**: O toggle de disponibilidade é a ação mais frequente do prestador; deve estar a um toque de distância.

**Ciclo**: Operação diária — entrada do Prestador após login; conecta ao Painel de Visitas (Passo 16).

**Perfis**: Prestador.

**Como portar**

Tela: `app/(app)/(provider)/index.tsx`

Layout:
- Card de disponibilidade no topo: `Switch` grande + label "Disponível para visitas"; ao toggle → `POST /auth/providers/availability/update/` + haptic + toast
- Se `verified === false`: `InfoBox` warning "Conta em verificação — aguarde aprovação"
- Se `verified === false && criminal_record` em análise: `PendingVerificationSheet` auto-aberto na primeira visita
- Seção "Visitas pendentes": counter card laranja → link "Ver todas" → navega para tab Visitas
- Seção "Lojas em destaque": reutiliza componente do Passo 7

**API**: `GET /auth/me/`, `POST /auth/providers/availability/update/`, `GET /technical-visits/my/?status=pending`

**Revisão/Teste**
- Toggle de disponibilidade sincroniza com backend (não apenas UI local)
- `PendingVerificationSheet` só abre uma vez por sessão (flag em `uiStore`)

---

### Passo 16 — Painel de Visitas do Prestador

**O que faz**: Gerencia todas as visitas técnicas do prestador: aceitar/recusar novas solicitações (com countdown de 20 minutos), visualizar visitas aceitas com chat, e registrar conclusão.

**Por que existe**: Módulo operacional central do prestador — onde ele recebe e gerencia sua demanda de trabalho.

**Ciclo**: Operação de serviço — recebe visitas do Passo 12 (consumidor solicitou); fecha com conclusão e avaliação.

**Perfis**: Prestador.

**Como portar**

Tela: `app/(app)/(provider)/visits/index.tsx`

Tabs horizontais: Pendentes | Aceitas | Concluídas | Recusadas | Canceladas

**Aba "Pendentes"** (crítica):
- `FlatList` de `VisitCard` expandido:
  - Dados: consumidor (avatar + nome), endereço, serviço solicitado, data preferencial, notas
  - `PendingCountdown` — countdown regressivo de 20 minutos em vermelho pulsante quando < 5 min
  - Botões: "Aceitar" (primary) + "Recusar" (outline destructive)
  - Aceitar → dialog "Confirmar aceitação da visita?" → `PATCH /technical-visits/{id}/` `{ action: 'accept' }`
  - Recusar → dialog → `PATCH /technical-visits/{id}/` `{ action: 'refuse' }`

**Aba "Aceitas"**:
- Card expansível: tap → expande revelando chat embutido (mesmo `ChatBubble` + input do Passo 13)
- Botão "Marcar como concluída" → dialog → `POST /technical-visits/{id}/complete/`

`PendingCountdown` hook:
```typescript
// Calcula segundos restantes a partir de pending_since + 20min
function usePendingCountdown(pendingSince: string) {
  const [remaining, setRemaining] = useState(calculateRemaining(pendingSince));
  useEffect(() => {
    const id = setInterval(() => setRemaining(calculateRemaining(pendingSince)), 1000);
    return () => clearInterval(id);
  }, [pendingSince]);
  return remaining;
}
```

Push notification "Nova solicitação de visita" → deep link para esta tela.

**API**: `GET /technical-visits/my/`, `PATCH /technical-visits/{id}/` (accept/refuse), `POST /technical-visits/{id}/complete/`, `GET/POST /technical-visits/{id}/messages/`

**Estado**: `Record<number, VisitMessage[]>` + `Record<number, string>` para mensagens por visita (mesmo padrão do `provider/visits/page.tsx` do web).

**Revisão/Teste**
- Countdown zera e card some da lista de pendentes ao expirar (lógica de filtro por `pending_since + 20min`)
- Chat embutido funciona sem abrir nova tela
- Aceitar/recusar remove o card da aba "Pendentes" imediatamente (optimistic update)

---

### Passo 17 — Configurações do Prestador

**O que faz**: Permite ao prestador atualizar foto, dados pessoais, endereço, especialidades, raio de cobertura, upload de documento (antecedentes criminais) e alterar disponibilidade.

**Por que existe**: Dados completos e documentação são pré-requisitos para verificação e exibição nos resultados de busca.

**Ciclo**: Configuração de perfil — acesso via tab "Perfil".

**Perfis**: Prestador.

**Como portar**

Tela: `settings/index.tsx` — seções:
1. Foto de perfil (`expo-image-picker`)
2. Dados pessoais: nome, CPF, telefone, gênero, data nascimento, CNPJ (opcional)
3. Endereço + CEP autocomplete
4. Atuação: `MultiSelect` de especialidades (normalizar `specialties` — o web tem lógica `normalizeSpecialties` para o formato legado JSON-stringified), raio de cobertura (Slider ou Input numérico)
5. Documentação: upload de antecedentes criminais via `expo-document-picker` (PDF) ou `expo-image-picker` (foto do doc)
6. Segurança: troca de senha

**API**: `PUT /auth/profile/provider/`, `PUT /auth/me/update/`, `POST /auth/providers/availability/update/`

**Ponto de atenção**: Upload de PDF via `expo-document-picker` → FormData com `{ uri, name, type: 'application/pdf' }` — testar em ambas plataformas pois Android pode exigir prefixo `file://` no URI.

**Revisão/Teste**
- Upload de PDF funciona em iOS e Android físicos
- Especialidades salvas e recarregadas corretamente (sem duplicação por normalização)
- Raio de cobertura refletido imediatamente no perfil público

---

## MÓDULOS — SPRINT 3: Empresa (Passos 18–25)

---

### Passo 18 — Dashboard da Empresa + Onboarding

**O que faz**: Tela inicial da Empresa com atalhos rápidos para todos os módulos operacionais, alerta de pedidos pendentes, e onboarding obrigatório na primeira sessão (horários de funcionamento + chave PIX).

**Por que existe**: Ponto de controle operacional da empresa. O onboarding é bloqueante — sem horários e PIX configurados a loja não fica visível.

**Ciclo**: Fundação da Empresa → todos os módulos de gestão operacional.

**Perfis**: Empresa.

**Como portar**

Tela: `app/(app)/(company)/index.tsx`

**Onboarding** (`onboarding_completed === false`): `OnboardingSheet` abre automaticamente (full-screen, não dispensável):
- Step 1: grade de horários (Seg–Dom, toggle ativo/inativo, pickers Abertura/Fechamento)
- Step 2: tipo de chave PIX (CPF/CNPJ/Email/Telefone/Aleatória) + valor da chave
- Step 3: resumo + "Confirmar" → `PUT /auth/profile/company/` `{ onboarding_completed: true, ... }`

**Dashboard**: grid 2x3 de `FeatureCard` (ícone + título + subtítulo + badge de alerta):
- Conferir Itens | Ger. Entregas | Pedidos (badge com count pendente) | Estoque | Recebimento | Contas a Pagar

Seção "Pedidos pendentes" abaixo: FlatList com os 3 pedidos mais recentes em `pendente`.

**API**: `GET /auth/me/` (checa `onboarding_completed`), `PUT /auth/profile/company/`, `GET /orders/company/?status=pendente&limit=3`

**Revisão/Teste**
- Onboarding sheet não fecha antes de completar (desabilitar swipe-to-close)
- Badge de pedidos pendentes atualiza com pull-to-refresh
- Após completar onboarding, sheet não reaparece em sessões futuras

---

### Passo 19 — Gestão de Produtos/Itens (Empresa)

**O que faz**: CRUD completo do catálogo de produtos da empresa: criar, editar, ativar/desativar e excluir itens com foto, preço, tipo de frete e peso.

**Por que existe**: Gestão do cardápio/catálogo — sem produtos cadastrados a loja não tem nada para vender.

**Ciclo**: Operação da Empresa — pré-requisito para receber pedidos (Passo 21).

**Perfis**: Empresa.

**Como portar**

Telas:
- `items/index.tsx` — lista com busca, toggle ativo/inativo e FAB "+"
- `items/[itemId].tsx` — formulário (create/edit) com header action "Salvar"

**Lista**: `FlashList` com `ItemCard` (foto thumb 60x60, nome, marca, preço em laranja, badge de frete, toggle ativo). Swipe-to-delete com confirmação.

**Formulário** (create/edit via `react-hook-form` + Zod):
- Foto (upload via `FileUpload`, preview imediato)
- Nome, marca, descrição (multiline), peso (kg)
- Preço (Input numérico com prefixo "R$")
- Tipo de frete: `Select` com opções Leve/Médio/Meio-pesado/Pesado
- Toggle "Disponível para venda"

**API**: `GET /items/`, `POST /items/`, `PATCH /items/{id}/`, `DELETE /items/{id}/`

**Revisão/Teste**
- Foto preview aparece antes do upload (URI local)
- Validação Zod bloqueia preço negativo e nome vazio
- Exclusão com `swipe-to-delete` mostra dialog de confirmação antes de chamar API

---

### Passo 20 — Gestão de Entregas (Empresa)

**O que faz**: Configura parâmetros de entrega da empresa (tempo médio por km, raio de exibição) e gerencia os entregadores cadastrados (CRUD).

**Por que existe**: Determina a capacidade e alcance de entrega da empresa; entregadores são necessários para movimentar pedidos.

**Ciclo**: Configuração operacional — paralelo ao Passo 19; ambos pré-configuram a operação antes de receber pedidos.

**Perfis**: Empresa.

**Como portar**

Tela: `deliveries/index.tsx` — duas seções em `ScrollView`:

**Seção 1 — Configurações de Entrega**:
- Input "Tempo médio por km (min)" + Input "Raio de exibição (km)"
- Botão "Salvar configurações" → `PUT /auth/profile/company/`

**Seção 2 — Entregadores**:
- FlatList de cards: nome, nível (badge), telefone, toggle disponível
- FAB "+" → BottomSheet com formulário: nome, nível (Select: Junior/Pleno/Senior), telefone
- Swipe-to-delete (com confirmação) + botão editar

**API**: `PUT /auth/profile/company/`, `POST /deliverers/`, `PATCH /deliverers/{id}/`, `DELETE /deliverers/{id}/`

**Revisão/Teste**
- Formulário de entregador valida telefone com máscara
- Deletar entregador com pedidos ativos deveria exibir warning (verificar regra de negócio no backend)

---

### Passo 21 — Gestão de Pedidos — Empresa

**O que faz**: Lista todos os pedidos recebidos pela empresa com filtro por status, permite ver detalhe do pedido e avançar o status de fulfillment.

**Por que existe**: Operação de fulfillment — sem isso a empresa não consegue processar as vendas recebidas.

**Ciclo**: Operação de fulfillment — recebe pedidos criados pelos consumidores no Passo 10.

**Perfis**: Empresa.

**Como portar**

Tela: `orders/index.tsx` + `orders/[orderId].tsx`

Idêntico ao Passo 11 em layout, mas com:
- `GET /orders/company/` em vez de `/orders/my/`
- Ações de empresa no detalhe: botões de progresso de status
  - `pendente` → "Confirmar pedido" → `PATCH /orders/{id}/status/` `{ status: 'confirmado' }`
  - `confirmado` → "Pedido enviado"
  - `enviado` → "Pedido entregue"
- Nome do comprador visível no card
- Nenhum botão de avaliação (empresa não avalia)

**API**: `GET /orders/company/`, `PATCH /orders/{id}/status/`

**Revisão/Teste**
- Botões de status aparecem apenas na etapa correta
- Status atualiza imediatamente na lista após ação (optimistic update com rollback em erro)

---

### Passo 22 — Controle de Estoque (Empresa)

**O que faz**: CRUD do estoque da empresa — itens de inventário com quantidade, unidade, preço de compra, quantidade mínima e alertas de estoque baixo.

**Por que existe**: Controle de inventário para evitar ruptura de estoque e auxiliar planejamento de compras.

**Ciclo**: Gestão interna — paralelo à operação; não bloqueia outras funcionalidades mas é essencial para a gestão.

**Perfis**: Empresa.

**Como portar**

Tela: `inventory/index.tsx` — `FlashList` + FAB "+"

`InventoryCard`: nome, categoria, quantidade + unidade, preço de compra, alerta vermelho se `quantity < min_quantity`.

FAB/botão editar → `InventoryFormSheet` (BottomSheet 75%): nome, categoria (Select: Cimento/Areia/Tijolo/Tinta/Madeira/Metal/Outros), quantidade (numérico), unidade (Select: un/kg/L/m/m²/m³/cx), quantidade mínima, preço de compra, observações.

Badge na tab "Estoque" mostra contagem de itens abaixo do mínimo (vermelho).

**API**: `POST /inventory/`, `PATCH /inventory/{id}/`, `DELETE /inventory/{id}/`

**Revisão/Teste**
- Badge de estoque baixo atualiza corretamente
- Unidades de medida corretas por tipo de produto (ex: cimento em kg, tinta em L)

---

### Passo 23 — Rastreamento de Receitas/Vendas (Empresa)

**O que faz**: Painel de métricas financeiras com gráficos de receita ao longo do tempo, distribuição de pedidos por status e ranking de produtos mais vendidos.

**Por que existe**: Inteligência de negócio — permite à empresa entender sua performance e tomar decisões.

**Ciclo**: Gestão financeira — informacional; conecta ao módulo de Contas a Pagar (Passo 24).

**Perfis**: Empresa.

**Como portar**

Tela: `revenue/index.tsx`

Substituição de Recharts por `victory-native` (usa Skia, mais performático em RN):
- Selector de período: Semana / Mês / Ano (chips)
- Cards de KPI: Receita total, Pedidos, Ticket médio, Taxa de entrega
- `VictoryLine` — receita por dia/mês
- `VictoryBar` — top 5 produtos por receita
- `VictoryPie` — pedidos por status (donut chart)

Todos os gráficos usam `width={Dimensions.get('window').width - 32}`. Cores: laranja para barras de receita, paleta semântica para status.

**API**: `GET /orders/company/stats/?period=week|month|year` (endpoint inferido do padrão web)

**Ponto de atenção**: `victory-native` v41 requer `@shopify/react-native-skia` — dependência pesada (~2MB); instalar uma vez na fundação (Passo 1).

**Revisão/Teste**
- Gráficos renderizam sem crash em ambas plataformas
- Período selecionado refaz fetch corretamente
- Valores BRL formatados (R$ 48.290,00)

---

### Passo 24 — Contas a Pagar (Empresa)

**O que faz**: CRUD de contas a pagar da empresa — registro de despesas com descrição, valor, vencimento, categoria e marcação de pago/pendente.

**Por que existe**: Controle de fluxo de caixa e obrigações financeiras da empresa.

**Ciclo**: Gestão financeira — complementa o Passo 23 com o lado das despesas.

**Perfis**: Empresa.

**Como portar**

Tela: `bills/index.tsx`

`BillCard`: descrição, valor formatado em BRL, data de vencimento, badge de categoria (colorido), toggle pago/pendente. Highlight vermelho se vencida e não paga.

Filtros: chips "Todas / Pendentes / Pagas" + "Categoria" (Select).

FAB → `BillFormSheet`: descrição, valor (Input numérico), vencimento (DatePicker nativo via `@react-native-community/datetimepicker`), categoria (Select: Aluguel/Fornecedor/Imposto/Funcionário/Outros).

Swipe-to-delete com confirmação → `DELETE /core/bills/{id}/`.

**API**: `GET /core/bills/` (inferido), `POST /core/bills/` (inferido), `PATCH /core/bills/{id}/` (inferido), `DELETE /core/bills/{id}/`

**Revisão/Teste**
- DatePicker funciona corretamente em iOS (spinner) e Android (calendar)
- Toggle pago/pendente sincroniza com backend
- Contas vencidas em destaque vermelho

---

### Passo 25 — Configurações da Empresa

**O que faz**: Permite atualizar logo, dados da empresa (nome, CNPJ, segmento, telefone), endereço, horários de funcionamento, chave PIX e senha.

**Por que existe**: Dados corretos da empresa são visíveis ao consumidor e determinam funcionamento do checkout.

**Ciclo**: Configuração de perfil — acesso via tab "Perfil".

**Perfis**: Empresa.

**Como portar**

Tela: `settings/index.tsx` — seções:
1. Logo (FileUpload, preview circular)
2. Dados da empresa: nome fantasia, CNPJ (mascarado), segmento (Select), telefone
3. Endereço + CEP autocomplete
4. Horários: grade Seg–Dom com toggles e time pickers
5. PIX: tipo de chave + valor (reuso do mesmo formulário do `OnboardingSheet`)
6. Segurança: troca de senha

**API**: `PUT /auth/profile/company/`, `PUT /auth/me/update/`

**Revisão/Teste**
- Upload de logo com preview imediato
- Horários salvos e recarregados corretamente para todos os dias
- Mudança de chave PIX reflete no checkout dos clientes

---

## MÓDULOS — SPRINT 4: Admin (Passos 26–30)

---

### Passo 26 — Dashboard Admin — Visão Geral

**O que faz**: Painel com estatísticas gerais da plataforma e acesso rápido aos módulos de gestão.

**Por que existe**: Monitoramento da saúde da plataforma; necessário para que o time de operações supervisione a qualidade.

**Ciclo**: Gestão da plataforma — entrada do Admin após login.

**Perfis**: Admin.

**Como portar**

Tela: `app/(app)/(admin)/index.tsx`

Grid 2x3 de `StatCard`:
- Total de Usuários, Consumidores, Prestadores, Empresas, Prestadores Verificados, Itens Cadastrados

Abaixo: FlatList de "Prestadores aguardando verificação" (link para Passo 28).

Tab bar com fundo escuro (`#111827`) e ícone/texto laranja quando ativo — visual de "modo admin".

**API**: `GET /admin/stats/` (inferido)

---

### Passo 27 — Gestão de Usuários (Admin)

**O que faz**: Lista todos os usuários da plataforma com busca e filtro por tipo.

**Perfis**: Admin.

**Como portar**

Tela: `users/index.tsx`

`FlashList` com `UserRow` (avatar, nome, email, tipo badge, data de cadastro). Busca por nome/email. Filtro por tipo (chips).

Toque no usuário → `UserDetailSheet` (BottomSheet 65%): dados completos, tipo, status de verificação.

**API**: `GET /admin/users/` (inferido)

---

### Passo 28 — Verificação de Prestadores (Admin)

**O que faz**: Lista prestadores aguardando verificação e permite ao admin verificar/aprovar perfil após análise de antecedentes criminais.

**Por que existe**: Segurança da plataforma — prestadores só aparecem nas buscas após verificação manual.

**Perfis**: Admin.

**Como portar**

Tela: `providers/index.tsx`

Filtro: Verificados / Pendentes / Todos.

Toque → `ProviderVerificationSheet`: dados completos, especialidades, link para documento de antecedentes (abre `expo-web-browser`), botão "Verificar prestador" → dialog → `POST /auth/admin/providers/{id}/verify/`.

**API**: `GET /admin/providers/` (inferido), `POST /auth/admin/providers/{id}/verify/`

---

### Passo 29 — Gestão de Lojas (Admin)

**O que faz**: Lista todas as empresas cadastradas (read-only para monitoramento).

**Perfis**: Admin.

**Como portar**

Tela: `stores/index.tsx` — FlashList de `StoreAdminRow` (nome, CNPJ, cidade/estado, onboarding_completed badge, rating). Read-only.

**API**: `GET /admin/stores/` (inferido)

---

### Passo 30 — Gestão de Avaliações (Admin)

**O que faz**: Lista todas as avaliações da plataforma (providers e companies) para monitoramento de qualidade.

**Perfis**: Admin.

**Como portar**

Tela: `reviews/index.tsx` — FlashList de `ReviewRow` (avaliador, alvo, tipo, estrelas, comentário, data). Filtro por tipo (prestador/empresa) e mínimo de estrelas. Read-only.

**API**: `GET /admin/reviews/` (inferido)

---

## PASSO 31 — Documentação (README)

**O que é**: README completo do projeto mobile, conduzido pelos padrões `doc-coauthoring` + `engineering:documentation`.

**Conteúdo obrigatório**:

1. **Visão geral**: o que é o ConstróiJá, os três perfis e o que cada um faz no app
2. **Stack completa e bibliotecas**:
   - Tabela com: biblioteca, versão, finalidade
   - Todas as ~30 dependências listadas no Passo 1
3. **Pré-requisitos**: Node ≥ 20, npm ≥ 10, Expo CLI (`npm install -g expo`), EAS CLI (`npm install -g eas-cli`), Android Studio (SDK 34) e/ou Xcode ≥ 15
4. **Rodar localmente** (passo a passo explicativo):
   - `cd monorepo/mobile && npm install`
   - Configurar `.env` (copiar `.env.example`, setar `EXPO_PUBLIC_API_URL`)
   - `npx expo start` → escanear QR com Expo Go
   - Para iOS: `npx expo run:ios` (requer Mac + Xcode)
   - Para Android: `npx expo run:android` (requer Android Studio)
5. **Estrutura de pastas**: árvore comentada de `app/` e `src/`
6. **Convenções de código**: `bnp-code:naming-things` (camelCase para funções, PascalCase para componentes, kebab-case para arquivos de tela), `bnp-code:language-policy` (PT-BR para labels/UI, EN para código)
7. **Integração com API**: como configurar `EXPO_PUBLIC_API_URL`; descrição do fluxo de autenticação JWT; endpoints documentados por módulo
8. **Scripts disponíveis**: `start`, `android`, `ios`, `build:preview`, `build:production`, `update`
9. **Build e distribuição**: EAS Build para preview (TestFlight/Firebase App Distribution) e production (App Store/Google Play)
10. **Variáveis de ambiente**: tabela com todas as variáveis, obrigatórias vs. opcionais

---

## Verificação Final do Plano

### Checklist de módulos (26 módulos do web → todos cobertos)

| Módulo web | Passo mobile |
|-----------|-------------|
| Auth (login/registro/confirm/senha) | Passo 4 |
| Dashboard Consumidor | Passo 6 |
| Dashboard Prestador | Passo 15 |
| Dashboard Empresa | Passo 18 |
| Dashboard Admin | Passo 26 |
| Materiais/Lojas | Passo 7 |
| Detalhe da Loja | Passo 8 |
| Descoberta de Prestadores | Passo 12 |
| Carrinho | Passo 9 |
| Checkout + PIX | Passo 10 |
| Pedidos Consumidor/Prestador | Passo 11 |
| Visitas Consumidor | Passo 13 |
| Visitas Prestador | Passo 16 |
| Itens Empresa | Passo 19 |
| Entregas Empresa | Passo 20 |
| Pedidos Empresa | Passo 21 |
| Estoque Empresa | Passo 22 |
| Receitas Empresa | Passo 23 |
| Contas a Pagar Empresa | Passo 24 |
| Config Consumidor | Passo 14 |
| Config Prestador | Passo 17 |
| Config Empresa | Passo 25 |
| Admin Usuários | Passo 27 |
| Admin Prestadores | Passo 28 |
| Admin Lojas | Passo 29 |
| Admin Avaliações | Passo 30 |

### Checklist de perfis por módulo

| Perfil | Módulos exclusivos | Módulos compartilhados |
|--------|-------------------|------------------------|
| Consumidor | Passos 6, 12, 13, 14 | Passos 4, 7, 8, 9, 10, 11 |
| Prestador | Passos 15, 16, 17 | Passos 4, 7, 8, 9, 10, 11 |
| Empresa | Passos 18–25 | Passo 4 |
| Admin | Passos 26–30 | Passo 4 |

### Riscos críticos mapeados

1. **PIX polling + AppState** (Passo 10): `pollingActive.current = false` quando app vai para background
2. **Token SecureStore async** (Passo 5): variável de memória para interceptors síncronos
3. **Upload de arquivo FormData** (Passos 14, 17, 19): `{ uri, name, type }` no FormData; prefixo `file://` no Android
4. **Máscaras brasileiras** (Passo 4 et al): usar `react-native-mask-input`; não reinventar lógica de cursor
5. **Gráficos sem Recharts** (Passo 23): `victory-native` v41 com `@shopify/react-native-skia`

---

## Arquivos Críticos de Referência (web)

- [api-client.ts](monorepo/frontend/src/lib/api-client.ts) — lógica de interceptores e refresh
- [AuthContext.tsx](monorepo/frontend/src/contexts/AuthContext.tsx) — padrão de auth state
- [types/index.ts](monorepo/frontend/src/types/index.ts) — portar integralmente para `src/types/index.ts`
- [checkout/page.tsx](monorepo/frontend/src/app/checkout/page.tsx) — lógica de polling PIX
- [provider/visits/page.tsx](monorepo/frontend/src/app/dashboard/provider/visits/page.tsx) — countdown + chat inline
- [formatters.ts](monorepo/frontend/src/utils/formatters.ts) — portar integralmente para `src/utils/formatters.ts`
- [Sidebar.tsx](monorepo/frontend/src/components/layout/Sidebar.tsx) — menus por perfil → tabs mobile
