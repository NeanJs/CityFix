<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { useLocale } from '../../composables/useLocale'
import { useVoiceCapture } from '../../composables/useVoiceCapture'
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

function onMeter() {
  waveform.value?.prime()
  if (voice.recording.value) {
    void voice.stop()
    return
  }
  void voice.start()
}

watch(voice.transcript, (value) => {
  if (voice.recording.value || value) {
    transcript.value = value
  }
})

watch(voice.audioBlob, (value) => {
  audioBlob.value = value
})

async function typeInstead() {
  await nextTick()
  note.value?.focus()
}

function reset() {
  voice.reset()
  waveform.value?.clear()
  transcript.value = ''
  audioBlob.value = null
}

defineExpose({ reset, stop: voice.stop })
</script>

<template>
  <div class="field" data-voice-capture>
    <span class="field-label">{{ t('report.voice') }}</span>
    <p class="hint">{{ t('report.voiceHint') }}</p>
    <button
      type="button"
      class="meter"
      :class="{ live: voice.recording.value }"
      @click="onMeter"
    >
      <span class="meta">
        <span class="time">{{ voice.formatElapsed() }}</span>
        <span class="state">
          <MorphText
            :text="
              voice.recording.value
                ? t('report.stopVoice')
                : voice.audioUrl.value
                  ? t('report.voiceReady')
                  : t('report.startVoice')
            "
          />
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
        {{ t('report.typeInstead') }}
      </button>
    </div>
    <audio v-show="voice.audioUrl.value && !voice.recording.value" :src="voice.audioUrl.value" controls />
    <label v-if="props.includeNote" class="note">
      <span class="field-label">{{ t('report.transcript') }}</span>
      <textarea
        ref="note"
        v-model="transcript"
        class="control"
        rows="4"
        maxlength="800"
        :placeholder="t('report.transcriptPlaceholder')"
      />
    </label>
    <p v-if="voice.errorKey.value" class="error">{{ t(voice.errorKey.value) }}</p>
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

.meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.wave {
  height: 2.7rem;
}

.meter.live {
  border-color: var(--accent);
}

.time {
  font-variant-numeric: tabular-nums;
  font-weight: 700;
  color: var(--text-h);
}

.state {
  font-size: 0.84rem;
  font-weight: 650;
  color: var(--text-muted);
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

audio {
  width: 100%;
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
