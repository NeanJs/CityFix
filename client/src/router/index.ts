import {
  createRouter,
  createWebHistory,
  type RouteLocationNormalized,
} from 'vue-router'
import AdminLayout from '../components/layout/AdminLayout.vue'
import AuthLayout from '../components/layout/AuthLayout.vue'
import UserLayout from '../components/layout/UserLayout.vue'
import { hydrateAuth, useAuth } from '../composables/useAuth'
import { homePathForRole } from '../services/auth/authService'
import type { UserRole } from '../types/user'
import AdminHomeView from '../views/admin/AdminHomeView.vue'
import LoginView from '../views/auth/LoginView.vue'
import RegisterView from '../views/auth/RegisterView.vue'
import HomeView from '../views/HomeView.vue'
import ReceiptView from '../views/ReceiptView.vue'
import ReportView from '../views/ReportView.vue'
import ReportsView from '../views/ReportsView.vue'

declare module 'vue-router' {
  interface RouteMeta {
    guest?: boolean
    role?: UserRole
    issueScope?: 'mine' | 'all'
  }
}

function metaRole(to: RouteLocationNormalized): UserRole | undefined {
  return [...to.matched].reverse().find((record) => record.meta.role)?.meta.role
}

function isGuestRoute(to: RouteLocationNormalized) {
  return to.matched.some((record) => record.meta.guest)
}

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      component: AuthLayout,
      meta: { guest: true },
      children: [{ path: '', name: 'login', component: LoginView }],
    },
    {
      path: '/register',
      component: AuthLayout,
      meta: { guest: true },
      children: [{ path: '', name: 'register', component: RegisterView }],
    },
    {
      path: '/',
      component: UserLayout,
      meta: { role: 'citizen' },
      children: [
        { path: '', name: 'home', component: HomeView },
        { path: 'report', name: 'report', component: ReportView },
        {
          path: 'report/receipt/:id',
          name: 'reportReceipt',
          component: ReceiptView,
        },
        {
          path: 'reports',
          name: 'reports',
          component: ReportsView,
          meta: { issueScope: 'mine' },
        },
      ],
    },
    {
      path: '/admin',
      component: AdminLayout,
      meta: { role: 'staff' },
      children: [
        { path: '', name: 'adminHome', component: AdminHomeView },
        {
          path: 'reports',
          name: 'adminReports',
          component: ReportsView,
          meta: { issueScope: 'all' },
        },
      ],
    },
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})

router.beforeEach(async (to) => {
  await hydrateAuth()
  const { currentUser } = useAuth()
  const user = currentUser.value
  const requiredRole = metaRole(to)

  if (isGuestRoute(to)) {
    if (user) {
      return homePathForRole(user.role)
    }
    return true
  }

  if (!user) {
    return { path: '/login' }
  }

  if (requiredRole && user.role !== requiredRole) {
    return homePathForRole(user.role)
  }

  return true
})
