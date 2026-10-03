import type { IssueCategory } from '../types/issue'

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
