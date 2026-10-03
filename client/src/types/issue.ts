export type IssueCategory =
  | 'pothole'
  | 'lighting'
  | 'graffiti'
  | 'trash'
  | 'vegetation'
  | 'other'

export type IssueStatus = 'submitted' | 'in_review' | 'scheduled' | 'resolved'

export type Issue = {
  id: string
  title: string
  description: string
  category: IssueCategory
  status: IssueStatus
  locationLabel: string
  latitude?: number
  longitude?: number
  createdAt: string
  updatedAt: string
}

export type NewIssueInput = {
  title: string
  description: string
  category: IssueCategory
  locationLabel: string
  latitude?: number
  longitude?: number
}
