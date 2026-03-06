<template>
  <div class="view">
    <div class="view__header">
      <div>
        <h1 class="view__title">Reservas e Investimentos</h1>
        <p class="view__subtitle">Acompanhamento do capital acumulado</p>
      </div>
    </div>

    <PatrimonyCard :accounts="accountsStore.balances" />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import PatrimonyCard from '@/components/financial/PatrimonyCard.vue'
import { useAccountsStore } from '@/stores/accounts'

const accountsStore = useAccountsStore()

onMounted(() => {
  accountsStore.fetchBalances()
})
</script>

<style scoped>
.view { display: flex; flex-direction: column; gap: var(--space-6); }
.view__header { display: flex; justify-content: space-between; align-items: flex-start; }
.view__title { font-size: var(--text-2xl); font-weight: var(--font-bold); color: var(--text-primary); }
.view__subtitle { font-size: var(--text-sm); color: var(--text-secondary); margin-top: var(--space-1); }
</style>
