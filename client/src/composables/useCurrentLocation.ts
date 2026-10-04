import { computed, ref } from 'vue'

export type CurrentLocationSuccess = {
  ok: true
  latitude: number
  longitude: number
}

export type CurrentLocationFailure = {
  ok: false
  errorKey: 'report.locationUnavailable' | 'report.locationDenied'
}

export type CurrentLocationResult = CurrentLocationSuccess | CurrentLocationFailure

const accurateGeoOptions: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 15000,
  maximumAge: 0,
}

const cached = ref<CurrentLocationSuccess | null>(null)
const locating = ref(false)
let bootstrapPromise: Promise<CurrentLocationResult> | null = null

function fetchCurrentPosition(): Promise<CurrentLocationResult> {
  return new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      resolve({ ok: false, errorKey: 'report.locationUnavailable' })
      return
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          ok: true,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })
      },
      () => {
        resolve({ ok: false, errorKey: 'report.locationDenied' })
      },
      accurateGeoOptions,
    )
  })
}

export function bootstrapLocation() {
  if (bootstrapPromise) {
    return bootstrapPromise
  }
  locating.value = true
  bootstrapPromise = fetchCurrentPosition().then((result) => {
    locating.value = false
    if (result.ok) {
      cached.value = result
    } else {
      bootstrapPromise = null
    }
    return result
  })
  return bootstrapPromise
}

type RequestCurrentPositionOptions = {
  force?: boolean
}

export function requestCurrentPosition(
  options: RequestCurrentPositionOptions = {},
): Promise<CurrentLocationResult> {
  const force = options.force ?? false
  if (!force) {
    if (cached.value) {
      return Promise.resolve(cached.value)
    }
    if (bootstrapPromise) {
      return bootstrapPromise
    }
  }
  if (!force) {
    return bootstrapLocation()
  }
  locating.value = true
  return fetchCurrentPosition().then((result) => {
    locating.value = false
    if (result.ok) {
      cached.value = result
    }
    return result
  })
}

export function useCurrentLocation() {
  return {
    cachedPosition: computed(() => cached.value),
    locating: computed(() => locating.value),
    bootstrapLocation,
    requestCurrentPosition,
  }
}
