<script setup lang="ts">
import { useRouter } from 'vue-router'
import { appName } from '../../config/appConfig'
import { useAuth } from '../../composables/useAuth'
import { useLocale } from '../../composables/useLocale'
import LanguageSwitcher from './LanguageSwitcher.vue'

defineProps<{
  subtitle?: string
  showAccount?: boolean
}>()

const { t } = useLocale()
const { logout } = useAuth()
const router = useRouter()

async function signOut() {
  await logout()
  await router.push('/login')
}
</script>

<template>
  <header class="header">
    <div class="brand">
      <div class="mark mark-mobile" aria-hidden="true">
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
      <div class="titles">
        <p class="name name-mobile">{{ appName }}</p>
        <h1 v-if="subtitle" class="page-title">{{ subtitle }}</h1>
      </div>
    </div>
    <div class="actions">
      <LanguageSwitcher class="locale-mobile" />
      <button v-if="showAccount" type="button" class="btn-ghost logout-mobile" @click="signOut">
        {{ t('nav.logout') }}
      </button>
    </div>
  </header>
</template>

<style scoped>
.header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.15rem 0 0.85rem;
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  min-width: 0;
}

.mark {
  width: 2.4rem;
  height: 2.4rem;
  display: grid;
  place-items: center;
  border-radius: var(--radius-md);
  color: var(--accent);
  background: var(--surface);
  border: 1px solid var(--border);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.35);
}

.mark svg {
  width: 1.2rem;
  height: 1.2rem;
}

.titles {
  min-width: 0;
}

.name {
  margin: 0;
  font-size: 0.68rem;
  font-weight: 650;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.page-title {
  margin: 0.1rem 0 0;
  font-size: 1.35rem;
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: -0.02em;
  color: var(--text-h);
  font-family: var(--font-display);
}

.actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.4rem;
  flex-shrink: 0;
}

.logout-mobile {
  min-height: 2.4rem;
}

@media (min-width: 1024px) {
  .mark-mobile,
  .name-mobile,
  .locale-mobile,
  .logout-mobile {
    display: none;
  }

  .page-title {
    margin: 0;
    font-size: 1.7rem;
  }
}
</style>
