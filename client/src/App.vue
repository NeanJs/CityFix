<script setup lang="ts">
import { computed } from 'vue'
import PageSwitch from './components/layout/PageSwitch.vue'
import BackgroundScene from './components/layout/BackgroundScene.vue'
import SkeletonCard from './components/ui/SkeletonCard.vue'
import SkeletonPanel from './components/ui/SkeletonPanel.vue'
import { useAuth } from './composables/useAuth'
import { useIssues } from './composables/useIssues'
import { useLocale } from './composables/useLocale'

const { storeReady } = useIssues()
const { ready: authReady } = useAuth()
const { ready: localeReady, t } = useLocale()

const booting = computed(() => !storeReady.value || !authReady.value || !localeReady.value)
</script>

<template>
  <div class="shell">
    <BackgroundScene />
    <Transition name="boot" mode="out-in">
      <div v-if="booting" key="boot" class="boot" aria-live="polite">
        <p class="sr-only">{{ t('boot') }}</p>
        <div class="boot-stack">
          <SkeletonPanel :lines="2" />
          <SkeletonCard />
          <SkeletonCard :with-thumb="false" />
          <SkeletonCard />
        </div>
      </div>
      <div v-else key="app" class="app">
        <PageSwitch layer="layout" />
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.shell {
  position: relative;
  min-height: 100svh;
  isolation: isolate;
}

.boot {
  position: relative;
  z-index: 1;
  min-height: 100svh;
  padding: calc(0.75rem + env(safe-area-inset-top, 0px)) 0.9rem
    calc(1.5rem + env(safe-area-inset-bottom, 0px));
}

.boot-stack {
  display: grid;
  gap: 0.65rem;
  width: min(100%, 42rem);
}

.app {
  position: relative;
  min-height: 100svh;
  isolation: isolate;
}

.app::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 80;
  height: 3px;
  background: var(--civic-bar);
  pointer-events: none;
}

.boot-enter-active,
.boot-leave-active {
  transition: opacity var(--motion-duration-md) var(--motion-ease);
}

.boot-enter-from,
.boot-leave-to {
  opacity: 0;
}

@media (min-width: 1024px) {
  .boot {
    padding: calc(1.1rem + env(safe-area-inset-top, 0px)) 1.5rem 1.5rem;
  }

  .boot-stack {
    width: min(100%, 52rem);
  }
}
</style>
