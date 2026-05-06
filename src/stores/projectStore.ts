import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface Project {
  id: string
  name: string
  description: string
  dimension: string
  status: 'ongoing' | 'completed' | 'delayed'
  progress: number
  startDate: string
  endDate: string
  demands: string[]
}

export interface Demand {
  id: string
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  source: string
  createDate: string
  expectDate: string
  remark: string
  projectId: string | null
  scheduleStart: string | null
  scheduleEnd: string | null
  status: 'pending' | 'scheduled' | 'in_progress' | 'completed'
}

const STORAGE_KEY = '4d-pm-data'

const defaultProjects: Project[] = [
  { id: '1', name: '海外市场拓展', description: '开拓东南亚市场', dimension: 'overseas', status: 'ongoing', progress: 65, startDate: '2026-01-06', endDate: '2026-03-30', demands: [] },
  { id: '2', name: '渠道合作伙伴招募', description: '招募10家核心渠道伙伴', dimension: 'channel', status: 'ongoing', progress: 40, startDate: '2026-01-13', endDate: '2026-04-15', demands: [] },
  { id: '3', name: 'Q1营销活动', description: '第一季度品牌推广活动', dimension: 'marketing', status: 'ongoing', progress: 80, startDate: '2026-01-06', endDate: '2026-03-15', demands: [] },
  { id: '4', name: '人才招聘计划', description: '招聘20名技术人才', dimension: 'hr', status: 'completed', progress: 100, startDate: '2026-01-06', endDate: '2026-02-28', demands: [] }
]

const defaultDemands: Demand[] = [
  { id: '1', title: '增加泰语支持', description: '海外市场需要泰语版本', priority: 'high', source: '海外团队', createDate: '2026-01-10', expectDate: '2026-02-15', remark: '', projectId: '1', scheduleStart: null, scheduleEnd: null, status: 'pending' },
  { id: '2', title: '渠道返点系统', description: '为渠道伙伴提供返点计算功能', priority: 'medium', source: '渠道部', createDate: '2026-01-12', expectDate: '2026-03-01', remark: '', projectId: '2', scheduleStart: null, scheduleEnd: null, status: 'pending' }
]

function loadFromStorage() {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (data) {
      const parsed = JSON.parse(data)
      return {
        projects: parsed.projects || defaultProjects,
        demands: parsed.demands || defaultDemands
      }
    }
  } catch (e) {
    console.error('Failed to load from storage:', e)
  }
  return { projects: defaultProjects, demands: defaultDemands }
}

function saveToStorage(projects: Project[], demands: Demand[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ projects, demands }))
  } catch (e) {
    console.error('Failed to save to storage:', e)
  }
}

export const useProjectStore = defineStore('project', () => {
  const { projects: loadedProjects, demands: loadedDemands } = loadFromStorage()
  const projects = ref<Project[]>(loadedProjects)
  const demands = ref<Demand[]>(loadedDemands)
  const alerts = ref<Array<{ id: string; projectId: string; message: string; level: string }>>([])

  const dimensions = [
    { key: 'overseas', label: '海外', icon: '🌍' },
    { key: 'channel', label: '渠道', icon: '🤝' },
    { key: 'marketing', label: '营销', icon: '📢' },
    { key: 'hr', label: 'HR', icon: '👥' }
  ]

  const getProjectsByDimension = (dimension: string) => {
    return computed(() => projects.value.filter(p => p.dimension === dimension))
  }

  const getProjectStats = (dimension: string) => {
    return computed(() => {
      const dimProjects = projects.value.filter(p => p.dimension === dimension)
      return {
        total: dimProjects.length,
        ongoing: dimProjects.filter(p => p.status === 'ongoing').length,
        completed: dimProjects.filter(p => p.status === 'completed').length,
        delayed: dimProjects.filter(p => p.status === 'delayed').length
      }
    })
  }

  const getDemandsByProject = (projectId: string) => {
    return computed(() => demands.value.filter(d => d.projectId === projectId))
  }

  const addProject = (project: Omit<Project, 'id' | 'demands'>) => {
    const newProject: Project = {
      ...project,
      id: Date.now().toString(),
      demands: []
    }
    projects.value.push(newProject)
    saveToStorage(projects.value, demands.value)
    return newProject
  }

  const updateProject = (id: string, updates: Partial<Project>) => {
    const index = projects.value.findIndex(p => p.id === id)
    if (index > -1) {
      projects.value[index] = { ...projects.value[index], ...updates }
      saveToStorage(projects.value, demands.value)
    }
  }

  const deleteProject = (id: string) => {
    projects.value = projects.value.filter(p => p.id !== id)
    demands.value = demands.value.filter(d => d.projectId !== id)
    saveToStorage(projects.value, demands.value)
  }

  const addDemand = (demand: Omit<Demand, 'id' | 'status'>) => {
    const newDemand: Demand = {
      ...demand,
      id: Date.now().toString(),
      status: 'pending'
    }
    demands.value.push(newDemand)
    saveToStorage(projects.value, demands.value)
    return newDemand
  }

  const updateDemand = (id: string, updates: Partial<Demand>) => {
    const index = demands.value.findIndex(d => d.id === id)
    if (index > -1) {
      demands.value[index] = { ...demands.value[index], ...updates }
      saveToStorage(projects.value, demands.value)
    }
  }

  const deleteDemand = (id: string) => {
    demands.value = demands.value.filter(d => d.id !== id)
    saveToStorage(projects.value, demands.value)
  }

  const checkDelays = () => {
    const today = new Date().toISOString().split('T')[0]
    const newAlerts: Array<{ id: string; projectId: string; message: string; level: string }> = []
    
    projects.value.forEach(project => {
      if (project.status === 'ongoing' && project.endDate < today) {
        newAlerts.push({
          id: `alert-${project.id}`,
          projectId: project.id,
          message: `项目「${project.name}」已逾期，请尽快处理`,
          level: 'high'
        })
      }
    })

    demands.value.forEach(demand => {
      if (demand.status !== 'completed' && demand.expectDate < today) {
        newAlerts.push({
          id: `alert-demand-${demand.id}`,
          projectId: demand.projectId || '',
          message: `需求「${demand.title}」已超期望完成时间`,
          level: 'medium'
        })
      }
    })

    alerts.value = newAlerts
    return newAlerts
  }

  const exportData = () => {
    return JSON.stringify({ projects: projects.value, demands: demands.value }, null, 2)
  }

  const importData = (json: string) => {
    try {
      const data = JSON.parse(json)
      if (data.projects) projects.value = data.projects
      if (data.demands) demands.value = data.demands
      saveToStorage(projects.value, demands.value)
      return true
    } catch (e) {
      return false
    }
  }

  return {
    projects,
    demands,
    alerts,
    dimensions,
    getProjectsByDimension,
    getProjectStats,
    getDemandsByProject,
    addProject,
    updateProject,
    deleteProject,
    addDemand,
    updateDemand,
    deleteDemand,
    checkDelays,
    exportData,
    importData
  }
})