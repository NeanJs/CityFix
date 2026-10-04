import type { IssueSeverity, IssueStatus } from '../../types/issue'

export const issueStatuses: IssueStatus[] = [
  'queued',
  'in_progress',
  'resolved',
  'rejected',
]

export const statusOrder: IssueStatus[] = ['queued', 'in_progress', 'resolved']

const severityRank: Record<IssueSeverity, number> = {
  high: 0,
  medium: 1,
  low: 2,
}

export function isIssueStatus(value: string): value is IssueStatus {
  return issueStatuses.includes(value as IssueStatus)
}

export function isOpenStatus(status: IssueStatus) {
  return status === 'queued' || status === 'in_progress'
}

export function canRejectStatus(status: IssueStatus) {
  return isOpenStatus(status)
}

export function normalizeStatus(value: string): IssueStatus {
  const token = value.toLowerCase().replace(/[\s-]+/g, '_')
  if (token === 'rejected' || token === 'declined' || token === 'denied') {
    return 'rejected'
  }
  if (
    token === 'resolved' ||
    token === 'closed' ||
    token === 'complete' ||
    token === 'completed' ||
    token === 'fixed'
  ) {
    return 'resolved'
  }
  if (
    token === 'in_progress' ||
    token === 'assigned' ||
    token === 'in_review' ||
    token === 'review' ||
    token === 'reviewing' ||
    token === 'scheduled'
  ) {
    return 'in_progress'
  }
  if (
    token === 'queued' ||
    token === 'submitted' ||
    token === 'new' ||
    token === 'open' ||
    token === 'pending'
  ) {
    return 'queued'
  }
  if (isIssueStatus(token)) {
    return token
  }
  return 'queued'
}

export function nextStatus(status: IssueStatus): IssueStatus | null {
  const index = statusOrder.indexOf(status)
  if (index < 0 || index >= statusOrder.length - 1) {
    return null
  }
  return statusOrder[index + 1] ?? null
}

export function compareQueuePriority(
  left: { severity: IssueSeverity; updatedAt: string },
  right: { severity: IssueSeverity; updatedAt: string },
) {
  const severityDelta = severityRank[left.severity] - severityRank[right.severity]
  if (severityDelta !== 0) {
    return severityDelta
  }
  return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
}
