<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useIssues } from '../composables/useIssues'
import { useLocale } from '../composables/useLocale'
import AppHeader from '../components/layout/AppHeader.vue'
import SpeakButton from '../components/SpeakButton.vue'
import StatusPill from '../components/StatusPill.vue'
import GlassPanel from '../components/ui/GlassPanel.vue'

const route = useRoute()
const router = useRouter()
const { getIssue } = useIssues()
const { t } = useLocale()

const issue = computed(() => {
  const id = route.params.id
  return typeof id === 'string' ? (getIssue(id) ?? null) : null
})

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

    <GlassPanel v-if="!issue" padding="lg" tone="fill" class="empty">
      <p class="empty-title">{{ t('receipt.missingTitle') }}</p>
      <p class="hint">{{ t('receipt.missingHint') }}</p>
      <button type="button" class="btn" @click="router.push('/report')">
        {{ t('receipt.fileAnother') }}
      </button>
    </GlassPanel>

    <GlassPanel v-else padding="lg" tone="fill" class="record">
      <p class="headline">{{ t('receipt.headline') }}</p>
      <p class="tracking-label">{{ t('receipt.trackingId') }}</p>
      <p class="tracking">{{ issue.trackingId }}</p>
      <img v-if="issue.photoDataUrl" class="photo" :src="issue.photoDataUrl" alt="" />
      <h2 class="title">{{ issue.title }}</h2>
      <StatusPill :status="issue.status" />
      <p class="summary">{{ issue.summary }}</p>
      <p class="place">{{ issue.locationLabel }}</p>
      <p class="hint">{{ formatWhen(issue.createdAt) }}</p>
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
  gap: 0.55rem;
  justify-items: start;
}

.empty-title,
.headline {
  margin: 0;
  font-size: clamp(1.35rem, 4vw, 1.85rem);
  line-height: 1.15;
  font-weight: 400;
  letter-spacing: -0.03em;
  color: var(--text-h);
  font-family: var(--font-display);
}

.tracking-label {
  margin: 0.2rem 0 0;
  font-size: 0.78rem;
  font-weight: 650;
  color: var(--text-muted);
}

.tracking {
  margin: 0;
  font-size: clamp(1.6rem, 5vw, 2.2rem);
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

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

@media (min-width: 1024px) {
  .record {
    max-width: 40rem;
  }
}
</style>
