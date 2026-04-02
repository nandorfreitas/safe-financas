/**
 * Parser OFX (Open Financial Exchange)
 * Extrai transações de arquivos OFX/QFX de bancos brasileiros
 */

function parseOFX(buffer) {
  let content = detectAndDecodeEncoding(buffer)

  // Remove headers OFX (linhas antes de <OFX>)
  const ofxStart = content.indexOf('<OFX>')
  if (ofxStart === -1) {
    throw Object.assign(new Error('Arquivo OFX inválido: tag <OFX> não encontrada'), { status: 400 })
  }

  content = content.substring(ofxStart)

  const transactions = extractTransactions(content)

  if (transactions.length === 0) {
    throw Object.assign(new Error('Nenhuma transação encontrada no arquivo OFX'), { status: 400 })
  }

  return transactions
}

function detectAndDecodeEncoding(buffer) {
  // OFX headers declaram encoding antes da tag <OFX>
  // Ex: CHARSET:1252 ou ENCODING:UTF-8
  const headerBytes = buffer.slice(0, Math.min(buffer.length, 1024))
  const headerStr = headerBytes.toString('ascii')

  if (headerStr.includes('UTF-8') || headerStr.includes('utf-8')) {
    return buffer.toString('utf-8')
  }

  // Default para latin1 (ISO-8859-1 / Windows-1252) — padrão de bancos brasileiros
  return buffer.toString('latin1')
}

function extractTransactions(content) {
  const transactions = []
  const regex = /<STMTTRN>([\s\S]*?)(<\/STMTTRN>|(?=<STMTTRN>|<\/BANKTRANLIST>))/gi
  let match

  while ((match = regex.exec(content)) !== null) {
    const block = match[1]
    const transaction = parseTransactionBlock(block)
    if (transaction) {
      transactions.push(transaction)
    }
  }

  return transactions
}

function parseTransactionBlock(block) {
  const trnType = extractTag(block, 'TRNTYPE')
  const datePosted = extractTag(block, 'DTPOSTED')
  const amount = extractTag(block, 'TRNAMT')
  const fitId = extractTag(block, 'FITID')
  const memo = extractTag(block, 'MEMO') || extractTag(block, 'NAME') || ''

  if (!datePosted || !amount) return null

  const parsedAmount = parseFloat(amount.replace(',', '.'))
  if (isNaN(parsedAmount)) return null

  const date = parseOFXDate(datePosted)
  if (!date) return null

  return {
    description: memo.trim(),
    amount: Math.abs(parsedAmount),
    type: parsedAmount >= 0 ? 'receita' : 'despesa',
    date,
    competence: date.substring(0, 7), // YYYY-MM
    fitid: fitId || null,
    original_type: trnType || null
  }
}

function extractTag(block, tagName) {
  // OFX SGML: <TAGNAME>value (sem tag de fechamento na maioria dos casos)
  const regex = new RegExp(`<${tagName}>([^<\\r\\n]+)`, 'i')
  const match = block.match(regex)
  return match ? match[1].trim() : null
}

function parseOFXDate(dateStr) {
  // Formato: YYYYMMDDHHMMSS[offset:TZ] ou YYYYMMDD
  const match = dateStr.match(/^(\d{4})(\d{2})(\d{2})/)
  if (!match) return null

  const [, year, month, day] = match
  return `${year}-${month}-${day}`
}

module.exports = { parseOFX }
