<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import GlassPanel from '../../components/ui/GlassPanel.vue'
import { useAuth } from '../../composables/useAuth'
import { useLocale } from '../../composables/useLocale'
import { AuthError, homePathForRole } from '../../services/auth/authService'

const { t } = useLocale()
const { register } = useAuth()
const router = useRouter()

const displayName = ref('')
const email = ref('')
const password = ref('')
const submitting = ref(false)
const errorKey = ref('')

async function submit() {
  if (submitting.value) {
    return
  }
  errorKey.value = ''
  submitting.value = true
  try {
    const user = await register({
      displayName: displayName.value,
      email: email.value,
      password: password.value,
    })
    await router.replace(homePathForRole(user.role))
  } catch (error) {
    errorKey.value =
      error instanceof AuthError ? `auth.errors.${error.code}` : 'auth.errors.invalidEmail'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <GlassPanel padding="lg" tone="fill" class="card">
    <h1 class="title">{{ t('auth.register') }}</h1>
    <p class="lead">{{ t('auth.registerLead') }}</p>

    <RouterLink class="btn skip" to="/report">{{ t('auth.toReport') }}</RouterLink>

    <form class="form" @submit.prevent="submit">
      <label class="field">
        <span class="field-label">{{ t('auth.name') }}</span>
        <input
          v-model="displayName"
          class="control"
          type="text"
          autocomplete="name"
          maxlength="80"
        />
      </label>
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
        <input v-model="password" class="control" type="password" autocomplete="new-password" />
      </label>
      <p v-if="errorKey" class="error" role="alert">{{ t(errorKey) }}</p>
      <button type="submit" class="btn submit" :disabled="submitting">
        {{ submitting ? t('auth.submitting') : t('auth.submitRegister') }}
      </button>
    </form>

    <RouterLink class="switch" to="/login">{{ t('auth.toLogin') }}</RouterLink>
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
  font-size: 2.25rem;
  font-weight: 700;
  letter-spacing: -0.02em;
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
  color: var(--accent);
  font-size: 0.85rem;
  font-weight: 650;
  text-decoration: none;
}
</style>
