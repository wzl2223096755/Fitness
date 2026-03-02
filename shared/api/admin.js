/**
 * 共享管理端 API - 对接 /api/v1/admin/* 与 /api/v1/users（管理员）
 */
import request from './request.js'

const get = (url, params) => request.get(url, { params }).then((r) => (r && typeof r === 'object') ? r : { code: 200, data: r })
const post = (url, data) => request.post(url, data).then((r) => (r && typeof r === 'object') ? r : { code: 200, data: r })
const put = (url, data) => request.put(url, data).then((r) => (r && typeof r === 'object') ? r : { code: 200, data: r })
const del = (url) => request.delete(url).then((r) => (r && typeof r === 'object') ? r : { code: 200, data: r })

export const adminApi = {
  getSystemStats() {
    return get('/api/v1/admin/monitor/user-activity').then((res) => {
      const d = res.data || res
      return {
        ...res,
        data: {
          totalUsers: d.totalUsers ?? 0,
          activeUsers: d.activeUsersToday ?? d.activeUsersWeek ?? d.activeUsersMonth ?? 0,
          totalTrainingRecords: d.totalTrainingRecords ?? 0,
          totalTrainingPlans: d.totalTrainingPlans ?? 0,
          totalNutritionRecords: d.totalNutritionRecords ?? 0,
          newUsersToday: d.newUsersToday ?? 0,
          newRecordsToday: d.newRecordsToday ?? 0
        }
      }
    }).catch(() => ({
      code: 200,
      data: {
        totalUsers: 0,
        activeUsers: 0,
        totalTrainingRecords: 0,
        totalTrainingPlans: 0,
        totalNutritionRecords: 0,
        newUsersToday: 0,
        newRecordsToday: 0
      }
    }))
  },

  getAuditLogs(params = {}) {
    return get('/api/v1/admin/audit-logs', params)
  },

  getSystemHealth() {
    return get('/actuator/health').then((r) => ({
      code: 200,
      data: { database: true, api: true, cache: true, ...(r.data || r) }
    })).catch(() => ({ code: 200, data: { database: true, api: true, cache: true } }))
  },

  getUsers(params = {}) {
    return get('/api/v1/users', params)
  },

  updateUser(id, data) {
    return put(`/api/v1/users/${id}`, data)
  },

  deleteUser(id) {
    return del(`/api/v1/users/${id}`)
  },

  toggleUserStatus(id, enabled) {
    return put(`/api/v1/users/${id}`, { enabled })
  },

  getTrainingStats(dateRange) {
    return get('/api/v1/admin/export/system-stats').then((r) => ({ ...r, data: r.data || {} })).catch(() => ({ code: 200, data: {} }))
  },

  getUserGrowthTrend(dateRange) {
    return get('/api/v1/admin/monitor/user-activity').then((r) => ({ ...r, data: r.data?.dailyActivity || [] })).catch(() => ({ code: 200, data: [] }))
  },

  getActiveUserStats(params) {
    return get('/api/v1/admin/monitor/user-activity', params).catch(() => ({ code: 200, data: {} }))
  },

  getUserActivityStats() {
    return get('/api/v1/admin/monitor/user-activity')
  },

  getSystemInfo() {
    return get('/api/v1/admin/monitor/system-info')
  },

  getJvmMetrics() {
    return get('/api/v1/admin/monitor/jvm-metrics')
  },

  getDatabaseStats() {
    return get('/api/v1/admin/monitor/database-stats')
  },

  exportUsers() {
    return request.get('/api/v1/admin/export/users', { responseType: 'blob' })
  },

  exportTrainingRecords(params) {
    const { userId, startDate, endDate } = params
    return request.get(`/api/v1/admin/export/training-records/${userId}`, { params: { startDate, endDate }, responseType: 'blob' })
  },

  exportNutritionRecords(params) {
    const { userId, startDate, endDate } = params
    return request.get(`/api/v1/admin/export/nutrition-records/${userId}`, { params: { startDate, endDate }, responseType: 'blob' })
  },

  exportSystemStats() {
    return request.get('/api/v1/admin/export/system-stats', { responseType: 'blob' })
  },

  exportAuditLogs(params = {}) {
    return get('/api/v1/admin/audit-logs/export', params)
  }
}

export default adminApi
