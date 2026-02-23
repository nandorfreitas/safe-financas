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
    getCreditCard: (id) => api.get(`/credit-cards/${id}`),
    getCreditCardInvoice: (id, competence) => api.get(`/credit-cards/${id}/invoice/${competence}`),
    createCreditCard: (data) => api.post('/credit-cards', data),
    updateCreditCard: (id, data) => api.put(`/credit-cards/${id}`, data),
    deleteCreditCard: (id) => api.delete(`/credit-cards/${id}`),

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
    deleteTransaction: (id) => api.delete(`/transactions/${id}`),

    // Dashboard
    getDashboard: (competence) => api.get(`/dashboard/${competence}`),

    // Projection
    getProjection: (months = 12) => api.get('/projection', { params: { months } }),

    // Backup
    downloadBackup: () => api.get('/backup', { responseType: 'blob' })
}
