export const openFreeMapStyleIds = [
  'liberty',
  'bright',
  'positron',
  'dark',
  'fiord',
  '3d',
] as const

export type OpenFreeMapStyleId = (typeof openFreeMapStyleIds)[number]

export const openFreeMapStyleBaseUrl = 'https://tiles.openfreemap.org/styles'

export const openFreeMapStyleUrls: Record<OpenFreeMapStyleId, string> = {
  liberty: `${openFreeMapStyleBaseUrl}/liberty`,
  bright: `${openFreeMapStyleBaseUrl}/bright`,
  positron: `${openFreeMapStyleBaseUrl}/positron`,
  dark: `${openFreeMapStyleBaseUrl}/dark`,
  fiord: `${openFreeMapStyleBaseUrl}/fiord`,
  '3d': `${openFreeMapStyleBaseUrl}/3d`,
}

export const defaultOpenFreeMapStyleId: OpenFreeMapStyleId = 'liberty'

function parseNumber(value: string | undefined, fallback: number) {
  if (!value?.trim()) {
    return fallback
  }
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function isOpenFreeMapStyleId(value: string): value is OpenFreeMapStyleId {
  return (openFreeMapStyleIds as readonly string[]).includes(value)
}

export function resolveOpenFreeMapStyleUrl(
  styleId: OpenFreeMapStyleId = defaultOpenFreeMapStyleId,
) {
  return openFreeMapStyleUrls[styleId]
}

export function resolveMapStyleUrl() {
  const customStyleUrl = import.meta.env.VITE_MAP_STYLE_URL?.trim()
  if (customStyleUrl) {
    return customStyleUrl
  }

  const styleId = import.meta.env.VITE_MAP_STYLE?.trim()
  if (styleId && isOpenFreeMapStyleId(styleId)) {
    return resolveOpenFreeMapStyleUrl(styleId)
  }

  return resolveOpenFreeMapStyleUrl()
}

export const defaultMapCenter: [number, number] = [
  parseNumber(import.meta.env.VITE_MAP_DEFAULT_LNG, -123.1207),
  parseNumber(import.meta.env.VITE_MAP_DEFAULT_LAT, 49.2827),
]

export const defaultMapZoom = parseNumber(import.meta.env.VITE_MAP_DEFAULT_ZOOM, 12)
