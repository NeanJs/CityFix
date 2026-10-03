import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import ReportView from '../views/ReportView.vue'
import ReportsView from '../views/ReportsView.vue'

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/reports', name: 'reports', component: ReportsView },
    { path: '/report', name: 'report', component: ReportView },
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})
