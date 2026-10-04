<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue'
import { requestCurrentPosition } from '../../composables/useCurrentLocation'
import { useLocale } from '../../composables/useLocale'
import { useMapLibre } from '../../composables/useMapLibre'
import { defaultMapCenter, defaultPickerZoom } from '../../config/mapConfig'

const latitude = defineModel<number | undefined>('latitude')
const longitude = defineModel<number | undefined>('longitude')

const props = withDefaults(
  defineProps<{
    disabled?: boolean
    tall?: boolean
  }>(),
  { disabled: false, tall: false },
)

const { t } = useLocale()
const container = ref<HTMLElement | null>(null)
const locating = ref(false)
const locationError = ref('')
const userMoved = ref(false)
const locatingStarted = ref(false)

const initialLng =
  longitude.value !== undefined ? longitude.value : defaultMapCenter[0]
const initialLat =
  latitude.value !== undefined ? latitude.value : defaultMapCenter[1]

const { map, resizeMap } = useMapLibre(container, {
  cooperativeGestures: false,
  center: [initialLng, initialLat],
  zoom: defaultPickerZoom,
  attributionControl: { compact: true },
  dragRotate: false,
  pitchWithRotate: false,
})

function applyInteractivity() {
  const instance = map.value
  if (!instance) {
    return
  }
  if (props.disabled) {
    instance.dragPan.disable()
    instance.scrollZoom.disable()
    instance.boxZoom.disable()
    instance.keyboard.disable()
    instance.doubleClickZoom.disable()
    instance.touchZoomRotate.disable()
    instance.dragRotate.disable()
    instance.touchPitch.disable()
    return
  }
  instance.dragPan.enable()
  instance.scrollZoom.enable()
  instance.boxZoom.enable()
  instance.keyboard.enable()
  instance.doubleClickZoom.enable()
  instance.touchZoomRotate.enable()
  instance.dragRotate.disable()
  instance.touchPitch.disable()
}

function syncFromMap() {
  const instance = map.value
  if (!instance) {
    return
  }
  const center = instance.getCenter()
  latitude.value = center.lat
  longitude.value = center.lng
}

function jumpTo(lat: number, lng: number) {
  latitude.value = lat
  longitude.value = lng
  const instance = map.value
  if (!instance) {
    return
  }
  instance.jumpTo({
    center: [lng, lat],
    zoom: instance.getZoom() || defaultPickerZoom,
  })
}

function onDragStart() {
  if (props.disabled) {
    return
  }
  userMoved.value = true
}

function onMoveEnd() {
  if (props.disabled) {
    return
  }
  syncFromMap()
}

async function locate(force: boolean, refresh = false) {
  locating.value = true
  locationError.value = ''
  const result = await requestCurrentPosition({ force: refresh })
  locating.value = false
  if (!result.ok) {
    locationError.value = t(result.errorKey)
    if (latitude.value === undefined || longitude.value === undefined) {
      jumpTo(defaultMapCenter[1], defaultMapCenter[0])
    }
    return
  }
  if (!force && userMoved.value) {
    return
  }
  userMoved.value = false
  jumpTo(result.latitude, result.longitude)
}

async function locateIfNeeded() {
  if (locatingStarted.value) {
    return
  }
  locatingStarted.value = true
  if (latitude.value !== undefined && longitude.value !== undefined) {
    jumpTo(latitude.value, longitude.value)
    return
  }
  await locate(false)
}

function recenter() {
  if (props.disabled || locating.value) {
    return
  }
  void locate(true, true)
}

watch(
  () => map.value,
  (instance, previous) => {
    if (previous) {
      previous.off('dragstart', onDragStart)
      previous.off('moveend', onMoveEnd)
    }
    if (!instance) {
      return
    }
    instance.on('dragstart', onDragStart)
    instance.on('moveend', onMoveEnd)
    applyInteractivity()
    const ready = () => {
      resizeMap()
      void locateIfNeeded()
    }
    if (instance.loaded()) {
      ready()
      return
    }
    instance.once('load', ready)
  },
  { immediate: true },
)

watch(
  () => props.disabled,
  () => {
    applyInteractivity()
  },
)

watch(
  () => props.tall,
  async () => {
    await nextTick()
    resizeMap()
  },
)

onMounted(async () => {
  await nextTick()
  resizeMap()
})
</script>

<template>
  <div class="field">
    <span class="field-label">{{ t('report.location') }}</span>
    <p class="hint">{{ t(disabled ? 'report.mapLocked' : 'report.mapHint') }}</p>
    <div class="stage" :class="{ locked: disabled, tall }">
      <div
        ref="container"
        class="map"
        role="application"
        :aria-label="t('report.pickerLabel')"
        :aria-disabled="disabled"
      />
      <div class="pin" aria-hidden="true">
        <span class="pin-head" />
        <span class="pin-dot" />
      </div>
      <button
        v-if="!disabled"
        type="button"
        class="recenter"
        :disabled="locating"
        :aria-label="t('report.recenter')"
        @click="recenter"
      >
        {{ locating ? t('report.locating') : t('report.recenter') }}
      </button>
    </div>
    <p v-if="locationError" class="error">{{ locationError }}</p>
  </div>
</template>

<style scoped>
.field {
  display: grid;
  gap: 0.5rem;
}

.stage {
  position: relative;
  overflow: hidden;
  min-height: 16rem;
  height: 16rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: #e8e6e3;
}

.stage.locked {
  cursor: default;
}

.map {
  width: 100%;
  height: 100%;
}

.pin {
  position: absolute;
  left: 50%;
  top: 50%;
  z-index: 2;
  width: 1.35rem;
  height: 2.1rem;
  transform: translate(-50%, calc(-100% + 0.22rem));
  pointer-events: none;
}

.pin-head {
  display: block;
  width: 1.35rem;
  height: 1.35rem;
  border: 2px solid #fff;
  border-radius: 50% 50% 50% 0;
  background: var(--ink);
  box-shadow: 0 1px 4px rgba(18, 24, 32, 0.35);
  transform: rotate(-45deg);
}

.pin-dot {
  position: absolute;
  left: 50%;
  bottom: 0;
  width: 0.42rem;
  height: 0.42rem;
  border-radius: 50%;
  background: var(--ink);
  opacity: 0.35;
  transform: translate(-50%, 0.12rem);
}

.recenter {
  position: absolute;
  right: 0.55rem;
  bottom: 0.55rem;
  z-index: 3;
  min-height: 2.75rem;
  padding: 0.45rem 0.75rem;
  border: 1.5px solid var(--text-h);
  border-radius: var(--radius-pill);
  background: var(--surface-solid);
  color: var(--text-h);
  font-size: 0.78rem;
  font-weight: 650;
  cursor: pointer;
}

.recenter:disabled {
  opacity: 0.55;
  cursor: wait;
}

.error {
  margin: 0;
  font-size: 0.82rem;
  color: var(--danger);
}

@media (min-width: 720px) {
  .stage {
    min-height: 16rem;
    height: 16rem;
  }

  .stage.tall {
    min-height: 16rem;
    height: 18rem;
  }
}
</style>
