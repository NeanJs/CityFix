<script setup lang="ts">
import { reactive, ref } from 'vue'
import { issueCategories } from '../data/categories'
import { useRouter } from 'vue-router'
import { useIssues } from '../composables/useIssues'
import type { IssueCategory } from '../types/issue'
import AppHeader from '../components/layout/AppHeader.vue'
import GlassPanel from '../components/ui/GlassPanel.vue'

const { addIssue } = useIssues()
const router = useRouter()
const submitting = ref(false)

const form = reactive({
  title: '',
  description: '',
  category: 'pothole' as IssueCategory,
  locationLabel: '',
})

const latitude = ref<number | undefined>()
const longitude = ref<number | undefined>()
const locating = ref(false)
const locationError = ref('')
const submitError = ref('')

function useCurrentLocation() {
  locationError.value = ''
  if (!navigator.geolocation) {
    locationError.value = 'Location is not available on this device.'
    return
  }
  locating.value = true
  navigator.geolocation.getCurrentPosition(
    (position) => {
      latitude.value = position.coords.latitude
      longitude.value = position.coords.longitude
      if (!form.locationLabel.trim()) {
        form.locationLabel = `${position.coords.latitude.toFixed(5)}, ${position.coords.longitude.toFixed(5)}`
      }
      locating.value = false
    },
    () => {
      locating.value = false
      locationError.value = 'Could not access your location. Enter an address instead.'
    },
    { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
  )
}

function resetForm() {
  form.title = ''
  form.description = ''
  form.category = 'pothole'
  form.locationLabel = ''
  latitude.value = undefined
  longitude.value = undefined
  submitError.value = ''
}

async function submit() {
  if (submitting.value) {
    return
  }
  submitError.value = ''
  if (!form.title.trim() || !form.description.trim() || !form.locationLabel.trim()) {
    submitError.value = 'Add a title, description, and location to continue.'
    return
  }
  submitting.value = true
  try {
    const issue = await addIssue({
      title: form.title,
      description: form.description,
      category: form.category,
      locationLabel: form.locationLabel,
      latitude: latitude.value,
      longitude: longitude.value,
    })
    resetForm()
    await router.push({ path: '/reports', query: { highlight: issue.id } })
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <section class="report">
    <AppHeader subtitle="Tell the city what needs attention" />

    <GlassPanel padding="lg" class="form-panel">
      <form class="form" @submit.prevent="submit">
        <label class="field">
          <span>Title</span>
          <input v-model="form.title" type="text" maxlength="120" placeholder="Short summary" />
        </label>

        <label class="field">
          <span>Category</span>
          <select v-model="form.category">
            <option v-for="cat in issueCategories" :key="cat.id" :value="cat.id">
              {{ cat.label }} — {{ cat.hint }}
            </option>
          </select>
        </label>

        <label class="field">
          <span>Description</span>
          <textarea
            v-model="form.description"
            rows="4"
            maxlength="800"
            placeholder="What happened? Include details crews should know."
          />
        </label>

        <div class="field">
          <span>Location</span>
          <input
            v-model="form.locationLabel"
            type="text"
            maxlength="160"
            placeholder="Intersection, address, or landmark"
          />
          <button
            type="button"
            class="ghost"
            :disabled="locating"
            @click="useCurrentLocation"
          >
            {{ locating ? 'Locating…' : 'Use current location' }}
          </button>
          <p v-if="locationError" class="error">{{ locationError }}</p>
        </div>

        <p v-if="submitError" class="error">{{ submitError }}</p>

        <button type="submit" class="submit" :disabled="submitting">
          {{ submitting ? 'Submitting…' : 'Submit report' }}
        </button>
      </form>
    </GlassPanel>

  </section>
</template>

<style scoped>
.report {
  display: grid;
  gap: 0.85rem;
}

.form {
  display: grid;
  gap: 0.85rem;
}

.field {
  display: grid;
  gap: 0.4rem;
}

.field > span {
  font-size: 0.78rem;
  font-weight: 650;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
}

input,
textarea,
select {
  width: 100%;
  padding: 0.65rem 0.8rem;
  border-radius: 0.85rem;
  border: 1px solid var(--glass-border);
  background: rgba(255, 255, 255, 0.06);
  color: var(--text-h);
  font: inherit;
  font-size: 0.92rem;
}

textarea {
  resize: vertical;
  min-height: 6.5rem;
}

.ghost {
  width: fit-content;
  margin-top: 0.15rem;
  padding: 0.45rem 0.75rem;
  border-radius: 999px;
  border: 1px solid var(--glass-border);
  background: rgba(255, 255, 255, 0.05);
  color: var(--accent);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
}

.ghost:disabled {
  opacity: 0.6;
  cursor: wait;
}

.submit {
  margin-top: 0.25rem;
  width: 100%;
  padding: 0.8rem 1rem;
  border: none;
  border-radius: var(--radius-md);
  font-size: 0.95rem;
  font-weight: 700;
  color: #042f2e;
  cursor: pointer;
  background: linear-gradient(135deg, #5eead4, #38bdf8);
  box-shadow: 0 12px 28px rgba(14, 165, 233, 0.25);
}

.submit:disabled {
  opacity: 0.7;
  cursor: wait;
}

.error {
  margin: 0;
  font-size: 0.82rem;
  color: #f87171;
}

</style>
