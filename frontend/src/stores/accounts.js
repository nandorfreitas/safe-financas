import { defineStore } from 'pinia'
import api from '@/services/api'

export const useAccountsStore = defineStore('accounts', {
    state: () => ({
        accounts: [],
        balances: [],
        loading: false,
        error: null
    }),

    actions: {
        async fetchAccounts() {
            this.loading = true
            try {
                const { data } = await api.getAccounts()
                this.accounts = data
            } catch (err) {
                this.error = err.message
            } finally {
                this.loading = false
            }
        },

        async fetchBalances() {
            try {
                const { data } = await api.getAccountBalances()
                this.balances = data
            } catch (err) {
                this.error = err.message
            }
        },

        async createAccount(payload) {
            const { data } = await api.createAccount(payload)
            this.accounts.push(data)
            return data
        },

        async updateAccount(id, payload) {
            const { data } = await api.updateAccount(id, payload)
            const idx = this.accounts.findIndex(a => a.id === id)
            if (idx !== -1) this.accounts[idx] = data
            return data
        },

        async deleteAccount(id) {
            await api.deleteAccount(id)
            this.accounts = this.accounts.filter(a => a.id !== id)
        }
    }
})
