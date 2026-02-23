import { defineStore } from 'pinia'
import api from '@/services/api'

export const useDashboardStore = defineStore('dashboard', {
    state: () => ({
        data: null,
        loading: false,
        error: null
    }),

    actions: {
        async fetchDashboard(competence) {
            this.loading = true
            try {
                const { data } = await api.getDashboard(competence)
                this.data = data
            } catch (err) {
                this.error = err.message
            } finally {
                this.loading = false
            }
        }
    }
})
