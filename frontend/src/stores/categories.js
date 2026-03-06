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
        despesas: (state) => state.categories.filter(c => c.type === 'despesa'),

        parentCategories: (state) => state.categories.filter(c => !c.parent_id),

        categoryTree: (state) => {
            const tree = []
            const map = new Map()

            state.categories.forEach(cat => {
                map.set(cat.id, { ...cat, children: [] })
            })

            state.categories.forEach(cat => {
                if (cat.parent_id) {
                    const parent = map.get(cat.parent_id)
                    if (parent) parent.children.push(map.get(cat.id))
                } else {
                    tree.push(map.get(cat.id))
                }
            })

            return tree
        },

        groupedOptions: (state) => {
            const tree = useCategoriesStore().categoryTree
            const options = []

            tree.forEach(parent => {
                options.push({ value: parent.id, label: parent.name, type: parent.type })
                if (parent.children && parent.children.length > 0) {
                    parent.children.forEach(child => {
                        options.push({
                            value: child.id,
                            label: `${parent.name} - ${child.name}`,
                            type: child.type
                        })
                    })
                }
            })

            return options
        }
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
