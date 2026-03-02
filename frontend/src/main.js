import { createApp } from 'vue'
import { createPinia } from 'pinia'
// 按需导入 - 不再全量导入Element Plus和Vant
// Element Plus和Vant组件会通过unplugin-vue-components自动按需导入
import App from './App.vue'
import router from './router'
// 导入自定义样式系统
import './style.css'
// 导入主题 store
import { useThemeStore } from './stores/theme'
// 导入资源优化工具
import { initResourceOptimization } from './utils/resourceOptimization'
import { registerLazyDirectives } from './directives/lazyLoad'
// 导入PWA注册
import { registerSW } from 'virtual:pwa-register'
// 导入离线同步管理器
import { initSyncManager } from './utils/syncManager'
// 导入离线存储初始化
import { openDatabase } from './utils/offlineStorage'
// 导入错误监控服务
import { initErrorMonitoring } from './utils/errorMonitoring'

function showInitError(err) {
  console.error('[AFitness] 初始化失败:', err)
  const el = document.getElementById('app')
  if (el) {
    el.innerHTML =
      '<div style="padding:24px;color:#ef4444;font-family:sans-serif;max-width:600px">' +
      '<h2>应用加载失败</h2><pre style="margin-top:12px;overflow:auto;font-size:12px;background:#1e1e2e;padding:16px;border-radius:8px">' +
      (err?.stack || err?.message || String(err)) + '</pre>' +
      '<button onclick="location.reload()" style="margin-top:16px;padding:8px 16px;cursor:pointer;background:#6366f1;color:#fff;border:none;border-radius:8px">重新加载</button></div>'
  }
  window.__APP_READY__ = true
  window.dispatchEvent(new Event('app-ready'))
}

try {
  const app = createApp(App)
  const pinia = createPinia()
  app.use(pinia)
  app.use(router)

  const themeStore = useThemeStore()
  themeStore.loadFromStorage()

  try {
    initErrorMonitoring(app, router)
  } catch (e) {
    console.warn('[AFitness] 错误监控初始化失败，继续启动:', e)
  }

  try {
    registerLazyDirectives(app)
  } catch (e) {
    console.warn('[AFitness] 懒加载指令注册失败，继续启动:', e)
  }

  app.mount('#app')
  window.__APP_READY__ = true
  window.dispatchEvent(new Event('app-ready'))

  // 非关键初始化放到挂载之后，失败不影响页面显示
  const runAfterMount = () => {
    try {
      const updateSW = registerSW({
        onNeedRefresh() {
          if (confirm('发现新版本，是否立即更新？')) updateSW(true)
        },
        onOfflineReady() {
          console.log('应用已准备好离线使用')
        },
        onRegistered(registration) {
          console.log('Service Worker 注册成功:', registration)
        },
        onRegisterError(error) {
          console.error('Service Worker 注册失败:', error)
        }
      })
    } catch (e) {
      console.warn('[AFitness] PWA 注册失败:', e)
    }
    try {
      initResourceOptimization({
        lazyLoadSelector: '[data-src], [data-bg-src], .lazy-image',
        preconnectOrigins: ['https://fonts.googleapis.com', 'https://fonts.gstatic.com'],
        preloadFonts: [{
          url: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2',
          type: 'font/woff2'
        }]
      })
    } catch (e) {
      console.warn('[AFitness] 资源优化初始化失败:', e)
    }
    openDatabase()
      .then(() => {
        console.log('离线存储数据库已初始化')
        initSyncManager()
      })
      .catch(error => {
        console.error('离线存储初始化失败:', error)
      })
  }
  if (typeof requestAnimationFrame !== 'undefined') {
    requestAnimationFrame(runAfterMount)
  } else {
    setTimeout(runAfterMount, 0)
  }
} catch (err) {
  showInitError(err)
}
