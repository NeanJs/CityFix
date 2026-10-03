import { onBeforeUnmount, onMounted, shallowRef, watch, type Ref } from 'vue'
import type { Map as MapLibreMap } from 'maplibre-gl'
import {
  createMapLibreMap,
  type CreateMapLibreMapOptions,
} from '../services/map/createMapLibreMap'

export type UseMapLibreOptions = Omit<CreateMapLibreMapOptions, 'container'>

export function useMapLibre(
  container: Ref<string | HTMLElement | null | undefined>,
  options: UseMapLibreOptions = {},
) {
  const map = shallowRef<MapLibreMap | null>(null)

  function destroyMap() {
    map.value?.remove()
    map.value = null
  }

  function createMap() {
    const target = container.value
    if (!target) {
      return
    }
    destroyMap()
    map.value = createMapLibreMap({
      ...options,
      container: target,
    })
  }

  function resizeMap() {
    map.value?.resize()
  }

  onMounted(createMap)
  onBeforeUnmount(destroyMap)
  watch(container, (next, prev) => {
    if (next === prev) {
      return
    }
    if (!next) {
      destroyMap()
      return
    }
    createMap()
  })

  return { map, createMap, destroyMap, resizeMap }
}
