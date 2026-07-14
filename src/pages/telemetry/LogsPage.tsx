import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Bell, Search, Sparkles } from 'lucide-react'
import { logPatterns, logStream } from '../../mock/telemetry'
import type { LogLevel, LogLine } from '../../mock/telemetry'
import { useEnv } from '../../state/env'
import { LogsExplorer } from './LogsExplorer'

const LEVELS: (LogLevel | 'all')[] = ['all', 'error', 'warn', 'info', 'debug']

const LEVEL_CLS: Record<LogLevel, string> = {
  error: 'sev-critical',
  warn: 'sev-warning',
  info: 'neutral',
  debug: 'neutral',
}

interface StampedLine extends LogLine {
  key: number
  time: string
}

/* Screen 15 — Logs live stream + Screen 25 — Explorer, two modes of one
   Logs lens. `?view=explorer` deeplinks straight into the explorer. */
export function LogsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const forcedState = searchParams.get('state')
  const mode = searchParams.get('view') === 'explorer' ? 'explorer' : 'live'

  if (forcedState === 'error') {
    return (
      <div className="error-panel" role="alert">
        <div className="error-title">Log pipeline unavailable</div>
        <div className="error-sub">The log ingestion pipeline is temporarily offline or unreachable.</div>
      </div>
    )
  }

  if (forcedState === 'empty') {
    return (
      <div className="placeholder-panel">
        No log data found.
        <span className="mono">connect a log source to start streaming</span>
      </div>
    )
  }

  return (
    <>
      <div className="pipeline-tabs" role="tablist" aria-label="Logs mode" style={{ marginBottom: 12 }}>
        <button
          role="tab"
          aria-selected={mode === 'live'}
          className={`pipeline-tab${mode === 'live' ? ' active' : ''}`}
          onClick={() => setSearchParams({})}
        >
          Live stream
        </button>
        <button
          role="tab"
          aria-selected={mode === 'explorer'}
          className={`pipeline-tab${mode === 'explorer' ? ' active' : ''}`}
          onClick={() => setSearchParams({ view: 'explorer' })}
        >
          Explorer
        </button>
      </div>

      {mode === 'explorer' ? <LogsExplorer /> : <LiveStream forceLoading={forcedState === 'loading'} />}
    </>
  )
}

function LiveStream({ forceLoading = false }: { forceLoading?: boolean }) {
  const { env } = useEnv()
  const [loading, setLoading] = useState(true)
  const [level, setLevel] = useState<(typeof LEVELS)[number]>('all')
  const [lines, setLines] = useState<StampedLine[]>([])
  const counter = useRef(0)

  useEffect(() => {
    setLoading(true)
    setLines([])
    counter.current = 0
    const t = setTimeout(() => setLoading(false), 550)
    return () => clearTimeout(t)
  }, [env.id])

  /* live stream: seed a batch, then append a line every 1.6s */
  useEffect(() => {
    if (loading) return
    const stamp = (l: LogLine): StampedLine => {
      counter.current += 1
      return { ...l, key: counter.current, time: new Date().toISOString().slice(11, 23) }
    }
    setLines(logStream.slice(0, 8).map(stamp))
    const t = setInterval(() => {
      setLines((prev) => {
        const next = stamp(logStream[counter.current % logStream.length])
        return [...prev.slice(-28), next]
      })
    }, 1600)
    return () => clearInterval(t)
  }, [loading])

  const visible = lines.filter((l) => level === 'all' || l.level === level)

  if (loading || forceLoading) {
    return (
      <div className="panel" aria-busy="true">
        <span className="skeleton skeleton-text" style={{ width: '40%' }} />
        <span className="skeleton" style={{ width: '100%', height: 220, display: 'block', marginTop: 12 }} />
      </div>
    )
  }

  return (
    <>
      {/* AI Detected Patterns banner (top, per spec) */}
      <section className="panel ai-panel">
        <div className="panel-head">
          <span className="ai-tile">
            <Sparkles size={15} strokeWidth={2} />
          </span>
          <span className="eyebrow" style={{ margin: 0 }}>
            AI Detected Patterns
          </span>
          <span className="time-ref" style={{ marginLeft: 'auto' }}>
            last 30m
          </span>
        </div>
        <div className="pattern-cards">
          {logPatterns.map((p) => (
            <div key={p.id} className="pattern-card">
              <div className="pattern-head">
                <span className="mono row-id">{p.id}</span>
                <span className="pattern-title">{p.title}</span>
                <span className="mono pattern-count">
                  ×{p.occurrences.toLocaleString()} / {p.windowMin}m
                </span>
              </div>
              <div className="pattern-cause">
                Likely cause: {p.likelyCause}{' '}
                <span className="mono anomaly-conf">{p.confidence}%</span>
              </div>
              <div className="pattern-actions">
                <button className="btn btn-primary" style={{ height: 28 }}>
                  <Bell size={12} strokeWidth={2.2} />
                  Create alert
                </button>
                <button className="btn btn-secondary" style={{ height: 28 }}>
                  <Search size={12} strokeWidth={2.2} />
                  Investigate
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="log-filters" role="tablist" aria-label="Log level filter">
        {LEVELS.map((l) => (
          <button
            key={l}
            role="tab"
            aria-selected={level === l}
            className={`pipeline-tab${level === l ? ' active' : ''}`}
            onClick={() => setLevel(l)}
          >
            {l === 'all' ? 'All levels' : l}
          </button>
        ))}
        <span className="live-indicator">
          <span className="dot critical" style={{ width: 7, height: 7 }} />
          streaming
        </span>
      </div>

      <div className="log-stream" aria-live="polite">
        {visible.map((l) => (
          <div key={l.key} className="log-line">
            <span className="mono log-time">{l.time}</span>
            <span className={`badge ${LEVEL_CLS[l.level]}`} style={{ minWidth: 52, justifyContent: 'center' }}>
              {l.level}
            </span>
            <span className="mono log-svc">{l.service}</span>
            <span className="log-msg">{l.message}</span>
          </div>
        ))}
      </div>
    </>
  )
}
