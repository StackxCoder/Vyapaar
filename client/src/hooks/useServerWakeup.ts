import { useEffect, useState } from 'react'
const API = import.meta.env.VITE_API_URL || '/api'
export function useServerWakeup() {
  const [waking, setWaking] = useState(false)
  const [ready, setReady] = useState(true)
  useEffect(() => {
    fetch(`${API}/health`).then(r => {
      if (!r.ok) throw new Error()
      setReady(true)
    }).catch(() => {
      setWaking(true)
      setReady(false)
      const interval = setInterval(() => {
        fetch(`${API}/health`).then(r => {
          if (r.ok) { setWaking(false); setReady(true); clearInterval(interval) }
        }).catch(() => {})
      }, 4000)
      return () => clearInterval(interval)
    })
  }, [])
  return { waking, ready }
}
