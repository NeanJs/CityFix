<script setup lang="ts">
import { useLocale } from '../../composables/useLocale'
import { useVoiceCapture } from '../../composables/useVoiceCapture'

const { t } = useLocale()
const voice = useVoiceCapture()

defineExpose({
  transcript: voice.transcript,
  audioUrl: voice.audioUrl,
  errorKey: voice.errorKey,
  reset: voice.reset,
})
</script>

<template>
  <div class="field">
    <span>{{ t('report.voice') }}</span>
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
        class="btn-ghost"
        @click="voice.start"
      >
        {{ voice.audioUrl.value ? t('report.rerecordVoice') : t('report.startVoice') }}
      </button>
      <button v-else type="button" class="btn-ghost" @click="voice.stop">
        {{ t('report.stopVoice') }}
      </button>
    </div>
    <audio v-if="voice.audioUrl.value && !voice.recording.value" :src="voice.audioUrl.value" controls />
    <p v-if="voice.errorKey.value" class="error">{{ t(voice.errorKey.value) }}</p>
  </div>
</template>

<style scoped>
.field {
  display: grid;
  gap: 0.4rem;
}

.field > span {
  font-size: 0.7rem;
  font-weight: 650;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
}

.meter {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  min-height: 3rem;
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
  font-family: var(--font-display);
}

.state {
  font-size: 0.8rem;
  font-weight: 650;
  color: var(--text-muted);
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

audio {
  width: 100%;
}

.error {
  margin: 0;
  font-size: 0.82rem;
  color: #b42318;
}
</style>
