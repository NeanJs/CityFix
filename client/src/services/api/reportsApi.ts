import { reportsCollectionUrl, reportTrackUrl } from '../../config/apiConfig'
import { demoReport } from '../../data/demoReport'
import { issueCategories } from '../../data/categories'
import type { IssueCategory, IssueSeverity, IssueStatus } from '../../types/issue'

const categories = issueCategories.map((item) => item.id)
const severities: IssueSeverity[] = ['low', 'medium', 'high']
const statuses: IssueStatus[] = ['submitted', 'in_review', 'scheduled', 'resolved']

export class ReportApiError extends Error {
  readonly code: 'not-found' | 'failed' | 'unavailable'

  constructor(code: 'not-found' | 'failed' | 'unavailable') {
    super(code)
    this.code = code
    this.name = 'ReportApiError'
  }
}

export type CreateReportBody = {
  issue_type: string
  title: string
  description: string
  severity: string
  location: {
    description: string
    latitude: number
    longitude: number
  }
  recommended_action: string
  transcript?: string
}

export type CreateReportInput = {
  issueType?: string
  title?: string
  description?: string
  severity?: string
  locationDescription?: string
  latitude?: number
  longitude?: number
  transcript?: string
  photo?: Blob
  audio?: Blob
}

export type RemoteReport = {
  trackingId: string
  title: string
  description: string
  transcript: string
  summary: string
  category: IssueCategory
  severity: IssueSeverity
  status: IssueStatus
  locationLabel: string
  latitude?: number
  longitude?: number
  photoUrl?: string
  recommendedAction: string
  createdAt?: string
  updatedAt?: string
}

function isCategory(value: string): value is IssueCategory {
  return categories.includes(value as IssueCategory)
}

function isSeverity(value: string): value is IssueSeverity {
  return severities.includes(value as IssueSeverity)
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

function filled(value: string | undefined, fallback: string) {
  const trimmed = value?.trim() ?? ''
  return trimmed || fallback
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

function normalizeCategory(value: string): IssueCategory {
  const token = value.toLowerCase().replace(/[\s-]+/g, '_')
  if (token === 'street_light' || token === 'streetlight' || token === 'light') {
    return 'lighting'
  }
  if (isCategory(token)) {
    return token
  }
  if (token.includes('pothole') || token.includes('road')) {
    return 'pothole'
  }
  return value.trim() ? 'other' : 'pothole'
}

function normalizeSeverity(value: string): IssueSeverity {
  const token = value.toLowerCase()
  if (isSeverity(token)) {
    return token
  }
  return 'medium'
}

function normalizeStatus(value: string): IssueStatus {
  const token = value.toLowerCase().replace(/[\s-]+/g, '_')
  if (token === 'in_review' || token === 'review' || token === 'reviewing') {
    return 'in_review'
  }
  if (token === 'scheduled' || token === 'in_progress' || token === 'assigned') {
    return 'scheduled'
  }
  if (token === 'resolved' || token === 'closed' || token === 'complete' || token === 'completed' || token === 'fixed') {
    return 'resolved'
  }
  if (token === 'submitted' || token === 'new' || token === 'open' || token === 'pending') {
    return 'submitted'
  }
  if (statuses.includes(token as IssueStatus)) {
    return token as IssueStatus
  }
  return 'submitted'
}

function readLocation(source: Record<string, unknown>) {
  const nested = asRecord(source.location)
  if (nested) {
    return {
      description: pickString(nested, ['description', 'label', 'name', 'address', 'place']),
      latitude: pickNumber(nested, ['latitude', 'lat']),
      longitude: pickNumber(nested, ['longitude', 'lng', 'lon']),
    }
  }
  return {
    description: pickString(source, ['locationLabel', 'location_label', 'place', 'address']),
    latitude: pickNumber(source, ['latitude', 'lat']),
    longitude: pickNumber(source, ['longitude', 'lng', 'lon']),
  }
}

function readTrackingId(records: Record<string, unknown>[]) {
  for (const source of records) {
    const explicit = pickString(source, ['trackingId', 'tracking_id', 'trackingID'])
    if (explicit) {
      return explicit
    }
  }
  for (const source of records) {
    const id = pickString(source, ['id', 'reference', 'reference_id'])
    if (/^CF-/i.test(id)) {
      return id
    }
  }
  return ''
}

export function buildCreateReportBody(input: CreateReportInput): CreateReportBody {
  const latitude = input.latitude
  const longitude = input.longitude
  const body: CreateReportBody = {
    issue_type: filled(input.issueType, demoReport.issueType),
    title: filled(input.title, demoReport.title),
    description: filled(input.description, demoReport.description),
    severity: filled(input.severity, demoReport.severity),
    location: {
      description: filled(input.locationDescription, demoReport.locationDescription),
      latitude: latitude ?? demoReport.latitude,
      longitude: longitude ?? demoReport.longitude,
    },
    recommended_action: demoReport.recommendedAction,
  }
  const transcript = input.transcript?.trim()
  if (transcript) {
    body.transcript = transcript
  }
  return body
}

export function buildCreateReportFormData(input: CreateReportInput) {
  const payload = buildCreateReportBody(input)
  const body = new FormData()
  body.append('issue_type', payload.issue_type)
  body.append('title', payload.title)
  body.append('description', payload.description)
  body.append('severity', payload.severity)
  body.append('location', JSON.stringify(payload.location))
  body.append('recommended_action', payload.recommended_action)
  if (payload.transcript) {
    body.append('transcript', payload.transcript)
  }
  if (input.photo) {
    body.append('photo', input.photo, photoFileName(input.photo))
  }
  if (input.audio) {
    body.append('audio', input.audio, audioFileName(input.audio))
  }
  return body
}

export function parseRemoteReport(payload: unknown): RemoteReport {
  const top = asRecord(payload)
  const envelope = top ? asRecord(top.data) ?? asRecord(top.result) ?? top : null
  const source = envelope ? asRecord(envelope.report) ?? envelope : null
  if (!envelope || !source) {
    throw new ReportApiError('failed')
  }
  const trackingId = readTrackingId([top ?? {}, envelope, source])
  if (!trackingId) {
    throw new ReportApiError('failed')
  }
  const location = readLocation(source)
  const transcript = pickString(source, ['transcript', 'text', 'voiceText', 'voice_text'])
  const description = pickString(source, ['description', 'note']) || transcript
  const title = pickString(source, ['title']) || description || demoReport.title
  const summary = pickString(source, ['summary']) || description || title
  const category = normalizeCategory(pickString(source, ['issue_type', 'issueType', 'category', 'type']))
  const severity = normalizeSeverity(pickString(source, ['severity']))
  const status = normalizeStatus(pickString(source, ['status', 'current_status', 'currentStatus']))
  const recommendedAction =
    pickString(source, ['recommended_action', 'recommendedAction']) ||
    pickString(envelope, ['recommended_action', 'recommendedAction']) ||
    demoReport.recommendedAction
  return {
    trackingId,
    title,
    description: description || title,
    transcript,
    summary,
    category,
    severity,
    status,
    locationLabel: location.description,
    latitude: location.latitude,
    longitude: location.longitude,
    photoUrl: pickString(source, ['photo_url', 'photoUrl', 'photo']) || undefined,
    recommendedAction,
    createdAt: pickString(source, ['created_at', 'createdAt', 'timestamp']) || undefined,
    updatedAt: pickString(source, ['updated_at', 'updatedAt']) || undefined,
  }
}

async function readPayload(response: Response) {
  const text = await response.text()
  if (!text.trim()) {
    return null
  }
  return JSON.parse(text) as unknown
}

export async function createReport(input: CreateReportInput): Promise<RemoteReport> {
  const url = reportsCollectionUrl
  if (!url) {
    throw new ReportApiError('unavailable')
  }
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
    },
    body: buildCreateReportFormData(input),
  })
  if (!response.ok) {
    throw new ReportApiError(response.status === 404 ? 'not-found' : 'failed')
  }
  return parseRemoteReport(await readPayload(response))
}

export async function trackReport(trackingId: string): Promise<RemoteReport> {
  const url = reportTrackUrl(trackingId)
  if (!url) {
    throw new ReportApiError('unavailable')
  }
  const response = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  })
  if (!response.ok) {
    throw new ReportApiError(response.status === 404 ? 'not-found' : 'failed')
  }
  return parseRemoteReport(await readPayload(response))
}
