<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useAndroidBackHandler } from '../composables/useAndroidBackHandler'
import { useElevenLabsConversation } from '../composables/useElevenLabsConversation'
import { useLocale } from '../composables/useLocale'
import AppHeader from '../components/layout/AppHeader.vue'
import AppIcon from '../components/ui/AppIcon.vue'
import MorphText from '../components/ui/MorphText.vue'

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
  getInputVolume,
  getOutputVolume,
} = useElevenLabsConversation()

const energy = ref(0)
const orbScale = ref(1)
let raf = 0

const statusLabel = computed(() => {
  if (errorKey.value && status.value === 'disconnected') {
    return t(errorKey.value)
  }
  if (status.value === 'connecting' || starting.value) {
    return t('voice.connecting')
  }
  if (status.value === 'connected') {
    return mode.value === 'speaking' ? t('voice.speaking') : t('voice.listening')
  }
  return t('voice.idle')
})

const actionLabel = computed(() => {
  if (connected.value) {
    return t('voice.end')
  }
  if (status.value === 'connecting' || starting.value) {
    return t('voice.connecting')
  }
  return t('voice.start')
})

function stopOrb() {
  if (raf) {
    cancelAnimationFrame(raf)
    raf = 0
  }
  energy.value = 0
  orbScale.value = 1
}

function tick() {
  const raw = mode.value === 'speaking' ? getOutputVolume() : getInputVolume()
  const next = Math.min(1, raw ** 0.55 * 2.2)
  energy.value += (next - energy.value) * 0.28
  orbScale.value = 1 + energy.value * 0.16
  raf = requestAnimationFrame(tick)
}

watch(
  connected,
  (isConnected) => {
    stopOrb()
    if (isConnected) {
      raf = requestAnimationFrame(tick)
    }
  },
)

useAndroidBackHandler(sessionHeld, () => {
  void endSession()
})

onBeforeUnmount(() => {
  stopOrb()
})

function onAction() {
  if (connected.value || sessionHeld.value) {
    void endSession()
    return
  }
  void startSession()
}
</script>

<template>
  <section class="voice">
    <AppHeader :subtitle="t('voice.title')" compact show-account />

    <div class="stage">
      <p v-if="!sessionHeld" class="lead">{{ t('voice.lead') }}</p>

      <div class="orb-slot" aria-hidden="true">
        <div
          class="orb"
          :class="{
            connecting: status === 'connecting' || starting,
            speaking: connected && mode === 'speaking',
          }"
          :style="{
            '--orb-scale': String(orbScale),
            '--orb-energy': String(0.42 + energy * 0.5),
          }"
        >
          <span class="orb-ring" />
          <span class="orb-core" />
        </div>
      </div>

      <p class="status" :class="{ error: errorKey && status === 'disconnected' }">
        <MorphText :text="statusLabel" />
      </p>

      <button
        type="button"
        class="action"
        :class="[
          connected ? 'btn-secondary' : 'btn',
          { 'is-busy': status === 'connecting' || starting },
        ]"
        :disabled="status === 'connecting' || starting"
        @click="onAction"
      >
        <AppIcon :name="connected ? 'x' : 'microphone'" size="1.05rem" />
        {{ actionLabel }}
      </button>
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
  grid-template-rows: auto minmax(0, 1fr) auto auto;
  justify-items: center;
  align-items: stretch;
  gap: 0.85rem;
  min-height: 0;
  width: 100%;
  padding: 0.1rem 0 0.2rem;
}

.lead {
  margin: 0;
  max-width: 28rem;
  text-align: center;
  font-size: 1.05rem;
  line-height: 1.45;
  color: var(--text-muted);
}

.orb-slot {
  min-height: 0;
  width: 100%;
  display: grid;
  place-items: center;
}

.orb {
  position: relative;
  display: grid;
  place-items: center;
  height: min(22rem, 100%);
  width: auto;
  max-width: min(22rem, 92%);
  aspect-ratio: 1;
  transform: scale(var(--orb-scale, 1));
  transform-origin: center;
  will-change: transform;
}

.orb-ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 1.5px solid var(--glass-border);
  background: var(--surface-solid);
}

.orb-core {
  position: relative;
  z-index: 1;
  width: 64%;
  aspect-ratio: 1;
  border-radius: 50%;
  background: var(--civic-bar);
  opacity: var(--orb-energy, 0.55);
  transform: scale(calc(0.92 + var(--orb-energy, 0.55) * 0.14));
  will-change: transform, opacity;
}

.orb.speaking .orb-core {
  background: var(--ink);
}

.orb.connecting .orb-core {
  animation: pulse 1.15s var(--motion-ease) infinite alternate;
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

@keyframes pulse {
  from {
    opacity: 0.38;
    transform: scale(0.94);
  }
  to {
    opacity: 0.78;
    transform: scale(1);
  }
}

@media (min-width: 1024px) {
  .voice {
    height: calc(100dvh - 2.6rem - env(safe-area-inset-top, 0px));
    max-height: calc(100dvh - 2.6rem - env(safe-area-inset-top, 0px));
  }

  .lead {
    font-size: 1.12rem;
  }
}
</style>
