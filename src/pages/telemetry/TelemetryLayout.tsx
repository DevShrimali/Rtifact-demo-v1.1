import { NavLink, Outlet, useSearchParams, Link } from 'react-router-dom'
import { RefreshCw, WifiOff, Bookmark, ChevronDown } from 'lucide-react'
import { useEnv } from '../../state/env'

const LENSES = [
  { to: '/command/telemetry/intelligence', label: 'All signals' },
  { to: '/command/telemetry/metrics', label: 'Metrics' },
  { to: '/command/telemetry/logs', label: 'Logs' },
  { to: '/command/telemetry/traces', label: 'Traces' },
  { to: '/command/telemetry/synthetic', label: 'Synthetic' },
]

/* Screens 13–17 share one Telemetry umbrella: one surface, five lenses.
   Lens switching is a pill row — no fragmenting of a single investigation;
   the AI correlates across lenses and Ask AI is present on all of them. */
export function TelemetryLayout() {
  const { env } = useEnv()
  const [searchParams, setSearchParams] = useSearchParams()
  /* Screen 73 — connection-lost error, recoverable via retry */
  const offline = searchParams.get('state') === 'offline'
  return (
    <>
      <div className="page-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div className="eyebrow">Command</div>
          <h1 className="page-title">Telemetry</h1>
          <p className="page-sub">
            One surface · AI-correlated across metrics, logs & traces · {env.id} · {env.name}
          </p>
        </div>
        <div>
          <button className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, padding: '6px 12px' }}>
            <span>Last 1h</span>
            <ChevronDown size={12} strokeWidth={2.2} />
          </button>
        </div>
      </div>

      <div className="telemetry-nav-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', marginBottom: 20 }}>
        <nav className="subnav" role="tablist" aria-label="Telemetry lenses" style={{ border: 'none', margin: 0, paddingBottom: 0 }}>
          {LENSES.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) => `subnav-item${isActive ? ' active' : ''}`}
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
        <Link to="/command/telemetry/views" className="saved-views-link" style={{ display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none', fontSize: 12.5, color: 'var(--muted)', fontWeight: 600, padding: '8px 12px' }}>
          <Bookmark size={13} strokeWidth={2.4} style={{ color: 'var(--muted)' }} />
          <span>Saved views</span>
        </Link>
      </div>

      {offline ? (
        <div className="error-panel" role="alert">
          <WifiOff size={22} strokeWidth={2} className="error-icon" />
          <div className="error-title">Telemetry connection lost</div>
          <div className="error-sub">
            The live stream from {env.name} dropped 40 seconds ago. Charts and logs are frozen at
            their last received values — nothing is being missed upstream; buffers replay on
            reconnect.
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" onClick={() => setSearchParams({})}>
              <RefreshCw size={14} strokeWidth={2.2} />
              Reconnect now
            </button>
            <NavLink to="/support/status-pages" className="btn btn-secondary">
              Check platform status
            </NavLink>
          </div>
        </div>
      ) : (
        <Outlet />
      )}
    </>
  )
}
