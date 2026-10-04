<script setup lang="ts">
import { ref } from 'vue'
import { useVoiceGlyph, type GlyphSample } from '../../composables/useVoiceGlyph'
import { cityBuildingCount, type GlyphPhase } from '../../services/voice/glyphShapes'

const props = defineProps<{
  phase: GlyphPhase
  readFrequency: () => Uint8Array
}>()

const canvas = ref<HTMLCanvasElement | null>(null)
const bands = new Float32Array(cityBuildingCount)
const sample: GlyphSample = { energy: 0, bands }
const voiceRange = 0.6
const attack = 0.55
const release = 0.12

function foldBands(bins: Uint8Array) {
  const usable = Math.floor(bins.length * voiceRange)
  let total = 0
  for (let band = 0; band < bands.length; band += 1) {
    let level = 0
    if (usable > 1) {
      const start = Math.floor(Math.pow(usable, band / bands.length))
      const end = Math.max(start + 1, Math.floor(Math.pow(usable, (band + 1) / bands.length)))
      let sum = 0
      for (let i = start; i < end; i += 1) {
        sum += bins[i] ?? 0
      }
      level = Math.min(1, Math.pow(sum / (end - start) / 255, 0.8) * 1.4)
    }
    const previous = bands[band] ?? 0
    const next = previous + (level - previous) * (level > previous ? attack : release)
    bands[band] = next
    total += next
  }
  sample.energy = total / bands.length
}

useVoiceGlyph(canvas, {
  phase: () => props.phase,
  sample: () => {
    foldBands(props.readFrequency())
    return sample
  },
})
</script>

<template>
  <canvas ref="canvas" class="voice-glyph" aria-hidden="true" />
</template>

<style scoped>
.voice-glyph {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
  pointer-events: none;
}
</style>
