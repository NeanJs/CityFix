export const defaultIssueType = 'other'

export function normalizeIssueType(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) {
    return defaultIssueType
  }
  const token = trimmed
    .toLowerCase()
    .replace(/[\s-]+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
  return token || defaultIssueType
}

export function formatIssueTypeLabel(value: string): string {
  const token = normalizeIssueType(value)
  return token
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}
