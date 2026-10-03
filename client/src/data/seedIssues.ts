import type { Issue } from '../types/issue'
import { seedCitizenId } from './seedUsers'

export const seedIssues: Issue[] = [
  {
    id: 'seed-1',
    title: 'Deep pothole on Main St',
    description: 'Rough patch near the crosswalk; cars are swerving around it.',
    category: 'pothole',
    status: 'in_review',
    locationLabel: 'Main St & 4th Ave',
    latitude: 49.2827,
    longitude: -123.1207,
    reporterId: seedCitizenId,
    createdAt: '2026-03-28T14:20:00.000Z',
    updatedAt: '2026-03-29T09:10:00.000Z',
  },
  {
    id: 'seed-2',
    title: 'Street light flickering',
    description: 'Light cycles on and off every few seconds at the park entrance.',
    category: 'lighting',
    status: 'scheduled',
    locationLabel: 'Harbor Park, north gate',
    reporterId: seedCitizenId,
    createdAt: '2026-03-25T22:05:00.000Z',
    updatedAt: '2026-03-27T16:40:00.000Z',
  },
  {
    id: 'seed-3',
    title: 'Overflowing bin',
    description: 'Recycling bin has not been emptied; litter spreading to sidewalk.',
    category: 'trash',
    status: 'resolved',
    locationLabel: 'Oak Plaza bus stop',
    reporterId: seedCitizenId,
    createdAt: '2026-03-20T11:30:00.000Z',
    updatedAt: '2026-03-22T08:15:00.000Z',
  },
]
