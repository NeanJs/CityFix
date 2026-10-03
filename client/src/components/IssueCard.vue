<script setup lang="ts">
import { useLocale } from '../composables/useLocale'
import type { Issue } from '../types/issue'
import GlassPanel from './ui/GlassPanel.vue'
import SeverityPill from './SeverityPill.vue'
import StatusPill from './StatusPill.vue'

const props = defineProps<{
  issue: Issue
  highlighted?: boolean
}>()

const emit = defineEmits<{
  select: [id: string]
}>()

const { t } = useLocale()

function formatWhen(iso: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
  }).format(new Date(iso))
}
</script>

<template>
  <button
    type="button"
    class="issue-card"
    :class="{ highlighted: props.highlighted }"
    @click="emit('select', props.issue.id)"
  >
    <GlassPanel padding="md" tone="paper" interactive>
      <div v-if="props.issue.photoDataUrl" class="thumb-wrap">
        <img class="thumb" :src="props.issue.photoDataUrl" alt="" />
      </div>
      <div class="row">
        <div class="meta">
          <span class="stamp">{{ props.issue.trackingId }}</span>
          <span class="stamp">{{ t(`category.${props.issue.category}`) }}</span>
          <SeverityPill :severity="props.issue.severity" />
          <StatusPill :status="props.issue.status" />
        </div>
        <time class="when" :datetime="props.issue.updatedAt">{{ formatWhen(props.issue.updatedAt) }}</time>
      </div>
      <h3 class="title">{{ props.issue.title }}</h3>
      <p class="location">
        <svg class="pin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M12 21s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11Z"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linejoin="round"
          />
          <circle cx="12" cy="10" r="2.25" stroke="currentColor" stroke-width="1.5" />
        </svg>
        {{ props.issue.locationLabel }}
      </p>
    </GlassPanel>
  </button>
</template>

<style scoped>
.issue-card {
  width: 100%;
  padding: 0;
  border: none;
  background: none;
  text-align: left;
  cursor: pointer;
  color: inherit;
  font: inherit;
}

.issue-card.highlighted :deep(.panel) {
  border-color: var(--accent);
  box-shadow:
    0 0 0 1px var(--accent),
    var(--paper-shadow);
}

.thumb-wrap {
  margin: -0.15rem -0.15rem 0.65rem;
  border-radius: var(--radius-sm);
  overflow: hidden;
  border: 1px solid var(--border);
}

.thumb {
  display: block;
  width: 100%;
  height: 7.5rem;
  object-fit: cover;
}

.row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem;
}

.when {
  font-size: 0.75rem;
  color: var(--text-muted);
  flex-shrink: 0;
  font-variant-numeric: tabular-nums;
}

.title {
  margin: 0 0 0.35rem;
  font-size: 1rem;
  font-weight: 650;
  color: var(--text-h);
  line-height: 1.3;
}

.location {
  margin: 0;
  display: flex;
  align-items: flex-start;
  gap: 0.35rem;
  font-size: 0.85rem;
  color: var(--text-muted);
  line-height: 1.4;
}

.pin {
  width: 0.9rem;
  height: 0.9rem;
  flex-shrink: 0;
  margin-top: 0.12rem;
  color: var(--accent);
}
</style>
