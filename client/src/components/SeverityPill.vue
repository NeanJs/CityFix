<script setup lang="ts">
import { useLocale } from '../composables/useLocale'
import type { IssueSeverity } from '../types/issue'

const props = defineProps<{
  severity: IssueSeverity
}>()

const { t } = useLocale()
</script>

<template>
  <span class="stamp severity" :class="`severity-${props.severity}`">
    {{ t(`severity.${props.severity}`) }}
  </span>
</template>

<style scoped>
.severity-low {
  color: var(--severity-low-fg);
  background: var(--severity-low-bg);
  border-color: var(--severity-low-bd);
}

.severity-medium {
  color: var(--severity-medium-fg);
  background: var(--severity-medium-bg);
  border-color: var(--severity-medium-bd);
}

.severity-high {
  color: var(--severity-high-fg);
  background: var(--severity-high-bg);
  border-color: var(--severity-high-bd);
}
</style>
