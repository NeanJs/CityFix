<script setup lang="ts">
import { categoryLabel } from '../data/categories'
import type { Issue } from '../types/issue'
import GlassPanel from './ui/GlassPanel.vue'
import StatusPill from './StatusPill.vue'

const props = defineProps<{
  issue: Issue
  highlighted?: boolean
}>()

const emit = defineEmits<{
  select: [id: string]
}>()

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
    <GlassPanel padding="md" interactive>
      <div class="row">
        <div class="meta">
          <span class="category">{{ categoryLabel(props.issue.category) }}</span>
          <StatusPill :status="props.issue.status" />
        </div>
        <time class="when" :datetime="props.issue.updatedAt">{{ formatWhen(props.issue.updatedAt) }}</time>
      </div>
      <h3 class="title">{{ props.issue.title }}</h3>
      <p class="location">{{ props.issue.locationLabel }}</p>
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

.issue-card.highlighted :deep(.glass) {
  border-color: rgba(45, 212, 191, 0.65);
  box-shadow:
    0 0 0 1px rgba(45, 212, 191, 0.25),
    var(--glass-shadow);
}

.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.45rem;
}

.meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem;
}

.category {
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
}

.when {
  font-size: 0.75rem;
  color: var(--text-muted);
  flex-shrink: 0;
}

.title {
  margin: 0 0 0.35rem;
  font-size: 1rem;
  font-weight: 650;
  color: var(--text-h);
  line-height: 1.35;
}

.location {
  margin: 0;
  font-size: 0.85rem;
  color: var(--text-muted);
}
</style>
