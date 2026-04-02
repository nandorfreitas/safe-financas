<template>
  <div class="chat-messages" ref="messagesRef">
    <div
      v-for="(msg, i) in messages"
      :key="i"
      :class="['msg', `msg--${msg.role}`, { 'msg--error': msg.type === 'error' }]"
    >
      <div class="msg__bubble">
        <!-- Text content with line breaks -->
        <div class="msg__text" v-html="formatMessage(msg.content)" />

        <!-- Transaction created card -->
        <div v-if="msg.type === 'transaction_created' && msg.data" class="msg__card">
          <div class="card-row">
            <span class="card-label">{{ msg.data.description }}</span>
            <span :class="['card-amount', `card-amount--${msg.data.type}`]">
              {{ msg.data.type === 'receita' ? '+' : '-' }}{{ formatCurrency(msg.data.amount) }}
            </span>
          </div>
          <div class="card-details">
            <span v-if="msg.data.account_name">{{ msg.data.account_name }}</span>
            <span v-if="msg.data.credit_card_name">{{ msg.data.credit_card_name }}</span>
            <span v-if="msg.data.category_name">{{ msg.data.category_name }}</span>
            <span>{{ formatDate(msg.data.launch_date) }}</span>
          </div>
          <div v-if="msg.count > 1" class="card-parcelas">
            {{ msg.count }} parcelas criadas
          </div>
        </div>
      </div>
    </div>

    <!-- Typing indicator -->
    <div v-if="loading" class="msg msg--assistant">
      <div class="msg__bubble">
        <div class="typing-indicator">
          <span /><span /><span />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'

const props = defineProps({
  messages: { type: Array, required: true },
  loading: { type: Boolean, default: false }
})

const messagesRef = ref(null)

watch(() => props.messages.length, () => {
  nextTick(scrollToBottom)
})

watch(() => props.loading, () => {
  nextTick(scrollToBottom)
})

function scrollToBottom() {
  if (messagesRef.value) {
    messagesRef.value.scrollTop = messagesRef.value.scrollHeight
  }
}

function formatMessage(text) {
  if (!text) return ''
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>')
    .replace(/•/g, '<span style="color: var(--text-tertiary)">•</span>')
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}
</script>

<style scoped>
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.msg {
  display: flex;
  max-width: 85%;
}

.msg--user {
  align-self: flex-end;
}

.msg--assistant {
  align-self: flex-start;
}

.msg__bubble {
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-lg);
  font-size: var(--text-sm);
  line-height: 1.5;
}

.msg--user .msg__bubble {
  background: var(--btn-primary-bg);
  color: white;
  border-bottom-right-radius: var(--radius-sm);
}

.msg--assistant .msg__bubble {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-subtle);
  border-bottom-left-radius: var(--radius-sm);
}

.msg--error .msg__bubble {
  background: var(--color-danger-subtle);
  color: var(--color-danger);
  border-color: var(--color-danger);
}

.msg__text {
  word-break: break-word;
}

.msg__card {
  margin-top: var(--space-2);
  padding: var(--space-2) var(--space-3);
  background: var(--bg-primary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
}

.card-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-2);
}

.card-label {
  font-weight: var(--font-medium);
  font-size: var(--text-sm);
}

.card-amount {
  font-weight: var(--font-semibold);
  font-size: var(--text-sm);
  white-space: nowrap;
}

.card-amount--receita { color: var(--color-success); }
.card-amount--despesa { color: var(--color-danger); }

.card-details {
  display: flex;
  gap: var(--space-2);
  margin-top: var(--space-1);
  font-size: var(--text-xs);
  color: var(--text-secondary);
  flex-wrap: wrap;
}

.card-details span:not(:last-child)::after {
  content: '·';
  margin-left: var(--space-2);
}

.card-parcelas {
  margin-top: var(--space-1);
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  font-style: italic;
}

/* Typing indicator */
.typing-indicator {
  display: flex;
  gap: 4px;
  padding: var(--space-1) 0;
}

.typing-indicator span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--text-tertiary);
  animation: typing 1.2s infinite;
}

.typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
.typing-indicator span:nth-child(3) { animation-delay: 0.4s; }

@keyframes typing {
  0%, 60%, 100% { opacity: 0.3; transform: scale(0.8); }
  30% { opacity: 1; transform: scale(1); }
}
</style>
