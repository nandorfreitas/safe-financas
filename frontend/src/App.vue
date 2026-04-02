<template>
  <AppLayout>
    <router-view />
  </AppLayout>
  <ChatWidget />
</template>

<script setup>
import AppLayout from '@/components/layout/AppLayout.vue'
import ChatWidget from '@/components/chat/ChatWidget.vue'
import { useThemeStore } from '@/stores/theme'

const theme = useThemeStore()
theme.init()
</script>
