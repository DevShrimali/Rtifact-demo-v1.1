import { useEnv } from '../state/env'

/* Static mock module pages — placeholders the real screen tickets replace.
   They exist so the shell can be verified: theme default, breadcrumb,
   env-scoped data, click-through targets. */
export function ModulePage({
  module,
  title,
  sub,
  replacedBy,
}: {
  module: string
  title: string
  sub: string
  replacedBy: string
}) {
  const { env } = useEnv()

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">{module}</div>
          <h1 className="page-title">{title}</h1>
          <p className="page-sub">{sub}</p>
        </div>
      </div>

      <div className="stat-grid">
        <div className={`stat-card${env.criticalAlerts > 0 ? ' accent-error' : ' accent-success'}`}>
          <div className="stat-label">Active alerts</div>
          <div className="stat-value mono">{env.activeAlerts}</div>
          <div className="stat-meta">
            {env.criticalAlerts} critical · <span className="time-ref">2m ago</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Clusters</div>
          <div className="stat-value mono">{env.clusters}</div>
          <div className="stat-meta">
            {env.provider} · <span className="time-ref">41m ago</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Environment</div>
          <div className="stat-value" style={{ fontSize: 18 }}>
            {env.name}
          </div>
          <div className="stat-meta mono">{env.region}</div>
        </div>
        <div
          className={`stat-card accent-${
            env.health === 'healthy' ? 'success' : env.health === 'degraded' ? 'warn' : 'error'
          }`}
        >
          <div className="stat-label">Health</div>
          <div className="stat-value" style={{ fontSize: 18, textTransform: 'capitalize' }}>
            {env.health}
          </div>
          <div className="stat-meta">
            <span className={`dot ${env.health}`} /> <span className="time-ref">live</span>
          </div>
        </div>
      </div>

      <div className="placeholder-panel">
        Placeholder — this surface is built by {replacedBy}.
        <span className="mono">shell verification target · env: {env.id}</span>
      </div>
    </>
  )
}
