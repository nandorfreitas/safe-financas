const { parseOFX } = require('./parsers/ofx.parser');
const { parseCSV, previewCSV } = require('./parsers/csv.parser');
const transactionsRepository = require('../repositories/transactions.repository');
const geminiService = require('./gemini.service');

class ImportService {
  async parse(buffer, { format, context, target_id, competence, col_date, col_description, col_amount, col_type }) {
    let transactions;

    if (format === 'csv' && col_date === undefined) {
      // Modo preview: retorna headers e sample rows para mapeamento
      return { preview: true, ...previewCSV(buffer) };
    }

    if (format === 'ofx') {
      transactions = parseOFX(buffer);
    } else if (format === 'csv') {
      transactions = parseCSV(buffer, {
        col_date: parseInt(col_date),
        col_description: parseInt(col_description),
        col_amount: parseInt(col_amount),
        col_type: col_type !== undefined ? parseInt(col_type) : null
      });
    } else {
      throw Object.assign(new Error('Formato não suportado. Use "ofx" ou "csv"'), { status: 400 });
    }

    // Para faturas de cartão: forçar competência e tipo
    if (context === 'credit_card') {
      transactions = transactions.map(t => ({
        ...t,
        type: 'despesa',
        competence: competence || t.competence
      }));
    }

    // Detectar duplicatas
    const targetType = context === 'credit_card' ? 'credit_card' : 'account';
    transactions = this._markDuplicates(transactions, parseInt(target_id), targetType);

    // Categorização automática via Gemini
    transactions = await geminiService.categorizeTransactions(transactions);

    // Gerar resumo
    const summary = {
      total_count: transactions.length,
      total_receitas: transactions.filter(t => t.type === 'receita').reduce((s, t) => s + t.amount, 0),
      total_despesas: transactions.filter(t => t.type === 'despesa').reduce((s, t) => s + t.amount, 0),
      duplicates_found: transactions.filter(t => t.is_duplicate).length
    };

    return {
      preview: false,
      transactions: transactions.map((t, i) => ({ ...t, temp_id: `t_${i}` })),
      summary,
      context: {
        type: context,
        target_id: parseInt(target_id),
        default_status: context === 'credit_card' ? 'cartao' : 'pago'
      }
    };
  }

  confirm({ context, target_id, competence, transactions }) {
    const isCard = context === 'credit_card';
    const status = isCard ? 'cartao' : 'pago';

    const mapped = transactions.map(t => ({
      description: t.description,
      amount: t.amount,
      type: t.type,
      category_id: t.category_id || null,
      account_id: isCard ? null : target_id,
      credit_card_id: isCard ? target_id : null,
      launch_date: t.date,
      competence: isCard && competence ? competence : (t.date ? t.date.substring(0, 7) : t.competence),
      due_date: t.date,
      status,
      fixed: 0,
      installment_total: 1,
      installment_number: 1,
      subtype: null
    }));

    const ids = transactionsRepository.createMany(mapped);
    return { created: ids.length };
  }

  _markDuplicates(transactions, targetId, targetType) {
    const uniqueDates = [...new Set(transactions.map(t => t.date))];
    if (uniqueDates.length === 0) return transactions;

    const existing = transactionsRepository.findByDateAndAmount(uniqueDates, targetId, targetType);

    return transactions.map(t => {
      const isDuplicate = existing.some(e =>
        e.launch_date === t.date &&
        Math.abs(e.amount - t.amount) < 0.01 &&
        this._normalizeDescription(e.description) === this._normalizeDescription(t.description)
      );

      return { ...t, is_duplicate: isDuplicate };
    });
  }

  _normalizeDescription(desc) {
    return (desc || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
}

module.exports = new ImportService();
