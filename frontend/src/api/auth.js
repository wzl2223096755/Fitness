/**
 * 认证 API - 真实后端版本
 */
import axios from 'axios'

// 创建axios实例
const api = axios.create({
  baseURL: '/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  response => {
    return response.data
  },
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const authApi = {
  /**
   * 用户登录
   */
  login: async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials)
      if (response.code === 200 && response.data) {
        // 保存token
        localStorage.setItem('token', response.data.accessToken)
        if (response.data.refreshToken) {
          localStorage.setItem('refreshToken', response.data.refreshToken)
        }
        return {
          success: true,
          data: response.data
        }
      }
      return {
        success: false,
        message: response.message || '登录失败'
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || '网络错误，请重试'
      }
    }
  },

  /**
   * 用户登出
   */
  logout: async () => {
    try {
      await api.post('/auth/logout')
    } catch (error) {
      // 即使登出接口失败，也要清除本地token
    } finally {
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
    }
  }
}

export default authApi
