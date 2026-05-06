import { createRouter, createWebHashHistory } from 'vue-router'
import DashboardView from '../views/DashboardView.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      redirect: '/dashboard/overseas'
    },
    {
      path: '/dashboard/:dimension',
      name: 'Dashboard',
      component: DashboardView,
      props: true
    },
    {
      path: '/gantt/:dimension',
      name: 'Gantt',
      component: () => import('../views/GanttView.vue'),
      props: true
    },
    {
      path: '/demands',
      name: 'Demands',
      component: () => import('../views/DemandPoolView.vue')
    }
  ]
})

export default router