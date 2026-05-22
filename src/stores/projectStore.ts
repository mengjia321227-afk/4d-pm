import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '../lib/supabase'

export interface Version {
  id: string
  projectId: string
  versionNumber: string
  name: string
  status: 'planning' | 'developing' | 'testing' | 'released' | 'deprecated'
  startDate: string
  endDate: string
  description: string
}

export interface ProgressLog {
  id: string
  projectId: string
  date: string
  description: string
}

export interface Project {
  id: string
  name: string
  description: string
  dimension: string
  status: 'ongoing' | 'completed' | 'delayed'
  progress: number
  startDate: string
  endDate: string
  priority: 'P0' | 'P1' | 'P2'
  stakeholders: string[]
  developers: string[]
}

export interface Demand {
  id: string
  title: string
  description: string
  priority: 'P0' | 'P1' | 'P2'
  category: string
  creator: string
  createDate: string
  remark: string
  images: string[]
  projectId: string | null
  versionId: string | null
  scheduleStart: string | null
  scheduleEnd: string | null
  status: 'pending' | 'scheduled' | 'in_progress' | 'completed'
}

const STORAGE_KEY = '4d-pm-data'

const defaultProjects: Project[] = [
  { 
    id: '1', 
    name: '海外市场拓展', 
    description: '开拓东南亚市场', 
    dimension: 'overseas', 
    status: 'ongoing', 
    progress: 65, 
    startDate: '2026-01-06', 
    endDate: '2026-03-30',
    priority: 'P0',
    stakeholders: ['王总', '李经理'],
    developers: ['张三', '李四']
  },
  { 
    id: '2', 
    name: '渠道合作伙伴招募', 
    description: '招募10家核心渠道伙伴', 
    dimension: 'channel', 
    status: 'ongoing', 
    progress: 40, 
    startDate: '2026-01-13', 
    endDate: '2026-04-15',
    priority: 'P1',
    stakeholders: ['赵总监'],
    developers: ['王五']
  },
  { 
    id: '3', 
    name: 'Q1营销活动', 
    description: '第一季度品牌推广活动', 
    dimension: 'marketing', 
    status: 'ongoing', 
    progress: 80, 
    startDate: '2026-01-06', 
    endDate: '2026-03-15',
    priority: 'P1',
    stakeholders: ['孙经理'],
    developers: ['赵六', '钱七']
  },
  { 
    id: '4', 
    name: '人才招聘计划', 
    description: '招聘20名技术人才', 
    dimension: 'hr', 
    status: 'completed', 
    progress: 100, 
    startDate: '2026-01-06', 
    endDate: '2026-02-28',
    priority: 'P2',
    stakeholders: ['HR总监'],
    developers: ['周八']
  }
]

const defaultProgressLogs: ProgressLog[] = [
  { id: '1', projectId: '1', date: '2026-01-06', description: '项目启动，完成需求调研' },
  { id: '2', projectId: '1', date: '2026-01-13', description: '完成技术方案设计，开始开发' },
  { id: '3', projectId: '1', date: '2026-01-20', description: '核心功能开发完成50%，进行内部测试' }
]

const defaultVersions: Version[] = [
  { id: '1', projectId: '1', versionNumber: 'v1.0', name: 'MVP版本', status: 'released', startDate: '2026-01-06', endDate: '2026-02-15', description: '基础功能上线' },
  { id: '2', projectId: '1', versionNumber: 'v1.1', name: '优化版本', status: 'developing', startDate: '2026-02-16', endDate: '2026-03-30', description: '性能优化和功能增强' }
]

const defaultDemands: Demand[] = [
  { id: '1', title: '增加泰语支持', description: '海外市场需要泰语版本', priority: 'P0', category: '海外平台', creator: '张三', createDate: '2026-01-10', remark: '', images: [], projectId: '1', versionId: '2', scheduleStart: null, scheduleEnd: null, status: 'in_progress' },
  { id: '2', title: '渠道返点系统', description: '为渠道伙伴提供返点计算功能', priority: 'P1', category: '渠道合作伙伴平台', creator: '李四', createDate: '2026-01-12', remark: '', images: [], projectId: '2', versionId: null, scheduleStart: null, scheduleEnd: null, status: 'pending' },
  { id: '3', title: '员工考勤优化', description: 'EHR系统考勤模块功能增强', priority: 'P1', category: 'EHR', creator: '王五', createDate: '2026-01-15', remark: '', images: [], projectId: '4', versionId: null, scheduleStart: null, scheduleEnd: null, status: 'pending' },
  { id: '4', title: '客户录入电话栏添加+86国内区号', description: '客户联系人信息录入时，电话字段需要支持+86国内区号。目前有客户在国内但做出海生意的情况，所有电话栏都需要添加+86选项，因为对接到了国内客户转海外的场景。', priority: 'P1', category: '海外平台', creator: '卜佳雯', createDate: '2026-05-21', remark: '截图中显示目前有SG +65、MY +60、TH +66、ID +62、PH +63、VN +84、MM +95、KH +855等区号，但缺少CN +86', images: [], projectId: null, versionId: null, scheduleStart: null, scheduleEnd: null, status: 'pending' }
]

// 蛇形命名 -> 驼峰命名
function fromSnakeCase(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(fromSnakeCase)
  }
  if (obj && typeof obj === 'object') {
    const result: any = {}
    for (const key in obj) {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
      result[camelKey] = fromSnakeCase(obj[key])
    }
    return result
  }
  return obj
}

// 驼峰命名 -> 蛇形命名
function toSnakeCase(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(toSnakeCase)
  }
  if (obj && typeof obj === 'object') {
    const result: any = {}
    for (const key in obj) {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
      result[snakeKey] = toSnakeCase(obj[key])
    }
    return result
  }
  return obj
}

async function loadFromSupabase() {
  try {
    // 尝试从 Supabase 加载
    const [{ data: projectsData }, { data: versionsData }, { data: demandsData }, { data: logsData }] = await Promise.all([
      supabase.from('projects').select('*').order('id'),
      supabase.from('versions').select('*').order('id'),
      supabase.from('demands').select('*').order('id'),
      supabase.from('progress_logs').select('*').order('id')
    ])

    if (projectsData && projectsData.length > 0) {
      return {
        projects: fromSnakeCase(projectsData) as Project[],
        versions: fromSnakeCase(versionsData || []) as Version[],
        demands: fromSnakeCase(demandsData || []) as Demand[],
        progressLogs: fromSnakeCase(logsData || []) as ProgressLog[]
      }
    }
  } catch (e) {
    console.error('Failed to load from Supabase:', e)
  }

  // 如果 Supabase 为空或失败，使用默认数据并保存到 Supabase
  await saveAllToSupabase(defaultProjects, defaultProgressLogs, defaultVersions, defaultDemands)
  
  return {
    projects: defaultProjects,
    progressLogs: defaultProgressLogs,
    versions: defaultVersions,
    demands: defaultDemands
  }
}

async function saveAllToSupabase(
  projects: Project[], 
  progressLogs: ProgressLog[], 
  versions: Version[], 
  demands: Demand[]
) {
  try {
    // 按顺序写入：先写没有外键依赖的表
    await supabase.from('projects').upsert(toSnakeCase(projects))
    await supabase.from('versions').upsert(toSnakeCase(versions))
    await supabase.from('demands').upsert(toSnakeCase(demands))
    await supabase.from('progress_logs').upsert(toSnakeCase(progressLogs))
    
    // 同时保存到 localStorage 作为备用
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ projects, progressLogs, versions, demands }))
  } catch (e) {
    console.error('Failed to save to Supabase:', e)
    // 降级到 localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ projects, progressLogs, versions, demands }))
  }
}

// 自动生成下一个版本号
function generateNextVersion(existingVersions: Version[]): string {
  if (existingVersions.length === 0) return 'v1.0'
  
  const latest = existingVersions
    .filter(v => v.versionNumber.match(/^v\d+\.\d+$/))
    .sort((a, b) => {
      const [aMajor, aMinor] = a.versionNumber.replace('v', '').split('.').map(Number)
      const [bMajor, bMinor] = b.versionNumber.replace('v', '').split('.').map(Number)
      if (aMajor !== bMajor) return bMajor - aMajor
      return bMinor - aMinor
    })[0]
  
  if (!latest) return 'v1.0'
  
  const [major, minor] = latest.versionNumber.replace('v', '').split('.').map(Number)
  return `v${major}.${minor + 1}`
}

export const useProjectStore = defineStore('project', () => {
  const projects = ref<Project[]>([])
  const progressLogs = ref<ProgressLog[]>([])
  const versions = ref<Version[]>([])
  const demands = ref<Demand[]>([])
  const isLoading = ref(true)
  const alerts = ref<Array<{ id: string; projectId: string; message: string; level: string }>>([])

  const dimensions = [
    { key: 'overseas', label: '海外', icon: 'HW' },
    { key: 'channel', label: '渠道', icon: 'QD' },
    { key: 'marketing', label: '营销', icon: 'YX' },
    { key: 'hr', label: 'HR', icon: 'HR' }
  ]

  // 初始化加载数据
  async function init() {
    isLoading.value = true
    const data = await loadFromSupabase()
    projects.value = data.projects
    progressLogs.value = data.progressLogs
    versions.value = data.versions
    demands.value = data.demands
    isLoading.value = false
  }

  // 获取项目的所有版本
  const getVersionsByProject = (projectId: string) => {
    return computed(() => versions.value
      .filter(v => v.projectId === projectId)
      .sort((a, b) => {
        const [aMajor, aMinor] = a.versionNumber.replace('v', '').split('.').map(Number)
        const [bMajor, bMinor] = b.versionNumber.replace('v', '').split('.').map(Number)
        if (aMajor !== bMajor) return bMajor - aMajor
        return bMinor - aMinor
      })
    )
  }

  // 获取版本关联的需求数
  const getDemandCountByVersion = (versionId: string) => {
    return computed(() => demands.value.filter(d => d.versionId === versionId).length)
  }

  // 获取项目的进度日志
  const getProgressLogsByProject = (projectId: string) => {
    return computed(() => progressLogs.value
      .filter(l => l.projectId === projectId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    )
  }

  // 添加进度日志
  const addProgressLog = async (log: Omit<ProgressLog, 'id'>) => {
    const newLog: ProgressLog = {
      ...log,
      id: Date.now().toString()
    }
    progressLogs.value.push(newLog)
    await saveAllToSupabase(projects.value, progressLogs.value, versions.value, demands.value)
    return newLog
  }

  // 删除进度日志
  const deleteProgressLog = async (id: string) => {
    progressLogs.value = progressLogs.value.filter(l => l.id !== id)
    await supabase.from('progress_logs').delete().eq('id', id)
    await saveAllToSupabase(projects.value, progressLogs.value, versions.value, demands.value)
  }

  // 添加版本
  const addVersion = async (version: Omit<Version, 'id'>) => {
    const newVersion: Version = {
      ...version,
      id: Date.now().toString()
    }
    versions.value.push(newVersion)
    await saveAllToSupabase(projects.value, progressLogs.value, versions.value, demands.value)
    return newVersion
  }

  // 更新版本
  const updateVersion = async (id: string, updates: Partial<Version>) => {
    const index = versions.value.findIndex(v => v.id === id)
    if (index > -1) {
      versions.value[index] = { ...versions.value[index], ...updates }
      await saveAllToSupabase(projects.value, progressLogs.value, versions.value, demands.value)
    }
  }

  // 删除版本（解绑关联需求）
  const deleteVersion = async (id: string) => {
    versions.value = versions.value.filter(v => v.id !== id)
    // 解绑关联的需求
    demands.value.forEach(demand => {
      if (demand.versionId === id) {
        demand.versionId = null
      }
    })
    await supabase.from('versions').delete().eq('id', id)
    await saveAllToSupabase(projects.value, progressLogs.value, versions.value, demands.value)
  }

  // 版本状态流转
  const advanceVersionStatus = async (id: string) => {
    const version = versions.value.find(v => v.id === id)
    if (!version) return
    
    const flow: Record<string, string> = {
      planning: 'developing',
      developing: 'testing',
      testing: 'released'
    }
    
    const nextStatus = flow[version.status]
    if (nextStatus) {
      await updateVersion(id, { status: nextStatus as Version['status'] })
      
      // 如果版本发布，自动完成关联需求
      if (nextStatus === 'released') {
        demands.value.forEach(demand => {
          if (demand.versionId === id) {
            demand.status = 'completed'
          }
        })
        await saveAllToSupabase(projects.value, progressLogs.value, versions.value, demands.value)
      }
    }
  }

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

  const addProject = async (project: Omit<Project, 'id'>) => {
    const newProject: Project = {
      ...project,
      id: Date.now().toString()
    }
    projects.value.push(newProject)
    await saveAllToSupabase(projects.value, progressLogs.value, versions.value, demands.value)
    return newProject
  }

  const updateProject = async (id: string, updates: Partial<Project>) => {
    const index = projects.value.findIndex(p => p.id === id)
    if (index > -1) {
      projects.value[index] = { ...projects.value[index], ...updates }
      await saveAllToSupabase(projects.value, progressLogs.value, versions.value, demands.value)
    }
  }

  const deleteProject = async (id: string) => {
    projects.value = projects.value.filter(p => p.id !== id)
    versions.value = versions.value.filter(v => v.projectId !== id)
    demands.value = demands.value.filter(d => d.projectId !== id)
    progressLogs.value = progressLogs.value.filter(l => l.projectId !== id)
    await supabase.from('projects').delete().eq('id', id)
    await saveAllToSupabase(projects.value, progressLogs.value, versions.value, demands.value)
  }

  const addDemand = async (demand: Omit<Demand, 'id' | 'status'>) => {
    const newDemand: Demand = {
      ...demand,
      id: Date.now().toString(),
      status: 'pending'
    }
    demands.value.push(newDemand)
    await saveAllToSupabase(projects.value, progressLogs.value, versions.value, demands.value)
    return newDemand
  }

  const updateDemand = async (id: string, updates: Partial<Demand>) => {
    const index = demands.value.findIndex(d => d.id === id)
    if (index > -1) {
      demands.value[index] = { ...demands.value[index], ...updates }
      await saveAllToSupabase(projects.value, progressLogs.value, versions.value, demands.value)
    }
  }

  const deleteDemand = async (id: string) => {
    demands.value = demands.value.filter(d => d.id !== id)
    await supabase.from('demands').delete().eq('id', id)
    await saveAllToSupabase(projects.value, progressLogs.value, versions.value, demands.value)
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

    alerts.value = newAlerts
    return newAlerts
  }

  const exportData = () => {
    return JSON.stringify({ projects: projects.value, progressLogs: progressLogs.value, versions: versions.value, demands: demands.value }, null, 2)
  }

  const importData = async (json: string) => {
    try {
      const data = JSON.parse(json)
      if (data.projects) projects.value = data.projects
      if (data.progressLogs) progressLogs.value = data.progressLogs
      if (data.versions) versions.value = data.versions
      if (data.demands) demands.value = data.demands
      await saveAllToSupabase(projects.value, progressLogs.value, versions.value, demands.value)
      return true
    } catch (e) {
      return false
    }
  }

  return {
    projects,
    progressLogs,
    versions,
    demands,
    isLoading,
    alerts,
    dimensions,
    init,
    getVersionsByProject,
    getDemandCountByVersion,
    getProgressLogsByProject,
    addProgressLog,
    deleteProgressLog,
    addVersion,
    updateVersion,
    deleteVersion,
    advanceVersionStatus,
    generateNextVersion,
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