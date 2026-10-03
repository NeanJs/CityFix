<script setup lang="ts">
import { useLocale } from '../composables/useLocale'
import type { IssueStatus } from '../types/issue'

const props = defineProps<{
  status: IssueStatus
}>()

const { t } = useLocale()
</script>

<template>
  <span class="stamp status" :class="`status-${props.status}`">{{ t(`status.${props.status}`) }}</span>
</template>

<style scoped>
.status-submitted {
  color: var(--status-submitted-fg);
  background: var(--status-submitted-bg);
  border-color: var(--status-submitted-bd);
}

.status-in_review {
  color: var(--status-review-fg);
  background: var(--status-review-bg);
  border-color: var(--status-review-bd);
}

.status-scheduled {
  color: var(--status-scheduled-fg);
  background: var(--status-scheduled-bg);
  border-color: var(--status-scheduled-bd);
}

.status-resolved {
  color: var(--status-resolved-fg);
  background: var(--status-resolved-bg);
  border-color: var(--status-resolved-bd);
}
</style>
