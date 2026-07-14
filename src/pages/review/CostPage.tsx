import { useEnv } from '../../state/env'
import { formatUsd, getCostItems } from '../../mock/review'
import { ListSkeleton, useEnvLoad } from '../../components/PageLoad'

const EFFORT_CLS: Record<string, string> = {
  Low: 'sev-healthy',
  Medium: 'sev-warning',
  High: 'sev-critical',
}

/* Screen 11 — Cost optimization: FinOps estimate with a specific $ amount
   and root-cause line items. */
export function CostPage() {
  const { env } = useEnv()
  const items = getCostItems(env.id)
  const total = items.reduce((s, i) => s + i.savingMoUsd, 0)
  const loading = useEnvLoad()

  if (loading) return <ListSkeleton rows={5} />

  if (items.length === 0) {
    return (
      <div className="placeholder-panel">
        No cost findings in {env.name} yet.
        <span className="mono">connect billing data to estimate savings</span>
      </div>
    )
  }

  return (
    <>
      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
        <div className="stat-card accent-success">
          <div className="stat-label">Savings ready to capture</div>
          <div className="stat-value mono">{formatUsd(total)}/mo</div>
          <div className="stat-meta">{formatUsd(total * 12)} annualized</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Opportunities</div>
          <div className="stat-value mono">{items.length}</div>
          <div className="stat-meta">{items.filter((i) => i.effort === 'Low').length} are low-effort</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Largest single item</div>
          <div className="stat-value mono">{formatUsd(Math.max(...items.map((i) => i.savingMoUsd)))}/mo</div>
          <div className="stat-meta">{items[0].title.toLowerCase()}</div>
        </div>
      </div>

      <div className="section-label">Root-cause line items</div>
      <div className="row-list">
        {items.map((i) => (
          <button key={i.id} className="row" style={{ width: '100%', textAlign: 'left' }}>
            <span className="row-id">{i.id}</span>
            <span className="row-title">
              {i.title}
              <span style={{ display: 'block', fontSize: 11.5, color: 'var(--muted)', fontWeight: 400 }}>
                {i.rootCause}
              </span>
            </span>
            <span className={`badge ${EFFORT_CLS[i.effort]}`}>{i.effort} effort</span>
            <span className="mono" style={{ fontSize: 13, fontWeight: 700 }}>
              {formatUsd(i.savingMoUsd)}/mo
            </span>
          </button>
        ))}
      </div>
    </>
  )
}
