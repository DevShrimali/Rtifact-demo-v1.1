import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, OctagonX, Pencil } from 'lucide-react'
import { getCheckDetail, getSyntheticChecks } from '../../mock/telemetry'
import { Sparkline } from '../../components/Sparkline'
import { TimeAgo } from '../../components/TimeAgo'
import { minutesAgo } from '../../lib/time'
import { useEnv } from '../../state/env'

/* Screen 26 — Synthetic check detail: trend, last-10 runs, alert history,
   configuration. Entry: list → detail (breadcrumb Command / Telemetry / name). */
export function SyntheticDetailPage() {
  const { checkId } = useParams()
  const { env } = useEnv()
  const check = getSyntheticChecks(env.id).find((c) => c.id === checkId) ?? getSyntheticChecks('prod-us').find((c) => c.id === checkId)
  const detail = getCheckDetail(checkId ?? '')

  if (!check) {
    return (
      <div className="error-panel" role="alert">
        <div className="error-title">Check {checkId} not found</div>
        <Link to="/command/telemetry/synthetic" className="btn btn-secondary" style={{ marginTop: 8 }}>
          <ArrowLeft size={14} strokeWidth={2.2} />
          Back to checks
        </Link>
      </div>
    )
  }

  const failures = detail.runs.filter((r) => !r.ok).length

  return (
    <>
      <div className="page-head" style={{ marginBottom: 14 }}>
        <div>
          <div className="eyebrow">Synthetic check</div>
          <h2 className="state-title" style={{ fontSize: 19 }}>
            {check.name}
          </h2>
          <p className="page-sub">
            every {check.intervalMin}m · {check.uptimePct}% uptime 30d ·{' '}
            {failures > 0 ? `${failures} of last 10 runs failed` : 'all recent runs passing'}
          </p>
        </div>
        <button className="btn btn-primary">
          <Pencil size={14} strokeWidth={2.2} />
          Edit check
        </button>
      </div>

      <section className="panel">
        <div className="panel-title">Performance trend — last 10 runs</div>
        <Sparkline
          data={[...detail.runs].reverse().map((r) => r.durationMs)}
          width={720}
          height={72}
          stroke={failures > 0 ? 'var(--warn)' : 'var(--muted)'}
        />
      </section>

      <div className="detail-grid">
        <div className="detail-main">
          <section className="panel">
            <div className="panel-title">Run history — last 10</div>
            <ul className="pipeline">
              {detail.runs.map((r, i) => (
                <li key={i} className="pipe-step">
                  {r.ok ? (
                    <CheckCircle2 size={15} strokeWidth={2} className="pipe-icon done" />
                  ) : (
                    <OctagonX size={15} strokeWidth={2} className="pipe-icon" style={{ color: 'var(--error)' }} />
                  )}
                  <span>
                    {r.ok ? 'Passed' : 'Failed'}
                    {r.note ? ` — ${r.note}` : ''}
                  </span>
                  <span className="mono pod-stat">{(r.durationMs / 1000).toFixed(1)}s</span>
                  <TimeAgo timestamp={minutesAgo(r.minutesAgo)} />
                </li>
              ))}
            </ul>
          </section>

          <section className="panel">
            <div className="panel-title">Alert history</div>
            {detail.alertHistory.length === 0 ? (
              <div className="panel-foot-note" style={{ border: 'none', padding: 0, margin: 0 }}>
                No alerts raised by this check.
              </div>
            ) : (
              detail.alertHistory.map((a) => (
                <Link key={a.id} to={`/command/alerts/${a.id}`} className="row" style={{ borderRadius: 8 }}>
                  <span className="row-id">{a.id}</span>
                  <span className="row-title" style={{ fontWeight: 400 }}>
                    {a.message}
                  </span>
                  <TimeAgo timestamp={minutesAgo(a.minutesAgo)} />
                </Link>
              ))
            )}
          </section>
        </div>

        <div className="detail-side">
          <section className="panel">
            <div className="panel-title">Configuration</div>
            <div className="kv-row">
              <span className="kv-label">Severity</span>
              <span className="badge sev-critical">{detail.config.severity}</span>
            </div>
            <div className="kv-row">
              <span className="kv-label">Environment</span>
              <span className="kv-value mono">{detail.config.environment}</span>
            </div>
            <div className="kv-row">
              <span className="kv-label">Routing</span>
              <span className="kv-value">{detail.config.routing}</span>
            </div>
            <div className="kv-row">
              <span className="kv-label">Regions</span>
              <span className="kv-value mono" style={{ fontSize: 11 }}>
                {detail.config.regions.join(', ')}
              </span>
            </div>
            <div className="kv-row">
              <span className="kv-label">Interval</span>
              <span className="kv-value mono">every {check.intervalMin}m</span>
            </div>
          </section>
        </div>
      </div>
    </>
  )
}
