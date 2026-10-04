<script setup lang="ts">
import { computed } from 'vue'
import { useLocale } from '../composables/useLocale'
import { nextStatus } from '../services/report/statusFlow'
import type { Issue } from '../types/issue'
import SeverityPill from './SeverityPill.vue'
import StatusPill from './StatusPill.vue'

const props = defineProps<{
  issue: Issue
  highlighted?: boolean
  showAdvance?: boolean
}>()

const emit = defineEmits<{
  select: [id: string]
  advance: [id: string]
}>()

const { t } = useLocale()
const upcoming = computed(() => nextStatus(props.issue.status))

function formatWhen(iso: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
  }).format(new Date(iso))
}

function onAdvance(event: Event) {
  event.stopPropagation()
  if (upcoming.value) {
    emit('advance', props.issue.id)
  }
}
</script>

<template>
  <div
    class="issue-card surface-frost"
    :class="{ highlighted: props.highlighted }"
    role="button"
    tabindex="0"
    @click="emit('select', props.issue.id)"
    @keydown.enter.prevent="emit('select', props.issue.id)"
    @keydown.space.prevent="emit('select', props.issue.id)"
  >
    <div class="body">
      <div v-if="props.issue.photoDataUrl" class="thumb-wrap">
        <img class="thumb" :src="props.issue.photoDataUrl" alt="" />
      </div>
      <div class="copy">
        <div class="topline">
          <h3 class="title">{{ props.issue.title }}</h3>
          <StatusPill :status="props.issue.status" />
        </div>
        <p class="location">{{ props.issue.locationLabel }}</p>
        <div class="meta">
          <span class="stamp">{{ props.issue.trackingId }}</span>
          <SeverityPill :severity="props.issue.severity" />
          <time class="when" :datetime="props.issue.updatedAt">{{ formatWhen(props.issue.updatedAt) }}</time>
          <button
            v-if="props.showAdvance && upcoming"
            type="button"
            class="btn advance"
            @click="onAdvance"
          >
            {{ t('adminHome.advance') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.issue-card {
  width: 100%;
  padding: 0.95rem 1rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--surface-raised);
  box-shadow: inset 3px 0 0 var(--civic-bar);
  text-align: left;
  cursor: pointer;
  color: inherit;
  font: inherit;
}

.issue-card.highlighted {
  background: var(--surface);
}

.issue-card.highlighted .title {
  color: var(--ink);
}

@media (hover: hover) {
  .issue-card:hover {
    background: var(--surface);
  }
}

.body {
  display: flex;
  gap: 0.85rem;
  align-items: stretch;
}

.thumb-wrap {
  flex-shrink: 0;
  width: 4.5rem;
  border-radius: var(--radius-md);
  overflow: hidden;
  background: #f1f0f0;
}

.thumb {
  display: block;
  width: 100%;
  height: 100%;
  min-height: 4.5rem;
  object-fit: cover;
}

.copy {
  min-width: 0;
  flex: 1;
  display: grid;
  gap: 0.25rem;
  align-content: start;
}

.topline {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.6rem;
}

.title {
  margin: 0;
  font-size: 1.02rem;
  font-weight: 700;
  color: var(--text-h);
  line-height: 1.3;
}

.location {
  margin: 0;
  font-size: 0.9rem;
  color: var(--text-muted);
  line-height: 1.4;
}

.meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem;
}

.when {
  font-size: 0.8rem;
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
}

.advance {
  min-height: 2rem;
  padding: 0.2rem 0.75rem;
  font-size: 0.8rem;
}

@media (min-width: 720px) {
  .thumb-wrap {
    width: 5.5rem;
  }
}
</style>
