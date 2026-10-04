function withScheme(value: string) {
  const trimmed = value.trim()
  if (!trimmed) {
    return ''
  }
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed
  }
  return `https://${trimmed.replace(/^\/+/, '')}`
}

function stripTrailingSlash(value: string) {
  return value.replace(/\/$/, '')
}

function joinApiUrl(base: string, path: string) {
  if (!base) {
    return ''
  }
  const prefix = path.startsWith('/') ? path : `/${path}`
  if (base.endsWith('/api') && prefix.startsWith('/api/')) {
    return `${base}${prefix.slice(4)}`
  }
  return `${base}${prefix}`
}

function ingestOverrideUrl(value: string) {
  const normalized = stripTrailingSlash(withScheme(value))
  if (!normalized) {
    return ''
  }
  if (/\/reports\/pothole$/i.test(normalized)) {
    return ''
  }
  return normalized
}

export const apiBaseUrl = stripTrailingSlash(withScheme(import.meta.env.VITE_API_BASE_URL ?? ''))

export const reportIngestPath = '/api/reports/analyze'

export const reportIngestUrl =
  ingestOverrideUrl(import.meta.env.VITE_REPORT_INGEST_URL ?? '') ||
  joinApiUrl(apiBaseUrl, reportIngestPath)

export const reportTranscribePath = '/api/reports/transcribe'

export const reportTranscribeUrl = joinApiUrl(apiBaseUrl, reportTranscribePath)

export const reportsCollectionPath = '/api/reports'

export const reportsCollectionUrl = joinApiUrl(apiBaseUrl, reportsCollectionPath)

export const adminReportsPath = '/api/admin/reports'

export const adminReportsUrl = joinApiUrl(apiBaseUrl, adminReportsPath)

export function reportTrackUrl(trackingId: string) {
  const id = trackingId.trim()
  if (!reportsCollectionUrl || !id) {
    return ''
  }
  return `${reportsCollectionUrl}/track/${encodeURIComponent(id)}`
}

export function voiceConversationIssueUrl(conversationId: string) {
  const id = conversationId.trim()
  if (!apiBaseUrl || !id) {
    return ''
  }
  return joinApiUrl(
    apiBaseUrl,
    `/api/voice/conversations/${encodeURIComponent(id)}/issue`,
  )
}

export function adminReportUrl(reportId: string) {
  const id = reportId.trim()
  if (!adminReportsUrl || !id) {
    return ''
  }
  return `${adminReportsUrl}/${encodeURIComponent(id)}`
}

export function adminReportStatusUrl(reportId: string) {
  const url = adminReportUrl(reportId)
  if (!url) {
    return ''
  }
  return `${url}/status`
}
