import { defineStore } from 'pinia'
import api from '@/services/api'

export const useTransactionsStore = defineStore('transactions', {
    state: () => ({
        transactions: [],
        loading: false,
        error: null
    }),

    actions: {
        async fetchTransactions(filters = {}) {
            this.loading = true
            try {
                const { data } = await api.getTransactions(filters)
                this.transactions = data
            } catch (err) {
                this.error = err.message
            } finally {
                this.loading = false
            }
        },

        async createTransaction(payload) {
            const { data } = await api.createTransaction(payload)
            // Could be array (installments/fixed) or single
            if (Array.isArray(data)) {
                this.transactions.push(...data)
            } else {
                this.transactions.push(data)
            }
            return data
        },

        async updateTransaction(id, payload) {
            const { data } = await api.updateTransaction(id, payload)
            const idx = this.transactions.findIndex(t => t.id === id)
            if (idx !== -1) this.transactions[idx] = data
            return data
        },

        async deleteTransaction(id) {
            await api.deleteTransaction(id)
            this.transactions = this.transactions.filter(t => t.id !== id)
        },

        async deleteTransactionFuture(id) {
            await api.deleteTransactionFuture(id)
        },

        async updateTransactionFuture(id, payload) {
            await api.updateTransactionFuture(id, payload)
        }
    }
})
