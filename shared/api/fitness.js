/**
 * 共享健身/仪表盘 API - 对接 /api/v1/dashboard 与 /api/v1/load-recovery
 */
import request from './request.js'

const get = (url, params) => request.get(url, { params }).then((r) => r?.data !== undefined ? r : { code: 200, data: r })
const post = (url, data) => request.post(url, data).then((r) => r?.data !== undefined ? r : { code: 200, data: r })
const put = (url, data) => request.put(url, data).then((r) => r?.data !== undefined ? r : { code: 200, data: r })
const del = (url) => request.delete(url).then((r) => r?.data !== undefined ? r : { code: 200, data: r })

export const fitnessApi = {
  // 仪表盘
  getMetricsOverview(timeRange = 'week') {
    return get('/api/v1/dashboard/metrics-overview', { timeRange })
  },
  getUserStatsOverview() {
    return get('/api/v1/dashboard/user-stats-overview')
  },
  getAnalyticsData(timeRange = 'week') {
    return get('/api/v1/dashboard/analytics', { timeRange })
  },
  getRecentTrainingRecords() {
    return get('/api/v1/dashboard/recent-training-records')
  },
  getDashboardStats() {
    return get('/api/v1/dashboard/metrics-overview', { timeRange: 'week' })
  },
  getTrainingHistory(params = {}) {
    return get('/api/v1/training/records/page', params)
  },
  getFitnessData() {
    return get('/api/v1/load-recovery/my-data')
  },
  saveFitnessData(data) {
    return post('/api/v1/load-recovery/training-data', data)
  },
  updateFitnessData(id, data) {
    return put(`/api/v1/load-recovery/data/${id}`, data)
  },
  deleteFitnessData(id) {
    return del(`/api/v1/load-recovery/data/${id}`)
  },
  assessRecovery(data) {
    return post('/api/v1/load-recovery/training-data', data)
  },
  getTrainingSuggestions() {
    return get('/api/v1/load-recovery/training-suggestions')
  },
  getLoadTrend(params) {
    return get('/api/v1/load-recovery/load-trend', params)
  },
  getCalculationHistory() {
    return get('/api/v1/load-recovery/my-data')
  },
  deleteCalculationRecord(id) {
    return del(`/api/v1/load-recovery/data/${id}`)
  },
  calculate1RM(weight, reps, model = 'Epley') {
    return get('/api/v1/load-recovery/one-rep-max', { weight, reps, model })
  },
  calculate1RMWithRecord(body) {
    return post('/api/v1/load-recovery/one-rep-max/record', body)
  },
  get1RMModels() {
    return get('/api/v1/load-recovery/one-rep-max/models')
  },
  calculateVolumeWithRecord(body) {
    return post('/api/v1/load-recovery/training-data', body)
  },
  calculateCaloriesWithRecord(body) {
    return post('/api/v1/load-recovery/training-data', body)
  },
  generateFitnessData() {
    return post('/api/v1/load-recovery/training-data', {})
  },
  // 训练计划
  getUserFitnessPlansByStatus(status) {
    return get(`/api/v1/training-plans/status/${status}`)
  },
  getFitnessPlanById(id) {
    return get(`/api/v1/training-plans/${id}`)
  },
  createFitnessPlan(data) {
    return request.post('/api/v1/training-plans', data).then((r) => r?.data !== undefined ? r : { code: 200, data: r })
  },
  toggleExerciseCompletion(exerciseId) {
    return request.patch(`/api/v1/training-plans/exercises/${exerciseId}/toggle`).then((r) => r?.data !== undefined ? r : { code: 200, data: r })
  },
  deleteFitnessPlan(id) {
    return del(`/api/v1/training-plans/${id}`)
  },
  syncHuaweiData() {
    return get('/api/v1/load-recovery/my-data')
  }
}

export default fitnessApi
