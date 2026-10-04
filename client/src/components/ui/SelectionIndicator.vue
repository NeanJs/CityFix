<script setup lang="ts">
import gsap from 'gsap'
import { Flip } from 'gsap/Flip'
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
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
let resizeObserver: ResizeObserver | null = null
let moveGeneration = 0

function hostEl() {
  return indicator.value?.parentElement ?? null
}

function activeEl() {
  return hostEl()?.querySelector('[data-selection-active="true"]') as HTMLElement | null
}

function resetIndicatorMotion(node: HTMLElement) {
  Flip.killFlipsOf(node)
  gsap.killTweensOf(node)
  gsap.set(node, { clearProps: 'transform' })
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

function hideIndicator() {
  const node = indicator.value
  if (!node) {
    return
  }
  resetIndicatorMotion(node)
  node.style.opacity = '0'
}

function settleLayout() {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve())
    })
  })
}

function observeSiblings() {
  const host = hostEl()
  const node = indicator.value
  if (!host || !node || !resizeObserver) {
    return
  }
  resizeObserver.disconnect()
  resizeObserver.observe(host)
  for (const child of host.children) {
    if (child !== node) {
      resizeObserver.observe(child)
    }
  }
}

function syncPosition() {
  const node = indicator.value
  if (!node) {
    return
  }
  resetIndicatorMotion(node)
  if (!applyBox()) {
    hideIndicator()
  }
}

async function move(animate: boolean) {
  const generation = ++moveGeneration
  const node = indicator.value
  if (!node) {
    return
  }

  resetIndicatorMotion(node)
  const state = animate ? captureFlip(node) : null

  await nextTick()
  await settleLayout()
  if (generation !== moveGeneration) {
    return
  }

  observeSiblings()

  if (!applyBox()) {
    hideIndicator()
    return
  }

  if (!animate || !state) {
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
    void move(true)
  },
)

onMounted(() => {
  resizeObserver = new ResizeObserver(() => {
    syncPosition()
  })
  void move(false)
})

onUnmounted(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
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
  box-shadow: inset 0 0 0 1px var(--selection-fill-border);
}

.indicator.fill.muted {
  background: var(--selection-fill-bg);
}

.indicator.fill.ink {
  background: var(--ink);
  box-shadow: inset 0 0 0 1px rgba(9, 9, 10, 0.2);
}

.indicator.fill.accent {
  background: var(--accent);
  box-shadow: inset 0 0 0 1px rgba(99, 74, 38, 0.35);
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
