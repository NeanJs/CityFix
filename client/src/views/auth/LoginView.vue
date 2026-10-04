<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import GlassPanel from '../../components/ui/GlassPanel.vue'
import { useAuth } from '../../composables/useAuth'
import { useLocale } from '../../composables/useLocale'
import { AuthError, homePathForRole } from '../../services/auth/authService'

const { t } = useLocale()
const { login } = useAuth()
const router = useRouter()

const email = ref('')
const password = ref('')
const submitting = ref(false)
const errorKey = ref('')

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
</script>

<template>
  <GlassPanel padding="lg" tone="fill" class="card">
    <h1 class="title">{{ t('auth.signIn') }}</h1>
    <p class="lead">{{ t('auth.loginLead') }}</p>

    <RouterLink class="btn skip" to="/report">{{ t('auth.toReport') }}</RouterLink>

    <form class="form" @submit.prevent="submit">
      <label class="field">
        <span class="field-label">{{ t('auth.email') }}</span>
        <input
          v-model="email"
          class="control"
          type="email"
          autocomplete="email"
          inputmode="email"
          required
        />
      </label>
      <label class="field">
        <span class="field-label">{{ t('auth.password') }}</span>
        <input
          v-model="password"
          class="control"
          type="password"
          autocomplete="current-password"
          required
        />
      </label>
      <p v-if="errorKey" class="error" role="alert">{{ t(errorKey) }}</p>
      <button type="submit" class="btn submit" :disabled="submitting">
        {{ submitting ? t('auth.submitting') : t('auth.submitLogin') }}
      </button>
    </form>
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
</style>
