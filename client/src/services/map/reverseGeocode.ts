const nominatimReverseUrl = 'https://nominatim.openstreetmap.org/reverse'

export function formatCoordinateLabel(latitude: number, longitude: number) {
  return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`
}

export function roundCoordinate(value: number) {
  return Number(value.toFixed(5))
}

export async function reverseGeocode(
  latitude: number,
  longitude: number,
  signal?: AbortSignal,
): Promise<string | null> {
  const params = new URLSearchParams({
    format: 'json',
    lat: String(latitude),
    lon: String(longitude),
    zoom: '18',
    addressdetails: '1',
  })
  try {
    const response = await fetch(`${nominatimReverseUrl}?${params}`, {
      signal,
      headers: {
        Accept: 'application/json',
      },
    })
    if (!response.ok) {
      return null
    }
    const payload = (await response.json()) as { display_name?: unknown }
    if (typeof payload.display_name !== 'string') {
      return null
    }
    const label = payload.display_name.trim()
    return label || null
  } catch (error) {
    if (signal?.aborted) {
      throw error
    }
    return null
  }
}
