import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/services/api'

export const useImportStore = defineStore('import', () => {
  const step = ref(1)
  const loading = ref(false)
  const error = ref(null)

  // Step 1 state
  const context = ref('account') // 'account' | 'credit_card'
  const targetId = ref(null)
  const format = ref('ofx')
  const competence = ref('')
  const fileBuffer = ref(null)

  // Step 2 state (CSV mapping)
  const csvPreview = ref(null) // { headers, sampleRows, totalLines }
  const columnMapping = ref({ col_date: 0, col_description: 1, col_amount: 2, col_type: null })

  // Step 3 state
  const parsedTransactions = ref([])
  const selectedIds = ref(new Set())
  const summary = ref(null)
  const importContext = ref(null)

  const selectedTransactions = computed(() =>
    parsedTransactions.value.filter(t => selectedIds.value.has(t.temp_id))
  )

  const selectedSummary = computed(() => {
    const selected = selectedTransactions.value
    return {
      count: selected.length,
      receitas: selected.filter(t => t.type === 'receita').reduce((s, t) => s + t.amount, 0),
      despesas: selected.filter(t => t.type === 'despesa').reduce((s, t) => s + t.amount, 0)
    }
  })

  function reset() {
    step.value = 1
    loading.value = false
    error.value = null
    context.value = 'account'
    targetId.value = null
    format.value = 'ofx'
    competence.value = ''
    fileBuffer.value = null
    csvPreview.value = null
    columnMapping.value = { col_date: 0, col_description: 1, col_amount: 2, col_type: null }
    parsedTransactions.value = []
    selectedIds.value = new Set()
    summary.value = null
    importContext.value = null
  }

  async function parseFile() {
    loading.value = true
    error.value = null

    try {
      const params = {
        format: format.value,
        context: context.value,
        target_id: targetId.value
      }

      if (context.value === 'credit_card' && competence.value) {
        params.competence = competence.value
      }

      // Para CSV com mapeamento de colunas
      if (format.value === 'csv' && step.value === 2) {
        params.col_date = columnMapping.value.col_date
        params.col_description = columnMapping.value.col_description
        params.col_amount = columnMapping.value.col_amount
        if (columnMapping.value.col_type !== null) {
          params.col_type = columnMapping.value.col_type
        }
      }

      const { data } = await api.parseImportFile(fileBuffer.value, params)

      if (data.preview) {
        // CSV preview mode — precisa de mapeamento
        csvPreview.value = data
        step.value = 2
      } else {
        parsedTransactions.value = data.transactions
        summary.value = data.summary
        importContext.value = data.context

        // Selecionar todas que não são duplicatas
        selectedIds.value = new Set(
          data.transactions.filter(t => !t.is_duplicate).map(t => t.temp_id)
        )

        step.value = 3
      }
    } catch (err) {
      error.value = err.response?.data?.error || 'Erro ao processar arquivo'
    } finally {
      loading.value = false
    }
  }

  async function confirmImport() {
    loading.value = true
    error.value = null

    try {
      const transactions = selectedTransactions.value.map(t => ({
        description: t.description,
        amount: t.amount,
        type: t.type,
        category_id: t.category_id || null,
        date: t.date
      }))

      const { data } = await api.confirmImport({
        context: context.value,
        target_id: parseInt(targetId.value),
        competence: competence.value || null,
        transactions
      })

      return data
    } catch (err) {
      error.value = err.response?.data?.error || 'Erro ao importar transações'
      throw err
    } finally {
      loading.value = false
    }
  }

  function toggleSelection(tempId) {
    const newSet = new Set(selectedIds.value)
    if (newSet.has(tempId)) {
      newSet.delete(tempId)
    } else {
      newSet.add(tempId)
    }
    selectedIds.value = newSet
  }

  function selectAll() {
    selectedIds.value = new Set(parsedTransactions.value.map(t => t.temp_id))
  }

  function deselectAll() {
    selectedIds.value = new Set()
  }

  function updateTransaction(tempId, updates) {
    const idx = parsedTransactions.value.findIndex(t => t.temp_id === tempId)
    if (idx >= 0) {
      parsedTransactions.value[idx] = { ...parsedTransactions.value[idx], ...updates }
    }
  }

  function setCategoryBulk(categoryId) {
    parsedTransactions.value = parsedTransactions.value.map(t =>
      selectedIds.value.has(t.temp_id) ? { ...t, category_id: categoryId } : t
    )
  }

  return {
    step, loading, error,
    context, targetId, format, competence, fileBuffer,
    csvPreview, columnMapping,
    parsedTransactions, selectedIds, summary, importContext,
    selectedTransactions, selectedSummary,
    reset, parseFile, confirmImport,
    toggleSelection, selectAll, deselectAll,
    updateTransaction, setCategoryBulk
  }
})
