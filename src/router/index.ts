import { createRouter, createWebHashHistory } from 'vue-router'
import ProjectManagementView from '../views/ProjectManagementView.vue'
import DemandManagementView from '../views/DemandManagementView.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      redirect: '/projects'
    },
    {
      path: '/projects',
      name: 'Projects',
      component: ProjectManagementView
    },
    {
      path: '/demands',
      name: 'Demands',
      component: DemandManagementView
    }
  ]
})

export default router