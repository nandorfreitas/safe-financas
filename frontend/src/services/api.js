import axios from 'axios'

const api = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json'
    }
})

export default {
    // Accounts
    getAccounts: () => api.get('/accounts'),
    getAccountBalances: () => api.get('/accounts/balances'),
    getAccount: (id) => api.get(`/accounts/${id}`),
    createAccount: (data) => api.post('/accounts', data),
    updateAccount: (id, data) => api.put(`/accounts/${id}`, data),
    deleteAccount: (id) => api.delete(`/accounts/${id}`),

    // Credit Cards
    getCreditCards: () => api.get('/credit-cards'),
    getCreditCardsWithInvoices: (competence) => api.get('/credit-cards/with-invoices', { params: { competence } }),
    getCreditCardProjections: (id, months = 6) => api.get(`/credit-cards/${id}/projections`, { params: { months } }),
    getCreditCard: (id) => api.get(`/credit-cards/${id}`),
    getCreditCardInvoice: (id, competence) => api.get(`/credit-cards/${id}/invoice/${competence}`),
    createCreditCard: (data) => api.post('/credit-cards', data),
    updateCreditCard: (id, data) => api.put(`/credit-cards/${id}`, data),
    deleteCreditCard: (id) => api.delete(`/credit-cards/${id}`),
    payInvoice: (id, competence, amount) => api.post(`/credit-cards/${id}/pay-invoice`, { competence, amount }),

    // Categories
    getCategories: () => api.get('/categories'),
    getCategoryBudget: (competence) => api.get(`/categories/budget/${competence}`),
    getCategory: (id) => api.get(`/categories/${id}`),
    createCategory: (data) => api.post('/categories', data),
    updateCategory: (id, data) => api.put(`/categories/${id}`, data),
    deleteCategory: (id) => api.delete(`/categories/${id}`),

    // Transactions
    getTransactions: (params) => api.get('/transactions', { params }),
    getTransaction: (id) => api.get(`/transactions/${id}`),
    createTransaction: (data) => api.post('/transactions', data),
    updateTransaction: (id, data) => api.put(`/transactions/${id}`, data),
    updateTransactionFuture: (id, data) => api.put(`/transactions/${id}/future`, data),
    deleteTransaction: (id) => api.delete(`/transactions/${id}`),
    deleteTransactionFuture: (id) => api.delete(`/transactions/${id}/future`),

    // Dashboard
    getDashboard: (competence) => api.get(`/dashboard/${competence}`),
    getExpensesByCategory: (competence) => api.get(`/dashboard/${competence}/expenses-by-category`),

    // Projection
    getProjection: (months = 12) => api.get('/projection', { params: { months } }),

    // Import
    parseImportFile: (file, params) => {
        const query = new URLSearchParams(params).toString()
        return api.post(`/import/parse?${query}`, file, {
            headers: { 'Content-Type': 'application/octet-stream' }
        })
    },
    confirmImport: (data) => api.post('/import/confirm', data),

    // Chat
    sendChatMessage: (data) => api.post('/chat', data),
    clearChatSession: (sessionId) => api.delete(`/chat/${sessionId}`),

    // Backup
    downloadBackup: () => api.get('/backup', { responseType: 'blob' }),
    restoreBackup: (file) => {
        return api.post('/backup/restore', file, {
            headers: { 'Content-Type': 'application/octet-stream' }
        })
    }
}
