<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAndroidBackHandler } from '../composables/useAndroidBackHandler'
import { useElevenLabsConversation } from '../composables/useElevenLabsConversation'
import { useLocale } from '../composables/useLocale'
import AppHeader from '../components/layout/AppHeader.vue'
import AppIcon from '../components/ui/AppIcon.vue'
import MorphText from '../components/ui/MorphText.vue'
import VoiceGlyph from '../components/voice/VoiceGlyph.vue'
import type { GlyphPhase } from '../services/voice/glyphShapes'

const { t } = useLocale()
const {
  status,
  mode,
  errorKey,
  starting,
  connected,
  sessionHeld,
  startSession,
  endSession,
  getInputFrequency,
  getOutputFrequency,
} = useElevenLabsConversation()

const router = useRouter()
const ending = ref(false)
const handoffErrorKey = ref('')
const busy = computed(() => status.value === 'connecting' || starting.value || ending.value)
const activeErrorKey = computed(() => handoffErrorKey.value || errorKey.value)
const failed = computed(() => Boolean(activeErrorKey.value) && status.value === 'disconnected')

const phase = computed<GlyphPhase>(() => {
  if (failed.value) {
    return 'error'
  }
  if (busy.value) {
    return 'connecting'
  }
  if (connected.value) {
    return mode.value === 'speaking' ? 'speaking' : 'listening'
  }
  return 'idle'
})

const statusLabel = computed(() => {
  if (failed.value) {
    return t(activeErrorKey.value)
  }
  if (ending.value) {
    return t('voice.preparingReport')
  }
  if (busy.value) {
    return t('voice.connecting')
  }
  if (connected.value) {
    return mode.value === 'speaking' ? t('voice.speaking') : t('voice.listening')
  }
  return t('voice.idle')
})

const actionLabel = computed(() => {
  if (ending.value) {
    return t('voice.preparingReport')
  }
  if (connected.value) {
    return t('voice.end')
  }
  if (busy.value) {
    return t('voice.connecting')
  }
  return t('voice.start')
})

function readFrequency() {
  return mode.value === 'speaking' ? getOutputFrequency() : getInputFrequency()
}

useAndroidBackHandler(sessionHeld, () => {
  void endSession()
})

async function onAction() {
  if (connected.value || sessionHeld.value) {
    if (ending.value) {
      return
    }
    ending.value = true
    handoffErrorKey.value = ''
    const conversationId = await endSession()
    if (!conversationId) {
      handoffErrorKey.value = 'voice.reportFailed'
      ending.value = false
      return
    }
    try {
      await router.push({
        name: 'report',
        query: { conversation: conversationId },
      })
    } catch {
      handoffErrorKey.value = 'voice.reportFailed'
      ending.value = false
    }
    return
  }
  handoffErrorKey.value = ''
  void startSession()
}
</script>

<template>
  <section class="voice">
    <AppHeader :subtitle="t('voice.title')" compact show-account />

    <div class="stage">
      <p v-if="!sessionHeld" class="lead">{{ t('voice.lead') }}</p>

      <div class="glyph-slot">
        <VoiceGlyph :phase="phase" :read-frequency="readFrequency" />
      </div>

      <div class="console">
        <p class="status" :class="{ error: failed }">
          <MorphText :text="statusLabel" />
        </p>

        <button
          type="button"
          class="action"
          :class="[connected ? 'btn-secondary' : 'btn', { 'is-busy': busy }]"
          :disabled="busy"
          @click="onAction"
        >
          <AppIcon :name="connected ? 'x' : 'microphone'" size="1.05rem" />
          {{ actionLabel }}
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.voice {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  height: calc(100dvh - 8rem - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px));
  max-height: calc(100dvh - 8rem - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px));
  gap: 0.15rem;
}

.stage {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  grid-template-areas: 'lead' 'glyph' 'console';
  justify-items: center;
  gap: 0.85rem;
  min-height: 0;
  width: 100%;
  padding: 0.1rem 0 0.2rem;
}

.lead {
  grid-area: lead;
  margin: 0;
  max-width: 28rem;
  text-align: center;
  font-size: 1.05rem;
  line-height: 1.45;
  color: var(--text-muted);
}

.glyph-slot {
  grid-area: glyph;
  position: relative;
  width: 100%;
  min-height: 0;
}

.console {
  grid-area: console;
  display: grid;
  justify-items: center;
  gap: 0.85rem;
  width: 100%;
}

.status {
  margin: 0;
  min-height: 1.5rem;
  font-size: 0.98rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: var(--text-h);
  text-align: center;
}

.status.error {
  color: var(--danger);
  font-weight: 500;
  max-width: 26rem;
}

.action {
  min-width: 8.5rem;
}

@media (min-width: 1024px) {
  .voice {
    height: calc(100dvh - 2.6rem - env(safe-area-inset-top, 0px));
    max-height: calc(100dvh - 2.6rem - env(safe-area-inset-top, 0px));
  }

  .lead {
    font-size: 1.12rem;
  }

  .console {
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    max-width: 44rem;
    padding: 0.9rem 0 0.2rem;
    border-top: 1px solid var(--border);
  }

  .status {
    justify-self: start;
    text-align: left;
    font-size: 1.05rem;
  }
}
</style>
