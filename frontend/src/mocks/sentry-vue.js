// 轻量级 Sentry Vue 空实现，用于 GitHub Pages 等纯前端演示环境
// 避免由于 Node 全局对象(global/Request) 等差异导致的运行时错误

export function init() {
  // no-op
}

export function browserTracingIntegration() {
  return {}
}

export function replayIntegration() {
  return {}
}

export function withScope(callback) {
  const scope = {
    setTag() {},
    setExtra() {},
    setLevel() {}
  }
  if (typeof callback === 'function') {
    callback(scope)
  }
}

export function captureException() {
  // no-op
}

export function captureMessage() {
  // no-op
}

export function setUser() {
  // no-op
}

export function addBreadcrumb() {
  // no-op
}

