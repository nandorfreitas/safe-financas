import { defineStore } from 'pinia'
import axios from 'axios'

const API_URL = 'http://localhost:3001/api/loans'

export const useLoansStore = defineStore('loans', {
    state: () => ({
        loans: [],
        loading: false,
        error: null
    }),

    getters: {
        activeLoans: (state) => state.loans.filter(l => l.status === 'ativo'),
        receivables: (state) => state.loans.filter(l => l.type === 'emprestimo_concedido'),
        payables: (state) => state.loans.filter(l => l.type === 'financiamento'),
        totalReceivable: (state) => {
            return state.loans
                .filter(l => l.type === 'emprestimo_concedido' && l.status === 'ativo')
                .reduce((sum, loan) => sum + loan.remaining_balance, 0)
        },
        totalPayable: (state) => {
            return state.loans
                .filter(l => l.type === 'financiamento' && l.status === 'ativo')
                .reduce((sum, loan) => sum + loan.remaining_balance, 0)
        }
    },

    actions: {
        async fetchLoans() {
            this.loading = true
            this.error = null
            try {
                const response = await axios.get(API_URL)
                this.loans = response.data
            } catch (error) {
                this.error = error.response?.data?.error || 'Erro ao carregar empréstimos e financiamentos'
                console.error('Error fetching loans:', error)
            } finally {
                this.loading = false
            }
        },

        async createLoan(loanData) {
            this.loading = true
            this.error = null
            try {
                const response = await axios.post(API_URL, loanData)
                this.loans.push(response.data)
                return response.data
            } catch (error) {
                this.error = error.response?.data?.error || 'Erro ao criar'
                console.error('Error creating loan:', error)
                throw error
            } finally {
                this.loading = false
            }
        },

        async updateLoan(id, loanData) {
            this.loading = true
            this.error = null
            try {
                const response = await axios.put(`${API_URL}/${id}`, loanData)
                const index = this.loans.findIndex(l => l.id === id)
                if (index !== -1) {
                    this.loans[index] = response.data
                }
                return response.data
            } catch (error) {
                this.error = error.response?.data?.error || 'Erro ao atualizar'
                console.error('Error updating loan:', error)
                throw error
            } finally {
                this.loading = false
            }
        },

        async deleteLoan(id) {
            this.loading = true
            this.error = null
            try {
                await axios.delete(`${API_URL}/${id}`)
                this.loans = this.loans.filter(l => l.id !== id)
            } catch (error) {
                this.error = error.response?.data?.error || 'Erro ao excluir'
                console.error('Error deleting loan:', error)
                throw error
            } finally {
                this.loading = false
            }
        }
    }
})
