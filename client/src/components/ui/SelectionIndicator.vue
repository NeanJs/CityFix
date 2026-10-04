<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue'
import { captureFlip, playFlip } from '../../motion/flip'
import { duration } from '../../motion/tokens'
import { easings } from '../../motion/easings'

const props = withDefaults(
  defineProps<{
    activeKey: string | number
    variant?: 'fill' | 'underline' | 'bar'
    tone?: 'muted' | 'ink' | 'accent'
  }>(),
  { variant: 'fill', tone: 'muted' },
)

const indicator = ref<HTMLElement | null>(null)

function hostEl() {
  return indicator.value?.parentElement ?? null
}

function activeEl() {
  return hostEl()?.querySelector('[data-selection-active="true"]') as HTMLElement | null
}

function applyBox() {
  const node = indicator.value
  const host = hostEl()
  const active = activeEl()
  if (!node || !host || !active) {
    return false
  }
  const hostBox = host.getBoundingClientRect()
  const box = active.getBoundingClientRect()
  node.style.width = `${box.width}px`
  node.style.height = `${props.variant === 'underline' ? 2 : box.height}px`
  const y =
    props.variant === 'underline'
      ? box.bottom - hostBox.top - 2
      : box.top - hostBox.top
  node.style.left = `${box.left - hostBox.left}px`
  node.style.top = `${y}px`
  node.style.opacity = '1'
  return true
}

async function move() {
  const node = indicator.value
  if (!node) {
    return
  }
  const state = captureFlip(node)
  await nextTick()
  if (!applyBox()) {
    return
  }
  playFlip(state, {
    duration: duration.md,
    ease: easings.indicator,
    absolute: false,
    fade: false,
  })
}

watch(
  () => props.activeKey,
  () => {
    void move()
  },
)

onMounted(() => {
  applyBox()
})
</script>

<template>
  <span
    ref="indicator"
    class="indicator"
    :class="[props.variant, props.tone]"
    aria-hidden="true"
  />
</template>

<style scoped>
.indicator {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 0;
  pointer-events: none;
  opacity: 0;
  will-change: transform;
}

.indicator.fill {
  border-radius: var(--radius-pill);
}

.indicator.fill.muted {
  background: #f1f0f0;
}

.indicator.fill.ink {
  background: var(--ink);
}

.indicator.fill.accent {
  background: var(--accent);
}

.indicator.underline {
  border-radius: 999px;
  background: var(--accent);
}

.indicator.bar {
  border-radius: 999px;
  background: var(--accent);
}
</style>
