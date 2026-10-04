<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { appName } from '../../config/appConfig'
import type { NavItem } from '../../config/nav'
import { useAuth } from '../../composables/useAuth'
import { useLocale } from '../../composables/useLocale'
import SelectionIndicator from '../ui/SelectionIndicator.vue'
const props = defineProps<{
  items: readonly NavItem[]
  sectionKey: string
  taglineKey: string
  ariaLabel: string
}>()

const route = useRoute()
const router = useRouter()
const { t } = useLocale()
const { currentUser, logout } = useAuth()
const activeName = computed(() => route.name)

async function onAccount() {
  if (currentUser.value) {
    await logout()
    await router.push('/')
    return
  }
  await router.push('/login')
}
</script>

<template>
  <aside class="side surface-frost" :aria-label="ariaLabel">
    <div class="side-head">
      <p class="side-brand">{{ appName }}</p>
      <span class="civic-rule" aria-hidden="true" />
      <p class="side-tagline">{{ t(props.taglineKey) }}</p>
    </div>

    <p class="side-section">{{ t(props.sectionKey) }}</p>
    <nav class="side-nav">
      <SelectionIndicator :active-key="String(activeName ?? '')" />
      <button
        v-for="item in items"
        :key="item.name"
        type="button"
        class="side-link"
        :class="{ active: activeName === item.name }"
        :data-selection-active="activeName === item.name ? 'true' : undefined"
        :aria-current="activeName === item.name ? 'page' : undefined"
        @click="router.push(item.path)"
      >
        {{ t(item.labelKey) }}
      </button>
    </nav>

    <div class="side-foot">
      <button type="button" class="btn-ghost sign-out" @click="onAccount">
        {{ currentUser ? t('nav.logout') : t('nav.login') }}
      </button>
    </div>
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
    position: sticky;
    top: 0;
    align-self: start;
    z-index: 20;
    width: 100%;
    padding: calc(1.4rem + env(safe-area-inset-top, 0px)) 1.1rem 1.4rem;
    height: 100svh;
    max-height: 100svh;
    overflow-y: auto;
    overscroll-behavior: contain;
    border-right: 1px solid var(--border);
    background: var(--surface);
  }

  .side-head {
    padding: 0 0.55rem;
  }

  .side-brand {
    margin: 0;
    font-size: 1.35rem;
    font-weight: 700;
    letter-spacing: -0.02em;
    color: var(--text-h);
    font-family: var(--font-display);
    line-height: 1.15;
  }

  .side-tagline {
    margin: 0.45rem 0 0;
    font-size: 0.82rem;
    font-weight: 500;
    letter-spacing: 0.02em;
    color: var(--text-muted);
  }

  .side-section {
    margin: 0.4rem 0 0;
    padding: 0 0.55rem;
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    color: var(--text-muted);
  }

  .side-nav {
    position: relative;
    display: grid;
    gap: 0.2rem;
  }

  .side-link {
    position: relative;
    z-index: 1;
    text-align: left;
    min-height: 2.6rem;
    padding: 0.5rem 0.7rem;
    border: none;
    border-radius: var(--radius-pill);
    background: transparent;
    color: var(--text);
    font-size: 0.95rem;
    font-weight: 500;
    cursor: pointer;
  }

  .side-link:hover {
    color: var(--text-h);
  }

  .side-link.active {
    color: var(--text-h);
    background: transparent;
    box-shadow: none;
  }

  .side-nav :deep(.indicator.fill) {
    border-radius: var(--radius-pill);
  }

  .side-foot {
    margin-top: auto;
    padding: 0 0.2rem;
  }

  .sign-out {
    width: 100%;
    justify-content: flex-start;
  }
}
</style>
