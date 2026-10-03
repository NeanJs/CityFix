<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuth } from '../../composables/useAuth'
import { useLocale } from '../../composables/useLocale'

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
    <h1 v-if="subtitle" class="page-title">{{ subtitle }}</h1>
    <button v-if="showAccount" type="button" class="btn-ghost logout" @click="signOut">
      {{ t('nav.logout') }}
    </button>
  </header>
</template>

<style scoped>
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.1rem 0 0.75rem;
}

.page-title {
  margin: 0;
  font-size: 1.4rem;
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: -0.02em;
  color: var(--text-h);
  font-family: var(--font-display);
}

.logout {
  flex-shrink: 0;
}

@media (min-width: 1024px) {
  .logout {
    display: none;
  }

  .page-title {
    font-size: 1.7rem;
  }
}
</style>
