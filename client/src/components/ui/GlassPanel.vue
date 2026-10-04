<script setup lang="ts">
withDefaults(
  defineProps<{
    padding?: 'none' | 'sm' | 'md' | 'lg'
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

.pad-none {
  padding: 0;
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
  transition: background var(--motion-duration-xs) var(--motion-ease);
}

@media (hover: hover) {
  .interactive:hover {
    background: var(--surface-frost-hover);
  }
}
</style>
