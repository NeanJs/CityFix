<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { issueCategories } from '../data/categories'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { useIssues } from '../composables/useIssues'
import { useLocale } from '../composables/useLocale'
import type { IssueCategory } from '../types/issue'
import AppHeader from '../components/layout/AppHeader.vue'
import PhotoCaptureField from '../components/report/PhotoCaptureField.vue'
import VoiceCaptureField from '../components/report/VoiceCaptureField.vue'
import GlassPanel from '../components/ui/GlassPanel.vue'
import {
  buildReportSummary,
  buildReportTitle,
  inferSeverity,
  narrativeText,
} from '../services/report/enrichReport'

const { addIssue } = useIssues()
const { currentUser } = useAuth()
const { t } = useLocale()
const router = useRouter()
const submitting = ref(false)
const submitStage = ref<'receive' | 'read' | 'file'>('receive')
const voiceField = ref<{ reset: () => void } | null>(null)
const detailsOpen = ref(false)
const step = ref<1 | 2 | 3>(1)

const form = reactive({
  title: '',
  category: 'pothole' as IssueCategory,
  locationLabel: '',
  photoDataUrl: '',
  transcript: '',
})

const latitude = ref<number | undefined>()
const longitude = ref<number | undefined>()
const locating = ref(false)
const locationError = ref('')
const submitError = ref('')

const hasCoords = computed(() => latitude.value !== undefined && longitude.value !== undefined)
const hasPhoto = computed(() => Boolean(form.photoDataUrl))
const hasNote = computed(() => Boolean(form.transcript.trim()))
const hasPlace = computed(() => Boolean(form.locationLabel.trim()))
const canSubmit = computed(() => hasPhoto.value && hasNote.value && hasPlace.value)

const missingKeys = computed(() => {
  const keys: string[] = []
  if (!hasPhoto.value) {
    keys.push('report.missingPhoto')
  }
  if (!hasNote.value) {
    keys.push('report.missingNote')
  }
  if (!hasPlace.value) {
    keys.push('report.missingPlace')
  }
  return keys
})

const accountText = computed(() =>
  narrativeText({
    title: form.title,
    description: form.transcript,
    transcript: form.transcript,
    category: form.category,
  }),
)

const submitLabel = computed(() => {
  if (!submitting.value) {
    return t('report.submit')
  }
  if (submitStage.value === 'receive') {
    return t('report.stageReceive')
  }
  if (submitStage.value === 'read') {
    return t('report.stageRead')
  }
  return t('report.stageFile')
})

function useCurrentLocation() {
  locationError.value = ''
  if (!navigator.geolocation) {
    locationError.value = t('report.locationUnavailable')
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
      locationError.value = t('report.locationDenied')
    },
    { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
  )
}

function resetForm() {
  form.title = ''
  form.category = 'pothole'
  form.locationLabel = ''
  form.photoDataUrl = ''
  form.transcript = ''
  latitude.value = undefined
  longitude.value = undefined
  submitError.value = ''
  detailsOpen.value = false
  step.value = 1
  voiceField.value?.reset()
}

function wait(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

function goNext() {
  if (step.value === 1 && hasPhoto.value) {
    step.value = 2
    return
  }
  if (step.value === 2 && hasNote.value) {
    step.value = 3
  }
}

function goBack() {
  if (step.value === 3) {
    step.value = 2
    return
  }
  if (step.value === 2) {
    step.value = 1
  }
}

async function submit() {
  if (submitting.value || !currentUser.value) {
    return
  }
  submitError.value = ''
  const note = form.transcript.trim()
  if (!form.photoDataUrl || !note || !form.locationLabel.trim()) {
    submitError.value = t('report.incomplete')
    if (!form.photoDataUrl) {
      step.value = 1
    } else if (!note) {
      step.value = 2
    } else {
      step.value = 3
    }
    return
  }
  submitting.value = true
  submitStage.value = 'receive'
  try {
    await wait(380)
    submitStage.value = 'read'
    const severity = inferSeverity(accountText.value)
    const title = buildReportTitle(
      t(`category.${form.category}`),
      form.locationLabel,
      form.title,
    )
    const summary = buildReportSummary(
      t(`severity.${severity}`),
      t(`category.${form.category}`),
      form.locationLabel,
    )
    await wait(420)
    submitStage.value = 'file'
    const issue = await addIssue({
      title,
      description: note,
      transcript: note,
      summary,
      category: form.category,
      severity,
      locationLabel: form.locationLabel,
      latitude: latitude.value,
      longitude: longitude.value,
      photoDataUrl: form.photoDataUrl,
      reporterId: currentUser.value.id,
    })
    await wait(280)
    resetForm()
    await router.replace({ name: 'reportReceipt', params: { id: issue.id } })
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <section class="report">
    <AppHeader :subtitle="t('report.title')" show-account />

    <ol class="steps" :aria-label="t('report.stepOf', { current: step, total: 3 })">
      <li :class="{ active: step === 1, done: step > 1 }">{{ t('report.stepPhoto') }}</li>
      <li :class="{ active: step === 2, done: step > 2 }">{{ t('report.stepVoice') }}</li>
      <li :class="{ active: step === 3 }">{{ t('report.stepPlace') }}</li>
    </ol>

    <GlassPanel padding="lg" tone="paper" class="form-panel">
      <form class="form" @submit.prevent="submit">
        <PhotoCaptureField v-if="step === 1" v-model:photo-data-url="form.photoDataUrl" />

        <VoiceCaptureField
          v-if="step === 2"
          ref="voiceField"
          v-model:transcript="form.transcript"
        />

        <div v-if="step === 3" class="place-step">
          <div class="field">
            <span class="field-label">{{ t('report.location') }}</span>
            <input
              v-model="form.locationLabel"
              class="control"
              type="text"
              maxlength="160"
              :placeholder="t('report.locationPlaceholder')"
              autocomplete="street-address"
            />
            <button
              type="button"
              class="btn-secondary"
              :disabled="locating"
              @click="useCurrentLocation"
            >
              {{ locating ? t('report.locating') : t('report.useGps') }}
            </button>
            <p v-if="hasCoords" class="coords hint">
              {{ latitude?.toFixed(5) }}, {{ longitude?.toFixed(5) }}
            </p>
            <p v-if="locationError" class="error">{{ locationError }}</p>
          </div>

          <details class="details" :open="detailsOpen" @toggle="detailsOpen = ($event.target as HTMLDetailsElement).open">
            <summary class="field-label">{{ t('report.details') }}</summary>
            <div class="field">
              <span class="field-label">{{ t('report.category') }}</span>
              <div class="category-row" role="group" :aria-label="t('report.category')">
                <button
                  v-for="cat in issueCategories"
                  :key="cat.id"
                  type="button"
                  class="category-chip"
                  :class="{ active: form.category === cat.id }"
                  @click="form.category = cat.id"
                >
                  {{ t(`category.${cat.id}`) }}
                </button>
              </div>
            </div>
            <label class="field">
              <span class="field-label">{{ t('report.fieldTitle') }} · {{ t('report.titleOptional') }}</span>
              <input
                v-model="form.title"
                class="control"
                type="text"
                maxlength="120"
                :placeholder="t('report.titlePlaceholder')"
                autocomplete="off"
              />
            </label>
          </details>

          <GlassPanel padding="md" tone="paper" class="mobile-preview">
            <p class="section-kicker">{{ t('report.preview') }}</p>
            <img v-if="form.photoDataUrl" class="preview-photo" :src="form.photoDataUrl" alt="" />
            <h2 class="summary-title">{{ form.title.trim() || t('report.untitled') }}</h2>
            <p class="preview-note">{{ form.transcript.trim() || t('report.missingNote') }}</p>
            <p class="preview-place">{{ form.locationLabel.trim() || t('report.locationUnset') }}</p>
          </GlassPanel>
        </div>

        <div class="step-nav">
          <button v-if="step > 1" type="button" class="btn-secondary" @click="goBack">
            {{ t('report.back') }}
          </button>
          <button
            v-if="step === 1"
            type="button"
            class="btn"
            :disabled="!hasPhoto"
            @click="goNext"
          >
            {{ t('report.continue') }}
          </button>
          <button
            v-if="step === 2"
            type="button"
            class="btn"
            :disabled="!hasNote"
            @click="goNext"
          >
            {{ t('report.continue') }}
          </button>
        </div>

        <p v-if="submitError" class="error" role="alert">{{ submitError }}</p>
      </form>
    </GlassPanel>

    <GlassPanel padding="lg" tone="paper" class="summary">
      <p class="section-kicker">{{ t('report.preview') }}</p>
      <img v-if="form.photoDataUrl" class="preview-photo" :src="form.photoDataUrl" alt="" />
      <h2 class="summary-title">{{ form.title.trim() || t('report.untitled') }}</h2>
      <p class="preview-note">{{ form.transcript.trim() || '—' }}</p>
      <dl class="summary-list">
        <div>
          <dt>{{ t('report.category') }}</dt>
          <dd>{{ t(`category.${form.category}`) }}</dd>
        </div>
        <div>
          <dt>{{ t('report.location') }}</dt>
          <dd>{{ form.locationLabel.trim() || t('report.locationUnset') }}</dd>
        </div>
        <div>
          <dt>{{ t('report.gps') }}</dt>
          <dd>{{ hasCoords ? t('report.gpsCaptured') : t('report.gpsOptional') }}</dd>
        </div>
      </dl>
    </GlassPanel>

    <div v-if="step === 3" class="sticky">
      <p class="sticky-status">
        {{ canSubmit ? t('report.ready') : missingKeys.map((key) => t(key)).join(' · ') }}
      </p>
      <button type="button" class="btn submit" :disabled="submitting" @click="submit">
        {{ submitLabel }}
      </button>
    </div>
  </section>
</template>

<style scoped>
.report {
  display: grid;
  gap: 0.85rem;
}

.steps {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.35rem;
}

.steps li {
  padding: 0.45rem 0.4rem;
  border-bottom: 2px solid var(--border);
  color: var(--text-muted);
  font-size: 0.82rem;
  font-weight: 650;
  text-align: center;
}

.steps li.active {
  color: var(--text-h);
  border-bottom-color: var(--accent);
}

.steps li.done {
  color: var(--text-h);
  border-bottom-color: var(--text-muted);
}

.form {
  display: grid;
  gap: 0.95rem;
}

.place-step,
.field {
  display: grid;
  gap: 0.5rem;
}

.details {
  display: grid;
  gap: 0.75rem;
}

.details summary {
  cursor: pointer;
}

.category-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.category-chip {
  min-height: 2.25rem;
  padding: 0.35rem 0.6rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface-raised);
  color: var(--text-muted);
  font-size: 0.8rem;
  font-weight: 650;
  cursor: pointer;
}

.category-chip.active {
  color: var(--text-h);
  border-color: var(--accent);
  background: var(--surface);
}

.coords {
  font-variant-numeric: tabular-nums;
}

.step-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.submit {
  width: 100%;
}

.error {
  margin: 0;
  font-size: 0.82rem;
  color: var(--danger);
}

.summary {
  display: none;
}

.mobile-preview {
  display: grid;
  gap: 0.4rem;
}

.preview-photo {
  display: block;
  width: 100%;
  max-height: 10rem;
  object-fit: cover;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
}

.summary-title {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--text-h);
  font-family: var(--font-display);
  line-height: 1.25;
}

.preview-note,
.preview-place {
  margin: 0;
  color: var(--text);
  font-size: 0.92rem;
}

.summary-list {
  margin: 0;
  display: grid;
  gap: 0.7rem;
}

.summary-list dt {
  font-size: 0.78rem;
  font-weight: 650;
  color: var(--text-muted);
}

.summary-list dd {
  margin: 0.15rem 0 0;
  color: var(--text-h);
  font-weight: 600;
}

.sticky {
  position: sticky;
  bottom: calc(5.4rem + env(safe-area-inset-bottom, 0px));
  z-index: 8;
  display: grid;
  gap: 0.45rem;
  padding: 0.75rem 0.85rem;
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  background: var(--glass-bg-strong);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  box-shadow: var(--dock-shadow);
}

.sticky-status {
  margin: 0;
  font-size: 0.82rem;
  font-weight: 650;
  color: var(--text-muted);
}

@media (min-width: 1024px) {
  .report {
    grid-template-columns: minmax(0, 1.2fr) minmax(16rem, 0.7fr);
    align-items: start;
  }

  .report > :first-child,
  .report > .steps,
  .report > .sticky {
    grid-column: 1 / -1;
  }

  .mobile-preview {
    display: none;
  }

  .summary {
    display: grid;
    gap: 0.7rem;
    position: sticky;
    top: 1.1rem;
  }

  .submit {
    width: fit-content;
  }

  .sticky {
    bottom: 1rem;
    grid-template-columns: 1fr auto;
    align-items: center;
  }
}
</style>
