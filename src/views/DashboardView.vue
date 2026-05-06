<template>
  <div class="dashboard">
    <div class="page-header">
      <div>
        <h1>{{ currentDimension?.label }}项目</h1>
        <p class="subtitle">管理{{ currentDimension?.label }}维度下的所有项目</p>
      </div>
      <button class="btn-primary" @click="showAddProject = true">+ 新建项目</button>
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

    <!-- 项目卡片列表 -->
    <div class="projects-grid">
      <div
        v-for="project in projects"
        :key="project.id"
        class="project-card"
        :class="project.status"
      >
        <div class="card-header">
          <div class="card-title">{{ project.name }}</div>
          <span class="status-badge" :class="project.status">{{ statusText(project.status) }}</span>
        </div>
        
        <p class="card-desc">{{ project.description }}</p>
        
        <div class="progress-section">
          <div class="progress-header">
            <span>进度</span>
            <span class="progress-value">{{ project.progress }}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: project.progress + '%' }"></div>
          </div>
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
          <button class="btn-text" @click="editProject(project)">编辑</button>
          <button class="btn-text" @click="deleteProject(project.id)">删除</button>
        </div>
      </div>
      
      <!-- 空状态 -->
      <div v-if="projects.length === 0" class="empty-state">
        <div class="empty-icon">📁</div>
        <p>暂无项目</p>
        <button class="btn-primary" @click="showAddProject = true">创建第一个项目</button>
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
          <label>项目描述</label>
          <textarea v-model="projectForm.description" placeholder="输入项目描述"></textarea>
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
        
        <div class="form-group">
          <label>当前进度 (%)</label>
          <input v-model.number="projectForm.progress" type="number" min="0" max="100">
        </div>
        
        <div class="modal-actions">
          <button class="btn-secondary" @click="showAddProject = false">取消</button>
          <button class="btn-primary" @click="saveProject">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useProjectStore } from '../stores/projectStore'

const store = useProjectStore()

const props = defineProps<{
  dimension: string
}>()

const currentDimension = computed(() => 
  store.dimensions.find(d => d.key === props.dimension)
)

const projects = computed(() => 
  store.projects.filter(p => p.dimension === props.dimension)
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

const showAddProject = ref(false)
const editingProject = ref<string | null>(null)

const projectForm = ref({
  name: '',
  description: '',
  startDate: new Date().toISOString().split('T')[0],
  endDate: '',
  progress: 0
})

const editProject = (project: any) => {
  editingProject.value = project.id
  projectForm.value = {
    name: project.name,
    description: project.description,
    startDate: project.startDate,
    endDate: project.endDate,
    progress: project.progress
  }
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

  if (editingProject.value) {
    store.updateProject(editingProject.value, {
      ...projectForm.value,
      status
    })
  } else {
    store.addProject({
      ...projectForm.value,
      dimension: props.dimension,
      status
    })
  }

  showAddProject.value = false
  editingProject.value = null
  projectForm.value = {
    name: '',
    description: '',
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

watch(() => props.dimension, () => {
  store.checkDelays()
}, { immediate: true })
</script>

<style scoped>
.dashboard {
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
}

.empty-state p {
  color: #8c8c8c;
  margin-bottom: 16px;
}

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
.form-group textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.form-group input:focus,
.form-group textarea:focus {
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
</style>