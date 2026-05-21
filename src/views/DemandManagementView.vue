<template>
  <div class="demand-management">
    <div class="page-header">
      <div>
        <h1>需求管理</h1>
        <p class="subtitle">收集、管理和排期所有业务需求</p>
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
        <option value="P0">P0</option>
        <option value="P1">P1</option>
        <option value="P2">P2</option>
      </select>
      
      <select v-model="filterStatus" class="filter-select">
        <option value="">所有状态</option>
        <option value="pending">待处理</option>
        <option value="scheduled">已排期</option>
        <option value="in_progress">进行中</option>
        <option value="completed">已完成</option>
      </select>

      <select v-model="filterCategory" class="filter-select">
        <option value="">所有分类</option>
        <option value="渠道合作伙伴平台">渠道合作伙伴平台</option>
        <option value="EHR">EHR</option>
        <option value="海外平台">海外平台</option>
      </select>
      
      <select v-model="filterVersion" class="filter-select">
        <option value="">所有版本</option>
        <option value="null">未分配版本</option>
        <option v-for="version in allVersions" :key="version.id" :value="version.id">
          {{ version.versionNumber }} {{ version.name }}
        </option>
      </select>
    </div>

    <!-- 需求表格 -->
    <div class="table-container">
      <table class="demand-table">
        <thead>
          <tr>
            <th>需求名称</th>
            <th>提出人</th>
            <th>优先级</th>
            <th>分类</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="demand in sortedDemands"
            :key="demand.id"
          >
            <td>
              <div class="demand-title">{{ demand.title }}</div>
            </td>
            <td>{{ demand.creator }}</td>
            <td>
              <span class="priority-badge" :class="demand.priority">
                {{ demand.priority }}
              </span>
            </td>
            <td>
              <span class="category-badge">{{ demand.category }}</span>
            </td>
            <td>
              <div class="action-btns">
                <button class="btn-text-action" @click="linkProject(demand)" title="关联项目">项目</button>
                <button class="btn-text-action" @click="linkVersion(demand)" title="关联版本">版本</button>
                <button class="btn-text-action" @click="editDemand(demand)" title="编辑">编辑</button>
                <button class="btn-text-action danger" @click="deleteDemand(demand.id)" title="删除">删除</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="sortedDemands.length === 0" class="empty-state">
        <div class="empty-icon">[空]</div>
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
              <option value="P0">P0</option>
              <option value="P1">P1</option>
              <option value="P2">P2</option>
            </select>
          </div>
          <div class="form-group">
            <label>分类</label>
            <select v-model="demandForm.category">
              <option value="渠道合作伙伴平台">渠道合作伙伴平台</option>
              <option value="EHR">EHR</option>
              <option value="海外平台">海外平台</option>
            </select>
          </div>
        </div>
        
        <div class="form-group">
          <label>提出人</label>
          <input v-model="demandForm.creator" type="text" placeholder="输入提出人姓名">
        </div>
        
        <div class="form-group">
          <label>提出时间</label>
          <input v-model="demandForm.createDate" type="date">
        </div>
        
        <!-- 图片上传 -->
        <div class="form-group">
          <label>需求截图</label>
          <div 
            class="image-upload-area"
            tabindex="0"
            @paste="handlePaste"
          >
            <input 
              type="file" 
              accept="image/*" 
              multiple 
              @change="handleImageUpload" 
              ref="imageInput"
              style="display: none"
            >
            <button class="btn-text" @click="imageInput?.click()">+ 上传图片</button>
            <span class="paste-hint">或在此区域按 Ctrl+V 粘贴</span>
          </div>
          <div v-if="uploadedImages.length > 0" class="uploaded-images">
            <div v-for="(img, idx) in uploadedImages" :key="idx" class="uploaded-image-item">
              <img :src="img" class="uploaded-thumb">
              <button class="remove-image" @click="removeImage(idx)">×</button>
            </div>
          </div>
        </div>
        
        <div class="form-group">
          <label>备注</label>
          <textarea v-model="demandForm.remark" placeholder="其他补充信息"></textarea>
        </div>
        
        <div class="form-group" v-if="demandForm.projectId">
          <label>关联版本</label>
          <select v-model="demandForm.versionId">
            <option :value="null">不关联版本</option>
            <option v-for="version in getAvailableVersions(demandForm.projectId)" :key="version.id" :value="version.id">
              {{ version.versionNumber }} {{ version.name }}
            </option>
          </select>
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

    <!-- 关联版本弹窗 -->
    <div v-if="showLinkVersion" class="modal-overlay" @click="showLinkVersion = false">
      <div class="modal" @click.stop>
        <h2>关联版本</h2>
        <p>选择要关联的版本：</p>
        
        <div class="version-list-modal">
          <div
            class="version-option"
            :class="{ selected: selectedVersionId === null }"
            @click="selectedVersionId = null"
          >
            <div class="option-name">不关联版本</div>
          </div>
          <div
            v-for="version in availableVersions"
            :key="version.id"
            class="version-option"
            :class="{ selected: selectedVersionId === version.id }"
            @click="selectedVersionId = version.id"
          >
            <div class="option-name">{{ version.versionNumber }} {{ version.name }}</div>
            <div class="option-status">{{ versionStatusText(version.status) }}</div>
          </div>
        </div>
        
        <div class="modal-actions">
          <button class="btn-secondary" @click="showLinkVersion = false">取消</button>
          <button class="btn-primary" @click="confirmLinkVersion">确认关联</button>
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
const filterCategory = ref('')
const filterVersion = ref('')

const showAddDemand = ref(false)
const showLinkProject = ref(false)
const showLinkVersion = ref(false)
const editingDemand = ref<string | null>(null)
const currentDemand = ref<any>(null)
const selectedProjectId = ref('')
const selectedVersionId = ref<string | null>(null)

const imageInput = ref<HTMLInputElement | null>(null)
const uploadedImages = ref<string[]>([])

const allVersions = computed(() => store.versions)

const availableVersions = computed(() => {
  if (!currentDemand.value || !currentDemand.value.projectId) return []
  return store.versions.filter(v => v.projectId === currentDemand.value.projectId && v.status !== 'released' && v.status !== 'deprecated')
})

const demandForm = ref({
  title: '',
  description: '',
  priority: 'P1' as 'P0' | 'P1' | 'P2',
  category: '海外平台' as string,
  creator: '',
  createDate: new Date().toISOString().split('T')[0],
  remark: '',
  projectId: null as string | null,
  versionId: null as string | null
})

const sortedDemands = computed(() => {
  let result = filteredDemands.value
  
  // Sort by priority: P0 > P1 > P2
  const priorityOrder: Record<string, number> = { P0: 0, P1: 1, P2: 2 }
  result = [...result].sort((a, b) => {
    const priorityDiff = (priorityOrder[a.priority] || 999) - (priorityOrder[b.priority] || 999)
    if (priorityDiff !== 0) return priorityDiff
    // Secondary sort by create date (newest first)
    return new Date(b.createDate).getTime() - new Date(a.createDate).getTime()
  })
  
  return result
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

  if (filterCategory.value) {
    result = result.filter(d => d.category === filterCategory.value)
  }

  if (filterVersion.value) {
    if (filterVersion.value === 'null') {
      result = result.filter(d => !d.versionId)
    } else {
      result = result.filter(d => d.versionId === filterVersion.value)
    }
  }

  return result
})

// 读取图片文件为 base64
const readImageFile = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      if (e.target?.result) {
        resolve(e.target.result as string)
      }
    }
    reader.readAsDataURL(file)
  })
}

// 图片上传处理
const handleImageUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  const files = target.files
  if (!files) return

  Array.from(files).forEach(file => {
    readImageFile(file).then(dataUrl => {
      uploadedImages.value.push(dataUrl)
    })
  })

  // 清空 input 以便可以重复选择相同文件
  target.value = ''
}

// 粘贴图片处理
const handlePaste = async (event: ClipboardEvent) => {
  const items = event.clipboardData?.items
  if (!items) return

  const imageFiles: File[] = []

  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    if (item.type.startsWith('image/')) {
      const file = item.getAsFile()
      if (file) {
        imageFiles.push(file)
      }
    }
  }

  if (imageFiles.length === 0) return

  event.preventDefault()

  for (const file of imageFiles) {
    const dataUrl = await readImageFile(file)
    uploadedImages.value.push(dataUrl)
  }
}

const removeImage = (index: number) => {
  uploadedImages.value.splice(index, 1)
}

const saveDemand = () => {
  if (!demandForm.value.title) {
    alert('请填写需求标题')
    return
  }

  const demandData = {
    ...demandForm.value,
    images: uploadedImages.value
  }

  if (editingDemand.value) {
    store.updateDemand(editingDemand.value, {
      ...demandData,
      status: demandData.versionId ? 'in_progress' : store.demands.find(d => d.id === editingDemand.value)?.status || 'pending'
    })
  } else {
    store.addDemand({
      ...demandData,
      projectId: null,
      scheduleStart: null,
      scheduleEnd: null
    })
  }

  showAddDemand.value = false
  editingDemand.value = null
  uploadedImages.value = []
  demandForm.value = {
    title: '',
    description: '',
    priority: 'P1',
    category: '海外平台',
    creator: '',
    createDate: new Date().toISOString().split('T')[0],
    remark: '',
    projectId: null,
    versionId: null
  }
}

const getAvailableVersions = (projectId: string | null) => {
  if (!projectId) return []
  return store.versions.filter(v => v.projectId === projectId && v.status !== 'released' && v.status !== 'deprecated')
}

const editDemand = (demand: any) => {
  editingDemand.value = demand.id
  demandForm.value = {
    title: demand.title,
    description: demand.description,
    priority: demand.priority,
    category: demand.category,
    creator: demand.creator,
    createDate: demand.createDate,
    remark: demand.remark,
    projectId: demand.projectId,
    versionId: demand.versionId
  }
  uploadedImages.value = demand.images ? [...demand.images] : []
  showAddDemand.value = true
}

const deleteDemand = (id: string) => {
  if (confirm('确定要删除这个需求吗？')) {
    store.deleteDemand(id)
  }
}

const getDimensionLabel = (key: string) => {
  return store.dimensions.find(d => d.key === key)?.label || key
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

const linkVersion = (demand: any) => {
  currentDemand.value = demand
  selectedVersionId.value = demand.versionId || null
  showLinkVersion.value = true
}

const confirmLinkVersion = () => {
  if (currentDemand.value) {
    store.updateDemand(currentDemand.value.id, {
      versionId: selectedVersionId.value,
      status: selectedVersionId.value ? 'in_progress' : currentDemand.value.status
    })
  }
  showLinkVersion.value = false
  currentDemand.value = null
  selectedVersionId.value = null
}
</script>

<style scoped>
.demand-management {
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
  background: #fafafa;
}

.demand-table td {
  padding: 14px 16px;
  border-bottom: 1px solid #f5f5f5;
  font-size: 14px;
}

.demand-table tbody tr:hover {
  background: #fafafa;
}

.demand-title {
  font-weight: 500;
  color: #1a1a2e;
}

.priority-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.priority-badge.P0 {
  background: #ffe6e6;
  color: #F53C3C;
}

.priority-badge.P1 {
  background: #fff7e6;
  color: #FAAD14;
}

.priority-badge.P2 {
  background: #f5f5f5;
  color: #8c8c8c;
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

.btn-text-action {
  padding: 4px 10px;
  background: transparent;
  border: 1px solid #e0e0e0;
  cursor: pointer;
  border-radius: 4px;
  font-size: 13px;
  color: #3b71ee;
  transition: all 0.2s;
}

.btn-text-action:hover {
  background: #f0f7ff;
  border-color: #3b71ee;
}

.btn-text-action.danger {
  color: #F53C3C;
}

.btn-text-action.danger:hover {
  background: #fff5f5;
  border-color: #F53C3C;
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

/* 图片上传 */
.image-upload-area {
  margin-bottom: 8px;
  border: 2px dashed #d9d9d9;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  transition: all 0.2s;
  cursor: pointer;
  outline: none;
}

.image-upload-area:hover,
.image-upload-area:focus {
  border-color: #3b71ee;
  background: #f0f7ff;
}

.paste-hint {
  display: block;
  margin-top: 8px;
  font-size: 12px;
  color: #8c8c8c;
}

.uploaded-images {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 8px;
}

.uploaded-image-item {
  position: relative;
  width: 80px;
  height: 80px;
}

.uploaded-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

.remove-image {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 20px;
  height: 20px;
  background: #F53C3C;
  color: #fff;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
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

.version-link {
  color: #3b71ee;
  font-weight: 500;
}

.no-version {
  color: #8c8c8c;
  font-style: italic;
}

.category-badge {
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  background: #e6f0ff;
  color: #3b71ee;
}

/* 版本选择弹窗 */
.version-list-modal {
  max-height: 300px;
  overflow-y: auto;
  margin: 16px 0;
}

.version-option {
  padding: 12px;
  border: 2px solid #f0f0f0;
  border-radius: 8px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.version-option:hover {
  border-color: #3b71ee;
}

.version-option.selected {
  border-color: #3b71ee;
  background: #f0f7ff;
}

.option-status {
  font-size: 12px;
  color: #8c8c8c;
  margin-top: 4px;
}

.modal-actions .btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>