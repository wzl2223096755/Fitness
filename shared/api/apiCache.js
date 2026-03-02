/**
 * 共享 API 缓存模块
 */
const STORAGE_KEY = 'fitness_api_cache'

const defaultTtl = 5 * 60 * 1000 // 5 min

export const cacheConfig = {
  strategies: {
    dashboard: { ttl: 5 * 60 * 1000, staleWhileRevalidate: true },
    userProfile: { ttl: 10 * 60 * 1000, staleWhileRevalidate: true },
    trainingRecords: { ttl: 2 * 60 * 1000, staleWhileRevalidate: true },
    nutritionGoals: { ttl: 10 * 60 * 1000, staleWhileRevalidate: false }
  }
}

export const apiCacheManager = {
  _cache: new Map(),

  generateKey(endpoint, params = {}) {
    const normalized = { ...params }
    delete normalized._t
    const keys = Object.keys(normalized).sort()
    const paramStr = keys.map((k) => `${k}=${JSON.stringify(normalized[k])}`).join('&')
    return `${endpoint}:${paramStr}`
  },

  set(key, data, options = {}) {
    const ttl = options.ttl ?? defaultTtl
    this._cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
      staleWhileRevalidate: options.staleWhileRevalidate ?? false
    })
  },

  get(key) {
    return this._cache.get(key) ?? null
  },

  isExpired(entry) {
    if (!entry) return true
    return Date.now() - entry.timestamp > entry.ttl
  },

  isStale(entry) {
    if (!entry) return false
    if (!this.isExpired(entry)) return false
    return entry.staleWhileRevalidate === true
  },

  delete(key) {
    this._cache.delete(key)
  },

  clear() {
    this._cache.clear()
  },

  getStats() {
    const now = Date.now()
    let fresh = 0
    this._cache.forEach((entry) => {
      if (now - entry.timestamp <= entry.ttl) fresh++
    })
    return { total: this._cache.size, fresh }
  }
}

export async function cachedRequest(requestFn, cacheKey, options = {}) {
  const ttl = options.ttl ?? defaultTtl
  const forceRefresh = options.forceRefresh === true
  const staleWhileRevalidate = options.staleWhileRevalidate ?? false

  const entry = apiCacheManager.get(cacheKey)
  if (!forceRefresh && entry) {
    if (!apiCacheManager.isExpired(entry)) {
      return entry.data
    }
    if (staleWhileRevalidate && entry.staleWhileRevalidate) {
      requestFn().then((res) => {
        apiCacheManager.set(cacheKey, res, { ttl, staleWhileRevalidate: true })
      }).catch(() => {})
      return entry.data
    }
  }

  const result = await requestFn()
  apiCacheManager.set(cacheKey, result, { ttl, staleWhileRevalidate })
  return result
}

export function invalidateCache(endpointPrefix) {
  const keys = []
  apiCacheManager._cache.forEach((_, key) => {
    if (key.startsWith(endpointPrefix)) keys.push(key)
  })
  keys.forEach((k) => apiCacheManager.delete(k))
}

export function invalidateAllCache() {
  apiCacheManager.clear()
}

export default apiCacheManager
