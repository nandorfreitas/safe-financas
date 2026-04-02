<template>
  <div class="chat-input">
    <textarea
      ref="textareaRef"
      v-model="text"
      class="chat-input__field"
      placeholder="Digite sua mensagem..."
      :disabled="disabled"
      rows="1"
      @keydown.enter.exact.prevent="send"
      @input="autoGrow"
    />
    <button
      class="chat-input__send"
      :disabled="!text.trim() || disabled"
      @click="send"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
      </svg>
    </button>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'

const props = defineProps({
  disabled: { type: Boolean, default: false }
})

const emit = defineEmits(['send'])
const text = ref('')
const textareaRef = ref(null)

function send() {
  if (!text.value.trim() || props.disabled) return
  emit('send', text.value.trim())
  text.value = ''
  nextTick(() => {
    if (textareaRef.value) {
      textareaRef.value.style.height = 'auto'
    }
  })
}

function autoGrow() {
  const el = textareaRef.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = Math.min(el.scrollHeight, 80) + 'px'
}
</script>

<style scoped>
.chat-input {
  display: flex;
  align-items: flex-end;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  border-top: 1px solid var(--border-subtle);
  background: var(--bg-primary);
  border-radius: 0 0 var(--radius-2xl) var(--radius-2xl);
  flex-shrink: 0;
}

.chat-input__field {
  flex: 1;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: var(--text-sm);
  font-family: inherit;
  resize: none;
  overflow-y: auto;
  line-height: 1.4;
  max-height: 80px;
}

.chat-input__field:focus {
  outline: none;
  border-color: var(--btn-primary-bg);
}

.chat-input__field::placeholder {
  color: var(--text-tertiary);
}

.chat-input__field:disabled {
  opacity: 0.6;
}

.chat-input__send {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  background: var(--btn-primary-bg);
  color: white;
  border-radius: var(--radius-lg);
  cursor: pointer;
  flex-shrink: 0;
  transition: opacity var(--duration-fast);
}

.chat-input__send:hover:not(:disabled) {
  opacity: 0.9;
}

.chat-input__send:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
