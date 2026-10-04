<script setup lang="ts">
withDefaults(
  defineProps<{
    lines?: number
    tall?: boolean
  }>(),
  {
    lines: 3,
    tall: false,
  },
)
</script>

<template>
  <div class="skeleton-panel glass-fill" aria-hidden="true">
    <span
      v-for="index in lines"
      :key="index"
      class="line skeleton-bone"
    />
    <span v-if="tall" class="body skeleton-bone" />
  </div>
</template>

<style scoped>
.skeleton-panel {
  display: grid;
  align-content: start;
  gap: 0.55rem;
  min-width: 0;
  padding: 1.15rem 1.2rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  pointer-events: none;
}

.line {
  height: 0.72rem;
}

.line:nth-child(3n + 1) {
  width: 72%;
}

.line:nth-child(3n + 2) {
  width: 54%;
}

.line:nth-child(3n) {
  width: 86%;
}

.body {
  width: 100%;
  min-height: 10.5rem;
  margin-top: 0.35rem;
  border-radius: var(--radius-md);
}
</style>
