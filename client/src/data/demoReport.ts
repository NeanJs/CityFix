import type { IssueSeverity } from '../types/issue'

export const demoReport = {
  issueType: 'pothole',
  title: 'Large pothole on Main Street',
  description: 'There is a large pothole near the right lane.',
  severity: 'high' as IssueSeverity,
  locationDescription: 'Main Street near 12th Avenue',
  latitude: 49.261,
  longitude: -123.113,
  recommendedAction: 'Inspect and repair the damaged road surface',
  transcript: "There's a really large pothole here near the right lane.",
}
