<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useLocale } from '../composables/useLocale'
import { playIssueFlip } from '../motion/issueFlip'
import { useMotionScope } from '../motion/useMotionScope'
import { dismissSurface, enterBlocks, presentSurface } from '../motion/transitions'
import { canRejectStatus, nextStatus } from '../services/report/statusFlow'
import type { Issue, IssueStatus } from '../types/issue'
import AppIcon from './ui/AppIcon.vue'
import SeverityPill from './SeverityPill.vue'
import StatusPill from './StatusPill.vue'
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

const { t, issueTypeLabel } = useLocale()
const overlayRef = ref<HTMLElement | null>(null)
const sheetRef = ref<HTMLElement | null>(null)
const rendered = ref(false)
const dragY = ref(0)
const copied = ref(false)
let copiedTimer = 0
let generation = 0
let dragPointer: number | null = null
let dragStartY = 0
const { run } = useMotionScope(overlayRef)

const upcoming = computed(() => (props.issue ? nextStatus(props.issue.status) : null))
const canReject = computed(() => Boolean(props.issue && canRejectStatus(props.issue.status)))

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

function surfaceOrigin() {
  return window.matchMedia('(min-width: 1024px)').matches ? 'center' : 'bottom'
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

function onGrabPointerDown(event: PointerEvent) {
  if (window.matchMedia('(min-width: 1024px)').matches) {
    return
  }
  dragPointer = event.pointerId
  dragStartY = event.clientY
  dragY.value = 0
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
}

function onGrabPointerMove(event: PointerEvent) {
  if (dragPointer !== event.pointerId) {
    return
  }
  dragY.value = Math.max(0, event.clientY - dragStartY)
}

function onGrabPointerUp(event: PointerEvent) {
  if (dragPointer !== event.pointerId) {
    return
  }
  dragPointer = null
  const distance = dragY.value
  dragY.value = 0
  if (distance > 96) {
    emit('close')
  }
}

function onGrabPointerCancel() {
  dragPointer = null
  dragY.value = 0
}

function setBodyScrollLocked(locked: boolean) {
  document.body.style.overflow = locked ? 'hidden' : ''
}

async function show() {
  const gen = ++generation
  rendered.value = true
  setBodyScrollLocked(true)
  await nextTick()
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve())
  })
  if (gen !== generation) {
    return
  }
  overlayRef.value?.focus()
  const overlay = overlayRef.value
  const sheet = sheetRef.value
  if (!overlay || !sheet) {
    return
  }
  run(() => {
    presentSurface(overlay, sheet, surfaceOrigin())
    playIssueFlip()
    enterBlocks(sheet.querySelectorAll('[data-enter-block]'))
  })
}

async function hide() {
  const gen = ++generation
  setBodyScrollLocked(false)
  const overlay = overlayRef.value
  const sheet = sheetRef.value
  const finish = async () => {
    if (gen !== generation) {
      return
    }
    rendered.value = false
    await nextTick()
    if (gen === generation) {
      playIssueFlip()
    }
  }
  if (!overlay || !sheet) {
    await finish()
    return
  }
  run(() => {
    const tween = dismissSurface(overlay, sheet, surfaceOrigin())
    if (!tween) {
      void finish()
      return
    }
    tween.eventCallback('onComplete', () => {
      void finish()
    })
  })
}

watch(
  () => props.open && Boolean(props.issue),
  (isOpen) => {
    if (isOpen) {
      void show()
      return
    }
    if (rendered.value) {
      void hide()
    }
  },
  { immediate: true },
)

watch(
  () => props.issue?.id,
  () => {
    copied.value = false
    window.clearTimeout(copiedTimer)
  },
)

function advance() {
  if (!props.issue || !upcoming.value) {
    return
  }
  emit('statusChange', props.issue.id, upcoming.value)
}

function reject() {
  if (!props.issue || !canReject.value) {
    return
  }
  emit('statusChange', props.issue.id, 'rejected')
}

async function copyTracking() {
  const trackingId = props.issue?.trackingId.trim()
  if (!trackingId || typeof navigator === 'undefined' || !navigator.clipboard) {
    return
  }
  try {
    await navigator.clipboard.writeText(trackingId)
    copied.value = true
    window.clearTimeout(copiedTimer)
    copiedTimer = window.setTimeout(() => {
      copied.value = false
    }, 1600)
  } catch {
    copied.value = false
  }
}

onBeforeUnmount(() => {
  generation += 1
  copied.value = false
  window.clearTimeout(copiedTimer)
  setBodyScrollLocked(false)
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="rendered && issue"
      ref="overlayRef"
      class="overlay"
      role="dialog"
      aria-modal="true"
      :aria-label="issue.title"
      tabindex="-1"
      @click="onBackdropClick"
      @keydown="onKeydown"
    >
      <div ref="sheetRef" class="sheet" @click.stop>
        <div
          class="sheet-drag"
          :style="dragY ? { transform: `translate3d(0, ${dragY}px, 0)` } : undefined"
        >
        <div
          class="grab"
          aria-hidden="true"
          @pointerdown="onGrabPointerDown"
          @pointermove="onGrabPointerMove"
          @pointerup="onGrabPointerUp"
          @pointercancel="onGrabPointerCancel"
        />
        <header class="sheet-head">
          <div class="head-copy">
            <div class="head-meta">
              <div class="tracking">
                <p class="stamp" :data-flip-id="`issue-${issue.id}-tracking`">{{ issue.trackingId }}</p>
                <button
                  type="button"
                  class="copy"
                  :aria-label="copied ? t('sheet.copied') : t('sheet.copyTracking')"
                  @click="copyTracking"
                >
                  <AppIcon :name="copied ? 'check' : 'copy'" size="0.95rem" />
                </button>
              </div>
              <StatusPill :status="issue.status" :flip-id="`issue-${issue.id}-status`" />
            </div>
            <h2 class="title" :data-flip-id="`issue-${issue.id}-title`">{{ issue.title }}</h2>
          </div>
          <button type="button" class="close" :aria-label="t('sheet.close')" @click="emit('close')">
            <AppIcon name="x" size="1rem" />
          </button>
        </header>

        <div class="sheet-body">
          <StatusTrack data-enter-block :status="issue.status" />

          <div v-if="canManageStatus && (upcoming || canReject)" class="advance-wrap" data-enter-block>
            <button v-if="upcoming" type="button" class="btn advance-btn" @click="advance">
              {{
                upcoming === 'resolved'
                  ? t('sheet.markResolved')
                  : t('sheet.advanceTo', { status: t(`status.${upcoming}`) })
              }}
            </button>
            <button v-if="canReject" type="button" class="btn-secondary reject-btn" @click="reject">
              {{ t('sheet.reject') }}
            </button>
          </div>

          <img
            v-if="issue.photoDataUrl"
            class="photo"
            :src="issue.photoDataUrl"
            alt=""
            :data-flip-id="`issue-${issue.id}-photo`"
          />

          <div class="pills" data-enter-block>
            <SeverityPill :severity="issue.severity" />
            <span class="stamp">{{ issueTypeLabel(issue.issueType) }}</span>
          </div>

          <div class="block" data-enter-block>
            <p class="row-label">{{ t('sheet.summary') }}</p>
            <p class="description">{{ issue.summary }}</p>
          </div>

          <div class="block" data-enter-block>
            <p class="row-label">{{ t('sheet.location') }}</p>
            <p class="location">{{ issue.locationLabel }}</p>
            <p
              v-if="issue.latitude !== undefined && issue.longitude !== undefined"
              class="coords hint"
            >
              {{ issue.latitude.toFixed(5) }}, {{ issue.longitude.toFixed(5) }}
            </p>
          </div>

          <div v-if="issue.recommendedAction" class="block" data-enter-block>
            <p class="row-label">{{ t('sheet.recommendedAction') }}</p>
            <p class="description">{{ issue.recommendedAction }}</p>
          </div>

          <div v-if="issue.audioUrl" class="block" data-enter-block>
            <p class="row-label">{{ t('sheet.audio') }}</p>
            <audio class="audio" :src="issue.audioUrl" controls />
          </div>

          <div v-if="showTranscript" class="block" data-enter-block>
            <p class="row-label">{{ t('sheet.transcript') }}</p>
            <p class="description">{{ issue.transcript }}</p>
          </div>

          <div class="block" data-enter-block>
            <p class="row-label">{{ t('sheet.description') }}</p>
            <p class="description">{{ issue.description }}</p>
          </div>

          <ul class="timeline" data-enter-block>
            <li v-for="entry in timeline" :key="entry.label">
              <span class="dot" aria-hidden="true" />
              <div>
                <p class="timeline-label">{{ entry.label }}</p>
                <p class="timeline-when">{{ formatDateTime(entry.at) }}</p>
              </div>
            </li>
          </ul>

        </div>
        </div>
      </div>
    </div>
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

.sheet-drag {
  display: flex;
  flex-direction: column;
  min-height: 0;
  flex: 1;
  max-height: min(92dvh, 100%);
}

.grab {
  flex-shrink: 0;
  width: 100%;
  height: 1.35rem;
  margin: 0;
  padding: 0.55rem 0 0.55rem;
  background:
    linear-gradient(var(--border), var(--border)) center 0.55rem / 2.5rem 0.25rem no-repeat;
  cursor: grab;
  touch-action: none;
}

.grab:active {
  cursor: grabbing;
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

.head-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem;
}

.tracking {
  display: flex;
  align-items: center;
  gap: 0.2rem;
  min-width: 0;
}

.copy {
  display: grid;
  place-items: center;
  width: 2.2rem;
  height: 2.2rem;
  border: none;
  border-radius: var(--radius-pill);
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
}

.copy:hover {
  color: var(--text-h);
  background: #f1f0f0;
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
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 0.85rem 0 0.35rem;
}

.advance-btn,
.reject-btn {
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

.audio {
  display: block;
  width: 100%;
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

@media (min-width: 1024px) {
  .overlay {
    align-items: center;
    justify-content: center;
    padding: 1.5rem;
  }

  .sheet {
    width: min(42rem, calc(100vw - 3rem));
    max-height: min(85dvh, 100%);
    height: auto;
    border-radius: var(--radius-lg);
    border: 1px solid var(--border);
    box-shadow: 0 18px 56px rgba(9, 9, 10, 0.22);
  }

  .sheet-drag {
    max-height: min(85dvh, 100%);
  }

  .grab {
    display: none;
  }

  .sheet-head {
    padding-top: 1rem;
  }

  .sheet-body {
    padding-bottom: 1.5rem;
  }

  .title {
    font-size: 1.7rem;
  }

  .advance-btn,
  .reject-btn {
    width: fit-content;
  }

  .sheet :deep(.speak .btn-secondary) {
    width: fit-content;
  }
}
</style>
