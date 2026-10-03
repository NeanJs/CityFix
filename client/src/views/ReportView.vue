<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { issueCategories } from '../data/categories'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { useAndroidBackHandler } from '../composables/useAndroidBackHandler'
import { useIssues } from '../composables/useIssues'
import { useLocale } from '../composables/useLocale'
import { blobFromDataUrl, ingestReport } from '../services/api/ingestReport'
import type { IssueCategory, IssueSeverity } from '../types/issue'
import type { ReportIngestDraft } from '../types/reportIngest'
import AppHeader from '../components/layout/AppHeader.vue'
import LocationPickerField from '../components/report/LocationPickerField.vue'
import PhotoCaptureField from '../components/report/PhotoCaptureField.vue'
import VoiceCaptureField from '../components/report/VoiceCaptureField.vue'
import GlassPanel from '../components/ui/GlassPanel.vue'

const severities: IssueSeverity[] = ['low', 'medium', 'high']

const { addIssue } = useIssues()
const { reporterId } = useAuth()
const { t } = useLocale()
const router = useRouter()
const submitting = ref(false)
const submitStage = ref<'read' | 'file'>('read')
const phase = ref<'capture' | 'review'>('capture')
const editing = ref(false)
const voiceField = ref<{ reset: () => void; stop: () => Promise<Blob | null> } | null>(null)

const form = reactive({
  photoDataUrl: '',
  transcript: '',
  locationLabel: '',
})
const audioBlob = ref<Blob | null>(null)
const latitude = ref<number | undefined>()
const longitude = ref<number | undefined>()
const submitError = ref('')

const draft = reactive<ReportIngestDraft>({
  title: '',
  description: '',
  transcript: '',
  summary: '',
  category: 'pothole',
  severity: 'medium',
  locationLabel: '',
  status: 'submitted',
})

const hasPhoto = computed(() => Boolean(form.photoDataUrl))
const hasVoice = computed(() => Boolean(audioBlob.value))
const hasText = computed(() => Boolean(form.transcript.trim()))
const canSend = computed(() => hasPhoto.value || hasVoice.value || hasText.value)
const reviewActive = computed(() => phase.value === 'review')

const submitLabel = computed(() => {
  if (!submitting.value) {
    return t('report.submit')
  }
  return t('report.stageRead')
})

const confirmLabel = computed(() => {
  if (submitting.value) {
    return t('report.stageFile')
  }
  return editing.value ? t('report.confirmEdits') : t('report.confirm')
})

useAndroidBackHandler(reviewActive, goBack)

function applyDraft(next: ReportIngestDraft) {
  draft.title = next.title
  draft.description = next.description
  draft.transcript = next.transcript
  draft.summary = next.summary
  draft.category = next.category
  draft.severity = next.severity
  draft.locationLabel = next.locationLabel
  draft.latitude = next.latitude
  draft.longitude = next.longitude
  draft.photoUrl = next.photoUrl
  draft.trackingId = next.trackingId
  draft.status = next.status ?? 'submitted'
  draft.createdAt = next.createdAt
  if (next.latitude !== undefined) {
    latitude.value = next.latitude
  }
  if (next.longitude !== undefined) {
    longitude.value = next.longitude
  }
}

watch([latitude, longitude], ([lat, lng]) => {
  draft.latitude = lat
  draft.longitude = lng
})

function resetForm() {
  form.photoDataUrl = ''
  form.transcript = ''
  form.locationLabel = ''
  audioBlob.value = null
  latitude.value = undefined
  longitude.value = undefined
  submitError.value = ''
  editing.value = false
  phase.value = 'capture'
  applyDraft({
    title: '',
    description: '',
    transcript: '',
    summary: '',
    category: 'pothole',
    severity: 'medium',
    locationLabel: '',
    status: 'submitted',
  })
  voiceField.value?.reset()
}

function goBack() {
  if (submitting.value) {
    return
  }
  if (phase.value === 'review') {
    phase.value = 'capture'
    editing.value = false
    submitError.value = ''
  }
}

async function send() {
  if (submitting.value) {
    return
  }
  submitError.value = ''
  const note = form.transcript.trim()
  await voiceField.value?.stop()
  if (!form.photoDataUrl && !audioBlob.value && !note) {
    submitError.value = t('report.incomplete')
    return
  }
  submitting.value = true
  submitStage.value = 'read'
  try {
    const photo = form.photoDataUrl ? await blobFromDataUrl(form.photoDataUrl) : undefined
    const next = await ingestReport({
      photo,
      audio: audioBlob.value ?? undefined,
      text: note || undefined,
      locationLabel: form.locationLabel.trim() || undefined,
      latitude: latitude.value,
      longitude: longitude.value,
      confirmed: false,
    })
    applyDraft({
      ...next,
      transcript: next.transcript || note,
      description: next.description || next.transcript || note,
      locationLabel: next.locationLabel || form.locationLabel.trim(),
      photoUrl: next.photoUrl || form.photoDataUrl,
    })
    editing.value = false
    phase.value = 'review'
  } catch {
    submitError.value = t('report.ingestFailed')
  } finally {
    submitting.value = false
  }
}

async function confirm() {
  if (submitting.value) {
    return
  }
  submitError.value = ''
  submitting.value = true
  submitStage.value = 'file'
  try {
    const photo = form.photoDataUrl ? await blobFromDataUrl(form.photoDataUrl) : undefined
    const next = await ingestReport({
      photo,
      audio: audioBlob.value ?? undefined,
      text: form.transcript.trim() || draft.description.trim() || undefined,
      locationLabel: draft.locationLabel.trim() || undefined,
      latitude: draft.latitude ?? latitude.value,
      longitude: draft.longitude ?? longitude.value,
      confirmed: true,
      draft: { ...draft },
    })
    applyDraft(next)
    const description =
      next.description.trim() || next.transcript.trim() || next.summary.trim() || next.title.trim()
    const issue = await addIssue({
      title: next.title.trim() || next.summary.trim() || t('report.untitled'),
      description: description || t('report.untitled'),
      transcript: next.transcript.trim() || next.description.trim() || form.transcript.trim(),
      summary: next.summary.trim() || description || t('report.untitled'),
      category: next.category,
      severity: next.severity,
      locationLabel: next.locationLabel.trim() || t('report.locationUnset'),
      latitude: next.latitude ?? latitude.value,
      longitude: next.longitude ?? longitude.value,
      photoDataUrl: next.photoUrl || form.photoDataUrl,
      reporterId: reporterId.value,
      trackingId: next.trackingId,
    })
    resetForm()
    await router.replace({ name: 'reportReceipt', params: { id: issue.id } })
  } catch {
    submitError.value = t('report.fileFailed')
  } finally {
    submitting.value = false
  }
}

function setCategory(id: IssueCategory) {
  if (!editing.value) {
    return
  }
  draft.category = id
}

function setSeverity(id: IssueSeverity) {
  if (!editing.value) {
    return
  }
  draft.severity = id
}
</script>

<template>
  <section class="report">
    <AppHeader :subtitle="t('report.title')" show-account />

    <ol class="steps" :aria-label="t('report.stepOf', { current: phase === 'capture' ? 1 : 2, total: 2 })">
      <li :class="{ active: phase === 'capture', done: phase === 'review' }">{{ t('report.capture') }}</li>
      <li :class="{ active: phase === 'review' }">{{ t('report.review') }}</li>
    </ol>

    <GlassPanel v-if="phase === 'capture'" padding="lg" tone="fill" class="form-panel">
      <form class="form" @submit.prevent="send">
        <p class="lead">{{ t('report.lead') }}</p>

        <PhotoCaptureField v-model:photo-data-url="form.photoDataUrl" />

        <LocationPickerField v-model:latitude="latitude" v-model:longitude="longitude" />

        <label class="field">
          <span class="field-label">{{ t('report.locationName') }}</span>
          <input
            v-model="form.locationLabel"
            class="control"
            type="text"
            maxlength="160"
            :placeholder="t('report.locationPlaceholder')"
            autocomplete="street-address"
          />
        </label>

        <VoiceCaptureField
          ref="voiceField"
          v-model:transcript="form.transcript"
          v-model:audio-blob="audioBlob"
          :include-note="false"
        />

        <label class="field">
          <span class="field-label">{{ t('report.transcript') }}</span>
          <p class="hint">{{ t('report.transcriptHint') }}</p>
          <textarea
            v-model="form.transcript"
            class="control"
            rows="4"
            maxlength="800"
            :placeholder="t('report.transcriptPlaceholder')"
          />
        </label>

        <LocationPickerField v-model:latitude="latitude" v-model:longitude="longitude" />

        <label class="field">
          <span class="field-label">{{ t('report.locationName') }}</span>
          <input
            v-model="form.locationLabel"
            class="control"
            type="text"
            maxlength="160"
            :placeholder="t('report.locationPlaceholder')"
            autocomplete="street-address"
          />
        </label>

        <p v-if="submitError" class="error" role="alert">{{ submitError }}</p>
      </form>
    </GlassPanel>

    <div v-if="phase === 'capture'" class="sticky">
      <p class="sticky-status">{{ canSend ? t('report.ready') : t('report.missingInput') }}</p>
      <div class="step-nav">
        <button type="button" class="btn submit" :disabled="submitting || !canSend" @click="send">
          {{ submitLabel }}
        </button>
        <button
          v-if="submitError"
          type="button"
          class="btn-secondary"
          :disabled="submitting || !canSend"
          @click="send"
        >
          {{ t('report.retry') }}
        </button>
      </div>
    </div>

    <GlassPanel v-else padding="lg" tone="fill" class="form-panel">
      <form class="form" @submit.prevent="confirm">
        <p class="lead">{{ t('report.reviewLead') }}</p>
        <img
          v-if="form.photoDataUrl || draft.photoUrl"
          class="preview-photo"
          :src="draft.photoUrl || form.photoDataUrl"
          alt=""
        />

        <div class="summary-list readonly">
          <div>
            <dt>{{ t('report.trackingId') }}</dt>
            <dd>{{ draft.trackingId || t('report.pendingId') }}</dd>
          </div>
        </div>

        <label class="field">
          <span class="field-label">{{ t('report.fieldTitle') }}</span>
          <input
            v-model="draft.title"
            class="control"
            type="text"
            maxlength="120"
            :readonly="!editing"
            :placeholder="t('report.titlePlaceholder')"
            autocomplete="off"
          />
        </label>

        <div class="field">
          <span class="field-label">{{ t('report.category') }}</span>
          <div class="category-row" role="group" :aria-label="t('report.category')">
            <button
              v-for="cat in issueCategories"
              :key="cat.id"
              type="button"
              class="category-chip"
              :class="{ active: draft.category === cat.id }"
              :disabled="!editing"
              @click="setCategory(cat.id)"
            >
              {{ t(`category.${cat.id}`) }}
            </button>
          </div>
        </div>

        <div class="field">
          <span class="field-label">{{ t('sheet.severity') }}</span>
          <div class="category-row" role="group" :aria-label="t('sheet.severity')">
            <button
              v-for="level in severities"
              :key="level"
              type="button"
              class="category-chip"
              :class="{ active: draft.severity === level }"
              :disabled="!editing"
              @click="setSeverity(level)"
            >
              {{ t(`severity.${level}`) }}
            </button>
          </div>
        </div>

        <LocationPickerField
          v-model:latitude="latitude"
          v-model:longitude="longitude"
          :disabled="!editing"
        />

        <label class="field">
          <span class="field-label">{{ t('report.locationName') }}</span>
          <input
            v-model="draft.locationLabel"
            class="control"
            type="text"
            maxlength="160"
            :readonly="!editing"
            :placeholder="t('report.locationPlaceholder')"
            autocomplete="street-address"
          />
        </label>

        <label class="field">
          <span class="field-label">{{ t('report.transcript') }}</span>
          <textarea
            v-model="draft.description"
            class="control"
            rows="4"
            maxlength="800"
            :readonly="!editing"
            :placeholder="t('report.transcriptPlaceholder')"
          />
        </label>

        <label class="field">
          <span class="field-label">{{ t('report.summary') }}</span>
          <textarea
            v-model="draft.summary"
            class="control"
            rows="3"
            maxlength="400"
            :readonly="!editing"
          />
        </label>

        <p v-if="submitError" class="error" role="alert">{{ submitError }}</p>
      </form>
    </GlassPanel>

    <div v-if="phase === 'review'" class="sticky">
      <div class="step-nav">
        <button type="button" class="btn-secondary" :disabled="submitting" @click="goBack">
          {{ t('report.back') }}
        </button>
        <button
          v-if="!editing"
          type="button"
          class="btn-secondary"
          :disabled="submitting"
          @click="editing = true"
        >
          {{ t('report.edit') }}
        </button>
        <button type="button" class="btn" :disabled="submitting" @click="confirm">
          {{ confirmLabel }}
        </button>
        <button
          v-if="submitError"
          type="button"
          class="btn-secondary"
          :disabled="submitting"
          @click="confirm"
        >
          {{ t('report.retry') }}
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.report {
  display: grid;
  gap: 0.85rem;
  padding-bottom: 1rem;
}

.steps {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
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
  padding-bottom: 7.5rem;
}

.lead {
  margin: 0;
  color: var(--text);
  font-size: 0.95rem;
  line-height: 1.45;
}

.field {
  display: grid;
  gap: 0.5rem;
}

.category-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.category-chip {
  min-height: 2.25rem;
  padding: 0.35rem 0.6rem;
  border: none;
  border-radius: var(--radius-pill);
  background: #f1f0f0;
  color: var(--text-muted);
  font-size: 0.8rem;
  font-weight: 650;
  cursor: pointer;
}

.category-chip.active {
  color: var(--accent-ink);
  background: var(--ink);
}

.category-chip:disabled {
  cursor: default;
}

.step-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.submit {
  width: 100%;
}

.sticky {
  position: sticky;
  bottom: calc(5.4rem + env(safe-area-inset-bottom, 0px));
  z-index: 8;
  display: grid;
  gap: 0.45rem;
  padding: 0.75rem 0.85rem;
  border-radius: var(--radius-lg);
  background: var(--glass-regular-bg);
}

.sticky-status {
  margin: 0;
  font-size: 0.82rem;
  font-weight: 650;
  color: var(--text-muted);
}

.error {
  margin: 0;
  font-size: 0.82rem;
  color: var(--danger);
}

.preview-photo {
  display: block;
  width: 100%;
  max-height: 14rem;
  object-fit: cover;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
}

.summary-list {
  margin: 0;
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

@media (min-width: 1024px) {
  .report {
    max-width: 44rem;
  }

  .form {
    padding-bottom: 0;
  }

  .submit {
    width: fit-content;
  }

  .sticky {
    bottom: 1rem;
  }
}
</style>
