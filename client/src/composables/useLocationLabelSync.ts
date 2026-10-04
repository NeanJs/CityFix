import { onBeforeUnmount, ref, watch, type Ref } from 'vue'
import {
  formatCoordinateLabel,
  reverseGeocode,
  roundCoordinate,
} from '../services/map/reverseGeocode'

const locationLabelMaxLength = 160

function clipLocationLabel(value: string) {
  if (value.length <= locationLabelMaxLength) {
    return value
  }
  return value.slice(0, locationLabelMaxLength).trim()
}

export function useLocationLabelSync(options: {
  latitude: Ref<number | undefined>
  longitude: Ref<number | undefined>
  locationLabel: Ref<string>
  enabled: Ref<boolean>
}) {
  const locationLabelManual = ref(false)
  let request: AbortController | null = null
  let lastPoint = ''

  function abortRequest() {
    request?.abort()
    request = null
  }

  function markLocationLabelManual() {
    locationLabelManual.value = true
  }

  function resetLocationLabelSync() {
    abortRequest()
    locationLabelManual.value = false
    lastPoint = ''
  }

  async function syncLabel(latitude: number, longitude: number) {
    abortRequest()
    const controller = new AbortController()
    request = controller
    try {
      const resolved = await reverseGeocode(latitude, longitude, controller.signal)
      if (controller.signal.aborted) {
        return
      }
      const label = resolved ?? formatCoordinateLabel(latitude, longitude)
      options.locationLabel.value = clipLocationLabel(label)
    } catch {
      if (controller.signal.aborted) {
        return
      }
      options.locationLabel.value = formatCoordinateLabel(latitude, longitude)
    } finally {
      if (request === controller) {
        request = null
      }
    }
  }

  watch(
    [options.latitude, options.longitude, options.enabled],
    ([latitude, longitude, enabled]) => {
      if (!enabled || locationLabelManual.value) {
        return
      }
      if (typeof latitude !== 'number' || typeof longitude !== 'number') {
        return
      }
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        return
      }
      const point = `${roundCoordinate(latitude)},${roundCoordinate(longitude)}`
      if (point === lastPoint) {
        return
      }
      lastPoint = point
      void syncLabel(latitude, longitude)
    },
    { immediate: true },
  )

  onBeforeUnmount(abortRequest)

  return {
    markLocationLabelManual,
    resetLocationLabelSync,
  }
}
