import { reportIngestUrl } from '../../config/apiConfig'
import { issueCategories } from '../../data/categories'
import type { IssueCategory, IssueSeverity, IssueStatus } from '../../types/issue'
import type { ReportIngestDraft, ReportIngestInput } from '../../types/reportIngest'

const categories = issueCategories.map((item) => item.id)
const severities: IssueSeverity[] = ['low', 'medium', 'high']
const statuses: IssueStatus[] = ['submitted', 'in_review', 'scheduled', 'resolved']

function isCategory(value: string): value is IssueCategory {
  return categories.includes(value as IssueCategory)
}

function isSeverity(value: string): value is IssueSeverity {
  return severities.includes(value as IssueSeverity)
}

function isStatus(value: string): value is IssueStatus {
  return statuses.includes(value as IssueStatus)
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return null
  }
  return value as Record<string, unknown>
}

function pickString(source: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = source[key]
    if (typeof value === 'string' && value.trim()) {
      return value.trim()
    }
  }
  return ''
}

function pickNumber(source: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = source[key]
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value
    }
    if (typeof value === 'string' && value.trim()) {
      const parsed = Number(value)
      if (Number.isFinite(parsed)) {
        return parsed
      }
    }
  }
  return undefined
}

function photoFileName(blob: Blob) {
  if (blob.type.includes('png')) {
    return 'photo.png'
  }
  if (blob.type.includes('webp')) {
    return 'photo.webp'
  }
  return 'photo.jpg'
}

function audioFileName(blob: Blob) {
  if (blob.type.includes('mp4')) {
    return 'voice.mp4'
  }
  if (blob.type.includes('mpeg')) {
    return 'voice.mp3'
  }
  return 'voice.webm'
}

function toFormData(input: ReportIngestInput) {
  const body = new FormData()
  if (input.photo) {
    body.append('photo', input.photo, photoFileName(input.photo))
  }
  if (input.audio) {
    body.append('audio', input.audio, audioFileName(input.audio))
  }
  const text = input.text?.trim()
  if (text) {
    body.append('text', text)
  }
  const place = input.locationLabel?.trim()
  if (place) {
    body.append('locationLabel', place)
  }
  if (input.latitude !== undefined) {
    body.append('latitude', String(input.latitude))
  }
  if (input.longitude !== undefined) {
    body.append('longitude', String(input.longitude))
  }
  body.append('confirmed', input.confirmed ? 'true' : 'false')
  if (input.draft) {
    const photoUrl = input.draft.photoUrl?.trim() ?? ''
    const draft = /^https?:\/\//i.test(photoUrl) ? input.draft : { ...input.draft, photoUrl: undefined }
    body.append('report', JSON.stringify(draft))
  }
  return body
}

function emptyDraft(overrides: Partial<ReportIngestDraft> = {}): ReportIngestDraft {
  return {
    title: '',
    description: '',
    transcript: '',
    summary: '',
    category: 'pothole',
    severity: 'medium',
    locationLabel: '',
    status: 'submitted',
    ...overrides,
  }
}

export function parseReportIngestResponse(payload: unknown): ReportIngestDraft {
  const root = asRecord(payload)
  const nested = root ? asRecord(root.report) ?? asRecord(root.data) : null
  const source = nested ?? root
  if (!source) {
    return emptyDraft()
  }
  const categoryRaw = pickString(source, ['category', 'type', 'issueType', 'issue_type']).toLowerCase()
  const severityRaw = pickString(source, ['severity']).toLowerCase()
  const statusRaw = pickString(source, ['status']).toLowerCase()
  const transcript = pickString(source, ['transcript', 'text', 'voiceText', 'voice_text'])
  const description = pickString(source, ['description', 'note']) || transcript
  const locationLabel = pickString(source, ['locationLabel', 'location', 'place'])
  const category = isCategory(categoryRaw) ? categoryRaw : 'pothole'
  const severity = isSeverity(severityRaw) ? severityRaw : 'medium'
  const title = pickString(source, ['title'])
  const summary = pickString(source, ['summary'])
  return emptyDraft({
    title,
    description,
    transcript,
    summary: summary || description || title,
    category,
    severity,
    locationLabel,
    latitude: pickNumber(source, ['latitude', 'lat']),
    longitude: pickNumber(source, ['longitude', 'lng', 'lon']),
    photoUrl: pickString(source, ['photoUrl', 'photo_url', 'photo']),
    trackingId: pickString(source, ['trackingId', 'tracking_id']),
    status: isStatus(statusRaw) ? statusRaw : 'submitted',
    createdAt: pickString(source, ['createdAt', 'created_at', 'timestamp']),
  })
}

function localIngest(input: ReportIngestInput): ReportIngestDraft {
  if (input.confirmed && input.draft) {
    return {
      ...input.draft,
      status: input.draft.status ?? 'submitted',
    }
  }
  const text = input.text?.trim() ?? ''
  const locationLabel =
    input.locationLabel?.trim() ||
    (input.latitude !== undefined && input.longitude !== undefined
      ? `${input.latitude.toFixed(5)}, ${input.longitude.toFixed(5)}`
      : '')
  return emptyDraft({
    description: text,
    transcript: text,
    locationLabel,
    latitude: input.latitude,
    longitude: input.longitude,
  })
}

export async function ingestReport(input: ReportIngestInput): Promise<ReportIngestDraft> {
  const url = reportIngestUrl
  if (!url) {
    return localIngest(input)
  }
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
    },
    body: toFormData(input),
  })
  if (!response.ok) {
    throw new Error('ingest-failed')
  }
  const payload = (await response.json()) as unknown
  return parseReportIngestResponse(payload)
}

export async function blobFromDataUrl(dataUrl: string) {
  const response = await fetch(dataUrl)
  return response.blob()
}
