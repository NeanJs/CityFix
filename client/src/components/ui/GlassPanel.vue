<script setup lang="ts">
withDefaults(
  defineProps<{
    padding?: 'sm' | 'md' | 'lg'
    interactive?: boolean
  }>(),
  {
    padding: 'md',
    interactive: false,
  },
)
</script>

<template>
  <div
    class="glass"
    :class="[`pad-${padding}`, { interactive }]"
  >
    <slot />
  </div>
</template>

<style scoped>
.glass {
  position: relative;
  border-radius: var(--radius-lg);
  border: 1px solid var(--glass-border);
  background: var(--glass-bg);
  box-shadow: var(--glass-shadow);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  overflow: hidden;
}

.glass::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(
    145deg,
    rgba(255, 255, 255, 0.22) 0%,
    rgba(255, 255, 255, 0.02) 40%,
    transparent 60%
  );
  pointer-events: none;
}

.pad-sm {
  padding: 0.75rem 0.9rem;
}

.pad-md {
  padding: 1rem 1.1rem;
}

.pad-lg {
  padding: 1.25rem 1.35rem;
}

.interactive {
  transition:
    transform 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.interactive:active {
  transform: scale(0.985);
}

@media (hover: hover) {
  .interactive:hover {
    border-color: var(--glass-border-hover);
    box-shadow: var(--glass-shadow-hover);
  }
}
</style>
