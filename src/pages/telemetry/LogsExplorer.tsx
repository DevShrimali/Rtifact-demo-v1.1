import { useState } from 'react'
import { Bell, Search, Star } from 'lucide-react'
import { explorerLogs, savedSearches as seedSearches } from '../../mock/telemetry'
import type { LogLevel } from '../../mock/telemetry'
import { timeAgo, minutesAgo } from '../../lib/time'

const LEVEL_CLS: Record<LogLevel, string> = {
  error: 'sev-critical',
  warn: 'sev-warning',
  info: 'neutral',
  debug: 'neutral',
}

const SERVICES = ['any', ...new Set(explorerLogs.map((l) => l.service))]
const LEVELS = ['any', 'error', 'warn', 'info', 'debug'] as const

/* Screen 25 — Logs explorer: query builder over historical logs.
   Rendered as the "Explorer" mode of the Logs lens (?view=explorer). */
export function LogsExplorer() {
  const [service, setService] = useState('any')
  const [level, setLevel] = useState<(typeof LEVELS)[number]>('any')
  const [message, setMessage] = useState('')
  const [traceId, setTraceId] = useState('')
  const [searches, setSearches] = useState(seedSearches)
  const [saved, setSaved] = useState(false)

  const currentQuery = () =>
    [
      service !== 'any' && `service=${service}`,
      level !== 'any' && `level=${level}`,
      message.trim() && `message~${message.trim()}`,
      traceId.trim() && `trace=${traceId.trim()}`,
    ]
      .filter(Boolean)
      .join(' ') || 'all logs'

  const saveCurrent = () => {
    setSearches((prev) => [
      { id: `ss-${prev.length + 1}`, name: 'Saved query', query: currentQuery(), starred: true },
      ...prev,
    ])
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  const results = explorerLogs.filter(
    (l) =>
      (service === 'any' || l.service === service) &&
      (level === 'any' || l.level === level) &&
      (message.trim() === '' || l.message.toLowerCase().includes(message.trim().toLowerCase())) &&
      (traceId.trim() === '' || l.traceId === traceId.trim()),
  )

  const applySaved = (query: string) => {
    setService('any')
    setLevel('any')
    setMessage('')
    setTraceId('')
    for (const part of query.split(/\s+/)) {
      const [k, v] = part.split(/[=~]/)
      if (k === 'service') setService(v)
      if (k === 'level') setLevel(v as (typeof LEVELS)[number])
      if (k === 'message') setMessage(v)
      if (k === 'trace') setTraceId(v)
    }
  }

  return (
    <div className="detail-grid" style={{ gridTemplateColumns: '288px 1fr' }}>
      <div className="detail-side">
        <section className="panel">
          <div className="panel-title">Query builder</div>
          <div className="field">
            <span className="field-label">Service</span>
            <select className="text-input select" style={{ width: '100%' }} value={service} onChange={(e) => setService(e.target.value)}>
              {SERVICES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <span className="field-label">Level</span>
            <select className="text-input select" style={{ width: '100%' }} value={level} onChange={(e) => setLevel(e.target.value as (typeof LEVELS)[number])}>
              {LEVELS.map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <span className="field-label">Message contains</span>
            <input className="text-input" value={message} placeholder="e.g. retry" onChange={(e) => setMessage(e.target.value)} />
          </div>
          <div className="field">
            <span className="field-label">Trace ID</span>
            <input className="text-input mono" value={traceId} placeholder="t-88ac21" onChange={(e) => setTraceId(e.target.value)} />
          </div>
        </section>

        <section className="panel">
          <div className="panel-title">Saved searches</div>
          {searches.map((s) => (
            <div key={s.id} className="saved-search-row">
              <button
                className="star-btn"
                aria-label={s.starred ? 'Unstar' : 'Star'}
                aria-pressed={s.starred}
                onClick={() =>
                  setSearches((prev) => prev.map((x) => (x.id === s.id ? { ...x, starred: !x.starred } : x)))
                }
              >
                <Star size={14} strokeWidth={2} fill={s.starred ? 'var(--warn)' : 'none'} style={{ color: s.starred ? 'var(--warn)' : 'var(--faint)' }} />
              </button>
              <button className="saved-search" onClick={() => applySaved(s.query)}>
                <span className="sim-title">{s.name}</span>
                <span className="mono" style={{ fontSize: 10, color: 'var(--faint)' }}>
                  {s.query}
                </span>
              </button>
            </div>
          ))}
        </section>
      </div>

      <div className="detail-main">
        <section className="panel" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="graph-toolbar">
            <Search size={14} strokeWidth={2.2} style={{ color: 'var(--faint)' }} />
            <span className="panel-title" style={{ margin: 0 }}>
              {results.length} matching line{results.length === 1 ? '' : 's'}
            </span>
            {/* query save + alert-from-pattern (DEV-30) */}
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
              <span className="time-ref">last 60m</span>
              <button className="btn btn-secondary" style={{ height: 28 }} onClick={() => saveCurrent()}>
                <Star size={12} strokeWidth={2.2} />
                {saved ? 'Saved' : 'Save search'}
              </button>
              <button className="btn btn-primary" style={{ height: 28 }}>
                <Bell size={12} strokeWidth={2.2} />
                Create alert
              </button>
            </div>
          </div>
          {results.length === 0 ? (
            <div className="placeholder-panel" style={{ border: 'none' }}>
              No log lines match this query.
              <span className="mono">loosen a filter or widen the time range</span>
            </div>
          ) : (
            <div className="log-stream" style={{ border: 'none', borderRadius: 0, flexDirection: 'column', maxHeight: 460 }}>
              {results.map((l, i) => (
                <div key={i} className="log-line">
                  <span className="mono log-time">{timeAgo(minutesAgo(l.minutesAgo))}</span>
                  <span className={`badge ${LEVEL_CLS[l.level]}`} style={{ minWidth: 52, justifyContent: 'center' }}>
                    {l.level}
                  </span>
                  <span className="mono log-svc">{l.service}</span>
                  <span className="log-msg">{l.message}</span>
                  <button className="mono trace-link" onClick={() => setTraceId(l.traceId)}>
                    {l.traceId}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
