# Safe Finanças

Aplicação web de gestão financeira multiusuário (workspace compartilhado), com o
conceito central de **orçamento previsto × realizado**. Saldo manual é a fonte da
verdade; valores sempre em centavos inteiros.

Escopo completo: [escopo-gestao-financeira.md](escopo-gestao-financeira.md).

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | Vue 3 + Vite + TypeScript |
| Estado | Pinia |
| Rotas | Vue Router (com guard de auth) |
| UI | [Oren Design System](../oren-design-system) (consumido via source) |
| Auth / DB / Functions | Firebase (Auth, Firestore, Cloud Functions) |

### Sobre o Oren Design System

O DS é consumido **direto do código-fonte** do pacote vizinho (`../oren-design-system`)
via alias do Vite — não é preciso publicar/buildar o pacote nem o token Font Awesome
Pro (usamos só ícones FA *free*). Ver `vite.config.ts` e
`src/types/oren-design-system.d.ts`. Se o DS publicar `dist` com tipos, troque por uma
dependência real e remova a declaração de módulo.

## Estrutura

```
src/
  assets/main.css          # reset + base (tokens vêm do DS)
  lib/money.ts             # centavos: formatar/parsear (NUNCA float)
  lib/icons.ts             # registro de ícones Font Awesome (free)
  types/models.ts          # modelo de dados do Firestore (seção 10 do escopo)
  firebase.ts              # init do Firebase por env + emuladores
  stores/auth.ts           # sessão (e-mail/senha + Google)
  stores/workspace.ts      # workspace ativo + onboarding
  router/index.ts          # rotas + guard de auth
  layouts/AppShell.vue     # sidebar + conteúdo + onboarding de workspace
  views/                   # uma view por tela (seção 12 do escopo)
functions/                 # Cloud Functions (convite de membro)
firestore.rules            # Security Rules (membro E (compartilhada OU dono))
```

## Setup

### 1. Dependências

```bash
npm install
```

### 2. Criar o projeto Firebase (nuvem)

1. Acesse <https://console.firebase.google.com> → **Adicionar projeto**.
2. Em **Build → Authentication → Sign-in method**, habilite **E-mail/senha** e **Google**.
3. Em **Build → Firestore Database**, crie o banco em **modo de produção** (as
   Security Rules deste repo cuidam do acesso).
4. Em **Configurações do projeto → Seus apps → Web (`</>`)**, registre um app web e
   copie as credenciais.
5. Copie `.env.example` para `.env.local` e preencha as variáveis `VITE_FIREBASE_*`.
6. Coloque o **Project ID** em `.firebaserc` (campo `default`).

```bash
cp .env.example .env.local   # depois preencha com as credenciais do console
```

### 3. Rodar

```bash
npm run dev          # app em http://localhost:5173
```

### 4. Deploy das regras e functions (quando logado no Firebase CLI)

```bash
firebase login
firebase deploy --only firestore:rules,firestore:indexes
cd functions && npm install && cd ..
firebase deploy --only functions
```

### Emuladores (opcional, dev local sem nuvem)

Defina `VITE_USE_EMULATORS=true` no `.env.local` e rode:

```bash
npm run emulators
```

## Estado atual

**Fase 1 (MVP) completa** e validada — `npm run typecheck` e `npm run build` passam,
e cada marco foi verificado por scripts e2e contra o Firebase real.

- Autenticação (e-mail/senha; Google pendente de OAuth no console)
- Workspace + onboarding + convite de membros (Cloud Function)
- Contas e investimentos com saldo manual e visibilidade por entidade
- Categorias (receita/despesa, cor, `fixaPorPadrao`)
- Lançamentos com flags previsto/realizado, `valorPrevisto`, despesa fixa
- Cartões com faturas (competência manual, parcelamento, `valorRegistrado`
  vs `valorFinal`, pagamento com baixa de saldo — anti-dupla-contagem)
- Fechamento de mês com alerta de divergência e eventos-anotação
- Dashboard: previsto × realizado, % de fixas, investimentos, faturas em aberto
- Security Rules + índices compostos publicados

### Padrão importante de leitura

Listas de entidades com visibilidade (contas, cartões, transações) usam **duas
queries** (`compartilhada` e `dono == eu`) mescladas no cliente — no Firestore
"regras não são filtros". Ver `src/composables/useData.ts`.

**Próximos (Fase 2):** fechamento automático de fatura, recorrentes, metas por
categoria, importação OFX, multi-moeda.
