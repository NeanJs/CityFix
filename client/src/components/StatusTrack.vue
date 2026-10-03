<script setup lang="ts">
import { useLocale } from '../composables/useLocale'
import { statusOrder } from '../services/report/statusFlow'
import type { IssueStatus } from '../types/issue'

const props = defineProps<{
  status: IssueStatus
}>()

const { t } = useLocale()

function stateFor(id: IssueStatus) {
  const current = statusOrder.indexOf(props.status)
  const index = statusOrder.indexOf(id)
  if (index < current) {
    return 'done'
  }
  if (index === current) {
    return 'current'
  }
  return 'upcoming'
}
</script>

<template>
  <ol class="track" :aria-label="t('sheet.status')">
    <li
      v-for="id in statusOrder"
      :key="id"
      :class="stateFor(id)"
    >
      <span class="dot" aria-hidden="true" />
      <span class="label">{{ t(`status.${id}`) }}</span>
    </li>
  </ol>
</template>

<style scoped>
.track {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.25rem;
}

.track li {
  display: grid;
  gap: 0.3rem;
  justify-items: center;
  text-align: center;
  color: var(--text-muted);
}

.dot {
  width: 100%;
  height: 0.28rem;
  background: var(--border);
}

.track li.done .dot,
.track li.current .dot {
  background: var(--accent);
}

.track li.current {
  color: var(--text-h);
}

.label {
  font-size: 0.68rem;
  font-weight: 650;
  line-height: 1.2;
}
</style>
