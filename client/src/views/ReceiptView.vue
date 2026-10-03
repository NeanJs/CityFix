<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useIssues } from '../composables/useIssues'
import { useLocale } from '../composables/useLocale'
import AppHeader from '../components/layout/AppHeader.vue'
import SeverityPill from '../components/SeverityPill.vue'
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

    <GlassPanel v-if="!issue" padding="lg" tone="paper" class="empty">
      <p class="empty-title">{{ t('receipt.missingTitle') }}</p>
      <p class="hint">{{ t('receipt.missingHint') }}</p>
      <button type="button" class="btn" @click="router.push('/report')">
        {{ t('receipt.fileAnother') }}
      </button>
    </GlassPanel>

    <template v-else>
      <GlassPanel padding="lg" class="hero">
        <p class="eyebrow">{{ t('receipt.eyebrow') }}</p>
        <h2 class="headline">{{ t('receipt.headline') }}</h2>
        <p class="lede">{{ t('receipt.lede') }}</p>
        <p class="tracking-label">{{ t('receipt.trackingId') }}</p>
        <p class="tracking">{{ issue.trackingId }}</p>
        <SpeakButton
          :text="confirmation"
          play-key="receipt.play"
          playing-key="receipt.playing"
          unavailable-key="receipt.playUnavailable"
        />
      </GlassPanel>

      <GlassPanel padding="lg" tone="paper" class="record">
        <img v-if="issue.photoDataUrl" class="photo" :src="issue.photoDataUrl" alt="" />
        <h3 class="title">{{ issue.title }}</h3>
        <div class="pills">
          <span class="stamp">{{ t(`category.${issue.category}`) }}</span>
          <SeverityPill :severity="issue.severity" />
          <StatusPill :status="issue.status" />
        </div>
        <dl class="facts">
          <div>
            <dt>{{ t('receipt.summary') }}</dt>
            <dd>{{ issue.summary }}</dd>
          </div>
          <div v-if="issue.transcript">
            <dt>{{ t('receipt.transcript') }}</dt>
            <dd>{{ issue.transcript }}</dd>
          </div>
          <div v-if="issue.description && issue.description !== issue.transcript">
            <dt>{{ t('receipt.description') }}</dt>
            <dd>{{ issue.description }}</dd>
          </div>
          <div>
            <dt>{{ t('receipt.location') }}</dt>
            <dd>{{ issue.locationLabel }}</dd>
          </div>
          <div>
            <dt>{{ t('receipt.filed') }}</dt>
            <dd>{{ formatWhen(issue.createdAt) }}</dd>
          </div>
        </dl>
        <div class="actions">
          <button type="button" class="btn" @click="router.push('/reports')">
            {{ t('receipt.viewReports') }}
          </button>
          <button type="button" class="btn-secondary" @click="router.push('/report')">
            {{ t('receipt.fileAnother') }}
          </button>
        </div>
      </GlassPanel>
    </template>
  </section>
</template>

<style scoped>
.receipt {
  display: grid;
  gap: 0.85rem;
}

.hero,
.empty {
  display: grid;
  gap: 0.5rem;
  justify-items: start;
}

.eyebrow {
  margin: 0;
  font-size: 0.7rem;
  font-weight: 650;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--accent);
}

.headline,
.empty-title {
  margin: 0;
  font-size: clamp(1.45rem, 4.6vw, 2rem);
  line-height: 1.15;
  font-weight: 700;
  letter-spacing: -0.03em;
  color: var(--text-h);
  font-family: var(--font-display);
}

.lede {
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.45;
  color: var(--text-muted);
  max-width: 48ch;
}

.tracking-label {
  margin: 0.35rem 0 0;
  font-size: 0.7rem;
  font-weight: 650;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.tracking {
  margin: 0 0 0.15rem;
  font-size: clamp(1.55rem, 5.4vw, 2.25rem);
  font-weight: 750;
  letter-spacing: 0.04em;
  color: var(--text-h);
  font-family: var(--font-display);
  font-variant-numeric: tabular-nums;
}

.record {
  display: grid;
  gap: 0.75rem;
}

.photo {
  display: block;
  width: 100%;
  max-height: 18rem;
  object-fit: cover;
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
}

.title {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--text-h);
  font-family: var(--font-display);
}

.pills {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.facts {
  margin: 0;
  display: grid;
  gap: 0.75rem;
}

.facts dt {
  font-size: 0.68rem;
  font-weight: 650;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.facts dd {
  margin: 0.2rem 0 0;
  color: var(--text);
  line-height: 1.5;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

@media (min-width: 1024px) {
  .receipt {
    grid-template-columns: minmax(16rem, 0.85fr) minmax(0, 1.15fr);
    align-items: start;
  }

  .receipt > :first-child {
    grid-column: 1 / -1;
  }
}
</style>
