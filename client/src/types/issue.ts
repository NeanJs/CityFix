export type IssueStatus = 'queued' | 'in_progress' | 'resolved' | 'rejected'

export type IssueSeverity = 'low' | 'medium' | 'high'

export type ReportInputKind =
  | 'photo'
  | 'voice'
  | 'written'
  | 'conversation'
  | 'photo_voice'
  | 'photo_written'
  | 'photo_conversation'

export type Issue = {
  id: string
  remoteId?: string
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
  photoDataUrl?: string
  audioUrl?: string
  inputKind?: ReportInputKind
  recommendedAction?: string
  reporterId: string
  createdAt: string
  updatedAt: string
}

export type NewIssueInput = {
  title?: string
  description: string
  transcript?: string
  summary: string
  issueType: string
  severity: IssueSeverity
  status?: IssueStatus
  locationLabel: string
  latitude?: number
  longitude?: number
  photoDataUrl?: string
  audioUrl?: string
  inputKind?: ReportInputKind
  recommendedAction?: string
  reporterId: string
  remoteId?: string
  trackingId?: string
}
