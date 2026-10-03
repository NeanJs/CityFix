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

const geoOptions: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 12000,
  maximumAge: 60000,
}

export function requestCurrentPosition(): Promise<CurrentLocationResult> {
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
      geoOptions,
    )
  })
}
