<script setup lang="ts">
withDefaults(
  defineProps<{
    padding?: 'sm' | 'md' | 'lg'
    interactive?: boolean
    tone?: 'regular' | 'thick' | 'fill' | 'clear'
  }>(),
  {
    padding: 'md',
    interactive: false,
    tone: 'thick',
  },
)
</script>

<template>
  <div
    class="panel"
    :class="[`pad-${padding}`, `glass-${tone}`, { interactive }]"
  >
    <slot />
  </div>
</template>

<style scoped>
.panel {
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.pad-sm {
  padding: 0.7rem 0.8rem;
}

.pad-md {
  padding: 0.9rem 1rem;
}

.pad-lg {
  padding: 1.15rem 1.2rem;
}

.interactive {
  transition: background 0.15s ease;
}

@media (hover: hover) {
  .interactive:hover {
    background: #f1f0f0;
  }
}
</style>
