<script setup lang="ts">
import { useLocale } from '../composables/useLocale'
import type { IssueStatus } from '../types/issue'
import MorphText from './ui/MorphText.vue'

const props = defineProps<{
  status: IssueStatus
  flipId?: string
}>()

const { t } = useLocale()
</script>

<template>
  <span
    class="stamp status"
    :class="`status-${props.status}`"
    :data-flip-id="props.flipId"
  >
    <MorphText :text="t(`status.${props.status}`)" />
  </span>
</template>

<style scoped>
.status-queued {
  color: var(--status-queued-fg);
  background: var(--status-queued-bg);
  border-color: var(--status-queued-bd);
}

.status-in_progress {
  color: var(--status-progress-fg);
  background: var(--status-progress-bg);
  border-color: var(--status-progress-bd);
}

.status-resolved {
  color: var(--status-resolved-fg);
  background: var(--status-resolved-bg);
  border-color: var(--status-resolved-bd);
}

.status-rejected {
  color: var(--status-rejected-fg);
  background: var(--status-rejected-bg);
  border-color: var(--status-rejected-bd);
}
</style>
