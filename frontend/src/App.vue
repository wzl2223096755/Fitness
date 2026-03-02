<template>
  <div class="app-container">
    <!-- 路由加载指示器 -->
    <RouteLoadingIndicator />
    
    <!-- 粒子背景 -->
    <ParticleBackground v-if="!isLoginPage" />
    
    <!-- 登录页面时隐藏所有抽屉 -->
    <template v-if="!isLoginPage">
      <!-- 侧边栏抽屉遮罩层 -->
      <div 
        v-if="sidebarDrawerOpen" 
        class="drawer-overlay" 
        @click="closeSidebarDrawer"
      ></div>
      
      <!-- 用户菜单遮罩层 -->
      <div 
        v-if="showUserMenu" 
        class="user-menu-overlay" 
        @click="showUserMenu = false"
      ></div>
      
      <!-- 侧边栏抽屉 -->
      <aside class="sidebar-drawer" :class="{ 'drawer-open': sidebarDrawerOpen }">
        <div class="drawer-header">
          <h2>🏃‍♂️ 健身管理系统</h2>
          <button class="drawer-close" @click="closeSidebarDrawer">×</button>
        </div>
        <nav class="sidebar-menu">
          <router-link to="/dashboard" class="menu-item" :class="{ active: activeMenu === '/dashboard' }" @click="closeSidebarDrawer">
            <span class="icon">📊</span>
            <span>仪表盘</span>
          </router-link>
          <!-- 用户管理已移至管理端前端 (port 3002) -->
          <router-link to="/training-data" class="menu-item" :class="{ active: activeMenu === '/training-data' }" @click="closeSidebarDrawer">
            <span class="icon">📈</span>
            <span>训练数据</span>
          </router-link>
          <router-link to="/load-analysis" class="menu-item" :class="{ active: activeMenu === '/load-analysis' }" @click="closeSidebarDrawer">
            <span class="icon">🥧</span>
            <span>负荷分析</span>
          </router-link>
          <router-link to="/recovery-status" class="menu-item" :class="{ active: activeMenu === '/recovery-status' }" @click="closeSidebarDrawer">
            <span class="icon">🔄</span>
            <span>恢复状态</span>
          </router-link>
          <router-link to="/training-suggestions" class="menu-item" :class="{ active: activeMenu === '/training-suggestions' }" @click="closeSidebarDrawer">
            <span class="icon">💬</span>
            <span>训练建议</span>
          </router-link>
          <router-link to="/history-stats" class="menu-item" :class="{ active: activeMenu === '/history-stats' }" @click="closeSidebarDrawer">
            <span class="icon">📊</span>
            <span>历史统计</span>
          </router-link>
          <router-link to="/training-records" class="menu-item" :class="{ active: activeMenu === '/training-records' }" @click="closeSidebarDrawer">
            <span class="icon">📝</span>
            <span>训练记录</span>
          </router-link>
          <router-link to="/data-visualization" class="menu-item" :class="{ active: activeMenu === '/data-visualization' }" @click="closeSidebarDrawer">
            <span class="icon">📈</span>
            <span>数据可视化</span>
          </router-link>
          <router-link to="/fitness-planner" class="menu-item" :class="{ active: activeMenu === '/fitness-planner' }" @click="closeSidebarDrawer">
            <span class="icon">📋</span>
            <span>健身计划</span>
          </router-link>
          <router-link to="/nutrition-tracking" class="menu-item" :class="{ active: activeMenu === '/nutrition-tracking' }" @click="closeSidebarDrawer">
            <span class="icon">🥗</span>
            <span>营养追踪</span>
          </router-link>
          <router-link to="/user-profile-manage" class="menu-item" :class="{ active: activeMenu === '/user-profile-manage' }" @click="closeSidebarDrawer">
            <span class="icon">👤</span>
            <span>个人资料</span>
          </router-link>
          <router-link to="/settings" class="menu-item bottom-menu-item" :class="{ active: activeMenu === '/settings' }" @click="closeSidebarDrawer">
            <span class="icon">⚙️</span>
            <span>设置</span>
          </router-link>
        </nav>
      </aside>

      <!-- 主内容区 -->
      <div class="main-container">
        <!-- 浮动操作按钮区域 -->
        <div class="floating-actions">
          <!-- 用户按钮 -->
          <div class="user-fab">
            <button class="fab-button user-btn" @click="toggleUserMenu" title="用户">
              <span class="icon">👤</span>
            </button>
            <div class="user-dropdown-menu" v-if="showUserMenu">
              <div class="dropdown-user-info">
                <div class="dropdown-avatar">👤</div>
                <span class="dropdown-username">{{ currentUser?.username || '用户' }}</span>
              </div>
              <div class="dropdown-divider"></div>
              <router-link to="/user-profile-manage" class="dropdown-item" @click="showUserMenu = false">
                <span class="dropdown-icon">👤</span>
                个人资料
              </router-link>
              <router-link to="/settings" class="dropdown-item" @click="showUserMenu = false">
                <span class="dropdown-icon">⚙️</span>
                设置
              </router-link>
              <div class="dropdown-divider"></div>
              <a href="#" class="dropdown-item logout" @click="handleLogout">
                <span class="dropdown-icon">🚪</span>
                退出登录
              </a>
            </div>
          </div>
          
          <!-- 主题切换按钮 -->
          <ThemeSwitcher />
          
          <!-- 侧边栏切换按钮 -->
          <button class="fab-button" @click="toggleSidebarDrawer" :class="{ 'active': sidebarDrawerOpen }" title="菜单">
            <span class="icon">☰</span>
          </button>
        </div>

        <!-- 页面内容 -->
        <main class="page-content">
          <router-view v-slot="{ Component }">
            <transition name="slide-fade" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </main>
      </div>
    </template>

    <!-- 登录页面直接显示内容 -->
    <template v-else>
      <router-view v-slot="{ Component }">
        <transition name="slide-fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </template>
    
    <!-- 错误监控组件：开发环境可点击 🐛 查看错误日志 -->
    <ErrorMonitor />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, defineAsyncComponent } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useFitnessStore } from './stores/fitness'
import { useUserStore } from './stores/user'
import ErrorMonitor from './components/ErrorMonitor.vue'

// 懒加载非关键组件 - 减少首屏JavaScript
const ParticleBackground = defineAsyncComponent(() => 
  import('./components/ParticleBackground.vue')
)
const RouteLoadingIndicator = defineAsyncComponent(() => 
  import('./components/RouteLoadingIndicator.vue')
)
const ThemeSwitcher = defineAsyncComponent(() => 
  import('./components/ThemeSwitcher.vue')
)

// 路由和状态管理
const route = useRoute()
const router = useRouter()
const fitnessStore = useFitnessStore()
const userStore = useUserStore()

// 响应式数据
const currentUser = ref(null)
const showUserMenu = ref(false)
const sidebarDrawerOpen = ref(false)

// 计算属性
const activeMenu = computed(() => route.path)

// 判断是否为登录页面
const isLoginPage = computed(() => route.path === '/login')

// 抽屉控制方法
const toggleSidebarDrawer = () => {
  sidebarDrawerOpen.value = !sidebarDrawerOpen.value
}

const closeSidebarDrawer = () => {
  sidebarDrawerOpen.value = false
}

const toggleUserMenu = () => {
  showUserMenu.value = !showUserMenu.value
}

const handleLogout = async () => {
  try {
    await userStore.logout()
    router.push('/login')
  } catch (error) {
    console.error('退出登录失败:', error)
  }
}

// 监听路由变化
watch(
  () => route.path,
  () => {
    showUserMenu.value = false
    // 路由变化时关闭侧边栏
    sidebarDrawerOpen.value = false
  }
)

// 监听点击外部关闭用户菜单
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

const handleClickOutside = (event) => {
  if (!event.target.closest('.user-fab')) {
    showUserMenu.value = false
  }
}

// 初始化用户数据
onMounted(async () => {
  try {
    if (userStore.token) {
      await userStore.getCurrentUser()
      currentUser.value = userStore.user
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
  }
})
</script>

<style scoped>
/* =====================================================
   App 容器 - 明亮炫酷科技风格
   ===================================================== */

.app-container {
  display: flex;
  height: 100vh;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  position: relative;
  background: var(--bg-page);
}

/* 抽屉遮罩层 */
.drawer-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--bg-overlay);
  backdrop-filter: blur(8px);
  z-index: 999;
  opacity: 1;
  transition: opacity 0.3s ease;
}

/* 用户菜单遮罩层 */
.user-menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 899;
}

/* 用户浮动按钮 */
.user-fab {
  position: relative;
}

.user-btn {
  background: var(--glass-bg);
  border: 1px solid var(--border-brand);
}

.user-btn:hover {
  border-color: var(--brand-primary);
  box-shadow: var(--shadow-brand);
}

/* 用户下拉菜单 - 从按钮上方弹出 */
.user-dropdown-menu {
  position: absolute;
  bottom: calc(100% + 12px);
  right: 0;
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  border: 1px solid var(--glass-border);
  border-radius: 14px;
  box-shadow: var(--shadow-lg);
  min-width: 180px;
  overflow: hidden;
  animation: dropdownSlideUp 0.25s ease;
  z-index: 1001;
}

@keyframes dropdownSlideUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dropdown-user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 18px;
  background: var(--hover-bg);
  border-bottom: 1px solid var(--border-default);
}

.dropdown-avatar {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: var(--brand-gradient);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: white;
  box-shadow: var(--shadow-brand);
}

.dropdown-username {
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 600;
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dropdown-divider {
  height: 1px;
  background: var(--border-default);
  margin: 4px 0;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 18px;
  color: var(--text-secondary);
  text-decoration: none;
  transition: all 0.2s ease;
  font-size: 14px;
}

.dropdown-item:hover {
  background: var(--hover-bg);
  color: var(--text-primary);
}

.dropdown-item.logout {
  color: var(--color-danger);
}

.dropdown-item.logout:hover {
  background: rgba(239, 68, 68, 0.1);
  color: #dc2626;
}

.dropdown-icon {
  font-size: 16px;
}

/* 侧边栏抽屉 - 统一主题 */
.sidebar-drawer {
  position: fixed;
  top: 0;
  left: -280px;
  width: 280px;
  height: 100vh;
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  color: var(--text-primary);
  transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-lg);
  border-right: 1px solid var(--glass-border);
}

.sidebar-drawer::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 2px;
  height: 100%;
  background: var(--brand-gradient);
  opacity: 0.5;
}

.sidebar-drawer.drawer-open {
  left: 0;
}

.drawer-header {
  padding: 24px 20px;
  border-bottom: 1px solid var(--border-default);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--hover-bg);
}

.drawer-header h2 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  background: var(--brand-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.drawer-header h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.drawer-close {
  background: var(--hover-bg);
  border: 1px solid var(--border-default);
  color: var(--text-tertiary);
  font-size: 20px;
  cursor: pointer;
  padding: 0;
  border-radius: 8px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.drawer-close:hover {
  background: rgba(239, 68, 68, 0.1);
  border-color: var(--color-danger);
  color: var(--color-danger);
  box-shadow: 0 0 15px rgba(239, 68, 68, 0.2);
}

.sidebar-menu {
  flex: 1;
  padding: 16px 0;
  overflow-y: auto;
}

/* 菜单项 - 统一主题风格 */
.menu-item {
  display: flex;
  align-items: center;
  padding: 14px 20px;
  color: var(--text-secondary);
  text-decoration: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 0 16px 16px 0;
  margin: 4px 0 4px 8px;
  position: relative;
  overflow: hidden;
  font-size: 14px;
  font-weight: 500;
}

.menu-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: 3px;
  background: var(--brand-gradient);
  transform: scaleY(0);
  transition: transform 0.3s ease;
}

.menu-item::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, var(--hover-bg), transparent);
  transition: left 0.5s;
}

.menu-item:hover {
  background: var(--hover-bg);
  color: var(--text-primary);
  transform: translateX(4px);
}

.menu-item:hover::before {
  transform: scaleY(1);
}

.menu-item:hover::after {
  left: 100%;
}

.menu-item.active {
  background: var(--active-bg);
  color: var(--text-primary);
  transform: translateX(4px);
}

.menu-item.active::before {
  transform: scaleY(1);
  box-shadow: var(--shadow-brand);
}

.menu-item .icon {
  margin-right: 12px;
  font-size: 1.1rem;
  width: 24px;
  text-align: center;
  filter: grayscale(0.3);
  transition: filter 0.3s;
}

.menu-item:hover .icon,
.menu-item.active .icon {
  filter: grayscale(0) drop-shadow(0 0 8px var(--brand-primary));
}

.bottom-menu-item {
  margin-top: auto;
}

/* 主内容区 */
.main-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  width: 100%;
}

/* 浮动操作按钮 - 统一主题风格 */
.floating-actions {
  position: fixed;
  bottom: 24px;
  right: 24px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  z-index: 900;
}

.fab-button {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: var(--glass-bg);
  backdrop-filter: blur(10px);
  border: 1px solid var(--border-brand);
  color: var(--text-secondary);
  font-size: 20px;
  cursor: pointer;
  box-shadow: var(--shadow-md);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.fab-button::before {
  content: '';
  position: absolute;
  inset: -2px;
  background: var(--brand-gradient);
  background-size: 400% 400%;
  border-radius: 18px;
  z-index: -1;
  opacity: 0;
  transition: opacity 0.3s;
  animation: gradient-rotate 4s ease infinite;
}

@keyframes gradient-rotate {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.fab-button:hover::before {
  opacity: 0.8;
}

.fab-button:hover {
  transform: translateY(-4px) scale(1.05);
  box-shadow: var(--shadow-lg);
  border-color: transparent;
  color: var(--text-inverse);
}

.fab-button.active {
  background: var(--brand-gradient);
  border-color: transparent;
  transform: scale(1.1);
  color: var(--text-inverse);
  box-shadow: var(--shadow-brand);
}

.fab-button .icon {
  font-size: 22px;
  z-index: 1;
  filter: drop-shadow(0 0 4px var(--brand-primary));
}

/* 页面内容 */
.page-content {
  flex: 1;
  padding: 24px;
  background: transparent;
  overflow-y: auto;
  width: 100%;
  box-sizing: border-box;
  min-height: 100vh;
  position: relative;
  z-index: 10;
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 现代化过渡效果 */
.slide-fade-enter-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-fade-leave-active {
  transition: all 0.25s cubic-bezier(0.4, 0, 1, 1);
}

.slide-fade-enter-from {
  transform: translateX(30px);
  opacity: 0;
}

.slide-fade-leave-to {
  transform: translateX(-20px);
  opacity: 0;
}

/* =====================================================
   响应式设计
   ===================================================== */

@media (max-width: 1200px) {
  .sidebar-drawer {
    width: 260px;
    left: -260px;
  }
  
  .floating-actions {
    bottom: 20px;
    right: 20px;
  }
  
  .fab-button {
    width: 52px;
    height: 52px;
  }
}

@media (max-width: 768px) {
  .sidebar-drawer {
    width: 260px;
    left: -260px;
  }
  
  .floating-actions {
    bottom: 16px;
    right: 16px;
    gap: 12px;
  }
  
  .fab-button {
    width: 50px;
    height: 50px;
    border-radius: 14px;
  }
  
  .user-dropdown-menu {
    min-width: 160px;
  }
  
  .dropdown-user-info {
    padding: 12px 14px;
  }
  
  .dropdown-avatar {
    width: 32px;
    height: 32px;
    font-size: 14px;
  }
  
  .dropdown-item {
    padding: 12px 14px;
    font-size: 13px;
  }
  
  .page-content {
    padding: 16px;
  }
  
  .menu-item {
    padding: 12px 16px;
    margin: 3px 0 3px 6px;
  }
  
  .drawer-header {
    padding: 18px 16px;
  }
}

@media (max-width: 480px) {
  .sidebar-drawer {
    width: 240px;
    left: -240px;
  }
  
  .drawer-header {
    padding: 14px;
  }
  
  .drawer-header h2 {
    font-size: 1rem;
  }
  
  .menu-item {
    padding: 10px 12px;
    font-size: 13px;
  }
  
  .menu-item .icon {
    font-size: 1rem;
    margin-right: 10px;
  }
  
  .floating-actions {
    bottom: 14px;
    right: 14px;
    gap: 10px;
  }
  
  .fab-button {
    width: 46px;
    height: 46px;
    border-radius: 12px;
  }
  
  .fab-button .icon {
    font-size: 18px;
  }
  
  .user-dropdown-menu {
    min-width: 150px;
  }
  
  .dropdown-user-info {
    padding: 10px 12px;
    gap: 10px;
  }
  
  .dropdown-avatar {
    width: 28px;
    height: 28px;
    font-size: 12px;
  }
  
  .dropdown-username {
    font-size: 13px;
  }
  
  .dropdown-item {
    padding: 10px 12px;
    font-size: 12px;
  }
  
  .page-content {
    padding: 12px;
  }
}

/* 超小屏幕优化 */
@media (max-width: 360px) {
  .sidebar-drawer {
    width: 220px;
    left: -220px;
  }
  
  .menu-item {
    padding: 8px 10px;
  }
  
  .drawer-header h2 {
    font-size: 0.9rem;
  }
  
  .floating-actions {
    bottom: 10px;
    right: 10px;
  }
  
  .fab-button {
    width: 42px;
    height: 42px;
    border-radius: 10px;
  }
  
  .fab-button .icon {
    font-size: 16px;
  }
  
  .page-content {
    padding: 10px;
  }
}

/* 横屏模式优化 */
@media (max-height: 500px) and (orientation: landscape) {
  .sidebar-drawer {
    top: 0;
    height: 100vh;
  }
  
  .floating-actions {
    bottom: 10px;
    right: 10px;
    flex-direction: row;
    gap: 10px;
  }
  
  .fab-button {
    width: 42px;
    height: 42px;
  }
}

/* 触摸设备优化 */
@media (hover: none) and (pointer: coarse) {
  .fab-button {
    min-width: 48px;
    min-height: 48px;
  }
  
  .menu-item {
    min-height: 48px;
  }
  
  .dropdown-item {
    min-height: 44px;
  }
}

/* 高分辨率屏幕优化 */
@media (min-resolution: 2dppx) {
  .fab-button {
    box-shadow: 
      0 4px 20px rgba(0, 0, 0, 0.4),
      0 0 25px rgba(99, 102, 241, 0.25);
  }
  
  .sidebar-drawer {
    box-shadow: 
      2px 0 35px rgba(99, 102, 241, 0.35),
      0 0 70px rgba(0, 0, 0, 0.5);
  }
  
  .user-dropdown-menu {
    box-shadow: 
      0 -10px 45px rgba(0, 0, 0, 0.6),
      0 0 35px rgba(128, 32, 255, 0.25);
  }
}
</style>