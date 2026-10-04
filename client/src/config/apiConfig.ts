export const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL?.trim() || '').replace(/\/$/, '')

export const reportIngestPath = '/reports/pothole'

export const reportIngestUrl = (
  import.meta.env.VITE_REPORT_INGEST_URL?.trim() ||
  (apiBaseUrl ? `${apiBaseUrl}${reportIngestPath}` : '')
).trim()

export const reportsCollectionPath = '/api/reports'

export const reportsCollectionUrl = (apiBaseUrl ? `${apiBaseUrl}${reportsCollectionPath}` : '').trim()

export function reportTrackUrl(trackingId: string) {
  const id = trackingId.trim()
  if (!reportsCollectionUrl || !id) {
    return ''
  }
  return `${reportsCollectionUrl}/track/${encodeURIComponent(id)}`
}
