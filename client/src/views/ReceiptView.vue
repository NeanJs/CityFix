<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { useIssues } from '../composables/useIssues'
import { useLocale } from '../composables/useLocale'
import AppHeader from '../components/layout/AppHeader.vue'
import ReportFlowSteps from '../components/report/ReportFlowSteps.vue'
import SpeakButton from '../components/SpeakButton.vue'
import StatusTrack from '../components/StatusTrack.vue'
import GlassPanel from '../components/ui/GlassPanel.vue'

const route = useRoute()
const router = useRouter()
const { reporterId } = useAuth()
const { getIssue, syncTrackedReport } = useIssues()
const { t } = useLocale()

const issue = computed(() => {
  const id = route.params.id
  return typeof id === 'string' ? (getIssue(id) ?? null) : null
})

watch(
  () => issue.value?.trackingId,
  (trackingId) => {
    if (!trackingId) {
      return
    }
    void syncTrackedReport(trackingId, reporterId.value).catch(() => undefined)
  },
  { immediate: true },
)

const confirmation = computed(() => {
  if (!issue.value) {
    return ''
  }
  return t('receipt.confirmationSpeech', {
    category: t(`category.${issue.value.category}`).toLowerCase(),
    trackingId: issue.value.trackingId,
  })
})

function formatWhen(iso: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso))
}
</script>

<template>
  <section class="receipt">
    <AppHeader :subtitle="t('receipt.title')" show-account />
    <ReportFlowSteps :current="3" />

    <GlassPanel v-if="!issue" padding="lg" tone="fill" class="empty">
      <p class="empty-title">{{ t('receipt.missingTitle') }}</p>
      <p class="hint">{{ t('receipt.missingHint') }}</p>
      <button type="button" class="btn" @click="router.push('/report')">
        {{ t('receipt.fileAnother') }}
      </button>
    </GlassPanel>

    <GlassPanel v-else padding="lg" tone="fill" class="record">
      <div class="success" aria-hidden="true">
        <svg class="success-mark" viewBox="0 0 24 24" fill="none">
          <path
            d="m5 12 4 4L19 6"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </div>
      <p class="section-kicker">{{ t('receipt.eyebrow') }}</p>
      <p class="headline">{{ t('receipt.headline') }}</p>
      <p class="lead">{{ t('receipt.lead') }}</p>

      <div class="reference">
        <p class="tracking-label">{{ t('receipt.trackingId') }}</p>
        <p class="tracking">{{ issue.trackingId }}</p>
        <p class="hint">{{ t('receipt.trackingHint') }}</p>
      </div>

      <img v-if="issue.photoDataUrl" class="photo" :src="issue.photoDataUrl" alt="" />
      <h2 class="title">{{ issue.title }}</h2>
      <p class="summary">{{ issue.summary }}</p>
      <div v-if="issue.recommendedAction" class="action-note">
        <p class="field-label">{{ t('receipt.recommendedAction') }}</p>
        <p class="summary">{{ issue.recommendedAction }}</p>
      </div>
      <p class="place">{{ issue.locationLabel }}</p>
      <p class="hint">{{ formatWhen(issue.createdAt) }}</p>

      <div class="progress">
        <p class="field-label">{{ t('receipt.progress') }}</p>
        <StatusTrack :status="issue.status" />
      </div>

      <div class="actions">
        <button type="button" class="btn" @click="router.push('/reports')">
          {{ t('receipt.viewReports') }}
        </button>
        <button type="button" class="btn-secondary" @click="router.push('/report')">
          {{ t('receipt.fileAnother') }}
        </button>
      </div>
      <SpeakButton
        :text="confirmation"
        play-key="receipt.play"
        playing-key="receipt.playing"
        unavailable-key="receipt.playUnavailable"
      />
    </GlassPanel>
  </section>
</template>

<style scoped>
.receipt {
  display: grid;
  gap: 0.85rem;
}

.empty,
.record {
  display: grid;
  gap: 0.65rem;
  justify-items: start;
}

.success {
  display: grid;
  place-items: center;
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 50%;
  background: var(--status-resolved-bg);
  color: var(--status-resolved-fg);
}

.success-mark {
  width: 1.6rem;
  height: 1.6rem;
}

.empty-title,
.headline {
  margin: 0;
  font-size: clamp(1.35rem, 4vw, 1.85rem);
  line-height: 1.15;
  font-weight: 700;
  letter-spacing: -0.03em;
  color: var(--text-h);
  font-family: var(--font-display);
}

.lead {
  margin: 0;
  max-width: 36rem;
  color: var(--text);
  line-height: 1.5;
}

.reference {
  display: grid;
  gap: 0.25rem;
  width: 100%;
  padding: 0.95rem 1rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: #f7f4ef;
}

.tracking-label {
  margin: 0;
  font-size: 0.78rem;
  font-weight: 650;
  color: var(--text-muted);
}

.tracking {
  margin: 0;
  font-size: clamp(1.4rem, 4.5vw, 2rem);
  font-weight: 750;
  letter-spacing: 0.04em;
  color: var(--text-h);
  font-variant-numeric: tabular-nums;
}

.photo {
  display: block;
  width: 100%;
  max-height: 16rem;
  object-fit: cover;
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
}

.title {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--text-h);
}

.summary,
.place {
  margin: 0;
  color: var(--text);
  line-height: 1.5;
}

.action-note {
  display: grid;
  gap: 0.25rem;
}

.progress {
  display: grid;
  gap: 0.65rem;
  width: 100%;
  padding: 0.95rem 1rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

@media (min-width: 1024px) {
  .record {
    max-width: none;
  }
}
</style>
