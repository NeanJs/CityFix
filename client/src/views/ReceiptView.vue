<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { useIssues } from '../composables/useIssues'
import { useLocale } from '../composables/useLocale'
import AppHeader from '../components/layout/AppHeader.vue'
import ReportFlowSteps from '../components/report/ReportFlowSteps.vue'
import StatusTrack from '../components/StatusTrack.vue'
import AppIcon from '../components/ui/AppIcon.vue'
import GlassPanel from '../components/ui/GlassPanel.vue'
import gsap from 'gsap'
import { easings } from '../motion/easings'
import { duration } from '../motion/tokens'

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

function formatWhen(iso: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso))
}

const mark = ref<HTMLElement | null>(null)

onMounted(() => {
  const node = mark.value
  if (!node) {
    return
  }
  gsap.fromTo(
    node,
    { opacity: 0, scale: 0.72 },
    {
      opacity: 1,
      scale: 1,
      duration: duration.lg,
      ease: easings.primary,
      overwrite: 'auto',
      transformOrigin: '50% 50%',
    },
  )
})
</script>

<template>
  <section class="receipt">
    <AppHeader :subtitle="t('receipt.title')" show-account />
    <ReportFlowSteps :current="3" />

    <GlassPanel v-if="!issue" padding="lg" tone="fill" class="empty">
      <AppIcon class="empty-icon" name="tray" size="1.75rem" />
      <p class="empty-title">{{ t('receipt.missingTitle') }}</p>
      <p class="hint">{{ t('receipt.missingHint') }}</p>
      <button type="button" class="btn" @click="router.push('/report')">
        <AppIcon name="plus" size="1rem" />
        {{ t('receipt.fileAnother') }}
      </button>
    </GlassPanel>

    <GlassPanel v-else padding="lg" tone="fill" class="record">
      <div class="success" aria-hidden="true">
        <span ref="mark" class="success-mark">
          <AppIcon name="check" size="1.6rem" weight="fill" />
        </span>
      </div>
      <p class="section-kicker">{{ t('receipt.eyebrow') }}</p>
      <p class="headline">{{ t('receipt.headline') }}</p>
      <p class="lead">{{ t('receipt.lead') }}</p>

      <div class="hero-row">
        <div class="reference">
          <p class="tracking-label">{{ t('receipt.trackingId') }}</p>
          <p class="tracking">{{ issue.trackingId }}</p>
          <p class="hint">{{ t('receipt.trackingHint') }}</p>
        </div>

        <img v-if="issue.photoDataUrl" class="photo" :src="issue.photoDataUrl" alt="" />
      </div>
      <h2 class="title">{{ issue.title }}</h2>
      <p class="summary">{{ issue.summary }}</p>
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

.empty-icon {
  color: var(--text-muted);
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
  display: grid;
  place-items: center;
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

.hero-row {
  display: grid;
  gap: 0.65rem;
  width: 100%;
  min-width: 0;
}

.tracking {
  margin: 0;
  font-size: clamp(1.4rem, 4.5vw, 2rem);
  font-weight: 750;
  letter-spacing: 0.04em;
  color: var(--text-h);
  font-variant-numeric: tabular-nums;
  user-select: all;
}

.photo {
  display: block;
  width: 100%;
  max-height: 16rem;
  object-fit: cover;
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
  view-transition-name: report-photo;
}

.title {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--text-h);
  view-transition-name: report-title;
}

.summary,
.place {
  margin: 0;
  color: var(--text);
  line-height: 1.5;
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

  .hero-row {
    grid-template-columns: minmax(0, 1fr) minmax(0, 0.9fr);
    align-items: stretch;
  }

  .photo {
    max-height: none;
    height: 100%;
    min-height: 10rem;
  }
}
</style>
