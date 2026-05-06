<template>
  <aside class="sidebar">
    <div class="logo">
      <span class="logo-icon">📊</span>
      <span class="logo-text">4D-PM</span>
    </div>
    
    <nav class="nav-menu">
      <div class="nav-section">
        <div class="nav-title">项目维度</div>
        <router-link
          v-for="dim in store.dimensions"
          :key="dim.key"
          :to="`/dashboard/${dim.key}`"
          class="nav-item"
          :class="{ active: route.params.dimension === dim.key && route.name === 'Dashboard' }"
        >
          <span class="nav-icon">{{ dim.icon }}</span>
          <span>{{ dim.label }}</span>
        </router-link>
      </div>
      
      <div class="nav-section">
        <div class="nav-title">视图</div>
        <router-link
          v-for="dim in store.dimensions"
          :key="`gantt-${dim.key}`"
          :to="`/gantt/${dim.key}`"
          class="nav-item sub-item"
          :class="{ active: route.params.dimension === dim.key && route.name === 'Gantt' }"
        >
          <span>{{ dim.label }}甘特图</span>
        </router-link>
      </div>
      
      <div class="nav-section">
        <router-link to="/demands" class="nav-item" :class="{ active: route.name === 'Demands' }">
          <span class="nav-icon">📝</span>
          <span>需求池</span>
          <span v-if="pendingDemands > 0" class="badge">{{ pendingDemands }}</span>
        </router-link>
      </div>
    </nav>
    
    <div class="sidebar-footer">
      <button class="export-btn" @click="exportData">💾 导出数据</button>
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
  padding: 20px 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}

.logo-icon {
  font-size: 24px;
}

.logo-text {
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 1px;
}

.nav-menu {
  flex: 1;
  padding: 16px 12px;
  overflow-y: auto;
}

.nav-section {
  margin-bottom: 24px;
}

.nav-title {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: rgba(255,255,255,0.4);
  margin-bottom: 8px;
  padding-left: 12px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  color: rgba(255,255,255,0.7);
  text-decoration: none;
  transition: all 0.2s;
  margin-bottom: 4px;
  position: relative;
}

.nav-item:hover {
  background: rgba(255,255,255,0.1);
  color: #fff;
}

.nav-item.active {
  background: #3b71ee;
  color: #fff;
}

.nav-icon {
  font-size: 18px;
}

.sub-item {
  padding-left: 40px;
  font-size: 14px;
}

.badge {
  margin-left: auto;
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