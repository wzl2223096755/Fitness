/**
 * 共享认证 API - 供管理端与需要 getCurrentUser 的模块使用
 */
import request from './request.js'

export const authApi = {
  async login(credentials) {
    try {
      const response = await request.post('/api/v1/auth/login', credentials)
      if (response && response.code === 200 && response.data) {
        const d = response.data
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('token', d.accessToken || d.token)
          if (d.refreshToken) localStorage.setItem('refreshToken', d.refreshToken)
        }
        return { success: true, data: { ...d, accessToken: d.accessToken || d.token } }
      }
      return {
        success: false,
        message: (response && response.message) || '登录失败'
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message || '网络错误，请重试'
      }
    }
  },

  async logout() {
    try {
      await request.post('/api/v1/auth/logout')
    } catch (e) {
      // ignore
    } finally {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('token')
        localStorage.removeItem('refreshToken')
      }
    }
  },

  async getCurrentUser() {
    const res = await request.get('/api/v1/users/current')
    return res
  }
}

export default authApi
