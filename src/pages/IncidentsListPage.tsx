import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { RefreshCw, Sparkles, WifiOff } from 'lucide-react'
import { useEnv } from '../state/env'
import { getIncidents, INCIDENT_PIPELINE } from '../mock/incidents'
import type { IncidentStatus } from '../mock/incidents'
import { SeverityBadge } from '../components/SeverityBadge'
import { TimeAgo } from '../components/TimeAgo'
import { SlaCountdown } from '../components/SlaCountdown'

/* Screen 06 — Incidents list: status pipeline tabs, SLA countdown per item,
   AI Created tag. States: Default · Empty · Loading (+ error via ?state=). */
export function IncidentsListPage() {
  const { env } = useEnv()
  const [searchParams] = useSearchParams()
  const forced = searchParams.get('state')
  const [loaded, setLoaded] = useState(false)
  const [tab, setTab] = useState<IncidentStatus>('investigating')

  useEffect(() => {
    setLoaded(false)
    const t = setTimeout(() => setLoaded(true), 550)
    return () => clearTimeout(t)
  }, [env.id])

  const all = forced === 'empty' ? [] : getIncidents(env.id)
  const loading = forced === 'loading' || !loaded
  const error = forced === 'error'
  const items = all.filter((i) => i.status === tab)
  const activeCount = all.filter((i) => i.status !== 'resolved').length

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">Command</div>
          <h1 className="page-title">Incidents</h1>
          <p className="page-sub">
            {error
              ? `Incident stream unavailable for ${env.name}`
              : loading
                ? `Loading incidents for ${env.name}…`
                : all.length === 0
                  ? `No incidents in ${env.name}`
                  : `${activeCount} active in ${env.name} · ${all.length} total`}
          </p>
        </div>
        <button className="btn btn-primary" disabled={loading || error}>
          Declare incident
        </button>
      </div>


      {error ? (
        <div className="error-panel" role="alert">
          <WifiOff size={22} strokeWidth={2} className="error-icon" />
          <div className="error-title">Incident stream unavailable</div>
          <div className="error-sub">Lost connection to the {env.name} incident stream.</div>
          <button className="btn btn-secondary" onClick={() => window.location.reload()}>
            <RefreshCw size={14} strokeWidth={2.2} />
            Retry connection
          </button>
        </div>
      ) : (
        <>
          <div className="pipeline-tabs" role="tablist" aria-label="Incident pipeline">
            {INCIDENT_PIPELINE.map((p) => {
              const count = loading ? null : all.filter((i) => i.status === p.key).length
              return (
                <button
                  key={p.key}
                  role="tab"
                  aria-selected={tab === p.key}
                  className={`pipeline-tab${tab === p.key ? ' active' : ''}`}
                  onClick={() => setTab(p.key)}
                >
                  {p.label}
                  {count !== null && count > 0 && <span className="tab-count mono">{count}</span>}
                </button>
              )
            })}
          </div>

          {loading ? (
            <div className="row-list">
              {[0, 1, 2].map((i) => (
                <div key={i} className="row" style={{ pointerEvents: 'none' }}>
                  <span className="skeleton skeleton-text" style={{ width: '65%' }} />
                </div>
              ))}
            </div>
          ) : all.length === 0 ? (
            <div className="placeholder-panel">
              <div className="empty-dot-wrap">
                <span className="dot healthy" />
              </div>
              No incidents in {env.name} — nothing has needed escalation.
              <span className="mono">alerts that escalate appear here automatically</span>
              <div style={{ marginTop: 14 }}>
                <Link to="/command" className="btn btn-secondary">
                  See what’s on the Alerts board
                </Link>
              </div>
            </div>
          ) : items.length === 0 ? (
            <div className="placeholder-panel">
              Nothing in “{INCIDENT_PIPELINE.find((p) => p.key === tab)?.label}” right now.
              <span className="mono">
                {activeCount} active incident{activeCount === 1 ? '' : 's'} in other stages
              </span>
            </div>
          ) : (
            <div className="row-list">
              {items.map((inc) => (
                <Link key={inc.id} to={`/command/incidents/${inc.id}`} className="row incident-row">
                  <span className="row-id">{inc.id}</span>
                  <SeverityBadge severity={inc.severity} />
                  <span className="row-title">
                    {inc.title}
                    {inc.aiCreated && (
                      <span className="ai-tag">
                        <Sparkles size={10} strokeWidth={2.2} />
                        AI Created
                      </span>
                    )}
                  </span>
                  <span className="mono service">{inc.services[0]}</span>
                  <SlaCountdown minutesLeft={inc.slaMinutesLeft} />
                  <TimeAgo timestamp={inc.startedAt} />
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </>
  )
}
