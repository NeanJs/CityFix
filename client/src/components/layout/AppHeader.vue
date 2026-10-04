<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuth } from '../../composables/useAuth'
import { useLocale } from '../../composables/useLocale'
import AppIcon from '../ui/AppIcon.vue'

const props = defineProps<{
  subtitle?: string
  showAccount?: boolean
  compact?: boolean
}>()

const { t } = useLocale()
const { currentUser, logout } = useAuth()
const router = useRouter()

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
  <header class="header" :class="{ compact: props.compact }">
    <div v-if="subtitle" class="title-block">
      <h1 class="page-title">{{ subtitle }}</h1>
      <span class="civic-rule" aria-hidden="true" />
    </div>
    <button v-if="showAccount" type="button" class="btn-ghost logout" @click="onAccount">
      <AppIcon :name="currentUser ? 'signOut' : 'signIn'" size="1rem" />
      {{ currentUser ? t('nav.logout') : t('nav.login') }}
    </button>
  </header>
</template>

<style scoped>
.header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.35rem 0 1.25rem;
}

.title-block {
  min-width: 0;
}

.page-title {
  margin: 0;
  font-size: 2.25rem;
  font-weight: 700;
  line-height: 1.16;
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
    font-size: 2.75rem;
  }

  .header.compact {
    padding: 0;
  }

  .header.compact .page-title {
    font-size: 1.85rem;
    line-height: 1.05;
  }

  .header.compact .civic-rule {
    margin-top: 0.28rem;
  }
}
</style>
