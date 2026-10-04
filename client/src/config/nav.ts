import type { UserRole } from '../types/user'

export type NavIcon = 'home' | 'report' | 'reports' | 'dashboard' | 'voice'

export type NavItem = {
  name: string
  path: string
  labelKey: string
  icon: NavIcon
  emphasis?: boolean
}

export const citizenNavItems: NavItem[] = [
  { name: 'home', path: '/', labelKey: 'nav.overview', icon: 'home' },
  { name: 'report', path: '/report', labelKey: 'nav.newReport', icon: 'report', emphasis: true },
  { name: 'voice', path: '/voice', labelKey: 'nav.voice', icon: 'voice' },
  { name: 'reports', path: '/reports', labelKey: 'nav.myReports', icon: 'reports' },
]

export const staffNavItems: NavItem[] = [
  { name: 'adminHome', path: '/admin', labelKey: 'nav.dashboard', icon: 'dashboard' },
  { name: 'adminReports', path: '/admin/reports', labelKey: 'nav.reports', icon: 'reports' },
]

export function navForRole(role: UserRole) {
  return role === 'staff' ? staffNavItems : citizenNavItems
}
