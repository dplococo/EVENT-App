import { useEffect } from 'react'

// Cierre de sesión por inactividad. La última actividad se guarda en
// localStorage, así varias pestañas abiertas cuentan como una sola sesión, y
// se revisa también al volver a la app (el celular frena los timers en segundo
// plano) y al abrirla con una sesión guardada de hace rato.
const IDLE_MINUTES = Number(import.meta.env.VITE_IDLE_TIMEOUT_MINUTES) || 30
const IDLE_MS = IDLE_MINUTES * 60 * 1000
const ACTIVITY_KEY = 'lastActivity'
const NOTICE_KEY = 'idleLogout'
const ACTIVITY_EVENTS = ['pointerdown', 'keydown', 'wheel', 'touchstart', 'mousemove', 'scroll']
const CHECK_EVERY_MS = 30 * 1000
const WRITE_EVERY_MS = 15 * 1000

const readLastActivity = () => {
  try {
    return Number(localStorage.getItem(ACTIVITY_KEY)) || 0
  } catch {
    return 0
  }
}

const writeLastActivity = (time) => {
  try {
    localStorage.setItem(ACTIVITY_KEY, String(time))
  } catch {
    // Sin storage se cuenta solo en esta pestaña
  }
}

/** Mensaje para el login si la sesión se cerró por inactividad (se lee una sola vez). */
export const consumeIdleLogoutNotice = () => {
  try {
    if (sessionStorage.getItem(NOTICE_KEY)) {
      sessionStorage.removeItem(NOTICE_KEY)
      return `Cerramos tu sesión después de ${IDLE_MINUTES} minutos sin actividad.`
    }
  } catch {
    // Sin storage no hay aviso
  }
  return ''
}

export const markActivity = () => writeLastActivity(Date.now())

export default function useIdleLogout(active, onTimeout) {
  useEffect(() => {
    if (!active) return undefined

    let lastWrite = 0
    const touch = () => {
      const now = Date.now()
      if (now - lastWrite < WRITE_EVERY_MS) return
      lastWrite = now
      writeLastActivity(now)
    }

    const check = () => {
      const last = readLastActivity()
      if (last && Date.now() - last >= IDLE_MS) {
        try {
          sessionStorage.setItem(NOTICE_KEY, '1')
          localStorage.removeItem(ACTIVITY_KEY)
        } catch {
          // igual se cierra la sesión
        }
        onTimeout()
      }
    }

    // Una sesión que quedó guardada de hace rato se cierra al abrir la app
    if (readLastActivity()) check()
    else touch()

    const onVisible = () => {
      if (document.visibilityState === 'visible') check()
    }

    ACTIVITY_EVENTS.forEach((name) => window.addEventListener(name, touch, { passive: true }))
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', check)
    const timer = window.setInterval(check, CHECK_EVERY_MS)

    return () => {
      ACTIVITY_EVENTS.forEach((name) => window.removeEventListener(name, touch))
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', check)
      window.clearInterval(timer)
    }
  }, [active, onTimeout])
}
