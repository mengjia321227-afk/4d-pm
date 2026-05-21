<template>
  <aside class="sidebar">
    <div class="logo">
      <span class="logo-text">项目&需求管理</span>
    </div>
    
    <nav class="nav-menu">
      <router-link to="/projects" class="nav-item" :class="{ active: route.name === 'Projects' }">
        项目管理
      </router-link>
      
      <router-link to="/demands" class="nav-item" :class="{ active: route.name === 'Demands' }">
        需求管理
        <span v-if="pendingDemands > 0" class="badge">{{ pendingDemands }}</span>
      </router-link>
    </nav>
    
    <div class="sidebar-footer">
      <button class="export-btn" @click="exportData">导出数据</button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useProjectStore } from '../stores/projectStore'

const route = useRoute()
const store = useProjectStore()

const pendingDemands = computed(() => store.demands.filter(d => d.status === 'pending').length)

const exportData = () => {
  const data = store.exportData()
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `4d-pm-backup-${new Date().toISOString().split('T')[0]}.json`
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<style scoped>
.sidebar {
  width: 220px;
  background: #1a1a2e;
  color: #fff;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.logo {
  padding: 24px 20px;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}

.logo-text {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 1px;
}

.nav-menu {
  flex: 1;
  padding: 20px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.nav-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-radius: 8px;
  color: rgba(255,255,255,0.7);
  text-decoration: none;
  transition: all 0.2s;
  font-size: 15px;
}

.nav-item:hover {
  background: rgba(255,255,255,0.1);
  color: #fff;
}

.nav-item.active {
  background: #3b71ee;
  color: #fff;
}

.badge {
  background: #F53C3C;
  color: #fff;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 600;
}

.sidebar-footer {
  padding: 16px;
  border-top: 1px solid rgba(255,255,255,0.1);
}

.export-btn {
  width: 100%;
  padding: 10px;
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.2);
  color: #fff;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.export-btn:hover {
  background: rgba(255,255,255,0.2);
}
</style>