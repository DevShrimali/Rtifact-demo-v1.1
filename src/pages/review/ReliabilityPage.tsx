import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useEnv } from '../../state/env'
import { getReliability } from '../../mock/review'
import { ListSkeleton, useEnvLoad } from '../../components/PageLoad'

const LEVEL_CLS: Record<string, string> = {
  critical: 'sev-critical',
  high: 'sev-warning',
  medium: 'neutral',
}

/* Screen 12 — Reliability risk: workload signals, deployment instability,
   observability gaps linking into Telemetry. */
export function ReliabilityPage() {
  const { env } = useEnv()
  const r = getReliability(env.id)
  const loading = useEnvLoad()

  if (loading) return <ListSkeleton rows={5} />

  if (r.signals.length === 0 && r.obsGaps.length === 0) {
    return (
      <div className="placeholder-panel">
        <div className="empty-dot-wrap">
          <span className="dot healthy" />
        </div>
        No reliability risks flagged in {env.name}.
        <span className="mono">{r.deploys.total} deploys · {r.deploys.failPct}% change-failure rate</span>
      </div>
    )
  }

  return (
    <>
      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
        <div className={`stat-card${r.signals.some((s) => s.level === 'critical') ? ' accent-error' : ' accent-warn'}`}>
          <div className="stat-label">Workload risk signals</div>
          <div className="stat-value mono">{r.signals.length}</div>
          <div className="stat-meta">{r.signals.filter((s) => s.level === 'critical').length} critical</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Deployment instability</div>
          <div className="stat-value mono">{r.deploys.failPct}%</div>
          <div className="stat-meta">
            {r.deploys.rolledBack} of {r.deploys.total} deploys rolled back this week
          </div>
        </div>
        <div className="stat-card accent-warn">
          <div className="stat-label">Observability gaps</div>
          <div className="stat-value mono">{r.obsGaps.length}</div>
          <div className="stat-meta">blocking better RCA confidence</div>
        </div>
      </div>

      <div className="section-label">Workload signals</div>
      <div className="row-list">
        {r.signals.map((s) => (
          <div key={s.workload} className="row">
            <span className="mono row-id" style={{ width: 130 }}>
              {s.workload}
            </span>
            <span className={`badge ${LEVEL_CLS[s.level]}`}>{s.level}</span>
            <span className="row-title" style={{ fontWeight: 400 }}>
              {s.signal}
            </span>
          </div>
        ))}
      </div>

      <div className="section-label">Observability gaps</div>
      <div className="row-list">
        {r.obsGaps.map((g) => (
          <Link key={g.area} to={g.telemetryPath} className="row">
            <span className="row-title">
              {g.area}
              <span style={{ display: 'block', fontSize: 11.5, color: 'var(--muted)', fontWeight: 400 }}>
                {g.gap}
              </span>
            </span>
            <span className="time-ref" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              open in Telemetry <ArrowRight size={12} strokeWidth={2.2} />
            </span>
          </Link>
        ))}
      </div>
    </>
  )
}
