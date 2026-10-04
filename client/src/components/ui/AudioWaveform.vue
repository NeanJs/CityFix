<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useAudioWaveform, type AudioWaveformFrame } from '../../composables/useAudioWaveform'

const props = withDefaults(
  defineProps<{
    stream?: MediaStream | null
    label?: string
    bars?: number
  }>(),
  {
    stream: null,
    label: '',
  },
)

const canvas = ref<HTMLCanvasElement | null>(null)
const waveform = useAudioWaveform(() => props.stream)
let unsubscribe: (() => void) | null = null
let resizeObserver: ResizeObserver | null = null
let ink = '#09090a'
let latest: AudioWaveformFrame | null = null

function readInk(node: HTMLCanvasElement) {
  const color = getComputedStyle(node).color
  if (color) {
    ink = color
  }
}

function sampleAt(frame: AudioWaveformFrame, index: number) {
  if (index >= 0 && index < frame.count) {
    return frame.levels[index] ?? 0
  }
  if (frame.live && index === frame.count && index < frame.levels.length) {
    return frame.incoming
  }
  return 0
}

function levelAt(frame: AudioWaveformFrame, index: number) {
  const raw = sampleAt(frame, index)
  const end = frame.live && frame.count < frame.levels.length ? frame.count : frame.count - 1
  if (index < 0 || index > end) {
    return raw
  }
  const prev = index > 0 ? sampleAt(frame, index - 1) : raw
  const next = index < end ? sampleAt(frame, index + 1) : raw
  return prev * 0.16 + raw * 0.68 + next * 0.16
}

function fillCapsule(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const radius = Math.min(width / 2, height / 2)
  ctx.beginPath()
  ctx.roundRect(x, y, width, height, radius)
  ctx.fill()
}

function draw(frame: AudioWaveformFrame) {
  latest = frame
  const node = canvas.value
  if (!node) {
    return
  }
  const width = node.clientWidth
  const height = node.clientHeight
  if (width < 2 || height < 2) {
    return
  }
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const bufferWidth = Math.round(width * dpr)
  const bufferHeight = Math.round(height * dpr)
  if (node.width !== bufferWidth || node.height !== bufferHeight) {
    node.width = bufferWidth
    node.height = bufferHeight
    readInk(node)
  }
  const ctx = node.getContext('2d')
  if (!ctx) {
    return
  }
  const visible = Math.max(1, frame.visibleBars)
  const pitch = width / visible
  const barWidth = Math.min(3.25, Math.max(1.5, pitch * 0.48))
  const maxHeight = Math.max(2, height - 2)
  const minHeight = Math.min(2.25, maxHeight)
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, width, height)
  ctx.translate(-frame.scroll * pitch, 0)
  ctx.fillStyle = ink
  const midY = height / 2
  const first = Math.floor(frame.scroll) - 1
  const last = Math.ceil(frame.scroll + visible) + 1
  const fadesLeft = frame.live && frame.scroll > 0
  const fadesRight = !frame.live && frame.count > frame.scroll + visible
  for (let index = first; index <= last; index += 1) {
    const level = Math.max(0, Math.min(1, levelAt(frame, index)))
    const barHeight = minHeight + level * (maxHeight - minHeight)
    const screen = (index - frame.scroll) / visible
    let fade = 1
    if (fadesLeft && screen < 0.14) {
      fade = Math.max(0, screen / 0.14)
    }
    if (fadesRight && screen > 0.9) {
      fade = Math.min(fade, Math.max(0, (1 - screen) / 0.1))
    }
    const presence = 0.45 + Math.min(1, level * 3.4) * 0.55
    ctx.globalAlpha = fade * presence
    fillCapsule(
      ctx,
      index * pitch + (pitch - barWidth) / 2,
      midY - barHeight / 2,
      barWidth,
      barHeight,
    )
  }
  ctx.globalAlpha = 1
}

function syncBars() {
  const width = canvas.value?.clientWidth ?? 0
  if (width < 2) {
    return
  }
  waveform.setVisibleBars(props.bars ?? width / 5)
  if (latest) {
    draw(latest)
  }
}

onMounted(() => {
  const node = canvas.value
  if (!node) {
    return
  }
  readInk(node)
  unsubscribe = waveform.subscribe(draw)
  resizeObserver = new ResizeObserver(syncBars)
  resizeObserver.observe(node)
  syncBars()
})

watch(
  () => props.bars,
  () => {
    syncBars()
  },
)

onBeforeUnmount(() => {
  unsubscribe?.()
  resizeObserver?.disconnect()
})

defineExpose({ prime: waveform.prime, clear: waveform.clear })
</script>

<template>
  <canvas
    ref="canvas"
    class="waveform"
    :role="label ? 'img' : undefined"
    :aria-label="label || undefined"
    :aria-hidden="label ? undefined : true"
  />
</template>

<style scoped>
.waveform {
  display: block;
  width: 100%;
  height: 100%;
  min-height: 2.7rem;
  color: var(--text-h);
  pointer-events: none;
}
</style>
