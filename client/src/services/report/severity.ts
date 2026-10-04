import type { IssueSeverity } from '../../types/issue'

const severityAliases: Record<string, IssueSeverity> = {
  low: 'low',
  medium: 'medium',
  high: 'high',
  critical: 'high',
  urgent: 'high',
  severe: 'high',
  emergency: 'high',
}

export function normalizeSeverity(value: string): IssueSeverity {
  const token = value.trim().toLowerCase().replace(/[\s-]+/g, '_')
  return severityAliases[token] ?? 'medium'
}
