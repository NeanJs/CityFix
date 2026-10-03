<script setup lang="ts">
import { appName } from '../../config/appConfig'

defineProps<{
  subtitle?: string
}>()
</script>

<template>
  <header class="header">
    <div class="brand">
      <div class="mark" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none">
          <path
            d="M12 2.5 4 8v8l8 5.5L20 16V8l-8-5.5Z"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linejoin="round"
          />
          <path
            d="M12 11.5a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Z"
            fill="currentColor"
          />
        </svg>
      </div>
      <div>
        <p class="name">{{ appName }}</p>
        <p v-if="subtitle" class="subtitle">{{ subtitle }}</p>
      </div>
    </div>
  </header>
</template>

<style scoped>
.header {
  padding: 0.25rem 0 0.75rem;
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.mark {
  width: 2.75rem;
  height: 2.75rem;
  display: grid;
  place-items: center;
  border-radius: 0.95rem;
  color: var(--accent);
  background: linear-gradient(145deg, rgba(45, 212, 191, 0.25), rgba(14, 165, 233, 0.12));
  border: 1px solid rgba(45, 212, 191, 0.35);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.25);
}

.mark svg {
  width: 1.35rem;
  height: 1.35rem;
}

.name {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--text-h);
}

.subtitle {
  margin: 0.1rem 0 0;
  font-size: 0.82rem;
  color: var(--text-muted);
}
</style>
