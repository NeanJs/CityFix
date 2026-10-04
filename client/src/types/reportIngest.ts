import type { IssueSeverity, IssueStatus } from './issue'

export type ReportIngestDraft = {
  title: string
  description: string
  transcript: string
  summary: string
  issueType: string
  severity: IssueSeverity
  locationLabel: string
  latitude?: number
  longitude?: number
  photoUrl?: string
  recommendedAction?: string
  trackingId?: string
  status?: IssueStatus
  createdAt?: string
}

export type ReportIngestInput = {
  photo?: Blob
  text?: string
  locationLabel?: string
  latitude?: number
  longitude?: number
  confirmed?: boolean
  draft?: ReportIngestDraft
}
