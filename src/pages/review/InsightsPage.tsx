import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { cloudServices } from '../../mock/reviewExtras'
import { getClusters } from '../../mock/infra'
import { getReliability } from '../../mock/review'
import { useEnv } from '../../state/env'

const LEVEL_CLS: Record<string, string> = {
  critical: 'sev-critical',
  high: 'sev-warning',
  medium: 'neutral',
}

/* Screens 28–29 — Cloud / K8s insights as peer tabs on one routed page. */
export function InsightsPage() {
  const { env } = useEnv()
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = searchParams.get('tab') === 'k8s' ? 'k8s' : 'cloud'
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const t = setTimeout(() => setLoading(false), 550)
    return () => clearTimeout(t)
  }, [env.id, tab])

  return (
    <>
      <div className="pipeline-tabs" role="tablist" aria-label="Insights scope" style={{ marginBottom: 12 }}>
        <button
          role="tab"
          aria-selected={tab === 'cloud'}
          className={`pipeline-tab${tab === 'cloud' ? ' active' : ''}`}
          onClick={() => setSearchParams({})}
        >
          Cloud
        </button>
        <button
          role="tab"
          aria-selected={tab === 'k8s'}
          className={`pipeline-tab${tab === 'k8s' ? ' active' : ''}`}
          onClick={() => setSearchParams({ tab: 'k8s' })}
        >
          Kubernetes
        </button>
      </div>

      {loading ? (
        <div className="row-list" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className="row" style={{ pointerEvents: 'none' }}>
              <span className="skeleton skeleton-text" style={{ width: '60%' }} />
            </div>
          ))}
        </div>
      ) : tab === 'cloud' ? (
        <div className="row-list">
          {cloudServices.map((s) => (
            <div key={s.name} className="row">
              <span className={`dot ${s.health}`} />
              <span className="row-title" style={{ flex: '0 0 110px' }}>
                {s.name}
              </span>
              <span className="row-title" style={{ fontWeight: 400, color: 'var(--muted)' }}>
                {s.metric}
              </span>
              <span className={`badge ${s.findings > 2 ? 'sev-warning' : 'neutral'}`}>
                {s.findings} finding{s.findings === 1 ? '' : 's'}
              </span>
              <span className="mono pod-stat">{s.resources} res</span>
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="section-label" style={{ marginTop: 0 }}>
            Cluster health — {env.name}
          </div>
          <div className="row-list" style={{ marginBottom: 18 }}>
            {getClusters(env.id).map((c) => (
              <div key={c.id} className="row">
                <span className={`dot ${c.health}`} />
                <span className="mono row-title" style={{ flex: '0 0 150px', fontSize: 12 }}>
                  {c.id}
                </span>
                <span className="row-title" style={{ fontWeight: 400, color: 'var(--muted)' }}>
                  {c.nodes} nodes · {c.utilization}% util · {c.version}
                </span>
                <span className={`badge ${c.pods.some((p) => p.status !== 'running') ? 'sev-warning' : 'sev-healthy'}`}>
                  {c.pods.filter((p) => p.status !== 'running').length || 'no'} unhealthy pods
                </span>
              </div>
            ))}
          </div>
          <div className="section-label">Workload signals</div>
          <div className="row-list">
            {getReliability(env.id).signals.map((s) => (
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
        </>
      )}
    </>
  )
}
