<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, toRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { useAndroidBackHandler } from '../composables/useAndroidBackHandler'
import { useIssues } from '../composables/useIssues'
import { useLocale } from '../composables/useLocale'
import { useLocationLabelSync } from '../composables/useLocationLabelSync'
import { defaultIssueType } from '../services/report/issueType'
import {
  classifyReportInput,
  reportCitizenWordsKey,
  reportDescriptionKey,
} from '../services/report/reportInputKind'
import { apiErrorMessage } from '../services/api/apiRequestError'
import { getVoiceConversationIssue } from '../services/api/voiceConversationIssue'
import { takeVoiceReportHandoff } from '../services/voice/voiceReportHandoff'
import { blobFromDataUrl, ingestReport } from '../services/api/ingestReport'
import { isAnalyzeImage } from '../services/media/formFile'
import { buildCreateReportBody, createReport } from '../services/api/reportsApi'
import type { ReportIngestDraft } from '../types/reportIngest'
import AppHeader from '../components/layout/AppHeader.vue'
import LocationPickerField from '../components/report/LocationPickerField.vue'
import PhotoCaptureField from '../components/report/PhotoCaptureField.vue'
import ReportFlowSteps from '../components/report/ReportFlowSteps.vue'
import VoiceCaptureField from '../components/report/VoiceCaptureField.vue'
import AppIcon from '../components/ui/AppIcon.vue'
import GlassPanel from '../components/ui/GlassPanel.vue'
import MorphText from '../components/ui/MorphText.vue'
import SeverityPill from '../components/SeverityPill.vue'
import VoiceGlyph from '../components/voice/VoiceGlyph.vue'
import { flipLayout } from '../motion/flip'
import { enterBlocks } from '../motion/transitions'

const emptyFrequency = new Uint8Array(0)

const { addIssue } = useIssues()
const { reporterId } = useAuth()
const { t, issueTypeLabel } = useLocale()
const route = useRoute()
const router = useRouter()
const submitting = ref(false)
const submitStage = ref<'read' | 'file'>('read')
const phase = ref<'capture' | 'review'>('capture')
const voiceField = ref<{
  reset: () => void
  stop: () => Promise<Blob | null>
  awaitTranscript: () => Promise<string>
  busy: boolean
} | null>(null)
const reportRoot = ref<HTMLElement | null>(null)
const commandEl = ref<HTMLElement | null>(null)
const keyboardInset = ref(0)
const dockSpace = ref(9.5 * 16)

const form = reactive({
  photoDataUrl: '',
  transcript: '',
  locationLabel: '',
})
const photoFile = ref<File | null>(null)
const audioBlob = ref<Blob | null>(null)
const latitude = ref<number | undefined>()
const longitude = ref<number | undefined>()
const submitError = ref('')
const pendingConversationId = ref('')
const conversationOrigin = ref(false)

const draft = reactive<ReportIngestDraft>({
  title: '',
  description: '',
  transcript: '',
  summary: '',
  issueType: defaultIssueType,
  severity: 'medium',
  locationLabel: '',
  status: 'queued',
})

const hasPhoto = computed(() => Boolean(form.photoDataUrl))
const hasText = computed(() => Boolean(form.transcript.trim()))
const canSend = computed(() => hasPhoto.value || hasText.value)
const canRetryConversation = computed(
  () => Boolean(pendingConversationId.value && submitError.value) && !canSend.value,
)
const reviewActive = computed(() => phase.value === 'review')
const captureActive = computed(() => phase.value === 'capture')
const readingReport = computed(() => submitting.value && phase.value === 'capture')
const { geocoding, markLocationLabelManual, resetLocationLabelSync } = useLocationLabelSync({
  latitude,
  longitude,
  locationLabel: toRef(form, 'locationLabel'),
  enabled: captureActive,
})
const step = computed<1 | 2>(() => (phase.value === 'review' ? 2 : 1))
const photoSrc = computed(() => draft.photoUrl || form.photoDataUrl)
const reviewDescription = computed(() => draft.description.trim())
const reviewSummary = computed(() => {
  const summary = draft.summary.trim()
  const description = reviewDescription.value
  if (!summary || (description && summary.toLowerCase() === description.toLowerCase())) {
    return ''
  }
  return summary
})
const citizenWords = computed(() => draft.transcript.trim() || form.transcript.trim())
const reportInputKind = computed(() =>
  classifyReportInput({
    hasPhoto: Boolean(photoSrc.value),
    hasVoiceNote: Boolean(audioBlob.value),
    hasWritten: Boolean(citizenWords.value),
    fromConversation: conversationOrigin.value,
  }),
)
const descriptionLabel = computed(() => t(reportDescriptionKey(reportInputKind.value)))
const citizenWordsLabel = computed(() => t(reportCitizenWordsKey(reportInputKind.value)))
const showCitizenWords = computed(() => {
  const words = citizenWords.value
  if (!words) {
    return false
  }
  const normalized = words.toLowerCase()
  if (reviewDescription.value && normalized === reviewDescription.value.toLowerCase()) {
    return false
  }
  if (reviewSummary.value && normalized === reviewSummary.value.toLowerCase()) {
    return false
  }
  return true
})

const submitLabel = computed(() => {
  if (submitting.value) {
    return t('report.stageRead')
  }
  if (submitError.value) {
    return t('report.retry')
  }
  return t('report.continue')
})

const confirmLabel = computed(() => {
  if (submitting.value) {
    return t('report.stageFile')
  }
  if (submitError.value) {
    return t('report.retry')
  }
  return t('report.confirm')
})

const primaryLabel = computed(() =>
  phase.value === 'review' ? confirmLabel.value : submitLabel.value,
)

const commandStatusText = computed(() => {
  if (submitting.value && phase.value === 'capture') {
    return t('report.stageRead')
  }
  if (submitting.value && phase.value === 'review') {
    return t('report.stageFile')
  }
  if (phase.value === 'capture') {
    return canSend.value ? t('report.ready') : t('report.missingInput')
  }
  return t('report.reviewReady')
})

const introKicker = computed(() =>
  phase.value === 'capture' ? t('report.eyebrow') : t('report.reviewEyebrow'),
)
const introHeading = computed(() =>
  phase.value === 'capture' ? t('report.heading') : t('report.reviewHeading'),
)
const introLead = computed(() =>
  phase.value === 'capture' ? t('report.lead') : t('report.reviewLead'),
)

function silentFrequency() {
  return emptyFrequency
}

async function setPhase(next: 'capture' | 'review') {
  const root = reportRoot.value
  await flipLayout({
    targets: root ? root.querySelectorAll('[data-flip-id]') : '[data-flip-id]',
    mutate: () => {
      phase.value = next
    },
    absolute: true,
    nested: true,
  })
  if (next === 'review') {
    await nextTick()
    const blocks = root?.querySelectorAll('.review-card [data-enter-block]')
    if (blocks?.length) {
      enterBlocks(blocks)
    }
  }
}

useAndroidBackHandler(reviewActive, goBack)

function applyDraft(next: ReportIngestDraft) {
  draft.title = next.title
  draft.description = next.description
  draft.transcript = next.transcript
  draft.summary = next.summary
  draft.issueType = next.issueType
  draft.severity = next.severity
  draft.locationLabel = next.locationLabel
  draft.latitude = next.latitude
  draft.longitude = next.longitude
  draft.photoUrl = next.photoUrl
  draft.recommendedAction = next.recommendedAction
  draft.trackingId = next.trackingId
  draft.status = next.status ?? 'queued'
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

watch(
  () => form.photoDataUrl,
  async (value, previous) => {
    if (!value || value === previous) {
      return
    }
    await nextTick()
    const voice = reportRoot.value?.querySelector('[data-voice-capture]')
    if (!(voice instanceof HTMLElement)) {
      return
    }
    const fold = window.visualViewport?.height ?? window.innerHeight
    if (voice.getBoundingClientRect().bottom > fold - 8) {
      voice.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  },
)

function measureDock() {
  const dock = commandEl.value
  if (dock) {
    dockSpace.value = dock.offsetHeight + 16
  }
}

function updateKeyboardInset() {
  const viewport = window.visualViewport
  if (!viewport) {
    keyboardInset.value = 0
    return
  }
  keyboardInset.value = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop)
}

function onReportFocusIn(event: FocusEvent) {
  const target = event.target
  if (!(target instanceof HTMLElement) || !target.matches('input, textarea')) {
    return
  }
  window.setTimeout(() => {
    target.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, 80)
}

onMounted(() => {
  measureDock()
  updateKeyboardInset()
  window.visualViewport?.addEventListener('resize', updateKeyboardInset)
  window.visualViewport?.addEventListener('scroll', updateKeyboardInset)
  window.addEventListener('resize', measureDock)
  const conversation = route.query.conversation
  if (typeof conversation === 'string' && conversation.trim()) {
    pendingConversationId.value = conversation.trim()
    void importConversation()
  }
})

onBeforeUnmount(() => {
  window.visualViewport?.removeEventListener('resize', updateKeyboardInset)
  window.visualViewport?.removeEventListener('scroll', updateKeyboardInset)
  window.removeEventListener('resize', measureDock)
})

watch([phase, submitting, submitError, canSend], async () => {
  await nextTick()
  measureDock()
})

function resetForm() {
  resetLocationLabelSync()
  form.photoDataUrl = ''
  photoFile.value = null
  form.transcript = ''
  form.locationLabel = ''
  audioBlob.value = null
  conversationOrigin.value = false
  latitude.value = undefined
  longitude.value = undefined
  submitError.value = ''
  phase.value = 'capture'
  applyDraft({
    title: '',
    description: '',
    transcript: '',
    summary: '',
    issueType: defaultIssueType,
    severity: 'medium',
    locationLabel: '',
    status: 'queued',
  })
  voiceField.value?.reset()
}

function goBack() {
  if (submitting.value) {
    return
  }
  if (phase.value === 'review') {
    void setPhase('capture')
    submitError.value = ''
  }
}

function placeForApi(label: string) {
  const trimmed = label.trim()
  if (!trimmed || trimmed === t('report.locationUnset')) {
    return undefined
  }
  return trimmed
}

async function analyzeReportInput(note: string) {
  const storedPhoto = photoFile.value
  const photo =
    (isAnalyzeImage(storedPhoto) ? storedPhoto : undefined) ??
    (form.photoDataUrl.startsWith('data:image')
      ? await blobFromDataUrl(form.photoDataUrl)
      : undefined)
  const next = await ingestReport({
    photo,
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
  await setPhase('review')
}

async function send() {
  if (submitting.value) {
    return
  }
  submitError.value = ''
  submitting.value = true
  submitStage.value = 'read'
  try {
    await voiceField.value?.stop()
    const note = (await voiceField.value?.awaitTranscript())?.trim() || form.transcript.trim()
    if (!form.photoDataUrl && !note) {
      submitError.value = audioBlob.value ? t('report.transcribeFailed') : t('report.incomplete')
      return
    }
    await analyzeReportInput(note)
  } catch (error) {
    submitError.value = apiErrorMessage(error, t, 'report.ingestFailed')
  } finally {
    submitting.value = false
  }
}

async function importConversation() {
  if (submitting.value || !pendingConversationId.value) {
    return
  }
  submitError.value = ''
  submitting.value = true
  submitStage.value = 'read'
  try {
    const conversationId = pendingConversationId.value
    const next = await getVoiceConversationIssue(conversationId)
    const handoff = takeVoiceReportHandoff(conversationId)
    const note = next.transcript.trim() || handoff?.userTranscript.trim() || ''
    form.transcript = note
    conversationOrigin.value = true
    applyDraft({
      ...next,
      transcript: next.transcript || note,
      description: next.description || next.transcript || note,
      title: next.title || next.summary || next.description || note,
      locationLabel: next.locationLabel || form.locationLabel.trim(),
      photoUrl: next.photoUrl || form.photoDataUrl,
    })
    pendingConversationId.value = ''
    if (route.query.conversation) {
      await router.replace({ name: 'report' })
    }
    await setPhase('review')
  } catch (error) {
    submitError.value = apiErrorMessage(error, t, 'report.voiceConversationFailed')
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
    const place = placeForApi(draft.locationLabel) || placeForApi(form.locationLabel)
    const note = draft.transcript.trim() || form.transcript.trim()
    const description =
      draft.description.trim() || note || draft.summary.trim() || draft.title.trim()
    const title =
      draft.title.trim() || draft.summary.trim() || description || t('report.untitled')
    const request = {
      issueType: draft.issueType.trim() || defaultIssueType,
      title,
      description: description || title,
      severity: draft.severity,
      locationDescription: place,
      latitude: draft.latitude ?? latitude.value,
      longitude: draft.longitude ?? longitude.value,
      transcript: note || undefined,
      recommendedAction: draft.recommendedAction,
      photoUrl: draft.photoUrl,
    }
    let recommendedAction = draft.recommendedAction?.trim() || buildCreateReportBody(request).recommended_action
    const created = await createReport(request)
    recommendedAction = created.recommendedAction || recommendedAction
    const next: ReportIngestDraft = {
      ...draft,
      title: created.title,
      description: created.description,
      transcript: created.transcript || note,
      summary: created.summary,
      issueType: created.issueType,
      severity: created.severity,
      locationLabel: created.locationLabel || place || '',
      latitude: created.latitude ?? request.latitude,
      longitude: created.longitude ?? request.longitude,
      photoUrl: created.photoUrl || draft.photoUrl || form.photoDataUrl,
      recommendedAction: created.recommendedAction || draft.recommendedAction,
      trackingId: created.trackingId,
      status: created.status,
      createdAt: created.createdAt,
    }
    applyDraft(next)
    const filedDescription =
      next.description.trim() || next.transcript.trim() || next.summary.trim() || next.title.trim()
    const photoDataUrl =
      form.photoDataUrl ||
      (next.photoUrl && /^https?:\/\//i.test(next.photoUrl) ? next.photoUrl : undefined)
    const issue = await addIssue({
      title: next.title.trim() || next.summary.trim() || t('report.untitled'),
      description: filedDescription || t('report.untitled'),
      transcript: next.transcript.trim() || next.description.trim() || form.transcript.trim(),
      summary: next.summary.trim() || filedDescription || t('report.untitled'),
      issueType: next.issueType,
      severity: next.severity,
      status: created.status,
      locationLabel: next.locationLabel.trim() || t('report.locationUnset'),
      latitude: next.latitude ?? latitude.value,
      longitude: next.longitude ?? longitude.value,
      photoDataUrl,
      audioUrl: created.audioUrl,
      inputKind: reportInputKind.value,
      recommendedAction,
      reporterId: reporterId.value,
      remoteId: created.remoteId,
      trackingId: next.trackingId,
    })
    await router.replace({ name: 'reportReceipt', params: { id: issue.id } })
    await nextTick()
    resetForm()
  } catch (error) {
    submitError.value = apiErrorMessage(error, t, 'report.fileFailed')
  } finally {
    submitting.value = false
  }
}

function onPrimaryAction() {
  if (phase.value === 'review') {
    void confirm()
    return
  }
  if (canRetryConversation.value) {
    void importConversation()
    return
  }
  void send()
}
</script>

<template>
  <section
    ref="reportRoot"
    class="report"
    :style="{
      '--dock-space': `${dockSpace}px`,
      '--keyboard-inset': `${keyboardInset}px`,
      '--tab-bar-space': keyboardInset > 0 ? '0px' : '4.65rem',
    }"
    @focusin="onReportFocusIn"
  >
    <div class="report-scroll">
    <div class="report-top">
      <AppHeader :subtitle="t('report.title')" show-account />
      <ReportFlowSteps :current="step" />
    </div>

    <header class="intro">
      <p class="section-kicker">
        <MorphText :text="introKicker" />
      </p>
      <h2 class="heading">
        <MorphText :text="introHeading" />
      </h2>
      <p class="lead"><MorphText :text="introLead" /></p>
    </header>

    <div class="report-body" :class="{ 'is-review': reviewActive }">
      <template v-if="phase === 'capture'">
        <GlassPanel padding="lg" tone="fill" class="map-col">
          <LocationPickerField
            v-model:latitude="latitude"
            v-model:longitude="longitude"
            tall
          />
          <label class="field">
            <span class="field-label">{{ t('report.locationName') }}</span>
            <input
              v-model="form.locationLabel"
              class="control"
              type="text"
              maxlength="160"
              :placeholder="t('report.locationPlaceholder')"
              autocomplete="street-address"
              @input="markLocationLabelManual"
              @keydown.enter.prevent
            />
            <p v-if="geocoding" class="hint">{{ t('report.updatingPlace') }}</p>
          </label>
        </GlassPanel>

        <div class="report-main">
          <GlassPanel padding="lg" tone="fill" class="form-panel">
            <form class="form" @submit.prevent="send">
              <PhotoCaptureField
                v-model:photo-data-url="form.photoDataUrl"
                v-model:photo-file="photoFile"
              />

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
                  :disabled="Boolean(voiceField?.busy)"
                  :placeholder="t('report.transcriptPlaceholder')"
                />
              </label>
            </form>
          </GlassPanel>
        </div>
      </template>

      <GlassPanel v-else padding="none" tone="fill" class="review-card">
        <div v-if="photoSrc" class="hero">
          <img class="hero-photo" :src="photoSrc" alt="" data-flip-id="report-photo" />
          <span class="hero-badge">{{ t('report.photoBadge') }}</span>
        </div>

        <div class="review-layout">
          <div class="review-copy">
            <label class="field">
              <span class="field-label">{{ t('report.fieldTitle') }}</span>
              <input
                v-model="draft.title"
                class="control review-title-input"
                type="text"
                maxlength="120"
                :placeholder="t('report.titlePlaceholder')"
              />
            </label>
            <label class="review-block" data-enter-block>
              <span class="field-label">{{ descriptionLabel }}</span>
              <textarea
                v-model="draft.description"
                class="control"
                rows="4"
                maxlength="800"
                :placeholder="t('report.transcriptPlaceholder')"
              />
            </label>
            <div v-if="reviewSummary" class="review-block" data-enter-block>
              <p class="field-label">{{ t('report.summary') }}</p>
              <p class="review-text">{{ reviewSummary }}</p>
            </div>
            <div v-if="showCitizenWords" class="review-block" data-enter-block>
              <p class="field-label">{{ citizenWordsLabel }}</p>
              <p class="review-text">{{ citizenWords }}</p>
            </div>
            <dl class="facts" data-enter-block>
              <div>
                <dt class="field-label">{{ t('report.category') }}</dt>
                <dd class="meta-value">{{ issueTypeLabel(draft.issueType) }}</dd>
              </div>
              <div>
                <dt class="field-label">{{ t('sheet.severity') }}</dt>
                <dd><SeverityPill :severity="draft.severity" /></dd>
              </div>
              <div class="fact-place">
                <dt class="field-label">{{ t('report.location') }}</dt>
                <dd>
                  <input
                    v-model="draft.locationLabel"
                    class="control"
                    type="text"
                    maxlength="160"
                    :placeholder="t('report.locationPlaceholder')"
                    autocomplete="street-address"
                    @keydown.enter.prevent
                  />
                </dd>
              </div>
            </dl>
          </div>
          <div class="review-map">
            <LocationPickerField
              v-model:latitude="latitude"
              v-model:longitude="longitude"
              disabled
            />
          </div>
        </div>
      </GlassPanel>
    </div>

    <footer ref="commandEl" class="command" data-flip-id="report-command">
      <div class="command-dock glass-dock">
        <p v-if="submitError" class="error" role="alert">{{ submitError }}</p>
        <div class="command-row">
          <p
            id="report-command-status"
            class="command-status"
            :class="{ ready: phase === 'review' || canSend || submitting }"
          >
            <MorphText :text="commandStatusText" />
          </p>
          <div class="command-actions">
            <button
              v-if="phase === 'review'"
              type="button"
              class="btn-secondary"
              :disabled="submitting"
              @click="goBack"
            >
              {{ t('report.editDetails') }}
            </button>
            <button
              type="button"
              class="btn command-primary"
              :class="{ 'is-busy': submitting }"
              :disabled="submitting || (phase === 'capture' && !canSend && !canRetryConversation)"
              :aria-busy="submitting"
              aria-describedby="report-command-status"
              @click="onPrimaryAction"
            >
              <span class="btn-inner">
                <span v-show="submitting" class="spinner" aria-hidden="true" />
                <AppIcon v-show="!submitting" name="paperPlaneTilt" size="1rem" />
                <MorphText :text="primaryLabel" />
              </span>
            </button>
          </div>
        </div>
      </div>
    </footer>
    </div>

    <div
      v-if="readingReport"
      class="read-overlay"
      aria-hidden="true"
    >
      <div class="read-glyph">
        <VoiceGlyph phase="connecting" :read-frequency="silentFrequency" />
      </div>
    </div>
  </section>
</template>

<style scoped>
.report {
  position: relative;
  display: grid;
  gap: 0.85rem;
  padding-bottom: calc(
    var(--dock-space) + var(--tab-bar-space) + env(safe-area-inset-bottom, 0px) +
      var(--keyboard-inset)
  );
}

.read-overlay {
  position: fixed;
  inset: 0;
  z-index: 23;
  pointer-events: auto;
  display: grid;
  grid-template-rows: minmax(0, 1fr);
  padding-top: calc(6.65rem + env(safe-area-inset-top, 0px));
  padding-bottom: calc(
    var(--dock-space) + var(--tab-bar-space) + env(safe-area-inset-bottom, 0px) +
      var(--keyboard-inset)
  );
  background: var(--glass-thick-bg);
  -webkit-backdrop-filter: var(--glass-thick-filter);
  backdrop-filter: var(--glass-thick-filter);
}

.read-glyph {
  position: relative;
  width: 100%;
  min-height: 0;
  align-self: stretch;
}

.report-top {
  position: sticky;
  top: 0;
  z-index: 25;
  display: grid;
  gap: 0.45rem;
  margin-top: calc(-0.5rem - env(safe-area-inset-top, 0px));
  margin-inline: -0.9rem;
  padding-top: calc(0.5rem + env(safe-area-inset-top, 0px));
  padding-inline: 0.9rem;
  padding-bottom: 0.45rem;
  background: var(--glass-thick-bg);
  -webkit-backdrop-filter: var(--glass-thick-filter);
  backdrop-filter: var(--glass-thick-filter);
  border-bottom: 1px solid var(--border);
}

.report-top :deep(.header) {
  padding: 0 0 0.35rem;
}

.report-scroll {
  display: contents;
}

.report-body {
  display: grid;
  gap: 0.85rem;
  min-width: 0;
}

.report-main {
  min-width: 0;
  order: -1;
}

.intro {
  display: grid;
  gap: 0.35rem;
}

.heading {
  margin: 0;
  font-size: clamp(1.45rem, 4vw, 2rem);
  line-height: 1.15;
  font-weight: 700;
  letter-spacing: -0.03em;
  color: var(--text-h);
  font-family: var(--font-display);
}

.lead {
  margin: 0;
  color: var(--text);
  font-size: 0.95rem;
  line-height: 1.45;
  max-width: 40rem;
}

.map-col {
  display: grid;
  gap: 0.85rem;
}

.form-panel,
.review-card {
  min-width: 0;
}

.form {
  display: grid;
  gap: 0.95rem;
}

.field {
  display: grid;
  gap: 0.5rem;
}

.meta-value,
.review-text {
  margin: 0;
  color: var(--text-h);
  font-weight: 600;
  line-height: 1.45;
}

.review-card {
  overflow: hidden;
}

.hero {
  position: relative;
  background: #e8e6e3;
}

.hero-photo {
  display: block;
  width: 100%;
  max-height: 16rem;
  object-fit: cover;
  view-transition-name: report-photo;
}

.hero-badge {
  position: absolute;
  left: 0.85rem;
  top: 0.85rem;
  padding: 0.35rem 0.7rem;
  border-radius: var(--radius-pill);
  background: rgba(9, 9, 10, 0.78);
  color: var(--accent-ink);
  font-size: 0.72rem;
  font-weight: 650;
}

.review-layout {
  display: grid;
  gap: 1rem;
}

.review-copy {
  display: grid;
  gap: 1rem;
  padding: 1.15rem 1.15rem 0;
  min-width: 0;
}

.review-title-input {
  font-size: clamp(1.05rem, 2.4vw, 1.25rem);
  font-weight: 700;
  letter-spacing: -0.02em;
  font-family: var(--font-display);
  view-transition-name: report-title;
}

.review-block {
  display: grid;
  gap: 0.4rem;
}

.review-text {
  font-weight: 500;
  color: var(--text);
}

.facts {
  display: grid;
  gap: 0.85rem;
  margin: 0;
}

.facts > div {
  display: grid;
  gap: 0.25rem;
}

.facts dd {
  margin: 0;
}

.review-map {
  padding: 0 1.15rem 1.15rem;
  min-width: 0;
}

.command {
  position: fixed;
  left: 0;
  right: 0;
  bottom: max(calc(4.65rem + env(safe-area-inset-bottom, 0px)), var(--keyboard-inset));
  z-index: 28;
  padding: 0 0.85rem;
  pointer-events: none;
}

.command-dock {
  pointer-events: auto;
  display: grid;
  gap: 0.55rem;
  width: 100%;
  max-width: 28rem;
  margin: 0 auto;
  padding: 0.7rem 0.55rem 0.75rem;
  border-radius: var(--radius-pill);
  border-width: 1.5px;
  box-shadow: 0 12px 32px rgba(9, 9, 10, 0.1);
}

@media (max-width: 1023px) {
  .command-dock:has(.command-actions > :nth-child(2)),
  .command-dock:has(.error) {
    --command-inset: 0.65rem;
    padding: 0.7rem var(--command-inset) var(--command-inset);
    border-radius: calc(1.5rem + var(--command-inset));
  }
}

.command-row {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
}

.command-status {
  margin: 0;
  color: var(--text);
  font-size: 0.95rem;
  font-weight: 650;
  line-height: 1.35;
  text-align: center;
}

.command-status.ready {
  color: var(--text-h);
}

.command-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.command-actions .btn-secondary,
.command-primary {
  width: 100%;
  min-height: 3rem;
}

.command-primary .btn-inner {
  width: 100%;
}

.command-primary:disabled {
  opacity: 0.38;
  cursor: not-allowed;
}

.command-primary.is-busy:disabled {
  opacity: 0.72;
  cursor: wait;
}

.error {
  margin: 0;
  font-size: 0.82rem;
  color: var(--danger);
}

@media (min-width: 1024px) {
  .report {
    display: flex;
    flex-direction: column;
    height: 100svh;
    min-height: 0;
    margin-top: calc(-1.1rem - env(safe-area-inset-top, 0px));
    margin-bottom: -1.5rem;
    margin-inline: -1.5rem;
    padding-bottom: 0;
    overflow: hidden;
  }

  .report-scroll {
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
    gap: 0.65rem;
    min-height: 0;
    overflow: auto;
    padding-bottom: 0.35rem;
  }

  .intro,
  .report-body {
    padding-inline: 1.5rem;
  }

  .report-body {
    align-content: start;
  }

  .report-body:not(.is-review) .map-col {
    position: sticky;
    top: 7.75rem;
    z-index: 1;
  }

  .read-overlay {
    position: absolute;
    padding-top: calc(7.35rem + env(safe-area-inset-top, 0px));
    padding-bottom: 5.75rem;
  }

  .command {
    position: sticky;
    top: auto;
    bottom: 0;
    left: auto;
    right: auto;
    z-index: 24;
    flex-shrink: 0;
    margin-top: auto;
    padding: 0.35rem 1.5rem 0.55rem;
  }

  .command-dock {
    max-width: none;
    padding: 0.75rem 1.15rem 0.85rem;
    box-shadow: 0 10px 28px rgba(9, 9, 10, 0.08);
  }

  .command-row {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: 1.25rem;
  }

  .command-status {
    max-width: 36rem;
    text-align: start;
  }

  .command-actions {
    flex-direction: row;
    flex-shrink: 0;
    justify-content: flex-end;
  }

  .command-actions .btn-secondary,
  .command-primary {
    order: 0;
    width: auto;
    min-width: 11rem;
  }

  .report-top {
    position: sticky;
    top: 0;
    z-index: 25;
    flex-shrink: 0;
    margin-top: 0;
    margin-inline: 0;
    padding-top: calc(0.85rem + env(safe-area-inset-top, 0px));
    padding-inline: 1.5rem;
  }
}

@media (min-width: 720px) {
  .report-main {
    order: 0;
  }

  .report-body:not(.is-review) {
    grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.95fr);
    align-items: start;
  }

  .review-layout {
    grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.9fr);
    align-items: start;
    gap: 0;
  }

  .review-copy {
    padding: 1.25rem 1.35rem 1.25rem 1.25rem;
  }

  .facts {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .fact-place {
    grid-column: 1 / -1;
  }

  .review-map {
    padding: 1.25rem 1.25rem 1.25rem 0;
  }

  .hero-photo {
    max-height: 16rem;
  }
}

</style>
