<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { appName } from '../../config/appConfig'
import type { NavItem } from '../../config/nav'
import { useAuth } from '../../composables/useAuth'
import { useLocale } from '../../composables/useLocale'
import LanguageSwitcher from './LanguageSwitcher.vue'

const props = defineProps<{
  items: readonly NavItem[]
  sectionKey: string
  taglineKey: string
  ariaLabel: string
}>()

const route = useRoute()
const router = useRouter()
const { t } = useLocale()
const { logout } = useAuth()
const activeName = computed(() => route.name)

async function signOut() {
  await logout()
  await router.push('/login')
}
</script>

<template>
  <aside class="side" :aria-label="ariaLabel">
    <div class="side-head">
      <div class="side-mark" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none">
          <path
            d="M12 2.5 4 8v8l8 5.5L20 16V8l-8-5.5Z"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linejoin="round"
          />
          <path
            d="M12 11.5a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Z"
            fill="currentColor"
          />
        </svg>
      </div>
      <div class="side-brand-block">
        <p class="side-brand">{{ appName }}</p>
        <p class="side-tagline">{{ t(props.taglineKey) }}</p>
      </div>
    </div>

    <p class="side-section">{{ t(props.sectionKey) }}</p>
    <nav class="side-nav">
      <button
        v-for="item in items"
        :key="item.name"
        type="button"
        class="side-link"
        :class="{ active: activeName === item.name }"
        :aria-current="activeName === item.name ? 'page' : undefined"
        @click="router.push(item.path)"
      >
        <span class="side-link-icon" aria-hidden="true">
          <svg v-if="item.icon === 'home' || item.icon === 'dashboard'" viewBox="0 0 24 24" fill="none">
            <path
              d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linejoin="round"
            />
          </svg>
          <svg v-else-if="item.icon === 'report'" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 5v14M5 12h14"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
            />
          </svg>
          <svg v-else viewBox="0 0 24 24" fill="none">
            <path
              d="M7 4h10a2 2 0 0 1 2 2v14l-3-2-3 2-3-2-3 2-3-2V6a2 2 0 0 1 2-2Z"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linejoin="round"
            />
          </svg>
        </span>
        <span class="side-link-label">{{ t(item.labelKey) }}</span>
      </button>
    </nav>

    <div class="side-foot">
      <LanguageSwitcher />
      <button type="button" class="btn-secondary sign-out" @click="signOut">
        {{ t('nav.logout') }}
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
    gap: 1rem;
    position: sticky;
    top: 0;
    align-self: start;
    z-index: 20;
    width: 100%;
    height: 100svh;
    max-height: 100svh;
    padding: calc(1.2rem + env(safe-area-inset-top, 0px)) 1rem 1.4rem;
    border-right: 1px solid var(--glass-border);
    background: var(--glass-bg-strong);
    backdrop-filter: blur(var(--glass-blur));
    -webkit-backdrop-filter: blur(var(--glass-blur));
    box-shadow: inset -1px 0 0 rgba(255, 255, 255, 0.28);
    overflow-y: auto;
    overscroll-behavior: contain;
  }

  @media (prefers-color-scheme: dark) {
    .side {
      box-shadow: inset -1px 0 0 rgba(196, 163, 106, 0.08);
    }
  }

  .side-head {
    display: flex;
    align-items: center;
    gap: 0.7rem;
    padding: 0.1rem 0.2rem 0.85rem;
    border-bottom: 1px solid var(--border);
    margin-bottom: 0.2rem;
  }

  .side-mark {
    flex-shrink: 0;
    width: 2.4rem;
    height: 2.4rem;
    display: grid;
    place-items: center;
    border-radius: var(--radius-md);
    color: var(--accent);
    background: var(--surface);
    border: 1px solid var(--border);
  }

  .side-mark svg {
    width: 1.2rem;
    height: 1.2rem;
  }

  .side-brand-block {
    min-width: 0;
  }

  .side-brand {
    margin: 0;
    font-size: 1.15rem;
    font-weight: 700;
    letter-spacing: -0.02em;
    color: var(--text-h);
    font-family: var(--font-display);
    line-height: 1.15;
  }

  .side-tagline {
    margin: 0.2rem 0 0;
    font-size: 0.66rem;
    font-weight: 650;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--text-muted);
  }

  .side-section {
    margin: 0;
    padding: 0 0.35rem;
    font-size: 0.66rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--text-muted);
  }

  .side-nav {
    display: grid;
    gap: 0.3rem;
  }

  .side-link {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    text-align: left;
    min-height: 2.75rem;
    padding: 0.5rem 0.6rem;
    border-radius: var(--radius-md);
    border: 1px solid transparent;
    background: transparent;
    color: var(--text-muted);
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition:
      background 0.18s ease,
      color 0.18s ease,
      border-color 0.18s ease;
  }

  .side-link:hover {
    border-color: var(--border);
    background: var(--surface);
  }

  .side-link-icon {
    flex-shrink: 0;
    width: 1.85rem;
    height: 1.85rem;
    display: grid;
    place-items: center;
    border-radius: var(--radius-sm);
    color: var(--text-muted);
    background: transparent;
    border: 1px solid var(--border);
  }

  .side-link-icon svg {
    width: 1.05rem;
    height: 1.05rem;
  }

  .side-link-label {
    color: var(--text-muted);
    font-weight: 600;
    line-height: 1.2;
  }

  .side-link.active {
    color: var(--text-h);
    border-color: var(--accent);
    background: var(--surface);
  }

  .side-link.active .side-link-icon {
    color: var(--accent);
    border-color: var(--accent);
  }

  .side-link.active .side-link-label {
    color: var(--text-h);
  }

  .side-foot {
    margin-top: auto;
    display: grid;
    gap: 0.65rem;
    padding-top: 1rem;
  }

  .sign-out {
    width: 100%;
  }
}
</style>
