<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import GlassPanel from '../../components/ui/GlassPanel.vue'
import { useAuth } from '../../composables/useAuth'
import { useLocale } from '../../composables/useLocale'
import { demoAccounts, demoPassword } from '../../data/seedUsers'
import { AuthError, homePathForRole } from '../../services/auth/authService'
import type { UserRole } from '../../types/user'

const { t } = useLocale()
const { login } = useAuth()
const router = useRouter()

const email = ref('')
const password = ref('')
const submitting = ref(false)
const errorKey = ref('')
const isDev = import.meta.env.DEV

async function signIn(nextEmail: string, nextPassword: string) {
  if (submitting.value) {
    return
  }
  errorKey.value = ''
  submitting.value = true
  try {
    const user = await login(nextEmail, nextPassword)
    await router.replace(homePathForRole(user.role))
  } catch (error) {
    errorKey.value =
      error instanceof AuthError ? `auth.errors.${error.code}` : 'auth.errors.invalidCredentials'
  } finally {
    submitting.value = false
  }
}

function submit() {
  return signIn(email.value, password.value)
}

function demoLogin(role: UserRole) {
  const account = demoAccounts.find((item) => item.role === role)
  if (!account) {
    return
  }
  return signIn(account.email, demoPassword)
}
</script>

<template>
  <GlassPanel padding="lg" tone="fill" class="card">
    <h1 class="title">{{ t('auth.signIn') }}</h1>
    <p class="lead">{{ t('auth.loginLead') }}</p>

    <RouterLink class="btn skip" to="/report">{{ t('auth.toReport') }}</RouterLink>

    <div v-if="isDev" class="demo">
      <p class="field-label">{{ t('auth.demoTitle') }}</p>
      <button type="button" class="btn" :disabled="submitting" @click="demoLogin('citizen')">
        {{ t('auth.demoCitizen') }}
      </button>
      <button type="button" class="btn-secondary" :disabled="submitting" @click="demoLogin('staff')">
        {{ t('auth.demoStaff') }}
      </button>
    </div>

    <form class="form" @submit.prevent="submit">
      <p v-if="isDev" class="field-label">{{ t('auth.orManual') }}</p>
      <label class="field">
        <span class="field-label">{{ t('auth.email') }}</span>
        <input
          v-model="email"
          class="control"
          type="email"
          autocomplete="email"
          inputmode="email"
        />
      </label>
      <label class="field">
        <span class="field-label">{{ t('auth.password') }}</span>
        <input v-model="password" class="control" type="password" autocomplete="current-password" />
      </label>
      <p v-if="errorKey" class="error" role="alert">{{ t(errorKey) }}</p>
      <button type="submit" class="btn submit" :disabled="submitting">
        {{ submitting ? t('auth.submitting') : t('auth.submitLogin') }}
      </button>
    </form>

    <RouterLink class="switch" to="/register">{{ t('auth.toRegister') }}</RouterLink>
  </GlassPanel>
</template>

<style scoped>
.card {
  width: min(100%, 26rem);
  display: grid;
  gap: 0.9rem;
}

.title {
  margin: 0;
  font-size: 2.25rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  font-family: var(--font-display);
  color: var(--text-h);
}

.lead {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.95rem;
}

.demo {
  display: grid;
  gap: 0.45rem;
}

.form {
  display: grid;
  gap: 0.8rem;
}

.field {
  display: grid;
  gap: 0.35rem;
}

.submit {
  width: 100%;
}

.skip {
  width: 100%;
  text-decoration: none;
}

.error {
  margin: 0;
  font-size: 0.82rem;
  color: var(--danger);
}

.switch {
  color: var(--text-h);
  font-size: 0.88rem;
  font-weight: 500;
  text-decoration: none;
}
</style>
