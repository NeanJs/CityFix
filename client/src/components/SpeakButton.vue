<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { useLocale } from '../composables/useLocale'
import { canSpeak, speak, stopSpeaking } from '../services/speech/speechPlayback'

const props = defineProps<{
  text: string
  playKey: string
  playingKey: string
  unavailableKey: string
}>()

const { t } = useLocale()
const playing = ref(false)
const available = canSpeak()

const label = computed(() => (playing.value ? t(props.playingKey) : t(props.playKey)))

function play() {
  if (!available || playing.value) {
    return
  }
  playing.value = speak(props.text)
  if (playing.value) {
    window.setTimeout(() => {
      playing.value = false
    }, Math.min(12000, 800 + props.text.length * 60))
  }
}

onBeforeUnmount(() => {
  stopSpeaking()
})
</script>

<template>
  <div class="speak">
    <button
      type="button"
      class="btn-secondary"
      :disabled="!available || playing"
      @click="play"
    >
      {{ label }}
    </button>
    <p v-if="!available" class="hint">{{ t(unavailableKey) }}</p>
  </div>
</template>

<style scoped>
.speak {
  display: grid;
  gap: 0.4rem;
  justify-items: start;
}
</style>
