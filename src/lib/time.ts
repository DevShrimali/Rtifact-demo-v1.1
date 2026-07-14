import { useEffect, useState } from 'react'

/* Re-render consumers every 30s so relative times stay honest. */
export function useNow(intervalMs = 30_000): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(t)
  }, [intervalMs])
  return now
}

export function timeAgo(timestamp: number, now: number = Date.now()): string {
  const s = Math.max(0, Math.floor((now - timestamp) / 1000))
  if (s < 60) return 'just now'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

/* Mock data expresses ages as "N minutes before page load". */
export function minutesAgo(min: number): number {
  return Date.now() - min * 60_000
}
