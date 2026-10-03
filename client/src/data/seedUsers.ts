import type { UserRole } from '../types/user'

export const seedCitizenId = 'seed-citizen'
export const seedStaffId = 'seed-staff'

export const demoPassword = 'cityfix'

export const demoAccounts = [
  {
    id: seedCitizenId,
    email: 'jane@cityfix.local',
    displayName: 'Jane Rivera',
    role: 'citizen' as UserRole,
    password: demoPassword,
  },
  {
    id: seedStaffId,
    email: 'desk@cityfix.local',
    displayName: 'Desk Officer',
    role: 'staff' as UserRole,
    password: demoPassword,
  },
] as const
