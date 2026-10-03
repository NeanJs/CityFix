<script setup lang="ts">
import { computed } from 'vue'
import { useLocale } from '../composables/useLocale'
import type { Issue, IssueStatus } from '../types/issue'
import GlassPanel from './ui/GlassPanel.vue'
import StatusPill from './StatusPill.vue'

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

const statusOptions: { id: IssueStatus; labelKey: string }[] = [
  { id: 'submitted', labelKey: 'status.submitted' },
  { id: 'in_review', labelKey: 'status.reviewShort' },
  { id: 'scheduled', labelKey: 'status.scheduled' },
  { id: 'resolved', labelKey: 'status.resolved' },
]

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
          <GlassPanel padding="lg" tone="paper">
            <div class="sheet-head">
              <div>
                <p class="stamp">{{ t(`category.${issue.category}`) }}</p>
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

            <div class="block">
              <p class="row-label">{{ t('sheet.status') }}</p>
              <StatusPill :status="issue.status" />
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

            <div v-if="canManageStatus" class="actions">
              <p class="row-label">{{ t('sheet.advanceStatus') }}</p>
              <div class="status-buttons">
                <button
                  v-for="status in statusOptions"
                  :key="status.id"
                  type="button"
                  class="status-btn"
                  :class="{ active: issue.status === status.id }"
                  @click="emit('statusChange', issue.id, status.id)"
                >
                  {{ t(status.labelKey) }}
                </button>
              </div>
            </div>
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
  padding: 0.85rem 0.85rem calc(5.75rem + env(safe-area-inset-bottom, 0px));
  background: rgba(26, 24, 20, 0.42);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
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
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--text-h);
  line-height: 1.25;
  font-family: var(--font-display);
}

.close {
  width: 2.4rem;
  height: 2.4rem;
  display: grid;
  place-items: center;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface-raised);
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
  font-size: 0.68rem;
  font-weight: 650;
  letter-spacing: 0.06em;
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
  border-radius: 0;
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

.status-buttons {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.4rem;
}

.status-btn {
  min-height: 2.4rem;
  padding: 0.4rem 0.55rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface-raised);
  color: var(--text-muted);
  font-size: 0.75rem;
  font-weight: 650;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  cursor: pointer;
}

.status-btn.active {
  color: var(--text-h);
  border-color: var(--accent);
  background: var(--surface);
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

  .status-buttons {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .sheet-enter-from .sheet,
  .sheet-leave-to .sheet {
    transform: translateX(18px);
  }
}
</style>
