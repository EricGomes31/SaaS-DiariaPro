import { useEffect, useRef, useCallback } from 'react'

const EVENTS = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click']

export function useIdleTimeout({ timeout, warningTime = 60000, onIdle, onWarning, onReset, enabled = true }) {
  const idleTimer    = useRef(null)
  const warningTimer = useRef(null)

  const reset = useCallback(() => {
    clearTimeout(idleTimer.current)
    clearTimeout(warningTimer.current)
    onReset?.()

    warningTimer.current = setTimeout(() => onWarning?.(), timeout - warningTime)
    idleTimer.current    = setTimeout(() => onIdle?.(),    timeout)
  }, [timeout, warningTime, onIdle, onWarning, onReset])

  useEffect(() => {
    if (!enabled) return
    EVENTS.forEach(e => window.addEventListener(e, reset, { passive: true }))
    reset()
    return () => {
      EVENTS.forEach(e => window.removeEventListener(e, reset))
      clearTimeout(idleTimer.current)
      clearTimeout(warningTimer.current)
    }
  }, [reset, enabled])
}
