import { defineStore } from 'pinia'
import api from '@/services/api'

export const useCreditCardsStore = defineStore('creditCards', {
    state: () => ({
        cards: [],
        loading: false,
        error: null
    }),

    actions: {
        async fetchCards() {
            this.loading = true
            try {
                const competence = new Date().toISOString().slice(0, 7)
                const { data } = await api.getCreditCardsWithInvoices(competence)
                this.cards = data
            } catch (err) {
                this.error = err.message
            } finally {
                this.loading = false
            }
        },

        async createCard(payload) {
            const { data } = await api.createCreditCard(payload)
            this.cards.push(data)
            return data
        },

        async updateCard(id, payload) {
            const { data } = await api.updateCreditCard(id, payload)
            const idx = this.cards.findIndex(c => c.id === id)
            if (idx !== -1) this.cards[idx] = data
            return data
        },

        async deleteCard(id) {
            await api.deleteCreditCard(id)
            this.cards = this.cards.filter(c => c.id !== id)
        }
    }
})
