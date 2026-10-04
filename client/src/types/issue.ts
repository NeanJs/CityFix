export type IssueCategory =
  | 'pothole'
  | 'lighting'
  | 'graffiti'
  | 'trash'
  | 'vegetation'
  | 'other'

export type IssueStatus = 'submitted' | 'in_review' | 'scheduled' | 'resolved'

export type IssueSeverity = 'low' | 'medium' | 'high'

export type Issue = {
  id: string
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
  photoDataUrl?: string
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
  category: IssueCategory
  severity: IssueSeverity
  locationLabel: string
  latitude?: number
  longitude?: number
  photoDataUrl?: string
  recommendedAction?: string
  reporterId: string
  trackingId?: string
}
