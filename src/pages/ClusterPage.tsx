import { useParams, Link, useSearchParams } from 'react-router-dom'
import { useEnv } from '../state/env'
import { findCluster, getClusters } from '../mock/infra'
import type { Pod } from '../mock/infra'
import { TimeAgo } from '../components/TimeAgo'
import { useEnvLoad, ListSkeleton } from '../components/PageLoad'

const POD_STATUS: Record<Pod['status'], { label: string; cls: string }> = {
  running: { label: 'Running', cls: 'sev-healthy' },
  pending: { label: 'Pending', cls: 'sev-warning' },
  crashloop: { label: 'CrashLoop', cls: 'sev-critical' },
}

/* Secondary tier of the env › cluster › pod drill (DEV-8). Routed page,
   reached one reveal from the Command board's health tiles. */
export function ClusterPage() {
  const { clusterId } = useParams()
  const { env } = useEnv()
  const [searchParams] = useSearchParams()
  const forcedState = searchParams.get('state')
  const loading = useEnvLoad()
  const cluster = findCluster(clusterId ?? '')

  if (loading) return <ListSkeleton rows={6} />

  if (forcedState === 'error') {
    return (
      <div className="error-panel" role="alert">
        <div className="error-title">Cluster data unavailable</div>
        <div className="error-sub">Unable to reach the cluster API. It may be temporarily offline.</div>
      </div>
    )
  }

  if (!cluster) {
    return (
      <div className="error-panel" role="alert">
        <div className="error-title">Cluster {clusterId} not found</div>
        <div className="error-sub">It may have been disconnected from this workspace.</div>
      </div>
    )
  }

  const siblings = getClusters(cluster.envId).filter((c) => c.id !== cluster.id)
  const troubled = cluster.pods.filter((p) => p.status !== 'running').length

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">Command · Cluster</div>
          <h1 className="page-title mono" style={{ fontSize: 21 }}>
            {cluster.id}
          </h1>
          <p className="page-sub">
            {cluster.nodes} nodes · {cluster.utilization}% utilization · {cluster.version}
            {troubled > 0 ? ` — ${troubled} pod${troubled === 1 ? '' : 's'} unhealthy` : ' — all pods healthy'}
          </p>
        </div>
        <button className="btn btn-primary">Cordon & drain node</button>
      </div>

      {siblings.length > 0 && (
        <div className="sibling-chips">
          <span className="eyebrow" style={{ margin: 0 }}>
            Also in {env.name}:
          </span>
          {siblings.map((c) => (
            <Link key={c.id} to={`/command/clusters/${c.id}`} className="pipeline-tab">
              <span className={`dot ${c.health}`} />
              {c.id}
            </Link>
          ))}
        </div>
      )}

      <div className="section-label">Pods</div>
      <div className="row-list">
        {cluster.pods.map((p) => {
          const st = POD_STATUS[p.status]
          return (
            <Link key={p.id} to={`/command/clusters/${cluster.id}/pods/${p.id}`} className="row">
              <span className="row-id" style={{ width: 170 }}>
                {p.id}
              </span>
              <span className={`badge ${st.cls}`}>{st.label}</span>
              <span className="row-title">{p.service}</span>
              <span className="mono pod-stat">cpu {p.cpuPct}%</span>
              <span className="mono pod-stat">mem {p.memPct}%</span>
              <span className="mono pod-stat">↻ {p.restarts}</span>
              <TimeAgo timestamp={p.startedAt} />
            </Link>
          )
        })}
      </div>
    </>
  )
}
