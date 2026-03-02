/**
 * 共享性能工具 - 简单实现，供前端复用
 */

export function measure(name, fn) {
  if (typeof performance !== 'undefined' && performance.mark) {
    const start = performance.now()
    const result = typeof fn === 'function' ? fn() : fn
    const end = performance.now()
    if (typeof console !== 'undefined' && console.debug) {
      console.debug(`[perf] ${name}: ${(end - start).toFixed(2)}ms`)
    }
    return result
  }
  return typeof fn === 'function' ? fn() : fn
}

export function mark(name) {
  if (typeof performance !== 'undefined' && performance.mark) {
    performance.mark(name)
  }
}

export function clearMarks(name) {
  if (typeof performance !== 'undefined' && performance.clearMarks) {
    performance.clearMarks(name)
  }
}

export default { measure, mark, clearMarks }
