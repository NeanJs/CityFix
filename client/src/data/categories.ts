import type { IssueCategory } from '../types/issue.ts'

export type CategoryMeta = {
  id: IssueCategory
  label: string
  hint: string
}

export const issueCategories: CategoryMeta[] = [
  { id: 'pothole', label: 'Pothole', hint: 'Road surface damage' },
  { id: 'lighting', label: 'Street light', hint: 'Outages or broken fixtures' },
  { id: 'graffiti', label: 'Graffiti', hint: 'Vandalism on public property' },
  { id: 'trash', label: 'Trash', hint: 'Overflowing bins or dumping' },
  { id: 'vegetation', label: 'Vegetation', hint: 'Overgrown trees or brush' },
  { id: 'other', label: 'Other', hint: 'Anything else in the public realm' },
]

export function categoryLabel(id: IssueCategory) {
  return issueCategories.find((item) => item.id === id)?.label ?? 'Other'
}

export function normalizeIssueCategory(value: string): IssueCategory {
  const token = value.toLowerCase().replace(/[\s-]+/g, '_')
  if (token === 'street_light' || token === 'streetlight' || token === 'lamp') {
    return 'lighting'
  }
  if (issueCategories.some((item) => item.id === token)) {
    return token as IssueCategory
  }
  if (token.includes('pothole') || token.includes('asphalt') || token.includes('pavement')) {
    return 'pothole'
  }
  if (token.includes('light') || token.includes('lamp')) {
    return 'lighting'
  }
  if (token.includes('graffiti') || token.includes('vandal')) {
    return 'graffiti'
  }
  if (token.includes('trash') || token.includes('garbage') || token.includes('litter') || token.includes('dump')) {
    return 'trash'
  }
  if (token.includes('tree') || token.includes('bush') || token.includes('vegetation') || token.includes('overgrown')) {
    return 'vegetation'
  }
  return 'other'
}
