import { reportIngestUrl } from '../../config/apiConfig'
import { ApiRequestError, apiRequestErrorFromResponse } from './apiRequestError'
import { defaultIssueType } from '../report/issueType'
import { normalizeSeverity } from '../report/severity'
import { normalizeStatus } from '../report/statusFlow'
import { pickIssueType } from './pickIssueType'
import { appendFormFile, audioFileName, fileFromDataUrl, isAnalyzeImage, photoFileName } from '../media/formFile'
import type { ReportIngestDraft, ReportIngestInput } from '../../types/reportIngest'

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

function analyzePhoto(input: ReportIngestInput) {
  return isAnalyzeImage(input.photo) ? input.photo : undefined
}

function analyzeAudio(input: ReportIngestInput) {
  const audio = input.audio
  if (!audio || audio.size < 1 || isAnalyzeImage(audio)) {
    return undefined
  }
  return audio
}

function analyzeText(input: ReportIngestInput) {
  return input.text?.trim() || ''
}

function toFormData(input: ReportIngestInput) {
  const body = new FormData()
  const photo = analyzePhoto(input)
  const audio = analyzeAudio(input)
  if (photo) {
    appendFormFile(body, 'file', photo, photoFileName(photo))
  } else if (audio) {
    appendFormFile(body, 'file', audio, audioFileName(audio))
  } else {
    const text = analyzeText(input)
    if (text) {
      body.append('text', text)
    }
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
    issueType: defaultIssueType,
    severity: 'medium',
    locationLabel: '',
    status: 'queued',
    ...overrides,
  }
}

function firstRecord(source: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const nested = asRecord(source[key])
    if (nested) {
      return nested
    }
  }
  return null
}

function resolveIngestSource(payload: unknown): Record<string, unknown> | null {
  const top = asRecord(payload)
  if (!top) {
    return null
  }
  const envelope =
    firstRecord(top, ['data', 'result', 'analysis', 'draft']) ?? top
  const nested = firstRecord(envelope, ['draft', 'report', 'analysis'])
  if (!nested) {
    return envelope === top ? envelope : { ...top, ...envelope }
  }
  return { ...top, ...envelope, ...nested }
}

function hasMeaningfulAnalysisText(draft: ReportIngestDraft) {
  return Boolean(
    draft.title.trim() ||
      draft.summary.trim() ||
      draft.description.trim() ||
      draft.transcript.trim(),
  )
}

export function parseReportIngestResponse(payload: unknown): ReportIngestDraft {
  const source = resolveIngestSource(payload)
  if (!source) {
    throw new ApiRequestError('failed')
  }
  const statusRaw = pickString(source, ['status']).toLowerCase()
  const transcript = pickString(source, ['transcript', 'text', 'voiceText', 'voice_text'])
  const description = pickString(source, ['description', 'note']) || transcript
  const locationLabel = pickString(source, ['locationLabel', 'location', 'place'])
  const issueType = pickIssueType(payload, [source])
  const title = pickString(source, ['title'])
  const summary = pickString(source, ['summary'])
  const recommendedAction = pickString(source, ['recommended_action', 'recommendedAction'])
  const draft = emptyDraft({
    title,
    description,
    transcript,
    summary,
    issueType,
    severity: normalizeSeverity(pickString(source, ['severity'])),
    locationLabel,
    latitude: pickNumber(source, ['latitude', 'lat']),
    longitude: pickNumber(source, ['longitude', 'lng', 'lon']),
    photoUrl: pickString(source, ['photoUrl', 'photo_url', 'photo']),
    recommendedAction,
    trackingId: pickString(source, ['trackingId', 'tracking_id']),
    status: statusRaw ? normalizeStatus(statusRaw) : 'queued',
    createdAt: pickString(source, ['createdAt', 'created_at', 'timestamp']),
  })
  if (!hasMeaningfulAnalysisText(draft)) {
    throw new ApiRequestError('failed')
  }
  return draft
}

function errorMessageFromPayload(payload: unknown) {
  const record = asRecord(payload)
  if (!record) {
    return typeof payload === 'string' ? payload : ''
  }
  const error = record.error
  if (typeof error === 'string') {
    return error
  }
  const nested = asRecord(error)
  if (nested) {
    return pickString(nested, ['message', 'error'])
  }
  return pickString(record, ['message'])
}

function isPhotoAnalysisRejection(payload: unknown) {
  return /only images are supported for photo analysis/i.test(errorMessageFromPayload(payload))
}

async function postIngest(url: string, input: ReportIngestInput) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
    },
    body: toFormData(input),
  })
  let payload: unknown
  try {
    payload = (await response.json()) as unknown
  } catch {
    if (!response.ok) {
      throw apiRequestErrorFromResponse(response)
    }
    throw new ApiRequestError('failed')
  }
  if (!response.ok) {
    if (isPhotoAnalysisRejection(payload)) {
      return { kind: 'photo-rejected' as const }
    }
    throw apiRequestErrorFromResponse(response)
  }
  return { kind: 'ok' as const, draft: parseReportIngestResponse(payload) }
}

export async function ingestReport(input: ReportIngestInput): Promise<ReportIngestDraft> {
  const url = reportIngestUrl
  if (!url) {
    throw new ApiRequestError('unavailable')
  }
  const first = await postIngest(url, input)
  if (first.kind === 'ok') {
    return first.draft
  }
  const note = analyzeText(input)
  if (!analyzePhoto(input) && analyzeAudio(input) && note) {
    const retry = await postIngest(url, { ...input, photo: undefined, audio: undefined })
    if (retry.kind === 'ok') {
      return retry.draft
    }
  }
  throw new ApiRequestError('failed')
}

export async function blobFromDataUrl(dataUrl: string) {
  return fileFromDataUrl(dataUrl, 'photo.jpg')
}
