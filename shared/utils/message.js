/**
 * 共享消息工具 - 简单封装，便于扩展为 UI 提示
 */

const noop = () => {}

export function success(msg) {
  if (typeof window !== 'undefined' && window.__fitnessMessageSuccess) {
    window.__fitnessMessageSuccess(msg)
  } else if (typeof console !== 'undefined') {
    console.info('[success]', msg)
  }
}

export function error(msg) {
  if (typeof window !== 'undefined' && window.__fitnessMessageError) {
    window.__fitnessMessageError(msg)
  } else if (typeof console !== 'undefined') {
    console.error('[error]', msg)
  }
}

export function warning(msg) {
  if (typeof window !== 'undefined' && window.__fitnessMessageWarning) {
    window.__fitnessMessageWarning(msg)
  } else if (typeof console !== 'undefined') {
    console.warn('[warning]', msg)
  }
}

export function info(msg) {
  if (typeof window !== 'undefined' && window.__fitnessMessageInfo) {
    window.__fitnessMessageInfo(msg)
  } else if (typeof console !== 'undefined') {
    console.info('[info]', msg)
  }
}

export default { success, error, warning, info }
