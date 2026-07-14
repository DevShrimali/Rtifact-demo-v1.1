import { useSearchParams } from 'react-router-dom'
import { useEnv } from '../../state/env'
import {
  aggregateCostItems,
  aggregateReliability,
  aggregateSecurity,
  formatUsd,
} from '../../mock/review'
import { cloudServices, connectedEnvironments, permissions } from '../../mock/reviewExtras'
import { SeverityBadge } from '../../components/SeverityBadge'
import { useEnvLoad, ListSkeleton } from '../../components/PageLoad'

/* Review › Inventory (DEV-29). Keeps the resource-inventory content that used
   to live across Security / Cost / Reliability / Insights / Environments /
   Data & Access tabs, now behind one category selector + a graphical view so
   it reads for scanning, not just as plain lists (Karan's note). */

const CATEGORIES = [
  { key: 'security', label: 'Security' },
  { key: 'cost', label: 'Cost' },
  { key: 'reliability', label: 'Reliability' },
  { key: 'cloud', label: 'Cloud' },
  { key: 'environments', label: 'Environments' },
  { key: 'access', label: 'Data & Access' },
] as const

type Cat = (typeof CATEGORIES)[number]['key']

/* horizontal bar chart — the graphical layer Inventory was missing */
function Bars({ data }: { data: { label: string; value: number; tone: 'error' | 'warn' | 'success' | 'neutral' }[] }) {
  const max = Math.max(1, ...data.map((d) => d.value))
  return (
    <div className="inv-bars">
      {data.map((d) => (
        <div key={d.label} className="inv-bar-row">
          <span className="inv-bar-label">{d.label}</span>
          <span className="inv-bar-track">
            <span className={`inv-bar-fill tone-${d.tone}`} style={{ width: `${(d.value / max) * 100}%` }} />
          </span>
          <span className="inv-bar-val mono">{d.value}</span>
        </div>
      ))}
    </div>
  )
}

export function InventoryPage() {
  const { selectedIds } = useEnv()
  const [params, setParams] = useSearchParams()
  const cat = (CATEGORIES.find((c) => c.key === params.get('cat'))?.key ?? 'security') as Cat
  const loading = useEnvLoad()
  const forcedState = params.get('state')

  if (forcedState === 'error') {
    return (
      <div className="error-panel" role="alert">
        <div className="error-title">Couldn’t load inventory metadata</div>
        <div className="error-sub">
          The resource mapping system encountered a connection timeout.
        </div>
      </div>
    )
  }

  if (forcedState === 'empty') {
    return (
      <div className="placeholder-panel">
        No inventory items.
        <span className="mono">provision cloud resources to index them in the catalog</span>
      </div>
    )
  }

  const setCat = (k: Cat) => setParams(k === 'security' ? {} : { cat: k })

  const sec = aggregateSecurity(selectedIds)
  const cost = aggregateCostItems(selectedIds)
  const rel = aggregateReliability(selectedIds)

  return (
    <>
      <nav className="subnav" role="tablist" aria-label="Inventory category">
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            role="tab"
            aria-selected={cat === c.key}
            className={`subnav-item${cat === c.key ? ' active' : ''}`}
            onClick={() => setCat(c.key)}
          >
            {c.label}
          </button>
        ))}
      </nav>

      {loading ? (
        <ListSkeleton rows={5} />
      ) : (
        <>
          {cat === 'security' && (
            <>
              {/* Compact severity summary — 4 pills, no panel wrapper */}
              <div className="sev-summary-row">
                <span className="section-label" style={{ margin: 0, alignSelf: 'center' }}>Findings by severity</span>
                {(
                  [
                    { key: 'critical', label: 'Critical', dot: 'critical', tone: 'sev-critical' },
                    { key: 'high',     label: 'High',     dot: 'high',     tone: 'sev-warning' },
                    { key: 'medium',   label: 'Medium',   dot: 'degraded', tone: 'neutral'     },
                    { key: 'low',      label: 'Low',      dot: 'healthy',  tone: 'neutral'     },
                  ] as const
                ).map(({ key, label, dot, tone }) => {
                  const count = sec.topFindings.filter((f) => f.severity === key).length
                  return (
                    <span key={key} className={`sev-pill badge ${tone}`}>
                      <span className={`dot ${dot}`} />
                      {label}
                      <span className="sev-pill-count">{count}</span>
                    </span>
                  )
                })}
              </div>

              <div className="section-label" style={{ marginTop: 14 }}>Top findings — {sec.resourcesAtRisk} resources at risk</div>
              <div className="row-list">
                {sec.topFindings.map((f) => (
                  <div key={f.id} className="row">
                    <span className="row-id">{f.id}</span>
                    <SeverityBadge severity={f.severity} />
                    <span className="row-title">{f.title}</span>
                    <span className="mono pod-stat">{f.confidence}%</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {cat === 'cost' && (
            <>
              <section className="panel">
                <div className="panel-title">Savings by opportunity — {formatUsd(cost.reduce((s, i) => s + i.savingMoUsd, 0))}/mo total</div>
                <Bars data={cost.map((i) => ({ label: i.title, value: i.savingMoUsd, tone: 'success' }))} />
              </section>
              <div className="row-list">
                {cost.map((i) => (
                  <div key={i.id} className="row">
                    <span className="row-id">{i.id}</span>
                    <span className="row-title">
                      {i.title}
                      <span style={{ display: 'block', fontSize: 11.5, color: 'var(--muted)', fontWeight: 400 }}>{i.rootCause}</span>
                    </span>
                    <span className="badge neutral">{i.effort} effort</span>
                    <span className="mono" style={{ fontWeight: 700 }}>{formatUsd(i.savingMoUsd)}/mo</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {cat === 'reliability' && (
            <>
              <section className="panel">
                <div className="panel-title">Deployment stability — {rel.deploys.failPct}% change-failure rate</div>
                <Bars
                  data={[
                    { label: 'Deploys', value: rel.deploys.total, tone: 'neutral' },
                    { label: 'Rolled back', value: rel.deploys.rolledBack, tone: 'warn' },
                    { label: 'Risk signals', value: rel.signals.length, tone: rel.signals.some((s) => s.level === 'critical') ? 'error' : 'warn' },
                  ]}
                />
              </section>
              <div className="row-list">
                {rel.signals.map((s, i) => (
                  <div key={`${s.workload}-${i}`} className="row">
                    <span className="mono row-id" style={{ width: 130 }}>{s.workload}</span>
                    <span className={`badge ${s.level === 'critical' ? 'sev-critical' : s.level === 'high' ? 'sev-warning' : 'neutral'}`}>{s.level}</span>
                    <span className="row-title" style={{ fontWeight: 400 }}>{s.signal}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {cat === 'cloud' && (
            <>
              <section className="panel">
                <div className="panel-title">Findings by service</div>
                <Bars data={cloudServices.map((s) => ({ label: s.name, value: s.findings, tone: s.health === 'critical' ? 'error' : s.health === 'degraded' ? 'warn' : 'success' }))} />
              </section>
              <div className="row-list">
                {cloudServices.map((s) => (
                  <div key={s.name} className="row">
                    <span className={`dot ${s.health}`} />
                    <span className="row-title" style={{ flex: '0 0 110px' }}>{s.name}</span>
                    <span className="row-title" style={{ fontWeight: 400, color: 'var(--muted)' }}>{s.metric}</span>
                    <span className={`badge ${s.findings > 2 ? 'sev-warning' : 'neutral'}`}>{s.findings} finding{s.findings === 1 ? '' : 's'}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {cat === 'environments' && (
            <div className="row-list">
              {connectedEnvironments.map((e) => (
                <div key={e.id} className="row">
                  <span className={`dot ${e.health}`} />
                  <span className="row-title" style={{ flex: '0 0 150px' }}>{e.name}</span>
                  <span className="mono" style={{ fontSize: 11, color: 'var(--faint)', flex: 1 }}>{e.provider} · {e.region}</span>
                  <span className="mono pod-stat">{e.clusters} cluster{e.clusters === 1 ? '' : 's'}</span>
                  <span className={`badge ${e.scanStatus === 'scanning' ? 'sev-warning' : 'sev-healthy'}`}>{e.scanStatus === 'scanning' ? `scanning ${e.scanPct}%` : 'scanned'}</span>
                </div>
              ))}
            </div>
          )}

          {cat === 'access' && (
            <div className="row-list">
              {permissions.map((p) => (
                <div key={p.scope} className="row">
                  <span className="row-title">
                    {p.scope}
                    <span style={{ display: 'block', fontSize: 11, color: 'var(--muted)', fontWeight: 400 }}>{p.purpose}</span>
                  </span>
                  <span className={`badge ${p.status === 'granted' ? 'sev-healthy' : 'sev-warning'}`}>{p.status}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </>
  )
}
