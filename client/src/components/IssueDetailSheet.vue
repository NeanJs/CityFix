<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useLocale } from '../composables/useLocale'
import { nextStatus } from '../services/report/statusFlow'
import type { Issue, IssueStatus } from '../types/issue'
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
const overlayRef = ref<HTMLElement | null>(null)

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

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    emit('close')
  }
}

function setBodyScrollLocked(locked: boolean) {
  document.body.style.overflow = locked ? 'hidden' : ''
}

watch(
  () => props.open,
  (isOpen) => {
    setBodyScrollLocked(isOpen)
    if (isOpen) {
      void nextTick(() => {
        overlayRef.value?.focus()
      })
    }
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  setBodyScrollLocked(false)
})

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
        ref="overlayRef"
        class="overlay"
        role="dialog"
        aria-modal="true"
        :aria-label="issue.title"
        tabindex="-1"
        @click="onBackdropClick"
        @keydown="onKeydown"
      >
        <div class="sheet" @click.stop>
          <div class="grab" aria-hidden="true" />
          <header class="sheet-head">
            <div class="head-copy">
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
          </header>

          <div class="sheet-body">
            <StatusTrack :status="issue.status" />

            <div v-if="canManageStatus && upcoming" class="advance-wrap">
              <button type="button" class="btn advance-btn" @click="advance">
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

            <div v-if="issue.recommendedAction" class="block">
              <p class="row-label">{{ t('sheet.recommendedAction') }}</p>
              <p class="description">{{ issue.recommendedAction }}</p>
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
          </div>
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
  padding: 0;
  background: rgba(9, 9, 10, 0.55);
}

.sheet {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-height: min(92dvh, 100%);
  background: var(--surface-raised-solid);
  border: 1px solid var(--border);
  border-bottom: none;
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  box-shadow: 0 -8px 40px rgba(9, 9, 10, 0.18);
  overflow: hidden;
}

.grab {
  flex-shrink: 0;
  width: 2.5rem;
  height: 0.25rem;
  margin: 0.55rem auto 0;
  border-radius: var(--radius-pill);
  background: var(--border);
}

.sheet-head {
  flex-shrink: 0;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.65rem 1.15rem 0.85rem;
  border-bottom: 1px solid var(--border);
  background: var(--surface-raised-solid);
}

.head-copy {
  min-width: 0;
}

.sheet-body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 1rem 1.15rem calc(1.15rem + env(safe-area-inset-bottom, 0px));
  -webkit-overflow-scrolling: touch;
}

.title {
  margin: 0.4rem 0 0;
  font-size: 1.45rem;
  font-weight: 700;
  color: var(--text-h);
  line-height: 1.25;
  font-family: var(--font-display);
}

.advance-wrap {
  margin: 0.85rem 0 0.35rem;
}

.advance-btn {
  width: 100%;
}

.photo {
  display: block;
  width: 100%;
  max-height: 14rem;
  object-fit: cover;
  margin: 0.9rem 0;
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
}

.pills {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-bottom: 0.85rem;
}

.close {
  flex-shrink: 0;
  width: 2.75rem;
  height: 2.75rem;
  display: grid;
  place-items: center;
  border: 1px solid var(--border);
  border-radius: var(--radius-pill);
  background: var(--surface-solid);
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
  text-transform: uppercase;
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

.sheet :deep(.speak .btn-secondary) {
  width: 100%;
}

.sheet-enter-active,
.sheet-leave-active {
  transition: opacity 0.22s ease;
}

.sheet-enter-active .sheet,
.sheet-leave-active .sheet {
  transition: transform 0.32s cubic-bezier(0.32, 0.72, 0, 1);
}

.sheet-enter-from,
.sheet-leave-to {
  opacity: 0;
}

.sheet-enter-from .sheet,
.sheet-leave-to .sheet {
  transform: translateY(100%);
}

@media (min-width: 1024px) {
  .overlay {
    align-items: stretch;
    justify-content: flex-end;
    padding: 0;
  }

  .sheet {
    width: 28rem;
    max-height: none;
    height: 100%;
    border-radius: 0;
    border: none;
    border-left: 1px solid var(--border);
    box-shadow: -12px 0 48px rgba(9, 9, 10, 0.14);
  }

  .grab {
    display: none;
  }

  .sheet-head {
    position: sticky;
    top: 0;
    z-index: 1;
    padding-top: calc(1rem + env(safe-area-inset-top, 0px));
  }

  .sheet-body {
    padding-bottom: 1.5rem;
  }

  .title {
    font-size: 1.7rem;
  }

  .advance-btn {
    width: fit-content;
  }

  .sheet :deep(.speak .btn-secondary) {
    width: fit-content;
  }

  .sheet-enter-from .sheet,
  .sheet-leave-to .sheet {
    transform: translateX(100%);
  }
}
</style>
