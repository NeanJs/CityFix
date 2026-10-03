<script setup lang="ts">
import { computed } from 'vue'
import { categoryLabel } from '../data/categories'
import type { Issue, IssueStatus } from '../types/issue'
import GlassPanel from './ui/GlassPanel.vue'
import StatusPill from './StatusPill.vue'

const props = defineProps<{
  issue: Issue | null
  open: boolean
}>()

const emit = defineEmits<{
  close: []
  statusChange: [id: string, status: IssueStatus]
}>()

const statusOptions: IssueStatus[] = ['submitted', 'in_review', 'scheduled', 'resolved']

const timeline = computed(() => {
  if (!props.issue) {
    return []
  }
  const created = new Date(props.issue.createdAt)
  const updated = new Date(props.issue.updatedAt)
  return [
    { label: 'Reported', at: created },
    { label: 'Last update', at: updated },
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
          <GlassPanel padding="lg">
            <div class="sheet-head">
              <div>
                <p class="category">{{ categoryLabel(issue.category) }}</p>
                <h2 class="title">{{ issue.title }}</h2>
              </div>
              <button type="button" class="close" aria-label="Close" @click="emit('close')">
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

            <div class="status-row">
              <StatusPill :status="issue.status" />
              <p class="location">{{ issue.locationLabel }}</p>
            </div>

            <p class="description">{{ issue.description }}</p>

            <ul class="timeline">
              <li v-for="entry in timeline" :key="entry.label">
                <span class="dot" aria-hidden="true" />
                <div>
                  <p class="timeline-label">{{ entry.label }}</p>
                  <p class="timeline-when">{{ formatDateTime(entry.at) }}</p>
                </div>
              </li>
            </ul>

            <div class="actions">
              <p class="actions-label">Update status</p>
              <div class="status-buttons">
                <button
                  v-for="status in statusOptions"
                  :key="status"
                  type="button"
                  class="status-btn"
                  :class="{ active: issue.status === status }"
                  @click="emit('statusChange', issue.id, status)"
                >
                  <StatusPill :status="status" />
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
  padding: 1rem 1rem calc(5.5rem + env(safe-area-inset-bottom, 0px));
  background: rgba(15, 23, 42, 0.45);
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
  margin-bottom: 0.75rem;
}

.category {
  margin: 0 0 0.25rem;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-h);
  line-height: 1.3;
}

.close {
  width: 2.25rem;
  height: 2.25rem;
  display: grid;
  place-items: center;
  border: 1px solid var(--glass-border);
  border-radius: 0.75rem;
  background: rgba(255, 255, 255, 0.06);
  color: var(--text-h);
  cursor: pointer;
}

.close svg {
  width: 1rem;
  height: 1rem;
}

.status-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem 0.75rem;
  margin-bottom: 0.85rem;
}

.location {
  margin: 0;
  font-size: 0.88rem;
  color: var(--text-muted);
}

.description {
  margin: 0 0 1rem;
  font-size: 0.95rem;
  line-height: 1.55;
  color: var(--text);
}

.timeline {
  list-style: none;
  margin: 0 0 1.1rem;
  padding: 0;
  display: grid;
  gap: 0.65rem;
}

.timeline li {
  display: flex;
  gap: 0.65rem;
  align-items: flex-start;
}

.dot {
  width: 0.55rem;
  height: 0.55rem;
  margin-top: 0.35rem;
  border-radius: 50%;
  background: var(--accent);
  box-shadow: 0 0 0 4px rgba(45, 212, 191, 0.15);
}

.timeline-label {
  margin: 0;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-h);
}

.timeline-when {
  margin: 0.1rem 0 0;
  font-size: 0.78rem;
  color: var(--text-muted);
}

.actions-label {
  margin: 0 0 0.5rem;
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.status-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.status-btn {
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
  border-radius: 999px;
  opacity: 0.72;
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.status-btn.active {
  opacity: 1;
  transform: scale(1.03);
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
</style>
