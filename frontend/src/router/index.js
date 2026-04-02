import { createRouter, createWebHistory } from 'vue-router'

const routes = [
    {
        path: '/',
        name: 'dashboard',
        component: () => import('@/views/DashboardView.vue'),
        meta: { title: 'Dashboard' }
    },
    {
        path: '/transactions',
        name: 'transactions',
        component: () => import('@/views/TransactionsView.vue'),
        meta: { title: 'Transações' }
    },
    {
        path: '/accounts',
        name: 'accounts',
        component: () => import('@/views/AccountsView.vue'),
        meta: { title: 'Contas' }
    },
    {
        path: '/cartoes',
        name: 'credit-cards',
        component: () => import('../views/CreditCardsView.vue')
    },
    {
        path: '/emprestimos',
        name: 'loans',
        component: () => import('../views/LoansView.vue')
    },
    {
        path: '/categories',
        name: 'categories',
        component: () => import('@/views/CategoriesView.vue'),
        meta: { title: 'Categorias' }
    },
    {
        path: '/projection',
        name: 'projection',
        component: () => import('@/views/ProjectionView.vue'),
        meta: { title: 'Projeção' }
    },
    {
        path: '/patrimony',
        name: 'patrimony',
        component: () => import('@/views/PatrimonyView.vue'),
        meta: { title: 'Patrimônio' }
    },
    {
        path: '/import',
        name: 'import',
        component: () => import('@/views/ImportView.vue'),
        meta: { title: 'Importar' }
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

router.beforeEach((to) => {
    document.title = `${to.meta.title || 'SAFE'} — SAFE Finanças`
})

export default router
