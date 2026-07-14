import { useParams, useSearchParams } from 'react-router-dom'
import { AlertTriangle, Info, OctagonX, RotateCcw } from 'lucide-react'
import { findCluster, findPod } from '../mock/infra'
import { TimeAgo } from '../components/TimeAgo'
import { useEnvLoad, ListSkeleton } from '../components/PageLoad'

/* Tertiary tier of the env › cluster › pod drill (DEV-8) — the deepest
   level. Anything deeper (container logs etc.) hands off to Telemetry
   rather than adding a 4th tier. */
export function PodPage() {
  const { clusterId, podId } = useParams()
  const [searchParams] = useSearchParams()
  const forcedState = searchParams.get('state')
  const loading = useEnvLoad()
  const cluster = findCluster(clusterId ?? '')
  const pod = findPod(clusterId ?? '', podId ?? '')

  if (loading) return <ListSkeleton rows={4} />

  if (forcedState === 'error') {
    return (
      <div className="error-panel" role="alert">
        <div className="error-title">Pod data unavailable</div>
        <div className="error-sub">The pod may have been evicted or the cluster API is unreachable.</div>
      </div>
    )
  }

  if (!cluster || !pod) {
    return (
      <div className="error-panel" role="alert">
        <div className="error-title">Pod {podId} not found</div>
        <div className="error-sub">It may have been rescheduled under a new name.</div>
      </div>
    )
  }

  const unhealthy = pod.status !== 'running'

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">Command · {cluster.id} · Pod</div>
          <h1 className="page-title mono" style={{ fontSize: 19 }}>
            {pod.id}
          </h1>
          <p className="page-sub">
            {pod.service} · node <span className="mono">{pod.node}</span> · {pod.restarts} restarts
          </p>
        </div>
        <button className="btn btn-primary">
          <RotateCcw size={14} strokeWidth={2.2} />
          Restart pod
        </button>
      </div>

      <div className="detail-grid">
        <div className="detail-main">
          <section className="panel">
            <div className="panel-title">Resources</div>
            <div className="slo-row">
              <span className="slo-label">CPU</span>
              <div className="slo-bar">
                <div
                  className={`slo-fill ${pod.cpuPct > 85 ? 'recovering' : 'ok'}`}
                  style={{ width: `${pod.cpuPct}%` }}
                />
              </div>
              <span className="mono slo-nums">{pod.cpuPct}%</span>
            </div>
            <div className="slo-row">
              <span className="slo-label">Memory</span>
              <div className="slo-bar">
                <div
                  className={`slo-fill ${pod.memPct > 85 ? 'recovering' : 'ok'}`}
                  style={{ width: `${pod.memPct}%` }}
                />
              </div>
              <span className="mono slo-nums">{pod.memPct}%</span>
            </div>
          </section>

          <section className="panel">
            <div className="panel-title">Recent events</div>
            <ul className="pipeline">
              {pod.events.map((e) => (
                <li key={e.label} className="pipe-step">
                  {e.level === 'error' ? (
                    <OctagonX size={15} strokeWidth={2} className="pipe-icon" style={{ color: 'var(--error)' }} />
                  ) : e.level === 'warn' ? (
                    <AlertTriangle size={15} strokeWidth={2} className="pipe-icon" style={{ color: 'var(--warn)' }} />
                  ) : (
                    <Info size={15} strokeWidth={2} className="pipe-icon pending" />
                  )}
                  <span>{e.label}</span>
                  <span style={{ marginLeft: 'auto' }}>
                    <TimeAgo timestamp={e.at} />
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="detail-side">
          <section className="panel">
            <div className="panel-title">Pod info</div>
            <div className="kv-row">
              <span className="kv-label">Status</span>
              <span className={`badge ${unhealthy ? (pod.status === 'crashloop' ? 'sev-critical' : 'sev-warning') : 'sev-healthy'}`}>
                {pod.status === 'crashloop' ? 'CrashLoop' : pod.status === 'pending' ? 'Pending' : 'Running'}
              </span>
            </div>
            <div className="kv-row">
              <span className="kv-label">Service</span>
              <span className="kv-value mono">{pod.service}</span>
            </div>
            <div className="kv-row">
              <span className="kv-label">Node</span>
              <span className="kv-value mono">{pod.node}</span>
            </div>
            <div className="kv-row">
              <span className="kv-label">Started</span>
              <span className="kv-value">
                <TimeAgo timestamp={pod.startedAt} />
              </span>
            </div>
            <div className="panel-foot-note">
              Container logs & traces live in Telemetry — one surface, three lenses. No deeper
              drill tier here by design.
            </div>
          </section>
        </div>
      </div>
    </>
  )
}
