<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { NavItem } from '../../config/nav'
import { useLocale } from '../../composables/useLocale'

const props = defineProps<{
  items: readonly NavItem[]
  ariaLabel: string
}>()

const route = useRoute()
const router = useRouter()
const { t } = useLocale()
const activeName = computed(() => route.name)
const columns = computed(() => props.items.length)
</script>

<template>
  <nav class="nav" :aria-label="ariaLabel">
    <div class="dock glass-dock" :style="{ gridTemplateColumns: `repeat(${columns}, 1fr)` }">
      <button
        v-for="item in items"
        :key="item.name"
        type="button"
        class="item"
        :class="{ active: activeName === item.name, emphasis: item.emphasis }"
        :aria-current="activeName === item.name ? 'page' : undefined"
        @click="router.push(item.path)"
      >
        <span class="icon" aria-hidden="true">
          <svg v-if="item.icon === 'home' || item.icon === 'dashboard'" viewBox="0 0 24 24" fill="none">
            <path
              d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linejoin="round"
            />
          </svg>
          <svg v-else-if="item.icon === 'report'" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 5v14M5 12h14"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
            />
          </svg>
          <svg v-else viewBox="0 0 24 24" fill="none">
            <path
              d="M7 4h10a2 2 0 0 1 2 2v14l-3-2-3 2-3-2-3 2-3-2V6a2 2 0 0 1 2-2Z"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linejoin="round"
            />
          </svg>
        </span>
        <span class="label">{{ t(item.labelKey) }}</span>
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
  padding: 0.45rem 0.85rem calc(0.55rem + env(safe-area-inset-bottom, 0px));
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
  gap: 0.3rem;
  padding: 0.3rem;
  border-radius: var(--radius-pill);
  border-width: 1.5px;
}

.item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
  padding: 0.45rem 0.3rem;
  border: none;
  border-radius: var(--radius-pill);
  background: transparent;
  color: var(--text);
  font-size: 0.7rem;
  font-weight: 500;
  cursor: pointer;
  transition:
    background 0.2s ease,
    color 0.2s ease,
    border-color 0.2s ease,
    transform 0.15s ease;
}

.item:active {
  transform: scale(0.97);
}

.item.active {
  color: var(--text-h);
  background: #f1f0f0;
}

.item.emphasis .icon {
  color: var(--text-h);
}

.icon svg {
  width: 1.2rem;
  height: 1.2rem;
}

.label {
  line-height: 1;
}
</style>
