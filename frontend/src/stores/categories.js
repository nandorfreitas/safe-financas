import { defineStore } from 'pinia'
import api from '@/services/api'

export const useCategoriesStore = defineStore('categories', {
    state: () => ({
        categories: [],
        budget: [],
        loading: false,
        error: null
    }),

    getters: {
        receitas: (state) => state.categories.filter(c => c.type === 'receita'),
        despesas: (state) => state.categories.filter(c => c.type === 'despesa')
    },

    actions: {
        async fetchCategories() {
            this.loading = true
            try {
                const { data } = await api.getCategories()
                this.categories = data
            } catch (err) {
                this.error = err.message
            } finally {
                this.loading = false
            }
        },

        async fetchBudget(competence) {
            try {
                const { data } = await api.getCategoryBudget(competence)
                this.budget = data
            } catch (err) {
                this.error = err.message
            }
        },

        async createCategory(payload) {
            const { data } = await api.createCategory(payload)
            this.categories.push(data)
            return data
        },

        async updateCategory(id, payload) {
            const { data } = await api.updateCategory(id, payload)
            const idx = this.categories.findIndex(c => c.id === id)
            if (idx !== -1) this.categories[idx] = data
            return data
        },

        async deleteCategory(id) {
            await api.deleteCategory(id)
            this.categories = this.categories.filter(c => c.id !== id)
        }
    }
})
