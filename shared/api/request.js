/**
 * 共享请求模块 - 基于 axios 的 API 客户端
 * 供用户端 frontend 与管理端 admin 共用
 */
import axios from 'axios'

const baseURL = typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL
  ? import.meta.env.VITE_API_BASE_URL
  : ''

const request = axios.create({
  baseURL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
})

// 请求拦截：附加 Token
request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (err) => Promise.reject(err)
)

// 401 时尝试用 refreshToken 换新 accessToken，仅一次，避免递归
let refreshPromise = null
const REFRESH_URL = '/api/v1/auth/refresh'

function doRefresh() {
  if (refreshPromise) return refreshPromise
  const refreshToken = typeof localStorage !== 'undefined' ? localStorage.getItem('refreshToken') : null
  if (!refreshToken) {
    return Promise.resolve(null)
  }
  refreshPromise = axios
    .post((baseURL || '') + REFRESH_URL, { refreshToken }, { timeout: 10000 })
    .then((res) => {
      const data = res.data || res
      const token = data?.data?.accessToken ?? data?.accessToken
      if (token && typeof localStorage !== 'undefined') {
        localStorage.setItem('token', token)
      }
      return token
    })
    .catch(() => null)
    .finally(() => {
      refreshPromise = null
    })
  return refreshPromise
}

function clearAuthAndRedirect() {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
  }
  if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
    window.location.href = '/#/login'
  }
}

// 响应拦截：统一解包 data；401 时尝试刷新 Token 并重试一次
request.interceptors.response.use(
  (response) => {
    const data = response.data
    if (data && typeof data === 'object' && 'code' in data) {
      return data
    }
    return { code: 200, data: data, message: 'success' }
  },
  async (error) => {
    const originalRequest = error.config
    if (error.response?.status !== 401) {
      return Promise.reject(error)
    }
    // 若是刷新接口本身 401，直接登出
    if (originalRequest?.url?.includes(REFRESH_URL) || originalRequest?.__isRetry) {
      clearAuthAndRedirect()
      return Promise.reject(error)
    }
    const newToken = await doRefresh()
    if (newToken) {
      originalRequest.headers = originalRequest.headers || {}
      originalRequest.headers.Authorization = `Bearer ${newToken}`
      originalRequest.__isRetry = true
      return request(originalRequest)
    }
    clearAuthAndRedirect()
    return Promise.reject(error)
  }
)

function get(url, params) {
  return request.get(url, { params }).then((res) => res?.data !== undefined ? res : { code: 200, data: res })
}

function post(url, data) {
  return request.post(url, data).then((res) => res?.data !== undefined ? res : { code: 200, data: res })
}

function put(url, data) {
  return request.put(url, data).then((res) => res?.data !== undefined ? res : { code: 200, data: res })
}

function del(url) {
  return request.delete(url).then((res) => res?.data !== undefined ? res : { code: 200, data: res })
}

function upload(url, file, fieldName = 'file') {
  const form = new FormData()
  form.append(fieldName, file)
  return request.post(url, form, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then((res) => res?.data !== undefined ? res : { code: 200, data: res })
}

export { get, post, put, del, upload }
export default request
