<template>
  <div class="view">
    <div class="view__header">
      <div>
        <h1 class="view__title">Categorias</h1>
        <p class="view__subtitle">Gerenciar categorias de receita e despesa</p>
      </div>
      <BaseButton @click="showModal = true">Nova Categoria</BaseButton>
    </div>

    <div class="categories-grid">
      <BaseCard v-for="cat in categoriesStore.categories" :key="cat.id">
        <div class="category-item">
          <div class="category-info">
            <span class="category-name">{{ cat.name }}</span>
            <div class="category-meta">
              <BaseBadge :variant="cat.type === 'receita' ? 'success' : 'danger'">
                {{ cat.type === 'receita' ? 'Receita' : 'Despesa' }}
              </BaseBadge>
              <BaseBadge v-if="cat.essential" variant="info">Essencial</BaseBadge>
              <span v-if="cat.monthly_budget" class="category-budget">
                Orçamento: {{ formatCurrency(cat.monthly_budget) }}
              </span>
            </div>
          </div>
          <div class="category-actions">
            <BaseButton variant="ghost" size="sm" @click="handleEdit(cat)">Editar</BaseButton>
            <BaseButton variant="ghost" size="sm" @click="handleDelete(cat)">Excluir</BaseButton>
          </div>
        </div>
      </BaseCard>
    </div>

    <p v-if="!categoriesStore.categories.length && !categoriesStore.loading" class="empty-state">
      Nenhuma categoria cadastrada. Crie sua primeira categoria.
    </p>

    <BaseModal v-model="showModal" :title="editing ? 'Editar Categoria' : 'Nova Categoria'">
      <form @submit.prevent="handleSubmit" class="form">
        <BaseInput v-model="form.name" label="Nome" placeholder="Ex: Alimentação" />
        <BaseSelect v-model="form.type" label="Tipo" :options="typeOptions" />
        <BaseInput v-model="form.monthly_budget" label="Orçamento Mensal (opcional)" type="number" step="0.01" placeholder="0,00" />
        <BaseCheckbox v-model="form.essential" label="Essencial" />
        <div class="form__actions">
          <BaseButton variant="secondary" @click="closeModal">Cancelar</BaseButton>
          <BaseButton type="submit">{{ editing ? 'Salvar' : 'Criar' }}</BaseButton>
        </div>
      </form>
    </BaseModal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseModal from '@/components/base/BaseModal.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseSelect from '@/components/base/BaseSelect.vue'
import BaseCheckbox from '@/components/base/BaseCheckbox.vue'
import BaseBadge from '@/components/base/BaseBadge.vue'
import { useCategoriesStore } from '@/stores/categories'

const categoriesStore = useCategoriesStore()

const showModal = ref(false)
const editing = ref(false)
const editingId = ref(null)

const form = reactive({ name: '', type: 'despesa', monthly_budget: '', essential: false })

const typeOptions = [
  { value: 'receita', label: 'Receita' },
  { value: 'despesa', label: 'Despesa' }
]

function handleEdit(cat) {
  editing.value = true
  editingId.value = cat.id
  Object.assign(form, { name: cat.name, type: cat.type, monthly_budget: cat.monthly_budget || '', essential: !!cat.essential })
  showModal.value = true
}

function handleDelete(cat) {
  if (confirm('Excluir esta categoria?')) {
    categoriesStore.deleteCategory(cat.id)
  }
}

async function handleSubmit() {
  const payload = {
    ...form,
    monthly_budget: form.monthly_budget ? parseFloat(form.monthly_budget) : null,
    essential: form.essential ? 1 : 0
  }
  if (editing.value) {
    await categoriesStore.updateCategory(editingId.value, payload)
  } else {
    await categoriesStore.createCategory(payload)
  }
  closeModal()
}

function closeModal() {
  showModal.value = false
  editing.value = false
  editingId.value = null
  Object.assign(form, { name: '', type: 'despesa', monthly_budget: '', essential: false })
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

onMounted(() => categoriesStore.fetchCategories())
</script>

<style scoped>
.view { display: flex; flex-direction: column; gap: var(--space-6); }
.view__header { display: flex; justify-content: space-between; align-items: flex-start; }
.view__title { font-size: var(--text-2xl); font-weight: var(--font-bold); color: var(--text-primary); }
.view__subtitle { font-size: var(--text-sm); color: var(--text-secondary); margin-top: var(--space-1); }
.categories-grid { display: flex; flex-direction: column; gap: var(--space-3); }
.category-item { display: flex; justify-content: space-between; align-items: center; }
.category-info { display: flex; flex-direction: column; gap: var(--space-2); }
.category-name { font-size: var(--text-sm); font-weight: var(--font-semibold); color: var(--text-primary); }
.category-meta { display: flex; align-items: center; gap: var(--space-2); flex-wrap: wrap; }
.category-budget { font-size: var(--text-xs); color: var(--text-secondary); }
.category-actions { display: flex; gap: var(--space-1); }
.form { display: flex; flex-direction: column; gap: var(--space-4); }
.form__actions { display: flex; justify-content: flex-end; gap: var(--space-3); margin-top: var(--space-4); padding-top: var(--space-4); border-top: 1px solid var(--border-subtle); }
.empty-state { text-align: center; color: var(--text-tertiary); font-size: var(--text-sm); padding: var(--space-10) 0; }
</style>
