<script setup lang="ts">
import { Marker } from 'maplibre-gl'
import { onBeforeUnmount, ref, watch } from 'vue'
import { useMapLibre } from '../composables/useMapLibre'
import { useLocale } from '../composables/useLocale'
import type { Issue, IssueSeverity } from '../types/issue'

const props = defineProps<{
  issues: Issue[]
}>()

const emit = defineEmits<{
  select: [id: string]
}>()

const { t } = useLocale()
const container = ref<HTMLElement | null>(null)
const { map, resizeMap } = useMapLibre(container)
const markers: Marker[] = []

const markerColor: Record<IssueSeverity, string> = {
  high: '#9a3a30',
  medium: '#b48428',
  low: '#3d6a48',
}

function clearMarkers() {
  markers.splice(0).forEach((marker) => marker.remove())
}

function syncMarkers() {
  const instance = map.value
  if (!instance) {
    return
  }
  clearMarkers()
  for (const issue of props.issues) {
    if (issue.latitude === undefined || issue.longitude === undefined) {
      continue
    }
    const el = document.createElement('button')
    el.type = 'button'
    el.className = 'issue-marker'
    el.setAttribute('aria-label', issue.title)
    el.style.cssText = [
      'width:14px',
      'height:14px',
      'padding:0',
      'border:2px solid #fff',
      `background:${markerColor[issue.severity]}`,
      'box-shadow:0 1px 4px rgba(18,24,32,0.35)',
      'cursor:pointer',
    ].join(';')
    el.addEventListener('click', (event) => {
      event.stopPropagation()
      emit('select', issue.id)
    })
    markers.push(
      new Marker({ element: el, anchor: 'center' })
        .setLngLat([issue.longitude, issue.latitude])
        .addTo(instance),
    )
  }
}

watch(
  () => map.value,
  (instance) => {
    if (!instance) {
      return
    }
    if (instance.loaded()) {
      syncMarkers()
      return
    }
    instance.once('load', syncMarkers)
  },
  { immediate: true },
)

watch(
  () => props.issues,
  () => {
    syncMarkers()
  },
  { deep: true },
)

onBeforeUnmount(clearMarkers)

defineExpose({ resizeMap })
</script>

<template>
  <div ref="container" class="map" :aria-label="t('map.label')" />
</template>

<style scoped>
.map {
  width: 100%;
  height: 100%;
  min-height: 14rem;
}
</style>
