import { onBeforeUnmount, onMounted, type Ref } from 'vue'
import {
  cityBlockTargets,
  cityBuildingCount,
  cityBuildings,
  createSeeds,
  fracturedTargets,
  glyphTargets,
  ringTargets,
  type GlyphPhase,
} from '../services/voice/glyphShapes'

export type GlyphSample = {
  energy: number
  bands: Float32Array
}

type Options = {
  phase: () => GlyphPhase
  sample: () => GlyphSample
}

type Rgb = [number, number, number]

const minParticles = 1400
const maxParticles = 2800
const areaPerParticle = 110
const camera = 3.4
const morphSpan = 0.62
const bucketAlpha = [0.34, 0.6, 0.92]

function parseColor(value: string, fallback: Rgb): Rgb {
  const color = value.trim()
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(color)
  if (hex?.[1]) {
    const digits = hex[1].length === 3 ? [...hex[1]].map((d) => d + d).join('') : hex[1]
    return [0, 2, 4].map((i) => parseInt(digits.slice(i, i + 2), 16)) as Rgb
  }
  const rgb = color.match(/[\d.]+/g)
  if (color.startsWith('rgb') && rgb && rgb.length >= 3) {
    return [Number(rgb[0]), Number(rgb[1]), Number(rgb[2])]
  }
  return fallback
}

function mixColor(a: Rgb, b: Rgb, t: number): Rgb {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]
}

function rgba(color: Rgb, alpha: number) {
  return `rgba(${color.map(Math.round).join(', ')}, ${alpha})`
}

function approach(current: number, target: number, rate: number, step: number) {
  return current + (target - current) * (1 - Math.pow(1 - rate, step))
}

export function useVoiceGlyph(canvas: Ref<HTMLCanvasElement | null>, options: Options) {
  let ctx: CanvasRenderingContext2D | null = null
  let resizeObserver: ResizeObserver | null = null
  let frameId = 0
  let lastFrame = 0
  let clock = 0
  let width = 0
  let height = 0
  let dpr = 1

  let count = 0
  let positions = new Float32Array(0)
  let velocities = new Float32Array(0)
  let seeds = new Float32Array(0)
  let delays = new Float32Array(0)
  let switched = new Uint8Array(0)
  let current = new Float32Array(0)
  let previous = new Float32Array(0)
  let screen = new Float32Array(0)
  let batches = new Uint8Array(0)
  const heights = new Float32Array(cityBuildingCount)

  let phase: GlyphPhase = options.phase()
  let previousPhase: GlyphPhase = phase
  let morphStart = -Infinity
  let viewMix = 0
  let speakMix = 0
  let dimMix = 0
  let energy = 0

  let ink: Rgb = [9, 9, 10]
  let bronze: Rgb = [125, 94, 48]
  let muted: Rgb = [74, 72, 70]

  function readPalette(node: HTMLCanvasElement) {
    const style = getComputedStyle(node)
    ink = parseColor(style.getPropertyValue('--ink'), ink)
    bronze = parseColor(style.getPropertyValue('--civic-bar'), bronze)
    muted = parseColor(style.getPropertyValue('--text-muted'), muted)
  }

  function fillTargets(target: GlyphPhase, out: Float32Array) {
    if (target === 'connecting') {
      ringTargets(out, seeds, count, clock)
    } else if (target === 'listening' || target === 'speaking') {
      cityBlockTargets(out, count, heights)
    } else if (target === 'error') {
      fracturedTargets(out, seeds, count, clock)
    } else {
      glyphTargets(out, seeds, count)
    }
  }

  function allocate(next: number) {
    count = next
    seeds = createSeeds(count)
    positions = new Float32Array(count * 3)
    velocities = new Float32Array(count * 3)
    delays = new Float32Array(count)
    switched = new Uint8Array(count).fill(1)
    current = new Float32Array(count * 3)
    previous = new Float32Array(count * 3)
    screen = new Float32Array(count * 3)
    batches = new Uint8Array(count)
    fillTargets(phase, current)
    for (let i = 0; i < positions.length; i += 1) {
      positions[i] = (current[i] ?? 0) * 0.12
    }
  }

  function resize() {
    const node = canvas.value
    if (!node) {
      return
    }
    width = node.clientWidth
    height = node.clientHeight
    dpr = Math.min(window.devicePixelRatio || 1, 2)
    node.width = Math.max(1, Math.round(width * dpr))
    node.height = Math.max(1, Math.round(height * dpr))
    const next = Math.round(
      Math.min(maxParticles, Math.max(minParticles, (width * height) / areaPerParticle)),
    )
    if (!count || Math.abs(next - count) / count > 0.15) {
      allocate(next)
    }
  }

  function updatePhase() {
    const next = options.phase()
    if (next === phase) {
      return
    }
    previousPhase = phase
    phase = next
    morphStart = clock
    for (let k = 0; k < count; k += 1) {
      const o = k * 3
      const radial = Math.min(1.2, Math.hypot(positions[o] ?? 0, positions[o + 1] ?? 0))
      delays[k] = radial * 0.34 + (seeds[o + 2] ?? 0) * 0.24
      switched[k] = 0
    }
  }

  function updateHeights(bands: Float32Array, step: number) {
    const speaking = phase === 'speaking'
    cityBuildings.forEach((building, i) => {
      const level = bands[building.band] ?? 0
      const distance = Math.hypot(building.x, building.z)
      const ripple = speaking ? Math.sin(distance * 5 - clock * 3.2) * (0.04 + energy * 0.1) : 0
      const breath = Math.sin(clock * 1.3 + i * 0.9) * 0.018
      const target = building.base + level * 0.95 + ripple + breath
      heights[i] = approach(heights[i] ?? building.base, Math.max(0.06, target), 0.32, step)
    })
  }

  function integrate(step: number) {
    const morphing = clock - morphStart < morphSpan + 0.1
    if (morphing) {
      fillTargets(previousPhase, previous)
    }
    fillTargets(phase, current)
    const damping = Math.pow(0.8, step)
    for (let k = 0; k < count; k += 1) {
      const o = k * 3
      const live = !morphing || clock - morphStart >= (delays[k] ?? 0)
      if (live && !switched[k]) {
        switched[k] = 1
        velocities[o] = (velocities[o] ?? 0) + ((seeds[o] ?? 0.5) - 0.5) * 0.05
        velocities[o + 1] = (velocities[o + 1] ?? 0) + ((seeds[o + 1] ?? 0.5) - 0.5) * 0.05
        velocities[o + 2] = (velocities[o + 2] ?? 0) + ((seeds[o + 2] ?? 0.5) - 0.5) * 0.08
      }
      const source = live ? current : previous
      const stiffness = (0.045 + (seeds[o] ?? 0) * 0.04) * step
      for (let axis = 0; axis < 3; axis += 1) {
        const i = o + axis
        const position = positions[i] ?? 0
        const velocity = (velocities[i] ?? 0) * damping + ((source[i] ?? 0) - position) * stiffness
        velocities[i] = velocity
        positions[i] = position + velocity * step
      }
    }
  }

  function project() {
    const pitch = viewMix * 0.62
    const yaw =
      viewMix * (Math.PI / 4 + Math.sin(clock * 0.16) * 0.5) +
      (1 - viewMix) * Math.sin(clock * 0.45) * 0.3
    const cosYaw = Math.cos(yaw)
    const sinYaw = Math.sin(yaw)
    const cosPitch = Math.cos(pitch)
    const sinPitch = Math.sin(pitch)
    const breath = (1 - viewMix) * Math.sin(clock * 1.1) * 0.012
    const scale = Math.min(width, height) * 0.44 * dpr * (1 + energy * 0.05 + breath)
    const centerX = (width * dpr) / 2
    const centerY = (height * dpr) / 2
    for (let k = 0; k < count; k += 1) {
      const o = k * 3
      const x = positions[o] ?? 0
      const y = positions[o + 1] ?? 0
      const z = positions[o + 2] ?? 0
      const rx = x * cosYaw + z * sinYaw
      const rz = -x * sinYaw + z * cosYaw
      const py = y * cosPitch + rz * sinPitch
      const pz = -y * sinPitch + rz * cosPitch
      const focus = camera / (camera + pz)
      const bucket = pz < -0.22 ? 2 : pz < 0.22 ? 1 : 0
      screen[o] = centerX + rx * focus * scale
      screen[o + 1] = centerY - py * focus * scale
      screen[o + 2] = (1.1 + (seeds[o + 1] ?? 0) * 0.9) * dpr * focus * (0.9 + bucket * 0.12)
      batches[k] = bucket * 2 + (k % 5 === 0 ? 1 : 0)
    }
    return scale
  }

  function draw(scale: number) {
    const node = canvas.value
    if (!ctx || !node) {
      return
    }
    ctx.clearRect(0, 0, node.width, node.height)
    const centerX = node.width / 2
    const centerY = node.height / 2
    const halo = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, scale * 1.3)
    const glow = mixColor(bronze, muted, dimMix)
    halo.addColorStop(0, rgba(glow, 0.08 + energy * 0.16))
    halo.addColorStop(1, rgba(glow, 0))
    ctx.fillStyle = halo
    ctx.fillRect(0, 0, node.width, node.height)

    const primary = mixColor(mixColor(ink, bronze, speakMix), muted, dimMix)
    const accent = mixColor(mixColor(bronze, ink, speakMix), muted, dimMix)
    const fade = 1 - dimMix * 0.45
    for (let batch = 0; batch < 6; batch += 1) {
      const alpha = (bucketAlpha[batch >> 1] ?? 1) * fade
      ctx.fillStyle = rgba(batch & 1 ? accent : primary, alpha)
      for (let k = 0; k < count; k += 1) {
        if (batches[k] !== batch) {
          continue
        }
        const o = k * 3
        const size = screen[o + 2] ?? 1
        ctx.fillRect((screen[o] ?? 0) - size / 2, (screen[o + 1] ?? 0) - size / 2, size, size)
      }
    }
  }

  function frame(now: number) {
    const dt = lastFrame ? Math.min(0.05, (now - lastFrame) / 1000) : 1 / 60
    lastFrame = now
    clock += dt
    const step = dt * 60
    const sample = options.sample()
    energy = approach(energy, sample.energy, 0.3, step)
    updatePhase()
    updateHeights(sample.bands, step)
    viewMix = approach(viewMix, phase === 'listening' || phase === 'speaking' ? 1 : 0, 0.06, step)
    speakMix = approach(speakMix, phase === 'speaking' ? 1 : 0, 0.08, step)
    dimMix = approach(dimMix, phase === 'error' ? 1 : 0, 0.06, step)
    integrate(step)
    draw(project())
    frameId = requestAnimationFrame(frame)
  }

  function start() {
    if (frameId || document.hidden) {
      return
    }
    lastFrame = 0
    frameId = requestAnimationFrame(frame)
  }

  function stop() {
    if (frameId) {
      cancelAnimationFrame(frameId)
      frameId = 0
    }
  }

  function onVisibility() {
    if (document.hidden) {
      stop()
    } else {
      start()
    }
  }

  onMounted(() => {
    const node = canvas.value
    if (!node) {
      return
    }
    ctx = node.getContext('2d')
    readPalette(node)
    resize()
    resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(node)
    document.addEventListener('visibilitychange', onVisibility)
    start()
  })

  onBeforeUnmount(() => {
    stop()
    resizeObserver?.disconnect()
    resizeObserver = null
    document.removeEventListener('visibilitychange', onVisibility)
  })
}
