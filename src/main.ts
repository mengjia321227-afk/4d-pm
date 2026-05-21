import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import { useProjectStore } from './stores/projectStore'

const app = createApp(App)
app.use(createPinia())
app.use(router)

// 初始化数据
const store = useProjectStore()
store.init().then(() => {
  app.mount('#app')
})
