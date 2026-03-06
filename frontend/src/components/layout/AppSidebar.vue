<template>
  <aside class="sidebar">
    <div class="sidebar__brand">
      <div class="sidebar__logo">
        <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
          <rect width="32" height="32" rx="8" fill="var(--btn-primary-bg)" />
          <text x="16" y="22" font-family="Inter, system-ui" font-size="18" font-weight="700" fill="white" text-anchor="middle">$</text>
        </svg>
      </div>
      <span class="sidebar__title">SAFE</span>
    </div>

    <nav class="sidebar__nav">
      <span class="sidebar__label">Principal</span>
      <router-link
        v-for="item in mainNav"
        :key="item.to"
        :to="item.to"
        class="sidebar__item"
        :class="{ 'sidebar__item--active': $route.path === item.to }"
      >
        <span class="sidebar__icon" v-html="item.icon" />
        <span>{{ item.label }}</span>
      </router-link>

      <span class="sidebar__label">Gestão</span>
      <router-link
        v-for="item in managementNav"
        :key="item.to"
        :to="item.to"
        class="sidebar__item"
        :class="{ 'sidebar__item--active': $route.path === item.to }"
      >
        <span class="sidebar__icon" v-html="item.icon" />
        <span>{{ item.label }}</span>
      </router-link>
    </nav>

    <div class="sidebar__footer">
      <div class="sidebar__backup">
        <button class="sidebar__backup-btn" @click="exportBackup" title="Exportar banco de dados">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          <span>Exportar</span>
        </button>
        <button class="sidebar__backup-btn" @click="fileInput?.click()" title="Importar banco de dados">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          <span>Importar</span>
        </button>
        <input ref="fileInput" type="file" accept=".db" style="display:none" @change="importBackup" />
      </div>
      <ThemeToggle />
    </div>
  </aside>
</template>

<script setup>
import { ref } from 'vue'
import ThemeToggle from './ThemeToggle.vue'
import api from '@/services/api'

const fileInput = ref(null)

async function exportBackup() {
  try {
    const { data } = await api.downloadBackup()
    const url = URL.createObjectURL(data)
    const a = document.createElement('a')
    a.href = url
    a.download = `safe-financas-backup-${new Date().toISOString().slice(0, 10)}.db`
    a.click()
    URL.revokeObjectURL(url)
  } catch (err) {
    alert('Erro ao exportar backup')
    console.error(err)
  }
}

async function importBackup(event) {
  const file = event.target.files?.[0]
  if (!file) return
  
  if (!confirm('Importar este backup vai substituir TODOS os dados atuais. Deseja continuar?')) {
    fileInput.value.value = ''
    return
  }

  try {
    const buffer = await file.arrayBuffer()
    await api.restoreBackup(buffer)
    alert('Backup restaurado com sucesso! A página será recarregada.')
    window.location.reload()
  } catch (err) {
    alert('Erro ao restaurar backup. Verifique se o arquivo é válido.')
    console.error(err)
  }
  fileInput.value.value = ''
}

const iconDashboard = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>'
const iconTransactions = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>'
const iconProjection = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>'
const iconPatrimony = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="2" x2="12" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>'
const iconLoans = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect><line x1="12" y1="11" x2="12" y2="17"></line><line x1="9" y1="14" x2="15" y2="14"></line></svg>'

const iconAccounts = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>'
const iconCards = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>'
const iconCategories = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>'

const mainNav = [
  { to: '/', label: 'Dashboard', icon: iconDashboard },
  { to: '/transactions', label: 'Transações', icon: iconTransactions },
  { to: '/projection', label: 'Projeção', icon: iconProjection },
  { to: '/emprestimos', label: 'Empréstimos', icon: iconLoans },
  { to: '/patrimony', label: 'Reservas', icon: iconPatrimony }
]

const managementNav = [
  { to: '/accounts', label: 'Contas', icon: iconAccounts },
  { to: '/cartoes', label: 'Cartões', icon: iconCards },
  { to: '/categories', label: 'Categorias', icon: iconCategories }
]
</script>

<style scoped>
.sidebar {
  width: 240px;
  background: var(--sidebar-bg);
  border-right: 1px solid var(--sidebar-border);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  height: 100vh;
  position: sticky;
  top: 0;
}

.sidebar__brand {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-6) var(--space-5);
}

.sidebar__logo {
  display: flex;
}

.sidebar__title {
  font-size: var(--text-md);
  font-weight: var(--font-bold);
  color: var(--text-primary);
  letter-spacing: 0.05em;
}

.sidebar__nav {
  flex: 1;
  padding: 0 var(--space-3);
  overflow-y: auto;
}

.sidebar__label {
  display: block;
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--sidebar-text-label);
  padding: var(--space-4) var(--space-3) var(--space-2);
}

.sidebar__item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-lg);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--sidebar-text);
  text-decoration: none;
  transition: all var(--duration-normal) var(--easing-default);
  margin-bottom: 2px;
}

.sidebar__item:hover {
  background: var(--sidebar-item-hover);
  color: var(--text-primary);
}

.sidebar__item--active {
  background: var(--sidebar-item-active-bg);
  color: var(--sidebar-item-active-text);
}

.sidebar__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.25rem;
  height: 1.25rem;
  flex-shrink: 0;
}

.sidebar__footer {
  padding: var(--space-4) var(--space-5);
  border-top: 1px solid var(--sidebar-border);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.sidebar__backup {
  display: flex;
  gap: var(--space-2);
}

.sidebar__backup-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-1);
  padding: var(--space-2);
  border-radius: var(--radius-lg);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  color: var(--sidebar-text);
  background: transparent;
  border: 1px solid var(--border-subtle);
  cursor: pointer;
  transition: all var(--duration-normal) var(--easing-default);
}

.sidebar__backup-btn:hover {
  background: var(--sidebar-item-hover);
  color: var(--text-primary);
  border-color: var(--border-default);
}

@media (max-width: 768px) {
  .sidebar {
    width: 100%;
    height: auto;
    position: relative;
    flex-direction: row;
    align-items: center;
    border-right: none;
    border-bottom: 1px solid var(--sidebar-border);
    overflow-x: auto;
  }

  .sidebar__brand {
    padding: var(--space-3) var(--space-4);
  }

  .sidebar__nav {
    display: flex;
    padding: 0 var(--space-2);
    gap: var(--space-1);
    align-items: center;
  }

  .sidebar__label {
    display: none;
  }

  .sidebar__footer {
    border-top: none;
    padding: var(--space-3);
  }
}
</style>
