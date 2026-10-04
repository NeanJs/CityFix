<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useLocale } from '../../composables/useLocale'
import { useVoiceCapture } from '../../composables/useVoiceCapture'
import { apiErrorMessage } from '../../services/api/apiRequestError'
import { transcribeReport } from '../../services/api/transcribeReport'
import { playVoiceCaptureEffect } from '../../services/media/voiceCaptureEffects'
import AppIcon from '../ui/AppIcon.vue'
import AudioWaveform from '../ui/AudioWaveform.vue'
import MorphText from '../ui/MorphText.vue'

const props = withDefaults(
  defineProps<{
    includeNote?: boolean
  }>(),
  { includeNote: true },
)

const transcript = defineModel<string>('transcript', { default: '' })
const audioBlob = defineModel<Blob | null>('audioBlob', { default: null })

const { t } = useLocale()
const voice = useVoiceCapture()
const note = ref<HTMLTextAreaElement | null>(null)
const waveform = ref<{ prime: () => void; clear: () => void } | null>(null)
const transcribing = ref(false)
const transcribeError = ref('')
const busy = computed(() => voice.encoding.value || transcribing.value)
const meterLabel = computed(() => {
  if (voice.recording.value) {
    return t('report.stopVoice')
  }
  if (busy.value) {
    return t('report.transcribing')
  }
  if (voice.audioUrl.value) {
    return t('report.voiceReady')
  }
  return t('report.startVoice')
})

let transcribeGeneration = 0
let transcribeAbort: AbortController | null = null
let transcribePromise: Promise<string> | null = null
let inFlightBlob: Blob | null = null
let transcribedBlob: Blob | null = null

function abortTranscribe() {
  transcribeGeneration += 1
  transcribeAbort?.abort()
  transcribeAbort = null
  transcribePromise = null
  inFlightBlob = null
  transcribing.value = false
}

function isAbortError(error: unknown) {
  if (error instanceof DOMException && error.name === 'AbortError') {
    return true
  }
  return error instanceof Error && error.name === 'AbortError'
}

async function transcribeBlob(blob: Blob, force = false): Promise<string> {
  if (blob.size < 1) {
    return transcript.value.trim()
  }
  if (!force && transcribedBlob === blob && transcript.value.trim()) {
    return transcript.value.trim()
  }
  if (!force && transcribePromise && inFlightBlob === blob) {
    return transcribePromise
  }
  const generation = transcribeGeneration + 1
  transcribeGeneration = generation
  transcribeAbort?.abort()
  const controller = new AbortController()
  transcribeAbort = controller
  inFlightBlob = blob
  transcribing.value = true
  transcribeError.value = ''
  playVoiceCaptureEffect('send')
  const run = (async () => {
    try {
      const text = await transcribeReport(blob, controller.signal)
      if (generation !== transcribeGeneration) {
        return transcript.value.trim()
      }
      transcribedBlob = blob
      if (text.trim()) {
        transcript.value = text
      }
      playVoiceCaptureEffect('response')
      return text.trim() || transcript.value.trim()
    } catch (error) {
      if (controller.signal.aborted || isAbortError(error) || generation !== transcribeGeneration) {
        return transcript.value.trim()
      }
      transcribeError.value = apiErrorMessage(error, t, 'report.transcribeFailed')
      return transcript.value.trim()
    } finally {
      if (generation === transcribeGeneration) {
        transcribing.value = false
        transcribePromise = null
        transcribeAbort = null
        inFlightBlob = null
      }
    }
  })()
  transcribePromise = run
  return run
}

function onMeter() {
  if (voice.recording.value) {
    waveform.value?.prime()
    void voice.stop()
    return
  }
  if (busy.value) {
    return
  }
  waveform.value?.prime()
  void voice.start()
}

watch(voice.recording, (recording) => {
  if (!recording) {
    if (!voice.encoding.value && !voice.audioBlob.value) {
      waveform.value?.clear()
    }
    return
  }
  playVoiceCaptureEffect('start')
  abortTranscribe()
  transcribeError.value = ''
  transcribedBlob = null
})

watch(voice.audioBlob, (value) => {
  audioBlob.value = value
  if (value && value.size > 0) {
    void transcribeBlob(value)
  }
})

async function typeInstead() {
  await nextTick()
  note.value?.focus()
}

async function awaitTranscript() {
  const blob = await voice.stop()
  if (transcribePromise) {
    return transcribePromise
  }
  const captured = blob ?? voice.audioBlob.value ?? audioBlob.value
  if (transcript.value.trim()) {
    return transcript.value.trim()
  }
  if (captured && captured.size > 0) {
    return transcribeBlob(captured, true)
  }
  return ''
}

function reset() {
  abortTranscribe()
  transcribeError.value = ''
  transcribedBlob = null
  voice.reset()
  waveform.value?.clear()
  transcript.value = ''
  audioBlob.value = null
}

onBeforeUnmount(() => {
  abortTranscribe()
})

defineExpose({ reset, stop: voice.stop, awaitTranscript, busy })
</script>

<template>
  <div class="field" data-voice-capture>
    <span class="field-label">{{ t('report.voice') }}</span>
    <p class="hint">{{ t('report.voiceHint') }}</p>
    <button
      type="button"
      class="meter"
      :class="{ live: voice.recording.value, busy }"
      :disabled="!voice.recording.value && busy"
      @click="onMeter"
    >
      <span class="meta">
        <span class="time-row">
          <AppIcon name="microphone" size="1.05rem" />
          <span class="time">{{ voice.formatElapsed() }}</span>
        </span>
        <span class="state">
          <MorphText :text="meterLabel" />
        </span>
      </span>
      <AudioWaveform
        ref="waveform"
        class="wave"
        :stream="voice.mediaStream.value"
        :label="t('report.voiceWaveform')"
      />
    </button>
    <div v-if="props.includeNote && !voice.recording.value" class="actions">
      <button type="button" class="btn-ghost" @click="typeInstead">
        <AppIcon name="keyboard" size="1rem" />
        {{ t('report.typeInstead') }}
      </button>
    </div>
    <label v-if="props.includeNote" class="note">
      <span class="field-label">{{ t('report.transcript') }}</span>
      <textarea
        ref="note"
        v-model="transcript"
        class="control"
        rows="4"
        maxlength="800"
        :disabled="busy"
        :placeholder="t('report.transcriptPlaceholder')"
      />
    </label>
    <p v-if="voice.errorKey.value" class="error">{{ t(voice.errorKey.value) }}</p>
    <p v-else-if="transcribeError" class="error">{{ transcribeError }}</p>
  </div>
</template>

<style scoped>
.field {
  display: grid;
  gap: 0.5rem;
}

.meter {
  display: grid;
  gap: 0.2rem;
  width: 100%;
  min-height: 5.4rem;
  padding: 0.65rem 0.8rem 0.45rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--surface-solid);
  color: inherit;
  font: inherit;
  cursor: pointer;
  text-align: start;
}

.meter:disabled {
  cursor: default;
}

.meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.time-row {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  color: var(--text-h);
}

.wave {
  height: 2.7rem;
}

.meter.live,
.meter.busy {
  border-color: var(--accent);
}

.time {
  font-variant-numeric: tabular-nums;
  font-weight: 700;
  color: var(--text-h);
}

.state {
  font-size: 0.84rem;
  color: var(--text-muted);
  font-weight: 650;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.actions .btn-ghost {
  width: 100%;
}

.note {
  display: grid;
  gap: 0.35rem;
}

.error {
  margin: 0;
  font-size: 0.82rem;
  color: var(--danger);
}

@media (min-width: 720px) {
  .actions .btn-ghost {
    width: auto;
  }
}
</style>
