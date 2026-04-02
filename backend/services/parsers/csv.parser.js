/**
 * Parser CSV flexível para extratos e faturas
 * Suporta formato brasileiro (DD/MM/YYYY, vírgula decimal, separador ponto-e-vírgula)
 */

function previewCSV(buffer) {
  const content = buffer.toString('utf-8')
  const separator = detectSeparator(content)
  const lines = splitLines(content)

  if (lines.length < 2) {
    throw Object.assign(new Error('Arquivo CSV vazio ou com apenas cabeçalho'), { status: 400 })
  }

  const headers = parseLine(lines[0], separator)
  const sampleRows = lines.slice(1, 6).map(line => parseLine(line, separator))

  return { headers, sampleRows, separator, totalLines: lines.length - 1 }
}

function parseCSV(buffer, columnMapping) {
  const { col_date, col_description, col_amount, col_type } = columnMapping
  const content = buffer.toString('utf-8')
  const separator = detectSeparator(content)
  const lines = splitLines(content)

  if (lines.length < 2) {
    throw Object.assign(new Error('Arquivo CSV vazio ou com apenas cabeçalho'), { status: 400 })
  }

  const transactions = []

  for (let i = 1; i < lines.length; i++) {
    const fields = parseLine(lines[i], separator)
    if (fields.length === 0) continue

    const dateStr = fields[col_date]?.trim()
    const description = fields[col_description]?.trim()
    const amountStr = fields[col_amount]?.trim()

    if (!dateStr || !description || !amountStr) continue

    const date = parseDate(dateStr)
    if (!date) continue

    const amount = parseAmount(amountStr)
    if (isNaN(amount) || amount === 0) continue

    let type = 'despesa'
    if (col_type !== undefined && col_type !== null && col_type >= 0 && fields[col_type]) {
      type = inferTypeFromColumn(fields[col_type].trim())
    } else {
      type = amount < 0 ? 'despesa' : 'receita'
    }

    transactions.push({
      description,
      amount: Math.abs(amount),
      type,
      date,
      competence: date.substring(0, 7),
      fitid: null,
      original_type: null
    })
  }

  if (transactions.length === 0) {
    throw Object.assign(new Error('Nenhuma transação válida encontrada no CSV'), { status: 400 })
  }

  return transactions
}

function detectSeparator(content) {
  const firstLine = content.split(/\r?\n/)[0] || ''
  const semicolons = (firstLine.match(/;/g) || []).length
  const commas = (firstLine.match(/,/g) || []).length
  return semicolons >= commas ? ';' : ','
}

function splitLines(content) {
  return content
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0)
}

function parseLine(line, separator) {
  const fields = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === separator && !inQuotes) {
      fields.push(current)
      current = ''
    } else {
      current += char
    }
  }
  fields.push(current)

  return fields
}

function parseDate(dateStr) {
  // DD/MM/YYYY
  let match = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (match) {
    const [, day, month, year] = match
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  }

  // YYYY-MM-DD
  match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (match) return dateStr

  // DD-MM-YYYY
  match = dateStr.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/)
  if (match) {
    const [, day, month, year] = match
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  }

  return null
}

function parseAmount(amountStr) {
  let cleaned = amountStr.replace(/\s/g, '')

  // Formato brasileiro: 1.234,56 → detectar se tem vírgula como decimal
  if (cleaned.includes(',') && cleaned.includes('.')) {
    // 1.234,56 → remover pontos de milhar, trocar vírgula por ponto
    cleaned = cleaned.replace(/\./g, '').replace(',', '.')
  } else if (cleaned.includes(',')) {
    // 1234,56 → trocar vírgula por ponto
    cleaned = cleaned.replace(',', '.')
  }
  // Se só tem ponto: 1234.56 (formato inglês) — já está ok

  return parseFloat(cleaned)
}

function inferTypeFromColumn(value) {
  const lower = value.toLowerCase()
  if (lower === 'credito' || lower === 'crédito' || lower === 'credit' || lower === 'c' || lower === 'receita') {
    return 'receita'
  }
  return 'despesa'
}

module.exports = { parseCSV, previewCSV }
