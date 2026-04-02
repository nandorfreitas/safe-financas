<template>
  <Teleport to="body">
    <!-- FAB Button -->
    <button class="chat-fab" :class="{ 'chat-fab--open': chatStore.isOpen }" @click="chatStore.toggleChat">
      <!-- Chat icon -->
      <svg v-if="!chatStore.isOpen" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
      <!-- Close icon -->
      <svg v-else width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    </button>

    <!-- Chat Panel -->
    <Transition name="chat-panel">
      <div v-if="chatStore.isOpen" class="chat-panel">
        <ChatHeader
          @close="chatStore.toggleChat"
          @clear="chatStore.clearChat"
        />
        <ChatMessages
          :messages="chatStore.messages"
          :loading="chatStore.isLoading"
        />
        <ChatInput
          :disabled="chatStore.isLoading"
          @send="chatStore.sendMessage"
        />
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { useChatStore } from '@/stores/chat'
import ChatHeader from './ChatHeader.vue'
import ChatMessages from './ChatMessages.vue'
import ChatInput from './ChatInput.vue'

const chatStore = useChatStore()
</script>

<style scoped>
.chat-fab {
  position: fixed;
  bottom: var(--space-6);
  right: var(--space-6);
  width: 52px;
  height: 52px;
  border-radius: 50%;
  border: none;
  background: var(--btn-primary-bg);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-lg);
  z-index: 450;
  transition: all var(--duration-normal) var(--easing-default);
}

.chat-fab:hover {
  transform: scale(1.05);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
}

.chat-fab--open {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.chat-panel {
  position: fixed;
  bottom: calc(var(--space-6) + 64px);
  right: var(--space-6);
  width: 380px;
  height: 520px;
  background: var(--bg-primary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-xl, 0 20px 60px rgba(0, 0, 0, 0.15));
  z-index: 450;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Transition animations */
.chat-panel-enter-active {
  transition: all 0.25s var(--easing-default);
}

.chat-panel-leave-active {
  transition: all 0.2s var(--easing-default);
}

.chat-panel-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

.chat-panel-leave-to {
  opacity: 0;
  transform: translateY(10px) scale(0.98);
}

/* Mobile: full screen */
@media (max-width: 768px) {
  .chat-panel {
    inset: 0;
    width: 100%;
    height: 100%;
    border-radius: 0;
    bottom: 0;
    right: 0;
  }

  .chat-fab--open {
    display: none;
  }
}
</style>
