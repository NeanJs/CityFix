<script setup lang="ts">
import { computed } from 'vue'
import { RouterView } from 'vue-router'
import BackgroundScene from './components/layout/BackgroundScene.vue'
import { useAuth } from './composables/useAuth'
import { useIssues } from './composables/useIssues'
import { useLocale } from './composables/useLocale'

const { storeReady } = useIssues()
const { ready: authReady } = useAuth()
const { ready: localeReady, t } = useLocale()

const booting = computed(() => !storeReady.value || !authReady.value || !localeReady.value)
</script>

<template>
  <div v-if="booting" class="boot" aria-live="polite">
    <p>{{ t('boot') }}</p>
  </div>
  <div v-else class="app">
    <BackgroundScene />
    <RouterView />
  </div>
</template>

<style scoped>
.boot {
  min-height: 100svh;
  display: grid;
  place-items: center;
  color: var(--text-muted);
  font-weight: 600;
}

.app {
  position: relative;
  min-height: 100svh;
  isolation: isolate;
}
</style>
