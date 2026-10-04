import { defaultIssueType, normalizeIssueType } from '../report/issueType'

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return null
  }
  return value as Record<string, unknown>
}

function stringifyIssueType(value: unknown): string {
  if (typeof value === 'string') {
    return value.trim()
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const next = stringifyIssueType(item)
      if (next) {
        return next
      }
    }
    return ''
  }
  const record = asRecord(value)
  if (!record) {
    return ''
  }
  return (
    stringifyIssueType(record.issue_type) ||
    stringifyIssueType(record.issueType) ||
    stringifyIssueType(record.name) ||
    stringifyIssueType(record.label) ||
    stringifyIssueType(record.value) ||
    stringifyIssueType(record.slug)
  )
}

function walk(value: unknown, keys: string[], depth: number): string {
  if (depth > 6) {
    return ''
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = walk(item, keys, depth + 1)
      if (found) {
        return found
      }
    }
    return ''
  }
  const record = asRecord(value)
  if (!record) {
    return ''
  }
  for (const key of keys) {
    if (key in record) {
      const picked = stringifyIssueType(record[key])
      if (picked) {
        return picked
      }
    }
  }
  for (const nested of Object.values(record)) {
    const found = walk(nested, keys, depth + 1)
    if (found) {
      return found
    }
  }
  return ''
}

export function pickIssueType(payload: unknown, sources: unknown[] = []): string {
  const candidates = [payload, ...sources]
  for (const candidate of candidates) {
    const found = walk(candidate, ['issue_type', 'issueType'], 0)
    if (found) {
      return normalizeIssueType(found)
    }
  }
  for (const source of sources) {
    const found = walk(source, ['category'], 0)
    if (found) {
      return normalizeIssueType(found)
    }
  }
  return defaultIssueType
}
