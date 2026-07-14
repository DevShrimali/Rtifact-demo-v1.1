import { timeAgo, useNow } from '../lib/time'

/* Shared component: relative, auto-updating time reference ("5m ago"). */
export function TimeAgo({ timestamp }: { timestamp: number }) {
  const now = useNow()
  return (
    <time className="time-ref" dateTime={new Date(timestamp).toISOString()}>
      {timeAgo(timestamp, now)}
    </time>
  )
}
