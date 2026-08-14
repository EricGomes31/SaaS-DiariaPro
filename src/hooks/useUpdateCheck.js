import { useState, useEffect } from 'react'

// Compara o carimbo de versão embutido no bundle (__APP_VERSION__, definido no
// vite.config.js) com o /version.json publicado no servidor. Quando divergem,
// uma nova versão foi enviada ao Hostgator → o app mostra o aviso de recarregar.
const CHECK_INTERVAL_MS = 5 * 60 * 1000

export function useUpdateCheck() {
  const [updateAvailable, setUpdateAvailable] = useState(false)

  useEffect(() => {
    if (import.meta.env.DEV) return  // no dev server não existe version.json

    let stopped = false

    const check = async () => {
      try {
        const res = await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json()
        if (!stopped && data?.version && data.version !== __APP_VERSION__) {
          setUpdateAvailable(true)
        }
      } catch { /* offline ou servidor indisponível — tenta de novo depois */ }
    }

    const intervalId = setInterval(check, CHECK_INTERVAL_MS)
    const onVisible = () => { if (document.visibilityState === 'visible') check() }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      stopped = true
      clearInterval(intervalId)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  return updateAvailable
}
