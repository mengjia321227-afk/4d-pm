<template>
  <div class="gantt-view">
    <div class="page-header">
      <div>
        <h1>{{ currentDimension?.label }}甘特图</h1>
        <p class="subtitle">按周查看项目时间线</p>
      </div>
    </div>

    <div class="gantt-container">
      <div class="gantt-header">
        <div class="gantt-project-col">项目</div>
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
        <div
          v-for="project in projects"
          :key="project.id"
          class="gantt-row"
        >
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

        <div v-if="projects.length === 0" class="empty-state">
          <p>该维度下暂无项目</p>
        </div>
      </div>
    </div>

    <div class="legend">
      <div class="legend-item">
        <div class="legend-color ongoing"></div>
        <span>进行中</span>
      </div>
      <div class="legend-item">
        <div class="legend-color completed"></div>
        <span>已完成</span>
      </div>
      <div class="legend-item">
        <div class="legend-color delayed"></div>
        <span>已延期</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useProjectStore } from '../stores/projectStore'

const props = defineProps<{
  dimension: string
}>()

const store = useProjectStore()

const currentDimension = computed(() => 
  store.dimensions.find(d => d.key === props.dimension)
)

const projects = computed(() => 
  store.projects.filter(p => p.dimension === props.dimension)
)

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
  
  const totalDuration = projectEnd.getTime() - projectStart.getTime()
  
  let opacity = 1
  if (project.status === 'completed') {
    opacity = 1
  } else if (project.status === 'delayed') {
    opacity = 0.7
  } else {
    const elapsed = weekStart.getTime() - projectStart.getTime()
    const expectedProgress = totalDuration > 0 ? (elapsed / totalDuration) * 100 : 0
    opacity = project.progress >= expectedProgress ? 1 : 0.5
  }
  
  return { opacity }
}
</script>

<style scoped>
.gantt-view {
  max-width: 1400px;
}

.page-header {
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

.project-name {
  font-weight: 500;
  color: #1a1a2e;
  margin-bottom: 4px;
}

.project-progress {
  font-size: 12px;
  color: #3b71ee;
  font-weight: 600;
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

.gantt-week-cell.completed .gantt-bar {
  background: #1DB969;
}

.gantt-week-cell.delayed .gantt-bar {
  background: #F53C3C;
}

.legend {
  display: flex;
  gap: 24px;
  margin-top: 20px;
  padding: 16px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #666;
}

.legend-color {
  width: 16px;
  height: 16px;
  border-radius: 4px;
}

.legend-color.ongoing {
  background: #3b71ee;
}

.legend-color.completed {
  background: #1DB969;
}

.legend-color.delayed {
  background: #F53C3C;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #8c8c8c;
}
</style>