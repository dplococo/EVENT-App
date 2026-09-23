import { useEffect } from 'react'

/** Ejecuta `callback` de inmediato y luego cada `intervalMs`, hasta que el componente se desmonte o cambien `deps`. */
export const usePolling = (callback, intervalMs, deps = []) => {
  useEffect(() => {
    callback()
    const timer = setInterval(callback, intervalMs)
    return () => clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}
