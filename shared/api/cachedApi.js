/**
 * 共享缓存 API - 对用户相关接口做短期缓存
 */
import request from './request.js'
import { apiCacheManager, cachedRequest, cacheConfig, invalidateCache } from './apiCache.js'

const userProfileTtl = cacheConfig.strategies.userProfile.ttl
const userProfileSwr = cacheConfig.strategies.userProfile.staleWhileRevalidate

function get(path, params = {}, options = {}) {
  const key = apiCacheManager.generateKey(path, params)
  return cachedRequest(
    () => request.get(path, { params }).then((r) => (r && typeof r === 'object' && 'data' in r) ? r : { code: 200, data: r }),
    key,
    { ttl: userProfileTtl, forceRefresh: options.forceRefresh, staleWhileRevalidate: userProfileSwr }
  )
}

async function put(path, data) {
  const res = await request.put(path, data)
  invalidateCache('/api/v1/user')
  return (res && typeof res === 'object' && 'data' in res) ? res : { code: 200, data: res }
}

async function post(path, data) {
  const res = await request.post(path, data)
  invalidateCache('/api/v1/user')
  return (res && typeof res === 'object' && 'data' in res) ? res : { code: 200, data: res }
}

export const cachedUserApi = {
  getCurrentUser(options = {}) {
    return get('/api/v1/users/current', {}, options)
  },
  updateProfile(data) {
    return put('/api/v1/user/profile', data)
  },
  getUserSettings(options = {}) {
    return get('/api/v1/user/settings', {}, options)
  },
  updateUserSettings(data) {
    return post('/api/v1/user/settings', data)
  },
  getUserStats(options = {}) {
    return get('/api/v1/user/stats', {}, options)
  },
  getBodyRecords(params, options = {}) {
    return get('/api/v1/user/body-records', params, options)
  },
  getUserAchievements(options = {}) {
    return get('/api/v1/user/achievements', {}, options)
  },
  invalidateCache() {
    return invalidateCache('/api/v1/user')
  }
}

export default cachedUserApi
