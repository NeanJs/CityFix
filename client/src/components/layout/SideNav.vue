<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { appName } from '../../config/appConfig'

const route = useRoute()
const router = useRouter()

const items = [
  { name: 'home', path: '/', label: 'Overview' },
  { name: 'reports', path: '/reports', label: 'Reports' },
  { name: 'report', path: '/report', label: 'New report' },
] as const

const activeName = computed(() => route.name)
</script>

<template>
  <aside class="side" aria-label="Workspace navigation">
    <p class="side-brand">{{ appName }}</p>
    <nav class="side-nav">
      <button
        v-for="item in items"
        :key="item.name"
        type="button"
        class="side-link"
        :class="{ active: activeName === item.name }"
        @click="router.push(item.path)"
      >
        {{ item.label }}
      </button>
    </nav>
  </aside>
</template>

<style scoped>
.side {
  display: none;
}

@media (min-width: 1024px) {
  .side {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    padding: calc(1.25rem + env(safe-area-inset-top, 0px)) 1.25rem 1.5rem;
    border-right: 1px solid var(--glass-border);
    background: var(--glass-bg-strong);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
  }

  .side-brand {
    margin: 0;
    font-size: 1.05rem;
    font-weight: 700;
    letter-spacing: -0.02em;
    color: var(--text-h);
    font-family: var(--font-display);
  }

  .side-nav {
    display: grid;
    gap: 0.35rem;
  }

  .side-link {
    text-align: left;
    padding: 0.65rem 0.85rem;
    border-radius: var(--radius-md);
    border: 1px solid transparent;
    background: transparent;
    color: var(--text-muted);
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition:
      background 0.15s ease,
      color 0.15s ease,
      border-color 0.15s ease;
  }

  .side-link.active {
    color: var(--text-h);
    border-color: var(--glass-border);
    background: rgba(45, 212, 191, 0.12);
  }
}
</style>
