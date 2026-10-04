import type { ReportInputKind } from '../../types/issue'

export const reportInputKinds = [
  'photo',
  'voice',
  'written',
  'conversation',
  'photo_voice',
  'photo_written',
  'photo_conversation',
] as const satisfies readonly ReportInputKind[]

export type { ReportInputKind }

export type ReportInputFlags = {
  hasPhoto: boolean
  hasVoiceNote: boolean
  hasWritten: boolean
  fromConversation: boolean
}

type ReportTextSource = 'conversation' | 'voice' | 'written'

export function isReportInputKind(value: unknown): value is ReportInputKind {
  return typeof value === 'string' && reportInputKinds.includes(value as ReportInputKind)
}

function textSourceFromFlags(flags: ReportInputFlags): ReportTextSource | null {
  if (flags.fromConversation) {
    return 'conversation'
  }
  if (flags.hasVoiceNote) {
    return 'voice'
  }
  if (flags.hasWritten) {
    return 'written'
  }
  return null
}

function textSourceFromKind(kind: ReportInputKind): ReportTextSource | null {
  if (kind === 'conversation' || kind === 'photo_conversation') {
    return 'conversation'
  }
  if (kind === 'voice' || kind === 'photo_voice') {
    return 'voice'
  }
  if (kind === 'written' || kind === 'photo_written') {
    return 'written'
  }
  return null
}

export function classifyReportInput(flags: ReportInputFlags): ReportInputKind {
  const text = textSourceFromFlags(flags)
  if (flags.hasPhoto && text) {
    return `photo_${text}`
  }
  if (flags.hasPhoto) {
    return 'photo'
  }
  if (text) {
    return text
  }
  return 'written'
}

export function classifyIssueInput(issue: {
  inputKind?: string
  photoDataUrl?: string
  audioUrl?: string
  transcript?: string
}): ReportInputKind {
  if (isReportInputKind(issue.inputKind)) {
    return issue.inputKind
  }
  const transcript = issue.transcript?.trim() ?? ''
  return classifyReportInput({
    hasPhoto: Boolean(issue.photoDataUrl),
    hasVoiceNote: Boolean(issue.audioUrl),
    hasWritten: Boolean(transcript) && !issue.audioUrl,
    fromConversation: false,
  })
}

export function reportDescriptionKey(kind: ReportInputKind): string {
  if (kind === 'photo' || kind.startsWith('photo_')) {
    return 'report.descriptionPhoto'
  }
  if (kind === 'conversation') {
    return 'report.descriptionConversation'
  }
  return 'report.description'
}

export function reportCitizenWordsKey(kind: ReportInputKind): string {
  const source = textSourceFromKind(kind)
  if (source === 'written') {
    return 'report.yourWordsWritten'
  }
  return 'report.yourWordsSpoken'
}

export function receiptHeadlineKey(kind: ReportInputKind): string {
  if (kind === 'conversation') {
    return 'receipt.headlineConversation'
  }
  if (kind === 'voice') {
    return 'receipt.headlineVoice'
  }
  return 'receipt.headline'
}

export function sheetTranscriptKey(kind: ReportInputKind): string {
  const source = textSourceFromKind(kind)
  if (source === 'conversation') {
    return 'sheet.transcriptConversation'
  }
  if (source === 'written') {
    return 'sheet.transcriptWritten'
  }
  return 'sheet.transcriptVoice'
}
