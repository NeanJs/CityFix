import type { IssueSeverity, IssueStatus } from '../../types/issue'

export const statusOrder: IssueStatus[] = [
  'submitted',
  'in_review',
  'scheduled',
  'resolved',
]

const severityRank: Record<IssueSeverity, number> = {
  high: 0,
  medium: 1,
  low: 2,
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
