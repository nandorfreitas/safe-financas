import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/services/api'

export const useChatStore = defineStore('chat', () => {
  const isOpen = ref(false)
  const isLoading = ref(false)
  const messages = ref([])
  const sessionId = ref(getOrCreateSessionId())

  function getOrCreateSessionId() {
    let id = localStorage.getItem('safe_chat_session')
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem('safe_chat_session', id)
    }
    return id
  }

  function toggleChat() {
    isOpen.value = !isOpen.value
    if (isOpen.value && messages.value.length === 0) {
      messages.value.push({
        role: 'assistant',
        content: 'Olá! Sou o assistente SAFE. Posso criar transações por você a partir de mensagens simples.\n\nExemplos:\n• "Recebi um pix de 1000 reais do trabalho"\n• "Paguei 50 reais no mercado"\n• "Comprei no cartão 200 reais em 3x"\n• "Quanto gastei esse mês?"',
        type: 'text',
        timestamp: Date.now()
      })
    }
  }

  async function sendMessage(text) {
    if (!text.trim() || isLoading.value) return

    // Adicionar mensagem do usuário
    messages.value.push({
      role: 'user',
      content: text,
      type: 'text',
      timestamp: Date.now()
    })

    isLoading.value = true

    try {
      const { data } = await api.sendChatMessage({
        session_id: sessionId.value,
        message: text
      })

      messages.value.push({
        role: 'assistant',
        content: data.message,
        type: data.type,
        data: data.data || null,
        count: data.count || null,
        timestamp: Date.now()
      })
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Erro ao processar mensagem. Tente novamente.'
      messages.value.push({
        role: 'assistant',
        content: errorMsg,
        type: 'error',
        timestamp: Date.now()
      })
    } finally {
      isLoading.value = false
    }
  }

  async function clearChat() {
    try {
      await api.clearChatSession(sessionId.value)
    } catch {
      // Ignorar erro de limpeza
    }

    messages.value = []
    sessionId.value = crypto.randomUUID()
    localStorage.setItem('safe_chat_session', sessionId.value)

    messages.value.push({
      role: 'assistant',
      content: 'Conversa limpa! Como posso ajudar?',
      type: 'text',
      timestamp: Date.now()
    })
  }

  return {
    isOpen, isLoading, messages, sessionId,
    toggleChat, sendMessage, clearChat
  }
})
