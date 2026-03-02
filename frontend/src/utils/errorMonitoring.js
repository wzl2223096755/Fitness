/**
 * 前端错误监控服务
 * 集成Sentry进行错误追踪和上报
 */
let Sentry

// 错误监控配置
const ERROR_MONITORING_CONFIG = {
  // Sentry DSN - 在生产环境中应该从环境变量获取
  dsn: import.meta.env.VITE_SENTRY_DSN || '',
  // 环境标识
  environment: import.meta.env.MODE || 'development',
  // 是否启用错误监控
  enabled: import.meta.env.PROD || import.meta.env.VITE_ENABLE_SENTRY === 'true',
  // 采样率 (0.0 - 1.0)
  tracesSampleRate: import.meta.env.PROD ? 0.2 : 1.0,
  // 是否在控制台输出调试信息
  debug: import.meta.env.DEV,
  // 最大面包屑数量
  maxBreadcrumbs: 50,
  // 是否附加堆栈跟踪
  attachStacktrace: true
}

/**
 * 初始化错误监控服务
 * @param {Object} app - Vue应用实例
 * @param {Object} router - Vue Router实例
 */
 export function initErrorMonitoring(app, router) {
  // 如果没有配置DSN且不是开发环境，使用本地错误处理
  if (!ERROR_MONITORING_CONFIG.dsn && !ERROR_MONITORING_CONFIG.enabled) {
    console.log('[ErrorMonitoring] Sentry DSN未配置，使用本地错误处理')
    setupLocalErrorHandling(app)
    return
  }

  // 初始化Sentry
  if (ERROR_MONITORING_CONFIG.dsn) {
    ;(async () => {
      if (!Sentry) {
        const mod = await import('@sentry/vue')
        Sentry = mod
      }

      const integrations = [Sentry.browserTracingIntegration({ router })]

      if (typeof Sentry.replayIntegration === 'function') {
        integrations.push(
          Sentry.replayIntegration({
            maskAllText: false,
            blockAllMedia: false
          })
        )
      }

      Sentry.init({
        app,
        dsn: ERROR_MONITORING_CONFIG.dsn,
        environment: ERROR_MONITORING_CONFIG.environment,
        integrations,
        tracesSampleRate: ERROR_MONITORING_CONFIG.tracesSampleRate,
        replaysSessionSampleRate: 0.1,
        replaysOnErrorSampleRate: 1.0,
        debug: ERROR_MONITORING_CONFIG.debug,
        maxBreadcrumbs: ERROR_MONITORING_CONFIG.maxBreadcrumbs,
        attachStacktrace: ERROR_MONITORING_CONFIG.attachStacktrace,
        beforeSend(event, hint) {
          // 在发送前可以过滤或修改事件
          return filterSensitiveData(event)
        }
      })
      console.log('[ErrorMonitoring] Sentry已初始化')
    })().catch((error) => {
      console.warn('[ErrorMonitoring] Sentry初始化失败，已降级为本地错误处理:', error)
    })
  }

  // 设置Vue错误处理器
  setupVueErrorHandler(app)
  
  // 设置全局错误捕获
  setupGlobalErrorHandlers()
}

/**
 * 设置Vue错误处理器
 */
function setupVueErrorHandler(app) {
  app.config.errorHandler = (err, instance, info) => {
    const componentName = instance?.$options?.name || instance?.$.type?.name || 'Unknown'
    
    const errorContext = {
      componentName,
      lifecycleHook: info,
      props: instance?.$props,
      route: instance?.$route?.fullPath
    }

    // 上报到Sentry
    if (ERROR_MONITORING_CONFIG.dsn && Sentry) {
      Sentry.withScope((scope) => {
        scope.setTag('error_type', 'vue_error')
        scope.setTag('component', componentName)
        scope.setExtra('lifecycle_hook', info)
        scope.setExtra('component_props', errorContext.props)
        scope.setExtra('route', errorContext.route)
        Sentry.captureException(err)
      })
    }

    // 本地日志记录
    logErrorLocally({
      type: 'VUE_ERROR',
      message: err.message,
      stack: err.stack,
      componentName,
      lifecycleHook: info,
      timestamp: new Date().toISOString()
    })

    // 开发环境输出详细信息
    if (import.meta.env.DEV) {
      console.group('🚨 Vue Error')
      console.error('Error:', err)
      console.error('Component:', componentName)
      console.error('Lifecycle Hook:', info)
      console.groupEnd()
    }
  }

  // 设置警告处理器（仅开发环境）
  if (import.meta.env.DEV) {
    app.config.warnHandler = (msg, instance, trace) => {
      console.warn('[Vue Warning]:', msg)
      if (trace) console.warn('Trace:', trace)
    }
  }
}

/**
 * 设置全局错误处理器
 */
function setupGlobalErrorHandlers() {
  // 捕获未处理的JavaScript错误
  window.addEventListener('error', (event) => {
    const { message, filename, lineno, colno, error } = event

    // 上报到Sentry
    if (ERROR_MONITORING_CONFIG.dsn && Sentry && error) {
      Sentry.withScope((scope) => {
        scope.setTag('error_type', 'uncaught_error')
        scope.setExtra('filename', filename)
        scope.setExtra('line', lineno)
        scope.setExtra('column', colno)
        Sentry.captureException(error)
      })
    }

    // 本地日志记录
    logErrorLocally({
      type: 'UNCAUGHT_ERROR',
      message,
      filename,
      lineno,
      colno,
      stack: error?.stack,
      timestamp: new Date().toISOString()
    })

    if (import.meta.env.DEV) {
      console.group('🚨 Uncaught Error')
      console.error('Message:', message)
      console.error('File:', filename)
      console.error('Line:', lineno, 'Column:', colno)
      console.groupEnd()
    }
  })

  // 捕获未处理的Promise rejection
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason

    // 上报到Sentry
    if (ERROR_MONITORING_CONFIG.dsn && Sentry) {
      Sentry.withScope((scope) => {
        scope.setTag('error_type', 'unhandled_rejection')
        if (error instanceof Error) {
          Sentry.captureException(error)
        } else {
          Sentry.captureMessage(`Unhandled Promise Rejection: ${String(error)}`)
        }
      })
    }

    // 本地日志记录
    logErrorLocally({
      type: 'UNHANDLED_REJECTION',
      message: error?.message || String(error),
      stack: error?.stack,
      timestamp: new Date().toISOString()
    })

    if (import.meta.env.DEV) {
      console.group('🚨 Unhandled Promise Rejection')
      console.error('Reason:', error)
      console.groupEnd()
    }
  })

  // 捕获资源加载错误
  window.addEventListener('error', (event) => {
    const target = event.target
    if (target && (target.tagName === 'IMG' || target.tagName === 'SCRIPT' || target.tagName === 'LINK')) {
      const resourceUrl = target.src || target.href

      // 上报到Sentry
      if (ERROR_MONITORING_CONFIG.dsn && Sentry) {
        Sentry.withScope((scope) => {
          scope.setTag('error_type', 'resource_error')
          scope.setTag('resource_type', target.tagName.toLowerCase())
          scope.setExtra('resource_url', resourceUrl)
          Sentry.captureMessage(`Resource load failed: ${resourceUrl}`)
        })
      }

      // 本地日志记录
      logErrorLocally({
        type: 'RESOURCE_ERROR',
        resourceType: target.tagName.toLowerCase(),
        resourceUrl,
        timestamp: new Date().toISOString()
      })
    }
  }, true)
}

/**
 * 设置本地错误处理（当Sentry未配置时使用）
 */
function setupLocalErrorHandling(app) {
  setupVueErrorHandler(app)
  setupGlobalErrorHandlers()
}

/**
 * 过滤敏感数据
 */
function filterSensitiveData(event) {
  // 过滤敏感字段
  const sensitiveFields = ['password', 'token', 'authorization', 'cookie', 'credit_card']
  
  if (event.request?.headers) {
    sensitiveFields.forEach(field => {
      if (event.request.headers[field]) {
        event.request.headers[field] = '[FILTERED]'
      }
    })
  }

  if (event.extra) {
    sensitiveFields.forEach(field => {
      if (event.extra[field]) {
        event.extra[field] = '[FILTERED]'
      }
    })
  }

  return event
}

/**
 * 本地错误日志记录
 */
function logErrorLocally(errorInfo) {
  // 过滤已知的噪声错误（例如 ECharts 在某些边界情况下抛出的 Canvas arc 负半径错误等）
  try {
    const msg = errorInfo?.message || ''
    if (typeof msg === 'string') {
      const noisePatterns = [
        "Failed to execute 'arc' on 'CanvasRenderingContext2D': The radius provided",
        "Cannot read properties of null (reading 'ce')" // Vue 内部渲染细节错误，通常对用户无感
      ]
      if (noisePatterns.some(pattern => msg.includes(pattern))) {
        if (import.meta.env.DEV) {
          console.warn('[ErrorMonitoring] 忽略噪声错误，不计入错误日志:', msg)
        }
        return
      }
    }
  } catch (e) {
    // 如果过滤逻辑本身出错，不影响后续正常记录
    console.warn('Error while filtering noise error logs:', e)
  }

  try {
    const logs = JSON.parse(localStorage.getItem('errorLogs') || '[]')
    logs.push(errorInfo)
    
    // 只保留最近100条错误日志
    if (logs.length > 100) {
      logs.splice(0, logs.length - 100)
    }
    
    localStorage.setItem('errorLogs', JSON.stringify(logs))
  } catch (e) {
    console.warn('Failed to store error log:', e)
  }
}

/**
 * 手动上报错误
 */
export function captureError(error, context = {}) {
  if (ERROR_MONITORING_CONFIG.dsn && Sentry) {
    Sentry.withScope((scope) => {
      Object.entries(context).forEach(([key, value]) => {
        scope.setExtra(key, value)
      })
      if (error instanceof Error) {
        Sentry.captureException(error)
      } else {
        Sentry.captureMessage(String(error))
      }
    })
  }

  logErrorLocally({
    type: 'MANUAL_CAPTURE',
    message: error?.message || String(error),
    stack: error?.stack,
    context,
    timestamp: new Date().toISOString()
  })
}

/**
 * 手动上报消息
 */
export function captureMessage(message, level = 'info', context = {}) {
  if (ERROR_MONITORING_CONFIG.dsn && Sentry) {
    Sentry.withScope((scope) => {
      scope.setLevel(level)
      Object.entries(context).forEach(([key, value]) => {
        scope.setExtra(key, value)
      })
      Sentry.captureMessage(message)
    })
  }

  logErrorLocally({
    type: 'MANUAL_MESSAGE',
    level,
    message,
    context,
    timestamp: new Date().toISOString()
  })
}

/**
 * 设置用户信息
 */
export function setUser(user) {
  if (ERROR_MONITORING_CONFIG.dsn && Sentry && user) {
    Sentry.setUser({
      id: user.id,
      username: user.username,
      email: user.email
    })
  }
}

/**
 * 清除用户信息
 */
export function clearUser() {
  if (ERROR_MONITORING_CONFIG.dsn && Sentry) {
    Sentry.setUser(null)
  }
}

/**
 * 添加面包屑
 */
export function addBreadcrumb(breadcrumb) {
  if (ERROR_MONITORING_CONFIG.dsn && Sentry) {
    Sentry.addBreadcrumb(breadcrumb)
  }
}

/**
 * 获取本地错误日志
 */
export function getLocalErrorLogs() {
  try {
    return JSON.parse(localStorage.getItem('errorLogs') || '[]')
  } catch (e) {
    return []
  }
}

/**
 * 清除本地错误日志
 */
export function clearLocalErrorLogs() {
  localStorage.removeItem('errorLogs')
}

export default {
  initErrorMonitoring,
  captureError,
  captureMessage,
  setUser,
  clearUser,
  addBreadcrumb,
  getLocalErrorLogs,
  clearLocalErrorLogs
}
