import type { IssueCategory, IssueSeverity } from '../../types/issue'

const highMarks = [
  'dangerous',
  'deep',
  'large',
  'huge',
  'severe',
  'accident',
  'swerve',
  'hazard',
  'urgent',
  'wide',
]

const lowMarks = ['small', 'minor', 'shallow', 'slight', 'tiny', 'hairline']

export function inferSeverity(text: string): IssueSeverity {
  const haystack = text.toLowerCase()
  if (highMarks.some((mark) => haystack.includes(mark))) {
    return 'high'
  }
  if (lowMarks.some((mark) => haystack.includes(mark))) {
    return 'low'
  }
  return 'medium'
}

export function buildReportTitle(
  categoryLabel: string,
  locationLabel: string,
  explicitTitle?: string,
) {
  const title = explicitTitle?.trim()
  if (title) {
    return title
  }
  return `${categoryLabel} at ${locationLabel.trim()}`
}

export function buildReportSummary(
  severityLabel: string,
  categoryLabel: string,
  locationLabel: string,
) {
  return `A ${severityLabel.toLowerCase()} ${categoryLabel.toLowerCase()} at ${locationLabel.trim()}.`
}

export function trackingIdFromInternal(id: string) {
  let hash = 0
  for (let index = 0; index < id.length; index += 1) {
    hash = (hash * 31 + id.charCodeAt(index)) >>> 0
  }
  return `CF-${1000 + (hash % 9000)}`
}

export function createTrackingId(existing: string[]) {
  const taken = new Set(existing)
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const next = `CF-${1000 + Math.floor(Math.random() * 9000)}`
    if (!taken.has(next)) {
      return next
    }
  }
  return trackingIdFromInternal(`${Date.now()}-${Math.random()}`)
}

export function narrativeText(input: {
  title?: string
  description?: string
  transcript?: string
  category: IssueCategory
}) {
  return [input.transcript, input.description, input.title, input.category]
    .filter((part): part is string => Boolean(part && part.trim()))
    .join(' ')
}
