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
const voiceField = ref<InstanceType<typeof VoiceCaptureField> | null>(null)

const form = reactive({
  title: '',
  description: '',
  category: 'pothole' as IssueCategory,
  locationLabel: '',
  photoDataUrl: '',
})

const latitude = ref<number | undefined>()
const longitude = ref<number | undefined>()
const locating = ref(false)
const locationError = ref('')
const submitError = ref('')

const hasCoords = computed(() => latitude.value !== undefined && longitude.value !== undefined)
const voiceTranscript = computed(() => voiceField.value?.transcript.value.trim() ?? '')
const accountText = computed(() =>
  narrativeText({
    title: form.title,
    description: form.description,
    transcript: voiceTranscript.value,
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
  form.description = ''
  form.category = 'pothole'
  form.locationLabel = ''
  form.photoDataUrl = ''
  latitude.value = undefined
  longitude.value = undefined
  submitError.value = ''
  voiceField.value?.reset()
}

function wait(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

async function submit() {
  if (submitting.value || !currentUser.value) {
    return
  }
  submitError.value = ''
  const note = voiceTranscript.value || form.description.trim()
  if (!form.photoDataUrl || !note || !form.locationLabel.trim()) {
    submitError.value = t('report.incomplete')
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
      description: form.description.trim() || voiceTranscript.value,
      transcript: voiceTranscript.value,
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

    <GlassPanel padding="lg" tone="paper" class="form-panel">
      <form class="form" @submit.prevent="submit">
        <PhotoCaptureField v-model:photo-data-url="form.photoDataUrl" />

        <VoiceCaptureField ref="voiceField" />

        <label class="field">
          <span>{{ t('report.transcript') }}</span>
          <textarea
            class="control"
            rows="3"
            maxlength="800"
            :placeholder="t('report.transcriptPlaceholder')"
            :value="voiceTranscript"
            readonly
          />
        </label>

        <label class="field">
          <span>{{ t('report.description') }}</span>
          <textarea
            v-model="form.description"
            class="control"
            rows="3"
            maxlength="800"
            :placeholder="t('report.descriptionPlaceholder')"
          />
        </label>

        <div class="field">
          <span>{{ t('report.category') }}</span>
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
          <span>{{ t('report.fieldTitle') }} · {{ t('report.titleOptional') }}</span>
          <input
            v-model="form.title"
            class="control"
            type="text"
            maxlength="120"
            :placeholder="t('report.titlePlaceholder')"
            autocomplete="off"
          />
        </label>

        <div class="field">
          <span>{{ t('report.location') }}</span>
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
            class="btn-ghost"
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

        <p v-if="submitError" class="error" role="alert">{{ submitError }}</p>

        <button type="submit" class="btn submit" :disabled="submitting">
          {{ submitLabel }}
        </button>
      </form>
    </GlassPanel>

    <GlassPanel padding="lg" tone="paper" class="summary">
      <p class="section-kicker">{{ t('report.preview') }}</p>
      <h2 class="summary-title">{{ form.title.trim() || t('report.untitled') }}</h2>
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
  </section>
</template>

<style scoped>
.report {
  display: grid;
  gap: 0.85rem;
}

.form {
  display: grid;
  gap: 0.95rem;
}

.field {
  display: grid;
  gap: 0.4rem;
}

.field > span {
  font-size: 0.7rem;
  font-weight: 650;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
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
  font-size: 0.78rem;
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

.submit {
  width: 100%;
  margin-top: 0.15rem;
}

.error {
  margin: 0;
  font-size: 0.82rem;
  color: #b42318;
}

.summary {
  display: none;
}

.summary-title {
  margin: 0 0 0.85rem;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-h);
  font-family: var(--font-display);
  line-height: 1.25;
}

.summary-list {
  margin: 0;
  display: grid;
  gap: 0.7rem;
}

.summary-list dt {
  font-size: 0.68rem;
  font-weight: 650;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.summary-list dd {
  margin: 0.15rem 0 0;
  color: var(--text-h);
  font-weight: 600;
}

@media (min-width: 1024px) {
  .report {
    grid-template-columns: minmax(0, 1.2fr) minmax(16rem, 0.7fr);
    align-items: start;
  }

  .report > :first-child {
    grid-column: 1 / -1;
  }

  .summary {
    display: block;
    position: sticky;
    top: 1.1rem;
  }

  .submit {
    width: fit-content;
  }
}
</style>
