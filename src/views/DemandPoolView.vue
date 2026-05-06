<template>
  <div class="demand-pool">
    <div class="page-header">
      <div>
        <h1>需求池</h1>
        <p class="subtitle">收集和管理所有业务需求</p>
      </div>
      <button class="btn-primary" @click="showAddDemand = true">+ 新建需求</button>
    </div>

    <!-- 筛选工具栏 -->
    <div class="toolbar">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="搜索需求..."
        class="search-input"
      >
      
      <select v-model="filterPriority" class="filter-select">
        <option value="">所有优先级</option>
        <option value="high">高</option>
        <option value="medium">中</option>
        <option value="low">低</option>
      </select>
      
      <select v-model="filterStatus" class="filter-select">
        <option value="">所有状态</option>
        <option value="pending">待处理</option>
        <option value="scheduled">已排期</option>
        <option value="in_progress">进行中</option>
        <option value="completed">已完成</option>
      </select>
    </div>

    <!-- 需求表格 -->
    <div class="table-container">
      <table class="demand-table">
        <thead>
          <tr>
            <th>需求标题</th>
            <th>优先级</th>
            <th>来源</th>
            <th>提出日期</th>
            <th>期望完成</th>
            <th>关联项目</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="demand in filteredDemands"
            :key="demand.id"
            :class="{ overdue: isOverdue(demand) }"
          >
            <td>
              <div class="demand-title">{{ demand.title }}</div>
              <div class="demand-desc">{{ demand.description }}</div>
            </td>
            <td>
              <span class="priority-badge" :class="demand.priority">
                {{ priorityText(demand.priority) }}
              </span>
            </td>
            <td>{{ demand.source }}</td>
            <td>{{ demand.createDate }}</td>
            <td>{{ demand.expectDate }}</td>
            <td>
              <span v-if="getProjectName(demand.projectId)" class="project-link">
                {{ getProjectName(demand.projectId) }}
              </span>
              <span v-else class="no-project">未关联</span>
            </td>
            <td>
              <span class="status-badge" :class="demand.status">
                {{ statusText(demand.status) }}
              </span>
            </td>
            <td>
              <div class="action-btns">
                <button class="btn-icon" @click="linkProject(demand)" title="关联项目">🔗</button>
                <button class="btn-icon" @click="scheduleDemand(demand)" title="排期">📅</button>
                <button class="btn-icon" @click="editDemand(demand)" title="编辑">✏️</button>
                <button class="btn-icon" @click="deleteDemand(demand.id)" title="删除">🗑️</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="filteredDemands.length === 0" class="empty-state">
        <div class="empty-icon">📝</div>
        <p>暂无需求</p>
      </div>
    </div>

    <!-- 新建/编辑需求弹窗 -->
    <div v-if="showAddDemand" class="modal-overlay" @click="showAddDemand = false">
      <div class="modal" @click.stop>
        <h2>{{ editingDemand ? '编辑需求' : '新建需求' }}</h2>
        
        <div class="form-group">
          <label>需求标题 *</label>
          <input v-model="demandForm.title" type="text" placeholder="输入需求标题">
        </div>
        
        <div class="form-group">
          <label>需求描述</label>
          <textarea v-model="demandForm.description" placeholder="详细描述需求内容"></textarea>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label>优先级</label>
            <select v-model="demandForm.priority">
              <option value="high">高</option>
              <option value="medium">中</option>
              <option value="low">低</option>
            </select>
          </div>
          <div class="form-group">
            <label>来源渠道</label>
            <input v-model="demandForm.source" type="text" placeholder="如：海外团队、渠道部">
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label>提出日期</label>
            <input v-model="demandForm.createDate" type="date">
          </div>
          <div class="form-group">
            <label>期望完成日期</label>
            <input v-model="demandForm.expectDate" type="date">
          </div>
        </div>
        
        <div class="form-group">
          <label>备注</label>
          <textarea v-model="demandForm.remark" placeholder="其他补充信息"></textarea>
        </div>
        
        <div class="modal-actions">
          <button class="btn-secondary" @click="showAddDemand = false">取消</button>
          <button class="btn-primary" @click="saveDemand">保存</button>
        </div>
      </div>
    </div>

    <!-- 关联项目弹窗 -->
    <div v-if="showLinkProject" class="modal-overlay" @click="showLinkProject = false">
      <div class="modal" @click.stop>
        <h2>关联项目</h2>
        <p>选择要关联的项目：</p>
        
        <div class="project-list">
          <div
            v-for="project in store.projects"
            :key="project.id"
            class="project-option"
            :class="{ selected: selectedProjectId === project.id }"
            @click="selectedProjectId = project.id"
          >
            <div class="option-name">{{ project.name }}</div>
            <div class="option-dim">{{ getDimensionLabel(project.dimension) }}</div>
          </div>
        </div>
        
        <div class="modal-actions">
          <button class="btn-secondary" @click="showLinkProject = false">取消</button>
          <button class="btn-primary" @click="confirmLink">确认关联</button>
        </div>
      </div>
    </div>

    <!-- 排期弹窗 -->
    <div v-if="showSchedule" class="modal-overlay" @click="showSchedule = false">
      <div class="modal" @click.stop>
        <h2>需求排期</h2>
        
        <p v-if="currentDemand">为需求「{{ currentDemand.title }}」安排执行时间</p>
        
        <div class="form-row">
          <div class="form-group">
            <label>开始周</label>
            <input v-model="scheduleForm.start" type="week">
          </div>
          <div class="form-group">
            <label>结束周</label>
            <input v-model="scheduleForm.end" type="week">
          </div>
        </div>
        
        <div class="modal-actions">
          <button class="btn-secondary" @click="showSchedule = false">取消</button>
          <button class="btn-primary" @click="confirmSchedule">确认排期</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useProjectStore } from '../stores/projectStore'

const store = useProjectStore()

const searchQuery = ref('')
const filterPriority = ref('')
const filterStatus = ref('')

const showAddDemand = ref(false)
const showLinkProject = ref(false)
const showSchedule = ref(false)
const editingDemand = ref<string | null>(null)
const currentDemand = ref<any>(null)
const selectedProjectId = ref('')

const demandForm = ref({
  title: '',
  description: '',
  priority: 'medium' as 'high' | 'medium' | 'low',
  source: '',
  createDate: new Date().toISOString().split('T')[0],
  expectDate: '',
  remark: ''
})

const scheduleForm = ref({
  start: '',
  end: ''
})

const filteredDemands = computed(() => {
  let result = store.demands

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(d => 
      d.title.toLowerCase().includes(query) ||
      d.description.toLowerCase().includes(query)
    )
  }

  if (filterPriority.value) {
    result = result.filter(d => d.priority === filterPriority.value)
  }

  if (filterStatus.value) {
    result = result.filter(d => d.status === filterStatus.value)
  }

  return result
})

const priorityText = (priority: string) => {
  const map: Record<string, string> = { high: '高', medium: '中', low: '低' }
  return map[priority] || priority
}

const statusText = (status: string) => {
  const map: Record<string, string> = {
    pending: '待处理',
    scheduled: '已排期',
    in_progress: '进行中',
    completed: '已完成'
  }
  return map[status] || status
}

const getProjectName = (projectId: string | null) => {
  if (!projectId) return null
  const project = store.projects.find(p => p.id === projectId)
  return project?.name || null
}

const getDimensionLabel = (key: string) => {
  return store.dimensions.find(d => d.key === key)?.label || key
}

const isOverdue = (demand: any) => {
  return demand.status !== 'completed' && demand.expectDate && demand.expectDate < new Date().toISOString().split('T')[0]
}

const saveDemand = () => {
  if (!demandForm.value.title) {
    alert('请填写需求标题')
    return
  }

  if (editingDemand.value) {
    store.updateDemand(editingDemand.value, demandForm.value)
  } else {
    store.addDemand({
      ...demandForm.value,
      projectId: null,
      scheduleStart: null,
      scheduleEnd: null
    })
  }

  showAddDemand.value = false
  editingDemand.value = null
  demandForm.value = {
    title: '',
    description: '',
    priority: 'medium',
    source: '',
    createDate: new Date().toISOString().split('T')[0],
    expectDate: '',
    remark: ''
  }
}

const editDemand = (demand: any) => {
  editingDemand.value = demand.id
  demandForm.value = {
    title: demand.title,
    description: demand.description,
    priority: demand.priority,
    source: demand.source,
    createDate: demand.createDate,
    expectDate: demand.expectDate,
    remark: demand.remark
  }
  showAddDemand.value = true
}

const deleteDemand = (id: string) => {
  if (confirm('确定要删除这个需求吗？')) {
    store.deleteDemand(id)
  }
}

const linkProject = (demand: any) => {
  currentDemand.value = demand
  selectedProjectId.value = demand.projectId || ''
  showLinkProject.value = true
}

const confirmLink = () => {
  if (currentDemand.value && selectedProjectId.value) {
    store.updateDemand(currentDemand.value.id, { 
      projectId: selectedProjectId.value,
      status: 'in_progress'
    })
  }
  showLinkProject.value = false
  currentDemand.value = null
}

const scheduleDemand = (demand: any) => {
  currentDemand.value = demand
  scheduleForm.value = {
    start: demand.scheduleStart || '',
    end: demand.scheduleEnd || ''
  }
  showSchedule.value = true
}

const confirmSchedule = () => {
  if (currentDemand.value) {
    store.updateDemand(currentDemand.value.id, {
      scheduleStart: scheduleForm.value.start,
      scheduleEnd: scheduleForm.value.end,
      status: 'scheduled'
    })
  }
  showSchedule.value = false
  currentDemand.value = null
}
</script>

<style scoped>
.demand-pool {
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

.toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.search-input {
  flex: 1;
  max-width: 300px;
  padding: 10px 16px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
}

.filter-select {
  padding: 10px 16px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  background: #fff;
}

.table-container {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  overflow-x: auto;
}

.demand-table {
  width: 100%;
  border-collapse: collapse;
}

.demand-table th {
  padding: 14px 16px;
  text-align: left;
  font-size: 13px;
  font-weight: 600;
  color: #666;
  border-bottom: 2px solid #f0f0f0;
  white-space: nowrap;
}

.demand-table td {
  padding: 14px 16px;
  border-bottom: 1px solid #f5f5f5;
  font-size: 14px;
}

.demand-table tbody tr:hover {
  background: #fafafa;
}

.demand-table tbody tr.overdue {
  background: #fff5f5;
}

.demand-title {
  font-weight: 500;
  color: #1a1a2e;
  margin-bottom: 4px;
}

.demand-desc {
  color: #8c8c8c;
  font-size: 13px;
}

.priority-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.priority-badge.high {
  background: #ffe6e6;
  color: #F53C3C;
}

.priority-badge.medium {
  background: #fff7e6;
  color: #FAAD14;
}

.priority-badge.low {
  background: #f5f5f5;
  color: #8c8c8c;
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

.project-link {
  color: #3b71ee;
  cursor: pointer;
}

.no-project {
  color: #8c8c8c;
  font-style: italic;
}

.action-btns {
  display: flex;
  gap: 4px;
}

.btn-icon {
  padding: 6px;
  background: transparent;
  border: none;
  cursor: pointer;
  border-radius: 6px;
  font-size: 14px;
  transition: all 0.2s;
}

.btn-icon:hover {
  background: #f0f0f0;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-state p {
  color: #8c8c8c;
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
  margin-bottom: 16px;
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

.project-list {
  max-height: 300px;
  overflow-y: auto;
  margin: 16px 0;
}

.project-option {
  padding: 12px;
  border: 2px solid #f0f0f0;
  border-radius: 8px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.project-option:hover {
  border-color: #3b71ee;
}

.project-option.selected {
  border-color: #3b71ee;
  background: #f0f7ff;
}

.option-name {
  font-weight: 500;
  margin-bottom: 4px;
}

.option-dim {
  font-size: 12px;
  color: #8c8c8c;
}
</style>