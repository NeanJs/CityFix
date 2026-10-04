import { reportsCollectionUrl, reportTrackUrl } from '../../config/apiConfig'
import {
  apiRequestErrorFromResponse,
  ApiRequestError,
  type ApiRequestErrorCode,
} from './apiRequestError'
import { appendFormFile, audioFileName, photoFileName } from '../media/formFile'
import { defaultIssueType } from '../report/issueType'
import { normalizeSeverity } from '../report/severity'
import { pickIssueType } from './pickIssueType'
import type { IssueSeverity, IssueStatus } from '../../types/issue'

const statuses: IssueStatus[] = ['submitted', 'in_review', 'scheduled', 'resolved']

export class ReportApiError extends ApiRequestError {
  constructor(code: ApiRequestErrorCode, retryAfterSeconds?: number) {
    super(code, retryAfterSeconds)
    this.name = 'ReportApiError'
  }
}

function errorFromResponse(response: Response) {
  const mapped = apiRequestErrorFromResponse(response)
  return new ReportApiError(mapped.code, mapped.retryAfterSeconds)
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
  recommendedAction?: string
  photo?: Blob
  audio?: Blob
}

export type RemoteReport = {
  trackingId: string
  title: string
  description: string
  transcript: string
  summary: string
  issueType: string
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
    issue_type: filled(input.issueType, defaultIssueType),
    title: filled(input.title, ''),
    description: filled(input.description, ''),
    severity: filled(input.severity, 'medium'),
    location: {
      description: filled(input.locationDescription, ''),
      latitude: latitude ?? 0,
      longitude: longitude ?? 0,
    },
    recommended_action: filled(input.recommendedAction, ''),
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
  body.append('latitude', String(payload.location.latitude))
  body.append('longitude', String(payload.location.longitude))
  body.append('recommended_action', payload.recommended_action)
  if (payload.transcript) {
    body.append('transcript', payload.transcript)
  }
  if (input.photo) {
    appendFormFile(body, 'photo', input.photo, photoFileName(input.photo))
  }
  if (input.audio) {
    appendFormFile(body, 'audio', input.audio, audioFileName(input.audio))
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
  const title = pickString(source, ['title']) || description
  const summary = pickString(source, ['summary']) || description || title
  const issueType = pickIssueType(payload, [top, envelope, source])
  const severity = normalizeSeverity(pickString(source, ['severity']))
  const status = normalizeStatus(pickString(source, ['status', 'current_status', 'currentStatus']))
  const recommendedAction =
    pickString(source, ['recommended_action', 'recommendedAction']) ||
    pickString(envelope, ['recommended_action', 'recommendedAction'])
  return {
    trackingId,
    title,
    description: description || title,
    transcript,
    summary,
    issueType,
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
    throw errorFromResponse(response)
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
    throw errorFromResponse(response)
  }
  return parseRemoteReport(await readPayload(response))
}
