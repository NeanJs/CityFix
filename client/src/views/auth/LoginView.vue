<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useAuth } from '../../composables/useAuth'
import { useLocale } from '../../composables/useLocale'
import { demoAccounts, demoPassword } from '../../data/seedUsers'
import { AuthError, homePathForRole } from '../../services/auth/authService'
import GlassPanel from '../../components/ui/GlassPanel.vue'

const { t } = useLocale()
const { login } = useAuth()
const router = useRouter()

const email = ref('')
const password = ref('')
const submitting = ref(false)
const errorKey = ref('')
const isDev = import.meta.env.DEV

async function submit() {
  if (submitting.value) {
    return
  }
  errorKey.value = ''
  submitting.value = true
  try {
    const user = await login(email.value, password.value)
    await router.replace(homePathForRole(user.role))
  } catch (error) {
    errorKey.value =
      error instanceof AuthError ? `auth.errors.${error.code}` : 'auth.errors.invalidCredentials'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <GlassPanel padding="lg" tone="paper" class="card">
    <h1 class="title">{{ t('auth.signIn') }}</h1>
    <p class="lead">{{ t('auth.loginLead') }}</p>

    <form class="form" @submit.prevent="submit">
      <label class="field">
        <span>{{ t('auth.email') }}</span>
        <input
          v-model="email"
          class="control"
          type="email"
          autocomplete="email"
          inputmode="email"
        />
      </label>
      <label class="field">
        <span>{{ t('auth.password') }}</span>
        <input v-model="password" class="control" type="password" autocomplete="current-password" />
      </label>
      <p v-if="errorKey" class="error" role="alert">{{ t(errorKey) }}</p>
      <button type="submit" class="btn submit" :disabled="submitting">
        {{ submitting ? t('auth.submitting') : t('auth.submitLogin') }}
      </button>
    </form>

    <RouterLink class="switch" to="/register">{{ t('auth.toRegister') }}</RouterLink>

    <div v-if="isDev" class="demo">
      <p class="demo-title">{{ t('auth.demoTitle') }}</p>
      <p v-for="account in demoAccounts" :key="account.id" class="hint">
        {{ account.role === 'staff' ? t('auth.demoStaff') : t('auth.demoCitizen') }}:
        {{ account.email }} / {{ demoPassword }}
      </p>
    </div>
  </GlassPanel>
</template>

<style scoped>
.card {
  width: min(100%, 26rem);
  display: grid;
  gap: 0.85rem;
}

.title {
  margin: 0;
  font-size: 1.55rem;
  font-weight: 700;
  font-family: var(--font-display);
  color: var(--text-h);
}

.lead {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.92rem;
}

.form {
  display: grid;
  gap: 0.8rem;
}

.field {
  display: grid;
  gap: 0.35rem;
}

.field > span {
  font-size: 0.7rem;
  font-weight: 650;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
}

.submit {
  width: 100%;
}

.error {
  margin: 0;
  font-size: 0.82rem;
  color: #b42318;
}

.switch {
  color: var(--accent);
  font-size: 0.85rem;
  font-weight: 650;
  text-decoration: none;
}

.demo {
  display: grid;
  gap: 0.25rem;
  padding-top: 0.35rem;
  border-top: 1px solid var(--border);
}

.demo-title {
  margin: 0;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-muted);
}
</style>
