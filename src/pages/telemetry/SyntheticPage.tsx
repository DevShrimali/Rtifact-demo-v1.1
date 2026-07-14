import { Link, useSearchParams } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { getSyntheticChecks } from '../../mock/telemetry'
import type { SyntheticCheck } from '../../mock/telemetry'
import { Sparkline } from '../../components/Sparkline'
import { TimeAgo } from '../../components/TimeAgo'
import { useEnv } from '../../state/env'
import { useEnvLoad, ListSkeleton } from '../../components/PageLoad'

const STATUS_CLS: Record<SyntheticCheck['status'], { label: string; cls: string }> = {
  passing: { label: 'Passing', cls: 'sev-healthy' },
  degraded: { label: 'Degraded', cls: 'sev-warning' },
  failing: { label: 'Failing', cls: 'sev-critical' },
}

/* Screen 17 — Synthetic checks list: summary stats, checks table with trend
   sparkline / uptime / status / alerts / last run. States: Default · Empty. */
export function SyntheticPage() {
  const { env } = useEnv()
  const [searchParams] = useSearchParams()
  const forcedState = searchParams.get('state')
  const loading = useEnvLoad()
  const checks = getSyntheticChecks(env.id)
  const passing = checks.filter((c) => c.status === 'passing').length
  const failing = checks.filter((c) => c.status === 'failing').length
  const avgUptime =
    checks.length > 0 ? (checks.reduce((s, c) => s + c.uptimePct, 0) / checks.length).toFixed(2) : '—'

  if (loading) return <ListSkeleton rows={5} />

  if (forcedState === 'error') {
    return (
      <div className="error-panel" role="alert">
        <div className="error-title">Synthetic monitoring unavailable</div>
        <div className="error-sub">The synthetic check runner is temporarily offline.</div>
      </div>
    )
  }

  return (
    <>
      <div className="stats-bar" style={{ marginBottom: 14 }}>
        <div className="stats-bar-item">
          <span className="stat-label">Checks</span>
          <span className="mono stats-bar-value">{checks.length}</span>
        </div>
        <div className="stats-bar-item">
          <span className="stat-label">Passing</span>
          <span className="mono stats-bar-value">{passing}</span>
        </div>
        <div className="stats-bar-item">
          <span className="stat-label">Failing</span>
          <span className="mono stats-bar-value">{failing}</span>
        </div>
        <div className="stats-bar-item">
          <span className="stat-label">Avg uptime 30d</span>
          <span className="mono stats-bar-value">{avgUptime}%</span>
        </div>
        <button className="btn btn-primary" style={{ marginLeft: 'auto', alignSelf: 'center' }}>
          <Plus size={14} strokeWidth={2.2} />
          New check
        </button>
      </div>

      {checks.length === 0 ? (
        <div className="placeholder-panel">
          No synthetic checks in {env.name} yet.
          <span className="mono">probe critical user flows even when traffic is quiet</span>
          <div style={{ marginTop: 14 }}>
            <button className="btn btn-primary">
              <Plus size={14} strokeWidth={2.2} />
              Create first check
            </button>
          </div>
        </div>
      ) : (
        <div className="row-list">
          {checks.map((c) => {
            const st = STATUS_CLS[c.status]
            return (
              <Link key={c.id} to={`/command/telemetry/synthetic/${c.id}`} className="row" style={{ width: '100%', textAlign: 'left' }}>
                <span className="row-title" style={{ flex: '0 0 220px' }}>
                  {c.name}
                  <span className="mono" style={{ display: 'block', fontSize: 10.5, color: 'var(--faint)' }}>
                    every {c.intervalMin}m
                  </span>
                </span>
                <Sparkline
                  data={c.trend}
                  width={110}
                  height={24}
                  stroke={c.status === 'passing' ? 'var(--muted)' : c.status === 'degraded' ? 'var(--warn)' : 'var(--error)'}
                />
                <span className="mono pod-stat">{c.uptimePct}%</span>
                <span className={`badge ${st.cls}`}>{st.label}</span>
                <span className="mono pod-stat">
                  {c.alerts} alert{c.alerts === 1 ? '' : 's'}
                </span>
                <TimeAgo timestamp={c.lastRun} />
              </Link>
            )
          })}
        </div>
      )}
    </>
  )
}
