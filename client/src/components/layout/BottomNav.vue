<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const items = [
  { name: 'home', path: '/', label: 'Home' },
  { name: 'reports', path: '/reports', label: 'Reports' },
  { name: 'report', path: '/report', label: 'Report' },
] as const

const activeName = computed(() => route.name)
</script>

<template>
  <nav class="nav" aria-label="Primary">
    <div class="dock">
      <button
        v-for="item in items"
        :key="item.name"
        type="button"
        class="item"
        :class="{ active: activeName === item.name }"
        :aria-current="activeName === item.name ? 'page' : undefined"
        @click="router.push(item.path)"
      >
        <span class="icon" aria-hidden="true">
          <svg v-if="item.name === 'home'" viewBox="0 0 24 24" fill="none">
            <path
              d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linejoin="round"
            />
          </svg>
          <svg v-else-if="item.name === 'reports'" viewBox="0 0 24 24" fill="none">
            <path
              d="M7 4h10a2 2 0 0 1 2 2v14l-3-2-3 2-3-2-3 2-3-2V6a2 2 0 0 1 2-2Z"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linejoin="round"
            />
          </svg>
          <svg v-else viewBox="0 0 24 24" fill="none">
            <path
              d="M12 5v14M5 12h14"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
            />
          </svg>
        </span>
        <span class="label">{{ item.label }}</span>
      </button>
    </div>
  </nav>
</template>

<style scoped>
.nav {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 30;
  padding: 0.5rem 1rem calc(0.65rem + env(safe-area-inset-bottom, 0px));
  pointer-events: none;
}

@media (min-width: 1024px) {
  .nav {
    display: none;
  }
}

.dock {
  pointer-events: auto;
  max-width: 28rem;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.35rem;
  padding: 0.45rem;
  border-radius: 1.25rem;
  border: 1px solid var(--glass-border);
  background: var(--glass-bg-strong);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  box-shadow: var(--dock-shadow);
}

.item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
  padding: 0.55rem 0.35rem;
  border: none;
  border-radius: 0.95rem;
  background: transparent;
  color: var(--text-muted);
  font-size: 0.68rem;
  font-weight: 600;
  cursor: pointer;
  transition:
    background 0.2s ease,
    color 0.2s ease,
    transform 0.15s ease;
}

.item:active {
  transform: scale(0.96);
}

.item.active {
  color: var(--text-h);
  background: linear-gradient(160deg, rgba(45, 212, 191, 0.22), rgba(14, 165, 233, 0.12));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.icon svg {
  width: 1.25rem;
  height: 1.25rem;
}

.label {
  line-height: 1;
}
</style>
