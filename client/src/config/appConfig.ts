const defaultName = 'CityFix'
const defaultTagline = 'Report and track civic issues in your city.'

export const appName = (import.meta.env.VITE_APP_NAME?.trim() || defaultName).trim()

export const appTagline = (
  import.meta.env.VITE_APP_TAGLINE?.trim() || defaultTagline
).trim()

export function applyDocumentMeta() {
  document.title = appName
  const description = document.querySelector('meta[name="description"]')
  if (description) {
    description.setAttribute('content', `${appName} — ${appTagline}`)
  }
}
