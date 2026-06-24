# Aplicação de Gestão Financeira — Documento de Escopo

> Documento de referência do projeto. Reflete as decisões fechadas em discussão de escopo.
> Status: escopo conceitual completo. Próximos passos: protótipo de telas e Security Rules.

---

## 1. Visão geral

Aplicação web de gestão financeira **multiusuário** (workspace compartilhado, ex.: casal/família), de **uso pessoal e contínuo**, sem ambição comercial. O foco é controle de orçamento mensal com a distinção entre o que foi **previsto** e o que de fato foi **realizado**, mantendo o saldo das contas como fonte da verdade atualizada manualmente.

### Princípios de design

- **Saldo manual é a fonte da verdade.** Os lançamentos servem para análise (relatório por categoria, projeção do mês), não para derivar o saldo. Saldo e soma dos lançamentos podem divergir — e isso é esperado, porque há gastos "por fora" que não são registrados.
- **Sem dupla contagem.** Compra no cartão não conta como despesa de caixa; o que pesa no orçamento é o pagamento da fatura.
- **Valores sempre em centavos inteiros.** Nunca usar float para dinheiro.
- **Visibilidade por entidade.** O workspace não é "tudo de todos"; cada conta/cartão/investimento carrega sua própria visibilidade.

---

## 2. Stack e arquitetura

Tudo no Firebase, sem backend tradicional à parte.

| Camada | Tecnologia |
|---|---|
| Frontend | Vue 3 + Vite, Pinia (estado), Vue Router |
| Integração Firestore | VueFire (binding reativo) |
| Autenticação | Firebase Auth (e-mail/senha + Google) |
| Banco de dados | Cloud Firestore |
| Hosting | Firebase Hosting |
| Lógica privilegiada | Cloud Functions (Node) — uso mínimo |

### Sobre Cloud Functions

O modelo é majoritariamente client-side (Vue lê e escreve direto no Firestore, protegido por Security Rules). Cloud Functions só onde há necessidade de privilégio ou garantia que não pode ficar no cliente. Na Fase 1, o único caso real é **convidar membro por e-mail** (traduzir e-mail → uid e escrever no array de membros de outro usuário).

### UI

A definir na fase de design: Tailwind (controle total) ou biblioteca de componentes (PrimeVue/Vuetify) para tabelas e formulários prontos.

---

## 3. Conceito central: Previsto × Realizado

O coração da aplicação. Cada lançamento existe potencialmente em **dois mundos**, controlados por duas flags independentes.

```
previsto: bool    // entra no orçamento previsto?
realizado: bool   // de fato aconteceu? entra no realizado?
```

A diferença entre os dois orçamentos **não está na fórmula** — está em *quais lançamentos* cada um enxerga.

### Orçamento Previsto

A foto do plano no começo do mês:

```
soma dos saldos atuais das contas
+ receitas previstas (ainda não realizadas)
− despesas previstas (ainda não realizadas)
```

### Orçamento Realizado

A foto do que aconteceu:

```
soma dos saldos atuais das contas (já absorve os gastos "por fora")
± lançamentos realizados (incluindo os que nasceram fora do plano)
```

Como o saldo é atualizado manualmente, ele *migra* sozinho em direção ao número real conforme o mês avança.

### Os três casos representáveis

| Situação | previsto | realizado | Observação |
|---|---|---|---|
| Conta de luz veio mais cara | true | true | `valorPrevisto` = 200, `valor` = 280 → desvio explícito no item |
| Gasto inesperado (passaporte) | false | true | Nasce só no realizado |
| Despesa planejada que foi cancelada | true | false | Some do realizado |

O campo opcional `valorPrevisto` captura o desvio item a item (o esperado vs. o efetivo).

---

## 4. Fechamento de mês (Monthly Review)

Quando previsto e realizado divergem além de um limiar (**default 20%** da receita prevista, configurável), o app convida o usuário a explicar o desvio. Transforma a divergência de um "erro silencioso" num registro contável da vida financeira.

### Eventos = anotação pura

Um evento de fechamento é **descritivo**, não vira transação automaticamente. Se o usuário quer que o gasto afete o orçamento, ele cria a transação manualmente — podendo, inclusive, descrever vários itens em texto e lançar uma única transação com o valor total.

> **Consequência explícita:** como o evento é anotação, ele **não soma** no realizado. O evento explica a diferença em palavras; a transação é o que move o número.

---

## 5. Contas

Coleção única `accounts`. O tipo é um campo, com campos condicionais.

### Tipos

- **conta** — dinheiro que se tem (corrente, poupança, banco digital, dinheiro vivo). "Carteira" foi fundida aqui; se a distinção banco/espécie for necessária no futuro, volta como campo opcional ou tag/ícone.
- **investimento** — patrimônio acumulado, **fora** do orçamento de caixa.

Cartão **não** é um tipo de conta — tem coleção própria (ver seção 6).

Todas as contas têm `saldo` manual como fonte da verdade, contam **positivo** no patrimônio.

---

## 6. Cartão de crédito

Coleção própria (`cards`), separada de `accounts` — separação conceitual entre **ativo** (dinheiro que se tem) e **passivo** (dívida). O cartão não tem campo `saldo`; seu "valor" é a fatura aberta.

### Faturas

A fatura é subcoleção do cartão. A competência é **manual e editável** (sem dia de fechamento automático): o usuário indica em qual fatura cada compra entra e corrige caso erre.

- **Ciclo de vida:** `aberta → paga`.
- **Vencimento:** derivado de `diaVencimento` + competência.

### Valor da fatura

| Campo | Papel |
|---|---|
| `valorRegistrado` | Soma automática das compras/parcelas lançadas. **Somente leitura**, serve de conferência. |
| `valorFinal` | O número que vale (entra no orçamento, é o que se paga). Default = `valorRegistrado`, mas **editável livremente** para refletir a fatura real do banco (cobre compras pequenas não registradas). |

A UI mostra os dois lado a lado para evidenciar a divergência (mesmo espírito do saldo manual vs. calculado).

### Parcelamento

Uma compra parcelada gera N lançamentos nas competências seguintes, a partir de uma competência inicial **indicada manualmente**. Cada parcela é editável. As parcelas aparecem espalhadas por competência no relatório por categoria (coerente com o fluxo de caixa).

### Pagamento da fatura

Não é uma transferência com referência fechada. São duas ações que ocorrem juntas:

1. O `saldo` da conta pagadora **desce** o valor da fatura.
2. A fatura marca `status: "paga"`, registrando `pagaPorContaId` e `dataPagamento`.

> **Anti-dupla-contagem:** o pagamento é ajuste de saldo, **não** gera transação e **não** aparece no relatório por categoria. O gasto real já foi contabilizado nas compras do cartão. O pagamento é só movimentação para quitar a dívida.

---

## 7. Investimentos

Tipo de conta (`investimento`), saldo manual, **fora do orçamento de caixa do mês** — é patrimônio, não fluxo. Exibido em card/aba separada no dashboard, com total somado.

São **compartilhados por padrão** (ver seção 9).

---

## 8. Despesa fixa

Flag `fixa: bool` no lançamento de despesa, com **default herdado da categoria** (`fixaPorPadrao`), sobrescrevível por lançamento.

No dashboard: soma das despesas fixas do mês e o **percentual que consomem da receita prevista** (ex.: "fixas = R$ 3.200, 64% da receita do mês").

---

## 9. Compartilhamento

A decisão que muda o modelo de "tudo de todos" para **visibilidade por entidade**.

### Decisões

| Dimensão | Decisão |
|---|---|
| Granularidade | **Por entidade individual** (toggle em cada conta/cartão/investimento), com default sugerido pelo tipo |
| Escopo | **Tudo-ou-nada**: compartilhada com o workspace inteiro, ou pessoal (só o dono) |
| Permissão | **Leitura e escrita** nas compartilhadas (ambos lançam, editam, pagam fatura, ajustam saldo) |
| Propriedade | **Dono fixo** (`donoUid` gravado na criação, nunca muda) |

### Defaults por tipo

- Conta → **pessoal**
- Cartão → **compartilhado**
- Investimento → **compartilhado**

### Herança de visibilidade

A visibilidade de uma transação/fatura/parcela é **herdada da entidade-raiz** (conta/cartão) a que pertence. Só a entidade-raiz carrega o flag; os filhos obedecem. Evita marcar visibilidade em cada lançamento.

### Autoria

Rastro de autoria (`criadoPor`) em **todas as ações relevantes** de entidade compartilhada: lançamentos, pagamento de fatura, ajuste de saldo. Permite mostrar "feito por Fernando" vs. "feito pela parceira" numa conta conjunta.

---

## 10. Modelo de dados (Firestore) — Fase 1

```
workspaces/{wsId}
  name, ownerUid
  memberUids: [uid, ...]          // usado nas Security Rules (array-contains)
  members: { uid: {role, nome} }  // denormalizado p/ UI
  limiarDivergencia: 0.20         // configurável
  createdAt

workspaces/{wsId}/accounts/{accId}
  nome
  tipo: "conta" | "investimento"
  saldo (centavos, int)           // manual; fonte da verdade
  donoUid                         // fixo
  visibilidade: "pessoal" | "compartilhada"   // default conta=pessoal, invest=compartilhada
  instituicao?, tipoInvest?       // só investimento
  arquivada: bool

workspaces/{wsId}/cards/{cardId}
  nome
  limite? (centavos)
  diaVencimento
  bandeira?
  donoUid
  visibilidade: "pessoal" | "compartilhada"   // default compartilhada
  arquivado: bool

workspaces/{wsId}/cards/{cardId}/invoices/{invId}
  competencia: "2026-06"          // YYYY-MM
  vencimento (timestamp)          // derivado de diaVencimento + competencia
  status: "aberta" | "paga"
  valorRegistrado (centavos)      // soma automática — leitura
  valorFinal (centavos)           // o que vale; editável livre
  pagaPorContaId?                 // conta que quitou
  dataPagamento?
  criadoPor (uid)

workspaces/{wsId}/categories/{catId}
  nome
  tipo: "receita" | "despesa"
  cor
  fixaPorPadrao: bool
  arquivada: bool

workspaces/{wsId}/transactions/{txId}
  tipo: "receita" | "despesa"
  previsto: bool                  // entra no orçamento previsto?
  realizado: bool                 // de fato aconteceu?
  valor (centavos, int, positivo) // valor efetivo
  valorPrevisto? (centavos)       // opcional: quanto se esperava (desvio item a item)
  data (timestamp)
  accountId?                      // conta de origem (despesa/receita comum)
  cardId?                         // se for compra de cartão
  categoryId?
  fixa: bool                      // só despesa; default da categoria
  competencia?                    // só compra de cartão (define a fatura)
  invoiceId?                      // só compra de cartão
  compraId?, parcelaNum?, parcelaTotal?   // parcelamento
  descricao
  criadoPor (uid)                 // autoria
  createdAt
  // denormalizado p/ Security Rules (cópia da entidade-pai):
  _donoUid, _visibilidade

workspaces/{wsId}/monthlyReviews/{competencia}   // "2026-06"
  previstoTotal, realizadoTotal, divergencia (centavos)   // snapshot no fechamento
  observacao: string
  eventos: [
    { descricao, valor (centavos), data }   // anotação pura — não soma no realizado
  ]
  fechadoEm, fechadoPor (uid)
```

### Nota sobre Security Rules

A regra de acesso, em essência: **é membro do workspace E (entidade compartilhada OU é o dono)**.

Para evitar `get()` dentro da rule ao ler uma transação (que precisaria consultar a conta-pai), os campos `_donoUid` e `_visibilidade` são **denormalizados** na própria transação, copiados da entidade-raiz na escrita. Detalhe de implementação, não de modelo.

---

## 11. Escopo por fase

### Fase 1 (MVP de uso contínuo)

- Autenticação (e-mail/senha + Google)
- Workspace + convite de membros (Cloud Function)
- Contas e investimentos com saldo manual
- Cartões com faturas (competência manual, parcelamento manual, ciclo aberta/paga)
- Categorias de receita/despesa
- Lançamentos com flags previsto/realizado
- Pagamento de fatura (baixa de saldo + marca paga)
- Despesa fixa com default por categoria
- Relatório mensal por categoria
- Fechamento de mês (monthly review) com alerta de divergência
- Compartilhamento por entidade
- Dashboard: previsto × realizado, % de fixas sobre receita, total de investimentos

### Fase 2 (futuro)

- Fechamento automático de fatura (dia de fechamento + Cloud Function agendada)
- Lançamentos recorrentes
- Orçamentos/metas por categoria
- Importação de OFX
- Multi-moeda
- Compartilhamento granular por pessoa (3+ membros)
- Regra de saída de membro do workspace

---

## 12. Telas previstas (ponto de partida para protótipo)

> Use esta lista no Claude Design para prototipar tela a tela.

1. **Login / cadastro** — Firebase Auth, e-mail/senha + Google.
2. **Dashboard** — cards de: orçamento previsto × realizado (com divergência), despesas fixas e % sobre receita, total de investimentos (separado), faturas em aberto com vencimento próximo.
3. **Lançamento (receita/despesa)** — valor, data, categoria, conta ou cartão, flags previsto/realizado, `valorPrevisto` opcional, flag fixa (default da categoria), parcelamento se for cartão.
4. **Lista de transações** — filtros por mês, tipo, categoria, conta/cartão, previsto/realizado; autoria visível.
5. **Contas** — lista com saldo, toggle de visibilidade, botão de ajuste manual de saldo.
6. **Detalhe do cartão / fatura** — competência, `valorRegistrado` vs. `valorFinal` (editável), lista de compras/parcelas, status, botão pagar fatura.
7. **Investimentos** — lista de contas de investimento + total, à parte do orçamento.
8. **Fechamento de mês** — comparativo previsto × realizado, alerta de divergência > limiar, campo de observação, lista de eventos-anotação.
9. **Categorias** — CRUD, tipo, cor, flag fixaPorPadrao.
10. **Configurações / Workspace** — membros, convite, limiar de divergência.
