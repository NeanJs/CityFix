export const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL?.trim() || '').replace(/\/$/, '')

export const reportIngestPath = '/reports/pothole'

export const reportIngestUrl = (
  import.meta.env.VITE_REPORT_INGEST_URL?.trim() ||
  (apiBaseUrl ? `${apiBaseUrl}${reportIngestPath}` : '')
).trim()
