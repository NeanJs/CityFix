<script setup lang="ts">
import { computed } from 'vue'
import { useLocale } from '../composables/useLocale'
import { nextStatus } from '../services/report/statusFlow'
import type { Issue, IssueStatus } from '../types/issue'
import GlassPanel from './ui/GlassPanel.vue'
import SeverityPill from './SeverityPill.vue'
import SpeakButton from './SpeakButton.vue'
import StatusTrack from './StatusTrack.vue'

const props = defineProps<{
  issue: Issue | null
  open: boolean
  canManageStatus?: boolean
}>()

const emit = defineEmits<{
  close: []
  statusChange: [id: string, status: IssueStatus]
}>()

const { t } = useLocale()

const confirmation = computed(() => {
  if (!props.issue) {
    return ''
  }
  return t('receipt.confirmationSpeech', {
    category: t(`category.${props.issue.category}`).toLowerCase(),
    trackingId: props.issue.trackingId,
  })
})

const upcoming = computed(() => (props.issue ? nextStatus(props.issue.status) : null))

const showTranscript = computed(() => {
  if (!props.issue?.transcript) {
    return false
  }
  return props.issue.transcript.trim() !== props.issue.description.trim()
})

const timeline = computed(() => {
  if (!props.issue) {
    return []
  }
  const created = new Date(props.issue.createdAt)
  const updated = new Date(props.issue.updatedAt)
  return [
    { label: t('sheet.reported'), at: created },
    { label: t('sheet.updated'), at: updated },
  ]
})

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function onBackdropClick(event: MouseEvent) {
  if (event.target === event.currentTarget) {
    emit('close')
  }
}

function advance() {
  if (!props.issue || !upcoming.value) {
    return
  }
  emit('statusChange', props.issue.id, upcoming.value)
}
</script>

<template>
  <Teleport to="body">
    <Transition name="sheet">
      <div
        v-if="open && issue"
        class="overlay"
        role="dialog"
        aria-modal="true"
        :aria-label="issue.title"
        @click="onBackdropClick"
      >
        <div class="sheet">
          <GlassPanel padding="lg" tone="fill">
            <div class="sheet-head">
              <div>
                <p class="stamp">{{ issue.trackingId }}</p>
                <h2 class="title">{{ issue.title }}</h2>
              </div>
              <button type="button" class="close" :aria-label="t('sheet.close')" @click="emit('close')">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M6 6l12 12M18 6 6 18"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linecap="round"
                  />
                </svg>
              </button>
            </div>

            <StatusTrack :status="issue.status" />

            <div v-if="canManageStatus && upcoming" class="advance-wrap">
              <button type="button" class="btn" @click="advance">
                {{
                  upcoming === 'resolved'
                    ? t('sheet.markResolved')
                    : t('sheet.advanceTo', { status: t(`status.${upcoming}`) })
                }}
              </button>
            </div>

            <img v-if="issue.photoDataUrl" class="photo" :src="issue.photoDataUrl" alt="" />

            <div class="pills">
              <SeverityPill :severity="issue.severity" />
              <span class="stamp">{{ t(`category.${issue.category}`) }}</span>
            </div>

            <div class="block">
              <p class="row-label">{{ t('sheet.summary') }}</p>
              <p class="description">{{ issue.summary }}</p>
            </div>

            <div class="block">
              <p class="row-label">{{ t('sheet.location') }}</p>
              <p class="location">{{ issue.locationLabel }}</p>
              <p
                v-if="issue.latitude !== undefined && issue.longitude !== undefined"
                class="coords hint"
              >
                {{ issue.latitude.toFixed(5) }}, {{ issue.longitude.toFixed(5) }}
              </p>
            </div>

            <div v-if="showTranscript" class="block">
              <p class="row-label">{{ t('sheet.transcript') }}</p>
              <p class="description">{{ issue.transcript }}</p>
            </div>

            <div class="block">
              <p class="row-label">{{ t('sheet.description') }}</p>
              <p class="description">{{ issue.description }}</p>
            </div>

            <ul class="timeline">
              <li v-for="entry in timeline" :key="entry.label">
                <span class="dot" aria-hidden="true" />
                <div>
                  <p class="timeline-label">{{ entry.label }}</p>
                  <p class="timeline-when">{{ formatDateTime(entry.at) }}</p>
                </div>
              </li>
            </ul>

            <SpeakButton
              :text="confirmation"
              play-key="sheet.play"
              playing-key="sheet.playing"
              unavailable-key="sheet.playUnavailable"
            />
          </GlassPanel>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 0.85rem 0.85rem calc(6.75rem + env(safe-area-inset-bottom, 0px));
  background: rgba(9, 9, 10, 0.28);
}

.sheet {
  width: min(100%, 32rem);
  max-height: min(78vh, 640px);
  overflow: auto;
}

.sheet-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.9rem;
}

.title {
  margin: 0.4rem 0 0;
  font-size: 1.7rem;
  font-weight: 700;
  color: var(--text-h);
  line-height: 1.25;
  font-family: var(--font-display);
}

.advance-wrap {
  margin: 0.85rem 0 0.35rem;
}

.photo {
  display: block;
  width: 100%;
  max-height: 14rem;
  object-fit: cover;
  margin: 0.9rem 0;
  border-radius: var(--radius-md);
  border: none;
}

.pills {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-bottom: 0.85rem;
}

.close {
  width: 2.4rem;
  height: 2.4rem;
  display: grid;
  place-items: center;
  border: none;
  border-radius: var(--radius-pill);
  background: #f1f0f0;
  color: var(--text-h);
  cursor: pointer;
}

.close svg {
  width: 1rem;
  height: 1rem;
}

.block {
  margin-bottom: 0.85rem;
}

.row-label {
  margin: 0 0 0.3rem;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--text-muted);
}

.location {
  margin: 0;
  font-size: 0.92rem;
  color: var(--text-h);
  line-height: 1.45;
}

.coords {
  margin: 0.3rem 0 0;
  font-variant-numeric: tabular-nums;
}

.description {
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.55;
  color: var(--text);
}

.timeline {
  list-style: none;
  margin: 0 0 1rem;
  padding: 0;
  display: grid;
  gap: 0.55rem;
}

.timeline li {
  display: flex;
  gap: 0.6rem;
  align-items: flex-start;
}

.dot {
  width: 0.45rem;
  height: 0.45rem;
  margin-top: 0.4rem;
  background: var(--accent);
}

.timeline-label {
  margin: 0;
  font-size: 0.8rem;
  font-weight: 650;
  color: var(--text-h);
}

.timeline-when {
  margin: 0.1rem 0 0;
  font-size: 0.78rem;
  color: var(--text-muted);
}

.sheet-enter-active,
.sheet-leave-active {
  transition: opacity 0.22s ease;
}

.sheet-enter-active .sheet,
.sheet-leave-active .sheet {
  transition: transform 0.28s cubic-bezier(0.32, 0.72, 0, 1);
}

.sheet-enter-from,
.sheet-leave-to {
  opacity: 0;
}

.sheet-enter-from .sheet,
.sheet-leave-to .sheet {
  transform: translateY(16px);
}

@media (min-width: 1024px) {
  .overlay {
    align-items: stretch;
    justify-content: flex-end;
    padding: 1.25rem;
  }

  .sheet {
    width: min(28rem, 38vw);
    max-height: none;
    height: 100%;
  }

  .sheet :deep(.panel) {
    height: 100%;
    overflow: auto;
  }

  .sheet-enter-from .sheet,
  .sheet-leave-to .sheet {
    transform: translateX(18px);
  }
}
</style>
