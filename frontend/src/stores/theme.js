import { defineStore } from 'pinia'

export const useThemeStore = defineStore('theme', {
    state: () => ({
        theme: 'light'
    }),

    getters: {
        isDark: (state) => state.theme === 'dark'
    },

    actions: {
        init() {
            const saved = localStorage.getItem('safe-theme')
            if (saved) {
                this.theme = saved
            } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                this.theme = 'dark'
            }
            this.apply()
        },

        toggle() {
            this.theme = this.theme === 'dark' ? 'light' : 'dark'
            localStorage.setItem('safe-theme', this.theme)
            this.apply()
        },

        apply() {
            document.documentElement.setAttribute('data-theme', this.theme)
        }
    }
})
