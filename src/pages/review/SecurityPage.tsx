import { useEnv } from '../../state/env'
import { getSecurity } from '../../mock/review'
import { SeverityBadge } from '../../components/SeverityBadge'
import { ListSkeleton, useEnvLoad } from '../../components/PageLoad'

const PRIORITY_CLS: Record<string, string> = {
  'Fix now': 'sev-critical',
  Schedule: 'sev-warning',
  Monitor: 'neutral',
}

/* Screen 10 — Security exposure. */
export function SecurityPage() {
  const { env } = useEnv()
  const s = getSecurity(env.id)
  const loading = useEnvLoad()

  if (loading) return <ListSkeleton rows={5} />

  if (s.findingTypes === 0) {
    return (
      <div className="placeholder-panel">
        <div className="empty-dot-wrap">
          <span className="dot healthy" />
        </div>
        No security findings in {env.name}.
        <span className="mono">run the first scan to populate exposure data</span>
      </div>
    )
  }

  return (
    <>
      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
        <div className="stat-card">
          <div className="stat-label">Finding types</div>
          <div className="stat-value mono">{s.findingTypes}</div>
          <div className="stat-meta">
            {s.deltaWk <= 0 ? `${Math.abs(s.deltaWk)} fewer than last week` : `${s.deltaWk} more than last week`}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Resources at risk</div>
          <div className="stat-value mono">{s.resourcesAtRisk}</div>
          <div className="stat-meta">across connected accounts</div>
        </div>
        <div className={`stat-card${s.criticalCount > 0 ? ' accent-error' : ' accent-success'}`}>
          <div className="stat-label">Critical</div>
          <div className="stat-value mono">{s.criticalCount}</div>
          <div className="stat-meta">need action this week</div>
        </div>
      </div>

      <div className="section-label">Top findings — AI prioritized</div>
      <div className="row-list">
        {s.topFindings.map((f) => (
          <button key={f.id} className="row" style={{ width: '100%', textAlign: 'left' }}>
            <span className="row-id">{f.id}</span>
            <SeverityBadge severity={f.severity} />
            <span className="row-title">
              {f.title}
              <span className="mono" style={{ display: 'block', fontSize: 10.5, color: 'var(--faint)' }}>
                {f.resource}
              </span>
            </span>
            <span className={`badge ${PRIORITY_CLS[f.aiPriority]}`}>{f.aiPriority}</span>
            <span className="mono pod-stat">{f.confidence}%</span>
          </button>
        ))}
      </div>
    </>
  )
}
