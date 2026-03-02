// 全局错误处理器
import { captureError, addBreadcrumb } from './errorMonitoring.js'

/**
 * 完整的错误码映射表
 * 包含 HTTP 状态码和自定义业务错误码
 */
export const errorMessages = {
  // HTTP 标准错误码
  400: '请求参数错误，请检查输入',
  401: '登录已过期，请重新登录',
  403: '您没有权限执行此操作',
  404: '请求的资源不存在',
  405: '请求方法不被允许',
  408: '请求超时，请稍后重试',
  409: '数据冲突，请刷新后重试',
  410: '请求的资源已被永久删除',
  413: '上传的文件过大',
  415: '不支持的媒体类型',
  422: '数据验证失败',
  429: '请求过于频繁，请稍后再试',
  500: '服务器内部错误，请稍后重试',
  502: '服务暂时不可用，请稍后重试',
  503: '系统维护中，请稍后重试',
  504: '网关超时，请稍后重试',
  
  // 自定义网络错误码
  NETWORK_ERROR: '网络连接失败，请检查网络',
  TIMEOUT: '请求超时，请稍后重试',
  OFFLINE: '网络连接已断开，请检查网络连接',
  UNKNOWN: '发生未知错误，请联系管理员',
  CANCELLED: '请求已取消',
  
  // 业务错误码
  TOKEN_EXPIRED: '登录已过期，请重新登录',
  TOKEN_INVALID: '登录凭证无效，请重新登录',
  PERMISSION_DENIED: '没有权限执行此操作',
  RESOURCE_NOT_FOUND: '请求的资源不存在',
  VALIDATION_ERROR: '数据验证失败，请检查输入',
  DUPLICATE_ERROR: '数据已存在，请勿重复提交',
  RATE_LIMITED: '操作过于频繁，请稍后再试',
  SERVER_ERROR: '服务器错误，请稍后重试',
  MAINTENANCE: '系统维护中，请稍后访问'
}

/**
 * 根据错误码获取用户友好的错误消息
 * @param {number|string} code - 错误码
 * @param {string} defaultMessage - 默认消息
 * @returns {string} 用户友好的错误消息
 */
export function getErrorMessage(code, defaultMessage = '') {
  return errorMessages[code] || defaultMessage || errorMessages.UNKNOWN
}

/**
 * 判断是否为网络相关错误
 * @param {number|string} code - 错误码
 * @returns {boolean}
 */
export function isNetworkError(code) {
  return ['NETWORK_ERROR', 'TIMEOUT', 'OFFLINE', 502, 503, 504].includes(code)
}

/**
 * 判断是否为认证相关错误
 * @param {number|string} code - 错误码
 * @returns {boolean}
 */
export function isAuthError(code) {
  return [401, 'TOKEN_EXPIRED', 'TOKEN_INVALID'].includes(code)
}

/**
 * 判断是否为权限相关错误
 * @param {number|string} code - 错误码
 * @returns {boolean}
 */
export function isPermissionError(code) {
  return [403, 'PERMISSION_DENIED'].includes(code)
}

/**
 * 判断是否为可重试的错误
 * @param {number|string} code - 错误码
 * @returns {boolean}
 */
export function isRetryableError(code) {
  return [408, 429, 500, 502, 503, 504, 'NETWORK_ERROR', 'TIMEOUT'].includes(code)
}

class ErrorHandler {
  static handle(error, context = '') {
    console.error(`[Error${context ? ` in ${context}` : ''}]:`, error)
    
    addBreadcrumb({
      category: 'error',
      message: `Error in ${context || 'unknown context'}`,
      level: 'error',
      data: { errorMessage: error.message }
    })
    
    if (error.response) {
      return this.handleApiError(error.response, context)
    }
    
    if (error.request) {
      return this.handleNetworkError(error, context)
    }
    
    return this.handleGenericError(error, context)
  }
  
  static handleApiError(response, context) {
    const { status, data } = response
    let message = getErrorMessage(status, data?.message)
    let errorCode = status
    
    // 处理业务错误码（后端返回的自定义错误码）
    if (data?.code && data.code !== status) {
      const businessMessage = getErrorMessage(data.code)
      if (businessMessage !== errorMessages.UNKNOWN) {
        message = businessMessage
        errorCode = data.code
      }
    }
    
    // 特殊处理：使用后端返回的具体错误消息
    if (data?.message && data.message !== message) {
      message = data.message
    }
    
    // 处理认证错误
    if (isAuthError(status)) {
      this.handleAuthError()
    }
    
    this.logError({
      type: 'API_ERROR',
      status,
      errorCode,
      message,
      url: response.config?.url,
      method: response.config?.method,
      context,
      timestamp: new Date().toISOString()
    })
    
    return {
      success: false,
      message,
      code: errorCode,
      data: data,
      retryable: isRetryableError(status)
    }
  }
  
  static handleNetworkError(error, context) {
    let code = 'NETWORK_ERROR'
    let message = errorMessages.NETWORK_ERROR
    
    // 判断具体的网络错误类型
    if (!navigator.onLine) {
      code = 'OFFLINE'
      message = errorMessages.OFFLINE
    } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      code = 'TIMEOUT'
      message = errorMessages.TIMEOUT
    } else if (error.message?.includes('cancel')) {
      code = 'CANCELLED'
      message = errorMessages.CANCELLED
    }
    
    this.logError({
      type: 'NETWORK_ERROR',
      code,
      message: error.message,
      context,
      timestamp: new Date().toISOString()
    })
    
    return {
      success: false,
      message,
      code,
      retryable: code !== 'CANCELLED'
    }
  }
  
  static handleGenericError(error, context) {
    const message = error.message || errorMessages.UNKNOWN
    
    this.logError({
      type: 'GENERIC_ERROR',
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString()
    })
    
    return {
      success: false,
      message,
      code: 'GENERIC_ERROR',
      retryable: false
    }
  }
  
  static handleAuthError() {
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('userInfo')
    localStorage.removeItem('isLoggedIn')
    
    if (!window.location.pathname.includes('/login')) {
      setTimeout(() => {
        window.location.href = '/login'
      }, 1500)
    }
  }
  
  static logError(errorInfo) {
    if (import.meta.env.DEV) {
      console.group('🚨 Error Details')
      console.error('Type:', errorInfo.type)
      console.error('Message:', errorInfo.message)
      console.error('Context:', errorInfo.context)
      console.groupEnd()
    }
    
    captureError(new Error(errorInfo.message), {
      type: errorInfo.type,
      context: errorInfo.context,
      url: errorInfo.url,
      method: errorInfo.method,
      status: errorInfo.status
    })
    
    this.storeErrorLog(errorInfo)
  }
  
  static storeErrorLog(errorInfo) {
    try {
      const logs = JSON.parse(localStorage.getItem('errorLogs') || '[]')
      logs.push(errorInfo)
      
      if (logs.length > 50) {
        logs.splice(0, logs.length - 50)
      }
      
      localStorage.setItem('errorLogs', JSON.stringify(logs))
    } catch (e) {
      console.warn('Failed to store error log:', e)
    }
  }
  
  static getErrorLogs() {
    try {
      return JSON.parse(localStorage.getItem('errorLogs') || '[]')
    } catch (e) {
      return []
    }
  }
  
  static clearErrorLogs() {
    localStorage.removeItem('errorLogs')
  }
}

// 响应数据标准化处理器
class ResponseHandler {
  static normalize(response) {
    if (typeof response === 'boolean') {
      return {
        success: response,
        data: null,
        message: response ? '操作成功' : '操作失败'
      }
    }
    
    if (response && typeof response === 'object') {
      if (Object.prototype.hasOwnProperty.call(response, 'success')) {
        return response
      }
      
      return {
        success: true,
        data: response,
        message: '操作成功'
      }
    }
    
    return {
      success: true,
      data: response,
      message: '操作成功'
    }
  }
  
  static isSuccess(response) {
    const normalized = this.normalize(response)
    return normalized.success === true
  }
  
  static getData(response) {
    const normalized = this.normalize(response)
    return normalized.data
  }
  
  static getMessage(response) {
    const normalized = this.normalize(response)
    return normalized.message
  }
}

// API调用包装器
export const apiWrapper = {
  async request(requestFn, context = '') {
    try {
      const response = await requestFn()
      return ResponseHandler.normalize(response)
    } catch (error) {
      return ErrorHandler.handle(error, context)
    }
  },
  
  async get(url, params = {}, context = '') {
    return this.request(() => import('../api/request.js').then(m => m.get(url, params)), context)
  },
  
  async post(url, data = {}, context = '') {
    return this.request(() => import('../api/request.js').then(m => m.post(url, data)), context)
  },
  
  async put(url, data = {}, context = '') {
    return this.request(() => import('../api/request.js').then(m => m.put(url, data)), context)
  },
  
  async delete(url, params = {}, context = '') {
    return this.request(() => import('../api/request.js').then(m => m.del(url, params)), context)
  }
}

export { ErrorHandler, ResponseHandler }

// 错误码工具函数（errorMessages、getErrorMessage、isNetworkError 等已在上面用 export 导出）
