import { useEffect, useState } from 'react'

/* SLA countdown — live, per-item (principle #9). Anchored to mount time:
   `minutesLeft` is "minutes remaining at page load". Breach flips to red. */
export function SlaCountdown({ minutesLeft }: { minutesLeft: number | null }) {
  const [secondsLeft, setSecondsLeft] = useState(() =>
    minutesLeft === null ? null : Math.round(minutesLeft * 60),
  )

  useEffect(() => {
    if (secondsLeft === null) return
    const t = setInterval(() => setSecondsLeft((s) => (s === null ? s : s - 1)), 1000)
    return () => clearInterval(t)
  }, [secondsLeft === null])

  if (secondsLeft === null) return <span className="sla none mono">no SLA</span>

  const breached = secondsLeft < 0
  const abs = Math.abs(secondsLeft)
  const mm = Math.floor(abs / 60)
  const ss = String(abs % 60).padStart(2, '0')
  return (
    <span className={`sla mono ${breached ? 'breached' : mm < 15 ? 'tight' : 'ok'}`}>
      {breached ? `SLA breached ${mm}m ago` : `SLA ${mm}:${ss} left`}
    </span>
  )
}
