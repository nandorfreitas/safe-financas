const { GoogleGenerativeAI } = require('@google/generative-ai');
const transactionsService = require('./transactions.service');
const dashboardService = require('./dashboard.service');
const accountsRepository = require('../repositories/accounts.repository');
const categoriesRepository = require('../repositories/categories.repository');
const creditCardsRepository = require('../repositories/credit-cards.repository');

class GeminiService {
  constructor() {
    this.sessions = new Map();
    this.model = null;
    this.categorizationModel = null;

    // Rate limiting diário
    this._requestCount = 0;
    this._requestDate = new Date().toISOString().slice(0, 10);

    // Limpar sessões expiradas a cada 10 minutos
    setInterval(() => this._cleanExpiredSessions(), 10 * 60 * 1000);
  }

  _checkRateLimit() {
    const today = new Date().toISOString().slice(0, 10);
    if (this._requestDate !== today) {
      this._requestCount = 0;
      this._requestDate = today;
    }

    const limit = parseInt(process.env.GEMINI_DAILY_LIMIT) || 100;
    if (this._requestCount >= limit) {
      throw Object.assign(
        new Error(`Limite diário de ${limit} chamadas à IA atingido. Tente novamente amanhã.`),
        { status: 429 }
      );
    }

    this._requestCount++;
  }

  _getModel() {
    if (!this.model) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw Object.assign(
          new Error('GEMINI_API_KEY não configurada. Defina a variável de ambiente para usar o assistente.'),
          { status: 503 }
        );
      }
      const genAI = new GoogleGenerativeAI(apiKey);
      this.model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.1,
          maxOutputTokens: 1024
        }
      });
    }
    return this.model;
  }

  async processMessage(sessionId, message) {
    this._checkRateLimit();
    const model = this._getModel();
    const context = this._loadContext();
    const systemPrompt = this._buildSystemPrompt(context);

    // Obter ou criar sessão
    let session = this.sessions.get(sessionId);
    if (!session) {
      session = { history: [], lastActivity: Date.now() };
      this.sessions.set(sessionId, session);
    }
    session.lastActivity = Date.now();

    // Montar histórico para o Gemini
    const chat = model.startChat({
      history: [
        { role: 'user', parts: [{ text: systemPrompt }] },
        { role: 'model', parts: [{ text: JSON.stringify({ action: 'clarification', message: 'Olá! Sou o assistente SAFE. Como posso ajudar com suas finanças?' }) }] },
        ...session.history
      ]
    });

    // Enviar mensagem
    const result = await chat.sendMessage(message);
    const responseText = result.response.text();

    // Salvar no histórico
    session.history.push(
      { role: 'user', parts: [{ text: message }] },
      { role: 'model', parts: [{ text: responseText }] }
    );

    // Limitar histórico a 20 mensagens
    if (session.history.length > 40) {
      session.history = session.history.slice(-20);
    }

    // Processar resposta
    let parsed;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      return { type: 'message', message: responseText };
    }

    return this._handleResponse(parsed, context);
  }

  _handleResponse(parsed, context) {
    switch (parsed.action) {
      case 'create_transaction':
        return this._handleCreateTransaction(parsed, context);
      case 'query':
        return this._handleQuery(parsed);
      case 'clarification':
        return { type: 'message', message: parsed.message };
      default:
        return { type: 'message', message: parsed.message || 'Não entendi. Pode reformular?' };
    }
  }

  _handleCreateTransaction(parsed, context) {
    const data = parsed.data;

    // Preencher defaults
    const today = new Date().toISOString().slice(0, 10);
    const currentCompetence = today.slice(0, 7);

    if (!data.description || !data.amount || !data.type) {
      return { type: 'message', message: 'Não consegui identificar todos os dados da transação. Informe a descrição, valor e tipo (receita/despesa).' };
    }

    // Default account: primeira conta corrente ativa
    if (!data.account_id && !data.credit_card_id) {
      const defaultAccount = context.accounts.find(a => a.type === 'corrente' && a.active);
      if (defaultAccount) data.account_id = defaultAccount.id;
    }

    const transactionData = {
      description: data.description,
      amount: Math.abs(data.amount),
      type: data.type,
      category_id: data.category_id || null,
      account_id: data.credit_card_id ? null : (data.account_id || null),
      credit_card_id: data.credit_card_id || null,
      launch_date: data.launch_date || today,
      competence: data.competence || currentCompetence,
      due_date: data.due_date || data.launch_date || today,
      status: data.status || (data.credit_card_id ? 'cartao' : 'pago'),
      fixed: data.fixed || 0,
      installment_total: data.installment_total || 1,
      installment_number: 1,
      subtype: data.subtype || null
    };

    try {
      const created = transactionsService.create(transactionData);
      const createdArray = Array.isArray(created) ? created : [created];

      return {
        type: 'transaction_created',
        message: parsed.confirmation_message || `Transação criada: ${transactionData.description} - R$ ${transactionData.amount.toFixed(2)}`,
        data: createdArray[0],
        count: createdArray.length
      };
    } catch (err) {
      return { type: 'error', message: `Erro ao criar transação: ${err.message}` };
    }
  }

  _handleQuery(parsed) {
    try {
      const competence = parsed.params?.competence || new Date().toISOString().slice(0, 7);

      if (parsed.query_type === 'expenses_by_category') {
        const expenses = dashboardService.getExpensesByCategory(competence);
        const lines = expenses.map(e =>
          `• ${e.category_name}: R$ ${e.total.toFixed(2)}`
        ).join('\n');
        return {
          type: 'query_result',
          message: parsed.confirmation_message || `Despesas por categoria em ${competence}:\n${lines}`,
          data: expenses
        };
      }

      // Default: dashboard summary
      const dashboard = dashboardService.getDashboard(competence);
      const summary = `Resumo de ${competence}:\n` +
        `• Receitas: R$ ${dashboard.total_receitas.toFixed(2)}\n` +
        `• Despesas: R$ ${dashboard.total_despesas.toFixed(2)}\n` +
        `• Gastos no cartão: R$ ${dashboard.total_gastos_cartao.toFixed(2)}\n` +
        `• Resultado: R$ ${dashboard.resultado.toFixed(2)}\n` +
        `• Saldo em contas: R$ ${dashboard.saldo_contas.toFixed(2)}`;

      return {
        type: 'query_result',
        message: parsed.confirmation_message || summary,
        data: dashboard
      };
    } catch (err) {
      return { type: 'error', message: `Erro ao consultar dados: ${err.message}` };
    }
  }

  _loadContext() {
    const accounts = accountsRepository.findAll();
    const categories = categoriesRepository.findAll();
    const creditCards = creditCardsRepository.findAll();
    return { accounts, categories, creditCards };
  }

  _buildSystemPrompt(context) {
    const today = new Date().toISOString().slice(0, 10);
    const currentCompetence = today.slice(0, 7);

    const accountsList = context.accounts
      .filter(a => a.active)
      .map(a => `  - id: ${a.id}, nome: "${a.name}", tipo: ${a.type}`)
      .join('\n');

    const categoriesReceita = context.categories
      .filter(c => c.type === 'receita')
      .map(c => `  - id: ${c.id}, nome: "${c.name}"${c.parent_id ? ` (subcategoria, parent_id: ${c.parent_id})` : ''}`)
      .join('\n');

    const categoriesDespesa = context.categories
      .filter(c => c.type === 'despesa')
      .map(c => `  - id: ${c.id}, nome: "${c.name}"${c.parent_id ? ` (subcategoria, parent_id: ${c.parent_id})` : ''}`)
      .join('\n');

    const cardsList = context.creditCards
      .filter(c => c.active)
      .map(c => `  - id: ${c.id}, nome: "${c.name}"`)
      .join('\n');

    return `Você é o SAFE, um assistente financeiro inteligente de um app de finanças pessoais. Responda sempre em português brasileiro.

Suas capacidades:
1. CRIAR transações a partir de descrições em linguagem natural
2. CONSULTAR dados financeiros (gastos, saldos, resumos)
3. PEDIR esclarecimento quando a informação for ambígua

IMPORTANTE: Sempre retorne JSON válido com o campo "action".

## Para CRIAR TRANSAÇÃO, retorne:
{
  "action": "create_transaction",
  "data": {
    "description": "string (descrição clara e concisa)",
    "amount": number (valor positivo),
    "type": "receita" | "despesa" | "transferencia",
    "category_id": number | null,
    "account_id": number | null,
    "credit_card_id": number | null,
    "launch_date": "YYYY-MM-DD",
    "competence": "YYYY-MM",
    "due_date": "YYYY-MM-DD" | null,
    "status": "previsto" | "pago" | "cartao",
    "fixed": 0 | 1,
    "installment_total": number (default 1),
    "subtype": null
  },
  "confirmation_message": "string (mensagem amigável confirmando o que foi criado)"
}

## Para CONSULTAR DADOS, retorne:
{
  "action": "query",
  "query_type": "dashboard" | "expenses_by_category",
  "params": { "competence": "YYYY-MM" },
  "confirmation_message": "string"
}

## Para PEDIR ESCLARECIMENTO, retorne:
{
  "action": "clarification",
  "message": "string (pergunta ao usuário)"
}

## CONTAS DISPONÍVEIS:
${accountsList || '  (nenhuma conta cadastrada)'}

## CATEGORIAS DE RECEITA:
${categoriesReceita || '  (nenhuma categoria de receita)'}

## CATEGORIAS DE DESPESA:
${categoriesDespesa || '  (nenhuma categoria de despesa)'}

## CARTÕES DE CRÉDITO:
${cardsList || '  (nenhum cartão cadastrado)'}

## DATA ATUAL: ${today}
## COMPETÊNCIA ATUAL: ${currentCompetence}

## REGRAS DE INFERÊNCIA:
- "recebi", "recebimento", "salário", "pix recebido" → type: "receita", status: "pago"
- "paguei", "gastei", "comprei", "pix enviado" → type: "despesa", status: "pago"
- "vou pagar", "preciso pagar", "conta de" → type: "despesa", status: "previsto"
- "no cartão", "no crédito" + nome do cartão → status: "cartao", preencher credit_card_id
- "em Nx", "parcelado em N vezes" → installment_total: N
- "todo mês", "mensal", "fixo/fixa" → fixed: 1
- "pix" → status: "pago" (pix é pagamento instantâneo)
- Se nenhuma conta for mencionada, NÃO defina account_id (o sistema usará a conta padrão)
- Se nenhuma categoria corresponder claramente, defina category_id como null
- Tente fazer match fuzzy com nomes de categorias (ex: "mercado" → categoria "Alimentação" ou "Supermercado")
- Use a data atual para launch_date e competence, a menos que o usuário especifique outra
- Valores: "mil" = 1000, "cem" = 100, "cento e cinquenta" = 150, etc.
- Quando o usuário perguntar sobre gastos, saldo, resumo → use action "query"
- Seja conciso e amigável nas confirmation_message`;
  }

  _getCategorizationModel() {
    if (!this.categorizationModel) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error('GEMINI_API_KEY não configurada');
      const genAI = new GoogleGenerativeAI(apiKey);
      this.categorizationModel = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.1,
          maxOutputTokens: 4096
        }
      });
    }
    return this.categorizationModel;
  }

  async categorizeTransactions(transactions) {
    let model;
    try {
      model = this._getCategorizationModel();
    } catch {
      return transactions;
    }

    const categories = categoriesRepository.findAll();
    if (categories.length === 0) return transactions;

    const categoriesDespesa = categories
      .filter(c => c.type === 'despesa')
      .map(c => `  - id: ${c.id}, nome: "${c.name}"${c.parent_id ? ' (sub)' : ''}`)
      .join('\n');

    const categoriesReceita = categories
      .filter(c => c.type === 'receita')
      .map(c => `  - id: ${c.id}, nome: "${c.name}"${c.parent_id ? ' (sub)' : ''}`)
      .join('\n');

    // Enviar em lotes de 50 para não estourar token limit
    const BATCH_SIZE = 50;
    const result = [...transactions];

    for (let i = 0; i < result.length; i += BATCH_SIZE) {
      const batch = result.slice(i, i + BATCH_SIZE);
      const items = batch.map((t, idx) => `${idx}: "${t.description}" (${t.type}, R$${t.amount.toFixed(2)})`).join('\n');

      const prompt = `Categorize as seguintes transações financeiras. Para cada uma, retorne o category_id mais adequado da lista abaixo, ou null se nenhuma categoria se aplicar.

CATEGORIAS DE DESPESA:
${categoriesDespesa || '(nenhuma)'}

CATEGORIAS DE RECEITA:
${categoriesReceita || '(nenhuma)'}

TRANSAÇÕES:
${items}

Retorne um JSON com um array "results" onde cada item tem "index" (número da transação) e "category_id" (number ou null).
Exemplo: {"results": [{"index": 0, "category_id": 5}, {"index": 1, "category_id": null}]}

REGRAS:
- Faça match fuzzy pela descrição (ex: "MERCADO EXTRA" → Alimentação/Supermercado, "UBER" → Transporte, "NETFLIX" → Lazer/Streaming)
- Use apenas IDs das categorias listadas acima
- O tipo da categoria DEVE corresponder ao tipo da transação (despesa → categorias de despesa, receita → categorias de receita)
- Na dúvida, retorne null`;

      try {
        this._checkRateLimit();
        const response = await model.generateContent(prompt);
        const responseText = response.response.text();
        const parsed = JSON.parse(responseText);

        if (parsed.results && Array.isArray(parsed.results)) {
          const validIds = new Set(categories.map(c => c.id));
          for (const item of parsed.results) {
            if (item.category_id != null && validIds.has(item.category_id)) {
              const globalIdx = i + item.index;
              if (globalIdx < result.length) {
                const cat = categories.find(c => c.id === item.category_id);
                if (cat && cat.type === result[globalIdx].type) {
                  result[globalIdx] = { ...result[globalIdx], category_id: item.category_id };
                }
              }
            }
          }
        }
      } catch (err) {
        console.error('[Categorize] Erro ao categorizar lote:', err.message);
      }
    }

    return result;
  }

  clearSession(sessionId) {
    this.sessions.delete(sessionId);
  }

  _cleanExpiredSessions() {
    const thirtyMinutes = 30 * 60 * 1000;
    const now = Date.now();
    for (const [id, session] of this.sessions) {
      if (now - session.lastActivity > thirtyMinutes) {
        this.sessions.delete(id);
      }
    }
  }
}

module.exports = new GeminiService();
