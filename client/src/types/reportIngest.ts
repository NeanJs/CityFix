import type { IssueCategory, IssueSeverity, IssueStatus } from './issue'

export type ReportIngestDraft = {
  title: string
  description: string
  transcript: string
  summary: string
  category: IssueCategory
  severity: IssueSeverity
  locationLabel: string
  latitude?: number
  longitude?: number
  photoUrl?: string
  trackingId?: string
  status?: IssueStatus
  createdAt?: string
}

export type ReportIngestInput = {
  photo?: Blob
  audio?: Blob
  text?: string
  locationLabel?: string
  latitude?: number
  longitude?: number
  confirmed?: boolean
  draft?: ReportIngestDraft
}
