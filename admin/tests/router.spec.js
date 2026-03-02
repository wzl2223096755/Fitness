/**
 * 管理端路由基础测试
 */
import { describe, it, expect } from 'vitest'
import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  { path: '/login', name: 'AdminLogin', meta: { requiresAuth: false } },
  { path: '/', redirect: '/dashboard' },
  { path: '/dashboard', name: 'AdminDashboard', meta: { requiresAuth: true } },
  { path: '/users', name: 'UserManagement', meta: { requiresAuth: true } },
]

describe('Admin router', () => {
  it('creates router with admin routes', () => {
    const router = createRouter({
      history: createWebHashHistory(),
      routes,
    })
    expect(router.getRoutes()).toBeDefined()
    const routeList = router.getRoutes()
    expect(routeList.some((r) => r.name === 'AdminLogin')).toBe(true)
    expect(routeList.some((r) => r.name === 'AdminDashboard')).toBe(true)
  })

  it('login route does not require auth', () => {
    const loginRoute = routes.find((r) => r.name === 'AdminLogin')
    expect(loginRoute?.meta?.requiresAuth).toBe(false)
  })

  it('dashboard route requires auth', () => {
    const dashboardRoute = routes.find((r) => r.name === 'AdminDashboard')
    expect(dashboardRoute?.meta?.requiresAuth).toBe(true)
  })
})
