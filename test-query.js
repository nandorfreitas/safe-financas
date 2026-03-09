const { getDatabase } = require('./backend/database/db');
const db = getDatabase();
const accountId = 3;
const result = db.prepare(`
SELECT
    COALESCE(SUM(CASE WHEN type = 'receita' AND status = 'pago' THEN amount ELSE 0 END), 0) as receitas,
    COALESCE(SUM(CASE WHEN type = 'despesa' AND credit_card_id IS NULL AND status = 'pago' THEN amount ELSE 0 END), 0) as despesas,
    COALESCE(SUM(CASE WHEN type = 'transferencia' AND account_id = ? AND status = 'pago' THEN amount ELSE 0 END), 0) as transferencias_saida,
    COALESCE(SUM(CASE WHEN type = 'transferencia' AND CAST(subtype AS INTEGER) = ? AND status = 'pago' THEN amount ELSE 0 END), 0) as transferencias_entrada
FROM transactions
WHERE (account_id = ? OR CAST(subtype AS INTEGER) = ?)
`).get(accountId, accountId, accountId, accountId);
console.log(result);
