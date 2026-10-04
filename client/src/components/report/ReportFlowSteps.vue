<script setup lang="ts">
import { computed } from 'vue'
import { useLocale } from '../../composables/useLocale'
import SelectionIndicator from '../ui/SelectionIndicator.vue'

const props = defineProps<{
  current: 1 | 2 | 3
}>()

const { t } = useLocale()

const items = computed(() => [
  { step: 1 as const, label: t('report.capture') },
  { step: 2 as const, label: t('report.review') },
  { step: 3 as const, label: t('report.confirmation') },
])
</script>

<template>
  <ol class="steps" :aria-label="t('report.stepOf', { current: props.current, total: 3 })">
    <SelectionIndicator :active-key="props.current" variant="underline" />
    <li
      v-for="item in items"
      :key="item.step"
      :class="{ active: props.current === item.step, done: props.current > item.step }"
      :data-selection-active="props.current === item.step ? 'true' : undefined"
    >
      {{ item.label }}
    </li>
  </ol>
</template>

<style scoped>
.steps {
  position: relative;
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.35rem;
}

.steps li {
  position: relative;
  z-index: 1;
  padding: 0.45rem 0.3rem;
  border-bottom: 2px solid var(--border);
  color: var(--text-muted);
  font-size: 0.78rem;
  font-weight: 650;
  text-align: center;
}

.steps li.active {
  color: var(--text-h);
  border-bottom-color: transparent;
}

.steps li.done {
  color: var(--text-h);
  border-bottom-color: var(--text-muted);
}
</style>
