<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { useLocale } from '../../composables/useLocale'
import { useVoiceCapture } from '../../composables/useVoiceCapture'

const transcript = defineModel<string>('transcript', { default: '' })

const { t } = useLocale()
const voice = useVoiceCapture()
const note = ref<HTMLTextAreaElement | null>(null)

watch(voice.transcript, (value) => {
  if (voice.recording.value || value) {
    transcript.value = value
  }
})

async function typeInstead() {
  await nextTick()
  note.value?.focus()
}

function reset() {
  voice.reset()
  transcript.value = ''
}

defineExpose({ reset })
</script>

<template>
  <div class="field">
    <span class="field-label">{{ t('report.voice') }}</span>
    <p class="hint">{{ t('report.voiceHint') }}</p>
    <div class="meter" :class="{ live: voice.recording.value }">
      <span class="time">{{ voice.formatElapsed() }}</span>
      <span class="state">
        {{
          voice.recording.value
            ? t('report.stopVoice')
            : voice.audioUrl.value
              ? t('report.voiceReady')
              : t('report.startVoice')
        }}
      </span>
    </div>
    <div class="actions">
      <button
        v-if="!voice.recording.value"
        type="button"
        class="btn"
        @click="voice.start"
      >
        {{ voice.audioUrl.value ? t('report.rerecordVoice') : t('report.startVoice') }}
      </button>
      <button v-else type="button" class="btn" @click="voice.stop">
        {{ t('report.stopVoice') }}
      </button>
      <button
        v-if="!voice.recording.value"
        type="button"
        class="btn-ghost"
        @click="typeInstead"
      >
        {{ t('report.typeInstead') }}
      </button>
    </div>
    <audio v-if="voice.audioUrl.value && !voice.recording.value" :src="voice.audioUrl.value" controls />
    <label class="note">
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
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  min-height: 3.25rem;
  padding: 0.65rem 0.8rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface-raised);
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
</style>
