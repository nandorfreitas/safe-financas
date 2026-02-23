import { defineStore } from 'pinia'
import api from '@/services/api'

export const useProjectionStore = defineStore('projection', {
    state: () => ({
        projections: [],
        loading: false,
        error: null
    }),

    actions: {
        async fetchProjection(months = 12) {
            this.loading = true
            try {
                const { data } = await api.getProjection(months)
                this.projections = data
            } catch (err) {
                this.error = err.message
            } finally {
                this.loading = false
            }
        }
    }
})
