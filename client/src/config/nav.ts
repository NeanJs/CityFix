import type { AppIconName } from '../components/ui/AppIcon.vue'
import type { UserRole } from '../types/user'

export type NavIcon = 'home' | 'report' | 'reports' | 'dashboard' | 'voice' | 'insights'

const pageTitleIcons: Partial<Record<string, AppIconName>> = {
  home: 'home',
  report: 'report',
  voice: 'voice',
  reports: 'reports',
  adminReports: 'reports',
  reportReceipt: 'checkCircle',
  adminHome: 'dashboard',
  adminInsights: 'insights',
  login: 'signIn',
}

export function pageTitleIconForRoute(name: string | symbol | null | undefined): AppIconName | undefined {
  if (typeof name !== 'string') {
    return undefined
  }
  return pageTitleIcons[name]
}

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
  { name: 'adminInsights', path: '/admin/insights', labelKey: 'nav.insights', icon: 'insights' },
]

export function navForRole(role: UserRole) {
  return role === 'staff' ? staffNavItems : citizenNavItems
}
