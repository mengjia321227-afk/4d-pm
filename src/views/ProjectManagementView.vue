<template>
  <div class="project-management">
    <!-- 页面标题 -->
    <div class="page-header">
      <div>
        <h1>项目管理</h1>
        <p class="subtitle">管理海外、渠道、营销、HR四个维度的所有项目</p>
      </div>
      <button class="btn-primary" @click="showAddProject = true">+ 新建项目</button>
    </div>

    <!-- 维度切换标签 -->
    <div class="dimension-tabs">
      <button
        v-for="dim in store.dimensions"
        :key="dim.key"
        class="tab-btn"
        :class="{ active: currentDimension === dim.key }"
        @click="currentDimension = dim.key"
      >
        {{ dim.label }}
        <span class="tab-count">{{ getProjectCount(dim.key) }}</span>
      </button>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">{{ stats.total }}</div>
        <div class="stat-label">总项目</div>
      </div>
      <div class="stat-card ongoing">
        <div class="stat-value">{{ stats.ongoing }}</div>
        <div class="stat-label">进行中</div>
      </div>
      <div class="stat-card completed">
        <div class="stat-value">{{ stats.completed }}</div>
        <div class="stat-label">已完成</div>
      </div>
      <div class="stat-card delayed">
        <div class="stat-value">{{ stats.delayed }}</div>
        <div class="stat-label">已延期</div>
      </div>
    </div>

    <!-- 视图切换 -->
    <div class="view-toggle">
      <button
        class="toggle-btn"
        :class="{ active: viewMode === 'card' }"
        @click="viewMode = 'card'"
      >
        项目看板
      </button>
      <button
        class="toggle-btn"
        :class="{ active: viewMode === 'gantt' }"
        @click="viewMode = 'gantt'"
      >
        甘特图
      </button>
    </div>

    <!-- 项目看板视图 -->
    <div v-if="viewMode === 'card'" class="projects-grid">
      <div
        v-for="project in projects"
        :key="project.id"
        class="project-card"
        :class="project.status"
      >
        <div class="card-header">
          <div class="card-title">{{ project.name }}</div>
          <div class="header-tags">
            <span class="priority-tag" :class="project.priority">{{ project.priority }}</span>
            <span class="status-badge" :class="project.status">{{ statusText(project.status) }}</span>
          </div>
        </div>
        
        <p class="card-desc">{{ project.description }}</p>
        
        <!-- 干系人和开发人员 -->
        <div class="project-people">
          <div v-if="project.stakeholders && project.stakeholders.length > 0" class="people-group">
            <span class="people-label">干系人:</span>
            <span v-for="(person, idx) in project.stakeholders" :key="idx" class="people-tag">{{ person }}</span>
          </div>
          <div v-if="project.developers && project.developers.length > 0" class="people-group">
            <span class="people-label">开发人员:</span>
            <span v-for="(person, idx) in project.developers" :key="idx" class="people-tag dev">{{ person }}</span>
          </div>
        </div>
        
        <div class="progress-section">
          <div class="progress-header">
            <span>进度</span>
            <span class="progress-value">{{ project.progress }}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: project.progress + '%' }"></div>
          </div>
        </div>
        
        <!-- 最新进度描述 -->
        <div v-if="getLatestProgressLog(project.id)" class="latest-progress">
          <div class="progress-log-header">
            <span class="progress-log-label">最新进展</span>
            <span class="progress-log-date">{{ getLatestProgressLog(project.id)?.date }}</span>
          </div>
          <p class="progress-log-content">{{ getLatestProgressLog(project.id)?.description }}</p>
        </div>
        
        <div class="card-meta">
          <div class="meta-item">
            <span class="meta-label">截止日期</span>
            <span>{{ project.endDate }}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">关联需求</span>
            <span>{{ getDemandCount(project.id) }}个</span>
          </div>
        </div>
        
        <div class="card-actions">
          <button class="btn-text" @click="openProgressLog(project)">进度日志</button>
          <button class="btn-text" @click="editProject(project)">编辑</button>
          <button class="btn-text" @click="deleteProject(project.id)">删除</button>
        </div>
        
        <!-- 版本管理 -->
        <div class="version-section">
          <div class="version-header">
            <span class="version-title">版本管理</span>
            <button class="btn-text-small" @click="openVersionModal(project)">+ 新建版本</button>
          </div>
          <div class="version-list">
            <div
              v-for="version in getProjectVersions(project.id)"
              :key="version.id"
              class="version-item"
              :class="version.status"
            >
              <div class="version-info">
                <span class="version-number">{{ version.versionNumber }}</span>
                <span class="version-name">{{ version.name }}</span>
                <span class="version-status-badge" :class="version.status">{{ versionStatusText(version.status) }}</span>
              </div>
              <div class="version-meta">
                <span>{{ version.startDate }} ~ {{ version.endDate }}</span>
                <span class="version-demand-count clickable" @click="viewVersionDemands(version)">{{ getVersionDemandCount(version.id) }}个需求</span>
              </div>
              <div class="version-actions">
                <button
                  v-if="version.status !== 'released' && version.status !== 'deprecated'"
                  class="btn-text-small"
                  @click="advanceVersion(version.id)"
                >
                  {{ getNextActionText(version.status) }}
                </button>
                <button class="btn-text-small" @click="viewVersionDemands(version)">查看需求</button>
                <button class="btn-text-small" @click="editVersion(version)">编辑</button>
                <button class="btn-text-small danger" @click="deleteVersion(version.id)">删除</button>
              </div>
            </div>
            <div v-if="getProjectVersions(project.id).length === 0" class="version-empty">
              暂无版本
            </div>
          </div>
        </div>
      </div>
      
      <!-- 空状态 -->
      <div v-if="projects.length === 0" class="empty-state">
        <div class="empty-icon">[空]</div>
        <p>该维度下暂无项目</p>
        <button class="btn-primary" @click="showAddProject = true">创建第一个项目</button>
      </div>
    </div>

    <!-- 甘特图视图 -->
    <div v-else class="gantt-container">
      <div class="gantt-header">
        <div class="gantt-project-col">项目 / 版本</div>
        <div class="gantt-timeline">
          <div
            v-for="week in weeks"
            :key="week"
            class="gantt-week-header"
            :class="{ current: isCurrentWeek(week) }"
          >
            {{ week }}
          </div>
        </div>
      </div>

      <div class="gantt-body">
        <template v-for="project in projects" :key="project.id">
          <!-- 项目行 -->
          <div class="gantt-row project-row">
            <div class="gantt-project-col">
              <div class="project-name">{{ project.name }}</div>
              <div class="project-progress">{{ project.progress }}%</div>
            </div>
            
            <div class="gantt-timeline">
              <div
                v-for="week in weeks"
                :key="week"
                class="gantt-week-cell"
                :class="{ 
                  active: isWeekInRange(project, week),
                  completed: isWeekCompleted(project, week),
                  delayed: project.status === 'delayed'
                }"
              >
                <div
                  v-if="isWeekInRange(project, week)"
                  class="gantt-bar"
                  :style="getBarStyle(project, week)"
                ></div>
              </div>
            </div>
          </div>
          
          <!-- 版本行 -->
          <div
            v-for="version in getProjectVersions(project.id)"
            :key="version.id"
            class="gantt-row version-row"
          >
            <div class="gantt-project-col version-col">
              <div class="version-indent"></div>
              <div class="version-info-gantt">
                <div class="version-name-gantt">{{ version.versionNumber }} {{ version.name }}</div>
                <div class="version-status-gantt" :class="version.status">{{ versionStatusText(version.status) }}</div>
              </div>
            </div>
            
            <div class="gantt-timeline">
              <div
                v-for="week in weeks"
                :key="week"
                class="gantt-week-cell"
                :class="{ active: isVersionWeekInRange(version, week) }"
              >
                <div
                  v-if="isVersionWeekInRange(version, week)"
                  class="gantt-bar version-bar"
                  :class="version.status"
                ></div>
              </div>
            </div>
          </div>
        </template>

        <div v-if="projects.length === 0" class="empty-state">
          <p>该维度下暂无项目</p>
        </div>
      </div>
    </div>

    <!-- 进度日志弹窗 -->
    <div v-if="showProgressLogModal" class="modal-overlay" @click="showProgressLogModal = false">
      <div class="modal modal-large" @click.stop>
        <h2>进度日志 - {{ progressLogProject?.name }}</h2>
        
        <!-- 添加新日志 -->
        <div class="progress-log-form">
          <div class="form-row">
            <div class="form-group">
              <label>日期</label>
              <input v-model="progressLogForm.date" type="date">
            </div>
          </div>
          <div class="form-group">
            <label>进度描述</label>
            <textarea v-model="progressLogForm.description" placeholder="记录本周进展、遇到的问题、下周计划..."></textarea>
          </div>
          <button class="btn-primary" @click="addProgressLogEntry">添加记录</button>
        </div>
        
        <!-- 历史记录 -->
        <div class="progress-log-history">
          <h3>历史记录</h3>
          <div v-if="progressLogProject && store.getProgressLogsByProject(progressLogProject.id).value.length === 0" class="log-empty">
            暂无进度记录
          </div>
          <div 
            v-for="log in progressLogProject ? store.getProgressLogsByProject(progressLogProject.id).value : []" 
            :key="log.id"
            class="log-item"
          >
            <div class="log-header">
              <span class="log-date">{{ log.date }}</span>
              <button class="btn-text-small danger" @click="deleteLog(log.id)">删除</button>
            </div>
            <p class="log-content">{{ log.description }}</p>
          </div>
        </div>
        
        <div class="modal-actions">
          <button class="btn-secondary" @click="showProgressLogModal = false">关闭</button>
        </div>
      </div>
    </div>
    
    <!-- 添加/编辑项目弹窗 -->
    <div v-if="showAddProject" class="modal-overlay" @click="showAddProject = false">
      <div class="modal" @click.stop>
        <h2>{{ editingProject ? '编辑项目' : '新建项目' }}</h2>
        
        <div class="form-group">
          <label>项目名称</label>
          <input v-model="projectForm.name" type="text" placeholder="输入项目名称">
        </div>
        
        <div class="form-group">
          <label>所属维度</label>
          <select v-model="projectForm.dimension">
            <option v-for="dim in store.dimensions" :key="dim.key" :value="dim.key">
              {{ dim.label }}
            </option>
          </select>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label>优先级</label>
            <select v-model="projectForm.priority">
              <option value="P0">P0</option>
              <option value="P1">P1</option>
              <option value="P2">P2</option>
            </select>
          </div>
          <div class="form-group">
            <label>当前进度 (%)</label>
            <input v-model.number="projectForm.progress" type="number" min="0" max="100">
          </div>
        </div>
        
        <div class="form-group">
          <label>项目描述</label>
          <textarea v-model="projectForm.description" placeholder="输入项目描述"></textarea>
        </div>
        
        <div class="form-group">
          <label>干系人（用逗号分隔）</label>
          <input v-model="stakeholdersInput" type="text" placeholder="如：张三, 李四, 王总">
        </div>
        
        <div class="form-group">
          <label>开发人员（用逗号分隔）</label>
          <input v-model="developersInput" type="text" placeholder="如：张三, 李四">
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label>开始日期</label>
            <input v-model="projectForm.startDate" type="date">
          </div>
          <div class="form-group">
            <label>截止日期</label>
            <input v-model="projectForm.endDate" type="date">
          </div>
        </div>
        
        <div class="modal-actions">
          <button class="btn-secondary" @click="showAddProject = false">取消</button>
          <button class="btn-primary" @click="saveProject">保存</button>
        </div>
      </div>
    </div>
    
    <!-- 版本管理弹窗 -->
    <div v-if="showVersionModal" class="modal-overlay" @click="showVersionModal = false">
      <div class="modal" @click.stop>
        <h2>{{ editingVersion ? '编辑版本' : '新建版本' }}</h2>
        
        <div class="form-group">
          <label>版本号</label>
          <div class="version-input-group">
            <input v-model="versionForm.versionNumber" type="text" placeholder="如：v1.0">
            <button class="btn-text" @click="autoGenerateVersion">自动生成</button>
          </div>
        </div>
        
        <div class="form-group">
          <label>版本名称</label>
          <input v-model="versionForm.name" type="text" placeholder="输入版本名称">
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label>开始日期</label>
            <input v-model="versionForm.startDate" type="date">
          </div>
          <div class="form-group">
            <label>截止日期</label>
            <input v-model="versionForm.endDate" type="date">
          </div>
        </div>
        
        <div class="form-group">
          <label>版本描述</label>
          <textarea v-model="versionForm.description" placeholder="输入版本描述"></textarea>
        </div>
        
        <div class="modal-actions">
          <button class="btn-secondary" @click="showVersionModal = false">取消</button>
          <button class="btn-primary" @click="saveVersion">保存</button>
        </div>
      </div>
    </div>
    
    <!-- 版本关联需求详情弹窗 -->
    <div v-if="showVersionDemandsModal" class="modal-overlay" @click="showVersionDemandsModal = false">
      <div class="modal modal-large" @click.stop>
        <div class="modal-header">
          <div>
            <h2>{{ selectedVersionForDemands?.versionNumber }} {{ selectedVersionForDemands?.name }}</h2>
            <p class="modal-subtitle">共 {{ versionDemands.length }} 个关联需求</p>
          </div>
          <button class="btn-secondary" @click="showVersionDemandsModal = false">关闭</button>
        </div>
        
        <div v-if="versionDemands.length === 0" class="empty-state small">
          <p>暂无关联需求</p>
        </div>
        
        <div v-else class="version-demands-list">
          <div 
            v-for="demand in versionDemands" 
            :key="demand.id" 
            class="demand-detail-card"
          >
            <div class="demand-detail-header">
              <div class="demand-detail-title">{{ demand.title }}</div>
              <div class="demand-detail-tags">
                <span class="priority-badge" :class="demand.priority">{{ demand.priority }}</span>
                <span class="category-badge">{{ demand.category }}</span>
                <span class="status-badge" :class="demand.status">{{ demandStatusText(demand.status) }}</span>
              </div>
            </div>
            
            <div class="demand-detail-meta">
              <div class="meta-row">
                <span class="meta-label">提出人</span>
                <span>{{ demand.creator }}</span>
              </div>
              <div class="meta-row">
                <span class="meta-label">提出时间</span>
                <span>{{ demand.createDate }}</span>
              </div>
            </div>
            
            <div class="demand-detail-section">
              <div class="section-label">需求描述</div>
              <p class="section-content">{{ demand.description || '暂无描述' }}</p>
            </div>
            
            <div v-if="demand.remark" class="demand-detail-section">
              <div class="section-label">备注</div>
              <p class="section-content">{{ demand.remark }}</p>
            </div>
            
            <div v-if="demand.images && demand.images.length > 0" class="demand-detail-section">
              <div class="section-label">需求截图 ({{ demand.images.length }}张)</div>
              <div class="demand-images">
                <img 
                  v-for="(img, idx) in demand.images" 
                  :key="idx" 
                  :src="img" 
                  class="demand-image-thumb"
                  @click="previewImage = img; showImagePreview = true"
                >
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 图片预览弹窗 -->
    <div v-if="showImagePreview" class="modal-overlay" @click="showImagePreview = false">
      <div class="image-preview-modal" @click.stop>
        <img :src="previewImage" class="preview-image">
        <button class="close-preview" @click="showImagePreview = false">×</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useProjectStore } from '../stores/projectStore'

const store = useProjectStore()

const currentDimension = ref('overseas')
const viewMode = ref('card')

const projects = computed(() => 
  store.projects.filter(p => p.dimension === currentDimension.value)
)

const stats = computed(() => {
  const dimProjects = projects.value
  return {
    total: dimProjects.length,
    ongoing: dimProjects.filter(p => p.status === 'ongoing').length,
    completed: dimProjects.filter(p => p.status === 'completed').length,
    delayed: dimProjects.filter(p => p.status === 'delayed').length
  }
})

const getProjectCount = (dimension: string) => {
  return store.projects.filter(p => p.dimension === dimension).length
}

const statusText = (status: string) => {
  const map: Record<string, string> = {
    ongoing: '进行中',
    completed: '已完成',
    delayed: '已延期'
  }
  return map[status] || status
}

const getDemandCount = (projectId: string) => {
  return store.demands.filter(d => d.projectId === projectId).length
}

// 甘特图相关
const weeks = computed(() => {
  const weekList: string[] = []
  const today = new Date()
  const startOfYear = new Date(today.getFullYear(), 0, 1)
  
  for (let i = 0; i < 26; i++) {
    const weekStart = new Date(startOfYear)
    weekStart.setDate(startOfYear.getDate() + i * 7)
    const month = weekStart.getMonth() + 1
    const day = weekStart.getDate()
    weekList.push(`${month}/${day}`)
  }
  
  return weekList
})

const isCurrentWeek = (weekLabel: string) => {
  const today = new Date()
  const startOfYear = new Date(today.getFullYear(), 0, 1)
  const currentWeek = Math.floor((today.getTime() - startOfYear.getTime()) / (7 * 24 * 60 * 60 * 1000))
  const weekIndex = weeks.value.indexOf(weekLabel)
  return weekIndex === currentWeek
}

const isWeekInRange = (project: any, weekLabel: string) => {
  const weekIndex = weeks.value.indexOf(weekLabel)
  const projectStart = new Date(project.startDate)
  const projectEnd = new Date(project.endDate)
  const startOfYear = new Date(new Date().getFullYear(), 0, 1)
  
  const weekStart = new Date(startOfYear)
  weekStart.setDate(startOfYear.getDate() + weekIndex * 7)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)
  
  return weekStart <= projectEnd && weekEnd >= projectStart
}

const isWeekCompleted = (project: any, weekLabel: string) => {
  if (project.status === 'completed') return true
  const weekIndex = weeks.value.indexOf(weekLabel)
  const projectStart = new Date(project.startDate)
  const startOfYear = new Date(new Date().getFullYear(), 0, 1)
  const weekStart = new Date(startOfYear)
  weekStart.setDate(startOfYear.getDate() + weekIndex * 7)
  
  const totalDuration = new Date(project.endDate).getTime() - projectStart.getTime()
  const elapsed = weekStart.getTime() - projectStart.getTime()
  const expectedProgress = totalDuration > 0 ? (elapsed / totalDuration) * 100 : 0
  
  return project.progress >= expectedProgress
}

const getBarStyle = (project: any, weekLabel: string) => {
  const weekIndex = weeks.value.indexOf(weekLabel)
  const projectStart = new Date(project.startDate)
  const projectEnd = new Date(project.endDate)
  const startOfYear = new Date(new Date().getFullYear(), 0, 1)
  
  const weekStart = new Date(startOfYear)
  weekStart.setDate(startOfYear.getDate() + weekIndex * 7)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)
  
  let opacity = 1
  if (project.status === 'completed') {
    opacity = 1
  } else if (project.status === 'delayed') {
    opacity = 0.7
  } else {
    const elapsed = weekStart.getTime() - projectStart.getTime()
    const totalDuration = projectEnd.getTime() - projectStart.getTime()
    const expectedProgress = totalDuration > 0 ? (elapsed / totalDuration) * 100 : 0
    opacity = project.progress >= expectedProgress ? 1 : 0.5
  }
  
  return { opacity }
}

// 版本甘特图相关函数
const isVersionWeekInRange = (version: any, weekLabel: string) => {
  const weekIndex = weeks.value.indexOf(weekLabel)
  const versionStart = new Date(version.startDate)
  const versionEnd = new Date(version.endDate)
  const startOfYear = new Date(new Date().getFullYear(), 0, 1)
  
  const weekStart = new Date(startOfYear)
  weekStart.setDate(startOfYear.getDate() + weekIndex * 7)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)
  
  return weekStart <= versionEnd && weekEnd >= versionStart
}

// 项目表单
const showAddProject = ref(false)
const editingProject = ref<string | null>(null)
const stakeholdersInput = ref('')
const developersInput = ref('')

const projectForm = ref({
  name: '',
  dimension: 'overseas',
  description: '',
  priority: 'P1' as 'P0' | 'P1' | 'P2',
  startDate: new Date().toISOString().split('T')[0],
  endDate: '',
  progress: 0
})

const editProject = (project: any) => {
  editingProject.value = project.id
  projectForm.value = {
    name: project.name,
    dimension: project.dimension,
    description: project.description,
    priority: project.priority || 'P1',
    startDate: project.startDate,
    endDate: project.endDate,
    progress: project.progress
  }
  stakeholdersInput.value = (project.stakeholders || []).join(', ')
  developersInput.value = (project.developers || []).join(', ')
  showAddProject.value = true
}

const saveProject = () => {
  if (!projectForm.value.name || !projectForm.value.endDate) {
    alert('请填写完整信息')
    return
  }

  const today = new Date().toISOString().split('T')[0]
  let status: 'ongoing' | 'completed' | 'delayed' = 'ongoing'
  
  if (projectForm.value.progress >= 100) {
    status = 'completed'
  } else if (projectForm.value.endDate < today && projectForm.value.progress < 100) {
    status = 'delayed'
  }

  const stakeholders = stakeholdersInput.value
    .split(/[,，]/)
    .map(s => s.trim())
    .filter(s => s.length > 0)
  
  const developers = developersInput.value
    .split(/[,，]/)
    .map(s => s.trim())
    .filter(s => s.length > 0)

  if (editingProject.value) {
    store.updateProject(editingProject.value, {
      ...projectForm.value,
      status,
      stakeholders,
      developers
    })
  } else {
    store.addProject({
      ...projectForm.value,
      status,
      stakeholders,
      developers
    })
  }

  showAddProject.value = false
  editingProject.value = null
  stakeholdersInput.value = ''
  developersInput.value = ''
  projectForm.value = {
    name: '',
    dimension: 'overseas',
    description: '',
    priority: 'P1',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    progress: 0
  }
}

const deleteProject = (id: string) => {
  if (confirm('确定要删除这个项目吗？关联的需求也会被删除。')) {
    store.deleteProject(id)
  }
}

// 进度日志
const showProgressLogModal = ref(false)
const progressLogProject = ref<any>(null)
const progressLogForm = ref({
  date: new Date().toISOString().split('T')[0],
  description: ''
})

const getLatestProgressLog = (projectId: string) => {
  const logs = store.getProgressLogsByProject(projectId).value
  return logs.length > 0 ? logs[0] : null
}

const openProgressLog = (project: any) => {
  progressLogProject.value = project
  progressLogForm.value = {
    date: new Date().toISOString().split('T')[0],
    description: ''
  }
  showProgressLogModal.value = true
}

const addProgressLogEntry = () => {
  if (!progressLogForm.value.description) {
    alert('请填写进度描述')
    return
  }
  
  store.addProgressLog({
    projectId: progressLogProject.value.id,
    date: progressLogForm.value.date,
    description: progressLogForm.value.description
  })
  
  progressLogForm.value = {
    date: new Date().toISOString().split('T')[0],
    description: ''
  }
}

const deleteLog = (logId: string) => {
  if (confirm('确定要删除这条进度记录吗？')) {
    store.deleteProgressLog(logId)
  }
}

watch(() => currentDimension.value, () => {
  store.checkDelays()
}, { immediate: true })

// 版本管理
const showVersionModal = ref(false)
const editingVersion = ref<string | null>(null)
const currentProjectId = ref('')

const versionForm = ref({
  versionNumber: '',
  name: '',
  startDate: new Date().toISOString().split('T')[0],
  endDate: '',
  description: ''
})

// 版本关联需求查看
const showVersionDemandsModal = ref(false)
const selectedVersionForDemands = ref<any>(null)
const showImagePreview = ref(false)
const previewImage = ref('')

const versionDemands = computed(() => {
  if (!selectedVersionForDemands.value) return []
  return store.demands
    .filter(d => d.versionId === selectedVersionForDemands.value.id)
    .sort((a, b) => {
      const priorityOrder: Record<string, number> = { P0: 0, P1: 1, P2: 2 }
      return (priorityOrder[a.priority] || 999) - (priorityOrder[b.priority] || 999)
    })
})

const viewVersionDemands = (version: any) => {
  selectedVersionForDemands.value = version
  showVersionDemandsModal.value = true
}

const demandStatusText = (status: string) => {
  const map: Record<string, string> = {
    pending: '待处理',
    scheduled: '已排期',
    in_progress: '进行中',
    completed: '已完成'
  }
  return map[status] || status
}

const getProjectVersions = (projectId: string) => {
  return store.versions
    .filter(v => v.projectId === projectId)
    .sort((a, b) => {
      const [aMajor, aMinor] = a.versionNumber.replace('v', '').split('.').map(Number)
      const [bMajor, bMinor] = b.versionNumber.replace('v', '').split('.').map(Number)
      if (aMajor !== bMajor) return bMajor - aMajor
      return bMinor - aMinor
    })
}

const getVersionDemandCount = (versionId: string) => {
  return store.demands.filter(d => d.versionId === versionId).length
}

const versionStatusText = (status: string) => {
  const map: Record<string, string> = {
    planning: '规划中',
    developing: '开发中',
    testing: '测试中',
    released: '已发布',
    deprecated: '已废弃'
  }
  return map[status] || status
}

const getNextActionText = (status: string) => {
  const map: Record<string, string> = {
    planning: '开始开发',
    developing: '开始测试',
    testing: '发布版本'
  }
  return map[status] || '推进'
}

const openVersionModal = (project: any) => {
  currentProjectId.value = project.id
  editingVersion.value = null
  versionForm.value = {
    versionNumber: store.generateNextVersion(getProjectVersions(project.id)),
    name: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    description: ''
  }
  showVersionModal.value = true
}

const autoGenerateVersion = () => {
  const projectVersions = getProjectVersions(currentProjectId.value)
  versionForm.value.versionNumber = store.generateNextVersion(projectVersions)
}

const editVersion = (version: any) => {
  currentProjectId.value = version.projectId
  editingVersion.value = version.id
  versionForm.value = {
    versionNumber: version.versionNumber,
    name: version.name,
    startDate: version.startDate,
    endDate: version.endDate,
    description: version.description
  }
  showVersionModal.value = true
}

const saveVersion = () => {
  if (!versionForm.value.versionNumber || !versionForm.value.name) {
    alert('请填写版本号和名称')
    return
  }

  // 验证版本号格式
  if (!versionForm.value.versionNumber.match(/^v\d+\.\d+$/)) {
    alert('版本号格式应为 v1.0 或 v1.1')
    return
  }

  if (editingVersion.value) {
    store.updateVersion(editingVersion.value, {
      ...versionForm.value,
      projectId: currentProjectId.value
    })
  } else {
    store.addVersion({
      ...versionForm.value,
      projectId: currentProjectId.value,
      status: 'planning'
    })
  }

  showVersionModal.value = false
  editingVersion.value = null
  versionForm.value = {
    versionNumber: '',
    name: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    description: ''
  }
}

const deleteVersion = (id: string) => {
  if (confirm('确定要删除这个版本吗？关联的需求将取消版本关联。')) {
    store.deleteVersion(id)
  }
}

const advanceVersion = (id: string) => {
  const version = store.versions.find(v => v.id === id)
  if (version && version.status === 'testing') {
    if (confirm('发布版本将自动完成所有关联需求，确定继续吗？')) {
      store.advanceVersionStatus(id)
    }
  } else {
    store.advanceVersionStatus(id)
  }
}
</script>

<style scoped>
.project-management {
  max-width: 1400px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-header h1 {
  font-size: 28px;
  font-weight: 700;
  color: #1a1a2e;
}

.subtitle {
  color: #8c8c8c;
  margin-top: 4px;
}

.btn-primary {
  padding: 10px 20px;
  background: #3b71ee;
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-primary:hover {
  background: #2d5dd9;
}

.btn-secondary {
  padding: 10px 20px;
  background: #f0f0f0;
  color: #333;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
}

/* 维度标签 */
.dimension-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  background: #fff;
  padding: 8px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.tab-btn {
  padding: 10px 20px;
  background: transparent;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  color: #666;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.tab-btn:hover {
  background: #f5f5f5;
}

.tab-btn.active {
  background: #3b71ee;
  color: #fff;
}

.tab-count {
  background: rgba(255,255,255,0.2);
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 600;
}

/* 统计卡片 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: #fff;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  border-left: 4px solid #3b71ee;
}

.stat-card.ongoing {
  border-left-color: #3b71ee;
}

.stat-card.completed {
  border-left-color: #1DB969;
}

.stat-card.delayed {
  border-left-color: #F53C3C;
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  color: #1a1a2e;
}

.stat-label {
  color: #8c8c8c;
  font-size: 14px;
  margin-top: 4px;
}

/* 视图切换 */
.view-toggle {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
}

.toggle-btn {
  padding: 8px 16px;
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  color: #666;
  transition: all 0.2s;
}

.toggle-btn:hover {
  border-color: #3b71ee;
  color: #3b71ee;
}

.toggle-btn.active {
  background: #3b71ee;
  color: #fff;
  border-color: #3b71ee;
}

/* 项目卡片 */
.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}

.project-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  transition: all 0.2s;
}

.project-card:hover {
  box-shadow: 0 4px 16px rgba(0,0,0,0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a2e;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.ongoing {
  background: #e6f0ff;
  color: #3b71ee;
}

.status-badge.completed {
  background: #e6f9f0;
  color: #1DB969;
}

.status-badge.delayed {
  background: #ffe6e6;
  color: #F53C3C;
}

.card-desc {
  color: #666;
  font-size: 14px;
  margin-bottom: 16px;
  line-height: 1.5;
}

.progress-section {
  margin-bottom: 16px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 14px;
  color: #666;
}

.progress-value {
  font-weight: 600;
  color: #3b71ee;
}

.progress-bar {
  height: 8px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #3b71ee;
  border-radius: 4px;
  transition: width 0.3s;
}

.card-meta {
  display: flex;
  gap: 20px;
  margin-bottom: 16px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 14px;
}

.meta-label {
  color: #8c8c8c;
  font-size: 12px;
}

.card-actions {
  display: flex;
  gap: 8px;
}

.btn-text {
  padding: 6px 12px;
  background: transparent;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  color: #666;
  transition: all 0.2s;
}

.btn-text:hover {
  background: #f5f5f5;
  color: #333;
}

.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 60px 20px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  color: #ccc;
}

.empty-state p {
  color: #8c8c8c;
  margin-bottom: 16px;
}

/* 甘特图 */
.gantt-container {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  overflow-x: auto;
}

.gantt-header {
  display: flex;
  border-bottom: 2px solid #f0f0f0;
  background: #fafafa;
  font-weight: 600;
  font-size: 13px;
  color: #666;
}

.gantt-project-col {
  width: 200px;
  flex-shrink: 0;
  padding: 12px 16px;
  border-right: 1px solid #f0f0f0;
}

.gantt-timeline {
  display: flex;
  flex: 1;
  min-width: 780px;
}

.gantt-week-header {
  flex: 1;
  padding: 12px 4px;
  text-align: center;
  border-right: 1px solid #f0f0f0;
  font-size: 11px;
  min-width: 30px;
}

.gantt-week-header.current {
  background: #e6f0ff;
  color: #3b71ee;
  font-weight: 700;
}

.gantt-body {
  max-height: 600px;
  overflow-y: auto;
}

.gantt-row {
  display: flex;
  border-bottom: 1px solid #f0f0f0;
  min-height: 60px;
}

.gantt-row:hover {
  background: #fafafa;
}

.gantt-row.project-row {
  background: #fafafa;
  border-bottom: 2px solid #e0e0e0;
}

.gantt-row.project-row:hover {
  background: #f0f0f0;
}

.gantt-row.version-row {
  min-height: 48px;
  border-bottom: 1px solid #f5f5f5;
}

.gantt-row.version-row:hover {
  background: #f5f9ff;
}

.project-name {
  font-weight: 600;
  color: #1a1a2e;
  margin-bottom: 4px;
}

.project-progress {
  font-size: 12px;
  color: #3b71ee;
  font-weight: 600;
}

.version-col {
  display: flex;
  align-items: center;
  padding-left: 16px;
}

.version-indent {
  width: 16px;
  height: 100%;
  border-left: 2px solid #ddd;
  margin-right: 8px;
}

.version-info-gantt {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.version-name-gantt {
  font-size: 13px;
  font-weight: 500;
  color: #333;
}

.version-status-gantt {
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 4px;
  display: inline-block;
  width: fit-content;
}

.version-status-gantt.planning {
  background: #f5f5f5;
  color: #8c8c8c;
}

.version-status-gantt.developing {
  background: #e6f0ff;
  color: #3b71ee;
}

.version-status-gantt.testing {
  background: #fff7e6;
  color: #FAAD14;
}

.version-status-gantt.released {
  background: #e6f9f0;
  color: #1DB969;
}

.version-status-gantt.deprecated {
  background: #ffe6e6;
  color: #F53C3C;
}

.gantt-week-cell {
  flex: 1;
  border-right: 1px solid #f0f0f0;
  position: relative;
  min-width: 30px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.gantt-week-cell.active {
  background: #f0f7ff;
}

.gantt-bar {
  width: 90%;
  height: 24px;
  background: #3b71ee;
  border-radius: 4px;
}

.gantt-bar.version-bar {
  height: 18px;
  border-radius: 3px;
}

.gantt-bar.version-bar.planning {
  background: #8c8c8c;
}

.gantt-bar.version-bar.developing {
  background: #3b71ee;
}

.gantt-bar.version-bar.testing {
  background: #FAAD14;
}

.gantt-bar.version-bar.released {
  background: #1DB969;
}

.gantt-bar.version-bar.deprecated {
  background: #F53C3C;
  opacity: 0.5;
}

.gantt-week-cell.completed .gantt-bar {
  background: #1DB969;
}

.gantt-week-cell.delayed .gantt-bar {
  background: #F53C3C;
}

/* 弹窗 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: #fff;
  padding: 24px;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal h2 {
  margin-bottom: 20px;
  font-size: 20px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
  outline: none;
  border-color: #3b71ee;
}

.form-group textarea {
  resize: vertical;
  min-height: 80px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
}

/* 版本管理 */
.version-section {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.version-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.version-title {
  font-size: 14px;
  font-weight: 600;
  color: #1a1a2e;
}

.version-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.version-item {
  padding: 12px;
  background: #fafafa;
  border-radius: 8px;
  border-left: 3px solid #3b71ee;
}

.version-item.planning {
  border-left-color: #8c8c8c;
}

.version-item.developing {
  border-left-color: #3b71ee;
}

.version-item.testing {
  border-left-color: #FAAD14;
}

.version-item.released {
  border-left-color: #1DB969;
}

.version-item.deprecated {
  border-left-color: #F53C3C;
  opacity: 0.7;
}

.version-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.version-number {
  font-weight: 600;
  color: #1a1a2e;
}

.version-name {
  color: #666;
  font-size: 13px;
}

.version-status-badge {
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 500;
}

.version-status-badge.planning {
  background: #f5f5f5;
  color: #8c8c8c;
}

.version-status-badge.developing {
  background: #e6f0ff;
  color: #3b71ee;
}

.version-status-badge.testing {
  background: #fff7e6;
  color: #FAAD14;
}

.version-status-badge.released {
  background: #e6f9f0;
  color: #1DB969;
}

.version-status-badge.deprecated {
  background: #ffe6e6;
  color: #F53C3C;
}

.version-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #8c8c8c;
  margin-bottom: 8px;
}

.version-demand-count {
  color: #3b71ee;
  font-weight: 500;
}

.version-actions {
  display: flex;
  gap: 8px;
}

.version-empty {
  text-align: center;
  padding: 12px;
  color: #8c8c8c;
  font-size: 13px;
}

.btn-text-small {
  padding: 4px 10px;
  background: transparent;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  color: #3b71ee;
  transition: all 0.2s;
}

.btn-text-small:hover {
  background: #f0f7ff;
  border-color: #3b71ee;
}

.btn-text-small.danger {
  color: #F53C3C;
}

.btn-text-small.danger:hover {
  background: #fff5f5;
  border-color: #F53C3C;
}

.version-input-group {
  display: flex;
  gap: 8px;
}

.version-input-group input {
  flex: 1;
}

/* 优先级标签 */
.header-tags {
  display: flex;
  gap: 8px;
  align-items: center;
}

.priority-tag {
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
}

.priority-tag.P0 {
  background: #ffe6e6;
  color: #F53C3C;
}

.priority-tag.P1 {
  background: #fff7e6;
  color: #FAAD14;
}

.priority-tag.P2 {
  background: #f5f5f5;
  color: #8c8c8c;
}

/* 项目人员 */
.project-people {
  margin: 12px 0;
  padding: 12px;
  background: #fafafa;
  border-radius: 8px;
}

.people-group {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
  flex-wrap: wrap;
}

.people-group:last-child {
  margin-bottom: 0;
}

.people-label {
  font-size: 12px;
  color: #8c8c8c;
  font-weight: 500;
  min-width: 56px;
}

.people-tag {
  padding: 2px 8px;
  background: #e6f0ff;
  color: #3b71ee;
  border-radius: 4px;
  font-size: 12px;
}

.people-tag.dev {
  background: #e6f9f0;
  color: #1DB969;
}

/* 最新进度 */
.latest-progress {
  margin: 12px 0;
  padding: 12px;
  background: #f0f7ff;
  border-radius: 8px;
  border-left: 3px solid #3b71ee;
}

.progress-log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.progress-log-label {
  font-size: 12px;
  font-weight: 600;
  color: #3b71ee;
}

.progress-log-date {
  font-size: 11px;
  color: #8c8c8c;
}

.progress-log-content {
  font-size: 13px;
  color: #333;
  line-height: 1.5;
  margin: 0;
}

/* 进度日志弹窗 */
.modal-large {
  max-width: 700px;
}

.progress-log-form {
  padding: 16px;
  background: #fafafa;
  border-radius: 8px;
  margin-bottom: 20px;
}

.progress-log-history {
  max-height: 400px;
  overflow-y: auto;
}

.progress-log-history h3 {
  font-size: 14px;
  color: #666;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.log-item {
  padding: 12px;
  background: #fff;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  margin-bottom: 8px;
}

.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.log-date {
  font-size: 13px;
  font-weight: 600;
  color: #3b71ee;
}

.log-content {
  font-size: 14px;
  color: #333;
  line-height: 1.5;
  margin: 0;
}

.log-empty {
  text-align: center;
  padding: 20px;
  color: #8c8c8c;
  font-size: 13px;
}

/* 版本关联需求详情 */
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.modal-subtitle {
  color: #8c8c8c;
  font-size: 14px;
  margin-top: 4px;
}

.version-demands-list {
  max-height: 70vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.demand-detail-card {
  background: #fafafa;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #f0f0f0;
}

.demand-detail-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 8px;
}

.demand-detail-title {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a2e;
}

.demand-detail-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.demand-detail-meta {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 16px;
  padding: 12px;
  background: #fff;
  border-radius: 8px;
}

.meta-row {
  display: flex;
  gap: 8px;
  font-size: 13px;
}

.demand-detail-section {
  margin-bottom: 12px;
}

.demand-detail-section:last-child {
  margin-bottom: 0;
}

.section-label {
  font-size: 12px;
  font-weight: 600;
  color: #666;
  margin-bottom: 6px;
}

.section-content {
  font-size: 14px;
  color: #333;
  line-height: 1.6;
  margin: 0;
}

.demand-images {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.demand-image-thumb {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  cursor: pointer;
  transition: transform 0.2s;
}

.demand-image-thumb:hover {
  transform: scale(1.05);
}

.status-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.pending {
  background: #f5f5f5;
  color: #8c8c8c;
}

.status-badge.scheduled {
  background: #e6f0ff;
  color: #3b71ee;
}

.status-badge.in_progress {
  background: #fff7e6;
  color: #FAAD14;
}

.status-badge.completed {
  background: #e6f9f0;
  color: #1DB969;
}

.empty-state.small {
  padding: 40px 20px;
}

.version-demand-count.clickable {
  cursor: pointer;
  text-decoration: underline;
}

.version-demand-count.clickable:hover {
  color: #2d5dd9;
}

/* 图片预览 */
.image-preview-modal {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
}

.preview-image {
  max-width: 100%;
  max-height: 90vh;
  border-radius: 8px;
}

.close-preview {
  position: absolute;
  top: -40px;
  right: 0;
  background: rgba(255,255,255,0.9);
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  cursor: pointer;
  font-size: 20px;
  color: #333;
}
</style>