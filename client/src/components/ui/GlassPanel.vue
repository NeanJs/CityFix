<script setup lang="ts">
withDefaults(
  defineProps<{
    padding?: 'sm' | 'md' | 'lg'
    interactive?: boolean
    tone?: 'glass' | 'paper'
  }>(),
  {
    padding: 'md',
    interactive: false,
    tone: 'glass',
  },
)
</script>

<template>
  <div
    class="panel"
    :class="[`pad-${padding}`, `tone-${tone}`, { interactive }]"
  >
    <slot />
  </div>
</template>

<style scoped>
.panel {
  position: relative;
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.tone-glass {
  border: 1px solid var(--glass-border);
  background: var(--glass-bg);
  box-shadow: var(--glass-shadow);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
}

.tone-glass::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(
    145deg,
    rgba(255, 255, 255, 0.28) 0%,
    rgba(255, 255, 255, 0.04) 38%,
    transparent 62%
  );
  pointer-events: none;
}

.tone-paper {
  border: 1px solid var(--border);
  background: var(--surface);
  box-shadow: var(--paper-shadow);
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
  transition:
    transform 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.interactive:active {
  transform: scale(0.99);
}

@media (hover: hover) {
  .interactive:hover {
    border-color: var(--glass-border-hover);
    box-shadow: var(--glass-shadow-hover);
  }
}
</style>
