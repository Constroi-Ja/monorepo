# INSTRUCTIONS GUIDE (LLM-Optimized)

## 1) Mission
Você é uma IA de engenharia para este projeto. Sua prioridade é:
1. cumprir integralmente a solicitação do usuário;
2. manter qualidade de código alta;
3. preservar arquitetura limpa e modular;
4. evitar regressões.

---

## 2) Repo Map

### Frontend (`/frontend`)
- Stack: Next.js + TypeScript + Tailwind.
- Pastas-chave:
  - `src/app`: páginas e fluxos por rota;
  - `src/components`: componentes reutilizáveis;
  - `src/lib/api-client.ts`: cliente HTTP central;
  - `src/types/index.ts`: contratos de tipagem.

### Backend (`/backend`)
- Stack: Django + DRF.
- Apps:
  - `apps/authentication`: usuários, perfis, auth, permissões;
  - `apps/core`: domínio de marketplace (lojas, itens, carrinho, visitas etc.).
- Arquivos-chave:
  - `models.py`: domínio e persistência;
  - `serializers.py`: validação e shape dos dados;
  - `views.py`: regras de request/response;
  - `urls.py`: rotas.

---

## 3) Hard Rules (MUST)

1. **Completeness**
   - Implementar fluxo fim a fim quando necessário (`frontend` + `backend` + tipos).
   - Não entregar solução parcial sem declarar claramente o que faltou e por quê.

2. **Architecture**
   - Manter separação de responsabilidades:
     - UI/state no frontend;
     - regra de negócio e validação no backend.
   - Não concentrar lógica complexa em JSX ou em uma única view gigante.

3. **Clean Code**
   - Remover código morto/imports não usados.
   - Evitar duplicação.
   - Nomear funções/variáveis de forma semântica.

4. **API Safety**
   - Não quebrar contratos existentes sem necessidade.
   - Sincronizar qualquer novo campo entre backend serializer + frontend type.
   - Toda mudança de modelo deve ter migration.

5. **UX Baseline**
   - Tratar sempre: `loading`, `error`, estado vazio.
   - Garantir responsividade.
   - Fluxos devem fazer sentido de produto (ex.: loja -> itens -> carrinho, nunca adicionar item sem seleção explícita).

---

## 4) Strong Recommendations (SHOULD)

- Reusar componentes base em `src/components/ui`.
- Priorizar endpoints coesos e previsíveis.
- Preferir mensagens curtas e acionáveis para usuário.
- Evitar “mock hardcoded” em produção de fluxo real.

---

## 5) Execution Protocol

1. Ler contexto e identificar impacto por camada.
2. Mapear arquivos-alvo antes de editar.
3. Implementar base de domínio/API primeiro (quando aplicável).
4. Conectar UI e navegação.
5. Atualizar tipos.
6. Validar lint e consistência.
7. Reportar alterações de forma objetiva.

---

## 6) Output Contract (resposta da IA)

Ao finalizar uma task, responder com:
1. **O que foi feito** (bullet points curtos);
2. **Arquivos alterados** (paths);
3. **Validação** (lint/test/status);
4. **Pendências** (se houver).

---

## 7) Final Checklist

- [ ] Solicitação atendida integralmente.
- [ ] Fluxo funcional validado ponta a ponta.
- [ ] Sem erros de lint nas áreas alteradas.
- [ ] Sem código morto/import não usado.
- [ ] Contratos API/Types sincronizados.
- [ ] Permissões corretas por tipo de usuário.
- [ ] Migrations criadas para mudanças de modelo.
- [ ] UX com loading/erro/vazio e responsividade.
