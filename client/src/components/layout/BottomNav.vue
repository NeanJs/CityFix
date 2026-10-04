<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import type { NavItem } from '../../config/nav'
import { useLocale } from '../../composables/useLocale'
import { useNavActiveName } from '../../composables/useNavActiveName'
import AppIcon from '../ui/AppIcon.vue'
import SelectionIndicator from '../ui/SelectionIndicator.vue'

const props = defineProps<{
  items: readonly NavItem[]
  ariaLabel: string
}>()

const router = useRouter()
const { t } = useLocale()
const activeName = useNavActiveName(() => props.items)
const columns = computed(() => props.items.length)
</script>

<template>
  <nav class="nav" :aria-label="ariaLabel">
    <div class="dock glass-dock" :style="{ gridTemplateColumns: `repeat(${columns}, 1fr)` }">
      <SelectionIndicator :active-key="String(activeName ?? '')" />
      <button
        v-for="item in items"
        :key="item.name"
        type="button"
        class="item"
        :class="{ active: activeName === item.name, emphasis: item.emphasis }"
        :data-selection-active="activeName === item.name ? 'true' : undefined"
        :aria-current="activeName === item.name ? 'page' : undefined"
        @click="router.push(item.path)"
      >
        <span class="icon" aria-hidden="true">
          <AppIcon
            :name="item.icon"
            size="1.2rem"
            :weight="item.emphasis || activeName === item.name ? 'bold' : 'regular'"
          />
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
  position: relative;
  max-width: 34rem;
  margin: 0 auto;
  display: grid;
  gap: 0.2rem;
  padding: 0.28rem;
  border-radius: var(--radius-pill);
  border-width: 1.5px;
}

.item {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
  padding: 0.45rem 0.3rem;
  border: none;
  border-radius: var(--radius-pill);
  background: transparent;
  color: var(--selection-inactive-fg);
  font-size: 0.7rem;
  font-weight: 500;
  cursor: pointer;
  transition:
    color var(--motion-duration-xs) var(--motion-ease),
    transform var(--motion-duration-press) var(--motion-ease);
}

.item:active {
  transform: scale(0.97);
}

.item.active {
  color: var(--selection-active-fg);
  background: transparent;
}

.item.active .label {
  font-weight: 600;
}

.dock :deep(.indicator.fill) {
  border-radius: var(--radius-pill);
}

.item.emphasis .icon {
  color: var(--text-h);
}

.icon {
  display: grid;
  place-items: center;
  width: 1.2rem;
  height: 1.2rem;
}

.label {
  line-height: 1;
}
</style>
