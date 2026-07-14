import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CheckCircle2, Plug, PlugZap, X } from 'lucide-react'
import { agents } from '../../mock/settings'
import type { Agent } from '../../mock/settings'
import { ConfidencePill } from '../../components/Confidence'
import { ListSkeleton, useEnvLoad } from '../../components/PageLoad'

const CATEGORIES = ['Runtime Intelligence', 'Infrastructure Intelligence'] as const

/* Screens 46–47 — Agent Ontology overview + agent detail drawer.
   The drawer follows the Ask AI pattern: docked side panel, no backdrop,
   no focus trap — the page stays interactive, so the no-modal rule holds. */
export function AgentsPage() {
  const [searchParams] = useSearchParams()
  const forcedState = searchParams.get('state')
  const [selected, setSelected] = useState<Agent | null>(null)
  const loading = useEnvLoad()

  useEffect(() => {
    if (!selected) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelected(null)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [selected])

  const active = agents.filter((a) => a.active).length
  const avgCoverage = Math.round(agents.reduce((s, a) => s + a.coveragePct, 0) / agents.length)
  const avgConfidence = Math.round(agents.reduce((s, a) => s + a.confidencePct, 0) / agents.length)
  const missing = agents.reduce((s, a) => s + a.missingSources, 0)

  if (forcedState === 'error') {
    return (
      <div className="error-panel" role="alert">
        <div className="error-title">Agent data unavailable</div>
        <div className="error-sub">Unable to fetch agent status. The backend may be temporarily offline.</div>
      </div>
    )
  }

  if (forcedState === 'empty') {
    return (
      <div className="placeholder-panel">
        No agents configured yet.
        <span className="mono">deploy an Rtifact agent to start intelligence coverage</span>
      </div>
    )
  }

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">Settings</div>
          <h1 className="page-title">Agent Ontology</h1>
          <p className="page-sub">12 agents power detection, correlation, and remediation.</p>
        </div>
      </div>
      <div className="stats-bar" style={{ marginBottom: 8 }}>
        <div className="stats-bar-item">
          <span className="stat-label">Active</span>
          <span className="mono stats-bar-value">{active} / 12</span>
        </div>
        <div className="stats-bar-item">
          <span className="stat-label">Coverage</span>
          <span className="mono stats-bar-value">{avgCoverage}%</span>
        </div>
        <div className="stats-bar-item">
          <span className="stat-label">Confidence</span>
          <span className="mono stats-bar-value">{avgConfidence}%</span>
        </div>
        <div className="stats-bar-item">
          <span className="stat-label">Missing sources</span>
          <span className="mono stats-bar-value" style={{ color: missing > 0 ? 'var(--warn)' : undefined }}>
            {missing}
          </span>
        </div>
      </div>

      <div className="panel" style={{ padding: '12px 16px', marginBottom: 18 }}>
        <div className="goal-top" style={{ marginBottom: 8 }}>
          <span className="goal-label">Intelligence Coverage</span>
          <span className="mono" style={{ fontSize: 12, fontWeight: 700 }}>
            {avgCoverage}%
          </span>
        </div>
        <div className="goal-bar">
          <div className={`goal-fill ${avgCoverage >= 80 ? 'ok' : 'behind'}`} style={{ width: `${avgCoverage}%` }} />
        </div>
      </div>

      {loading && <ListSkeleton rows={6} />}
      {!loading && CATEGORIES.map((cat) => (
        <div key={cat}>
          <div className="section-label">{cat}</div>
          <div className="row-list" style={{ marginBottom: 18 }}>
            {agents
              .filter((a) => a.category === cat)
              .map((a) => (
                <button
                  key={a.id}
                  className={`row${selected?.id === a.id ? ' wf-highlight' : ''}`}
                  style={{ width: '100%', textAlign: 'left' }}
                  onClick={() => setSelected(a)}
                  aria-expanded={selected?.id === a.id}
                >
                  <span className={`dot ${a.active ? (a.missingSources > 0 ? 'degraded' : 'healthy') : 'critical'}`} style={{ animation: 'none' }} />
                  <span className="row-title" style={{ flex: '0 0 190px' }}>
                    {a.name}
                  </span>
                  <span className={`badge ${a.active ? 'sev-healthy' : 'neutral'}`}>
                    {a.active ? 'Active' : 'Inactive'}
                  </span>
                  <span className="mono pod-stat">cov {a.coveragePct}%</span>
                  <span className="mono pod-stat">conf {a.confidencePct}%</span>
                  {a.missingSources > 0 ? (
                    <span className="badge sev-warning">
                      {a.missingSources} source{a.missingSources === 1 ? '' : 's'} missing
                    </span>
                  ) : (
                    <span className="badge neutral">all sources connected</span>
                  )}
                </button>
              ))}
          </div>
        </div>
      ))}

      {selected && (
        <aside className="askai-panel agent-drawer" aria-label={`Agent: ${selected.name}`}>
          <header className="askai-head">
            <span className={`dot ${selected.active ? (selected.missingSources > 0 ? 'degraded' : 'healthy') : 'critical'}`} style={{ animation: 'none' }} />
            <span className="askai-title">
              {selected.name}
              <span className="askai-surface">{selected.category}</span>
            </span>
            <button className="askai-close" onClick={() => setSelected(null)} aria-label="Close drawer">
              <X size={16} strokeWidth={2.2} />
            </button>
          </header>

          <div className="askai-body">
            <div className="askai-hint">Purpose</div>
            <p className="panel-body-text" style={{ fontSize: 12.5 }}>
              {selected.purpose}
            </p>

            <div className="askai-hint" style={{ marginTop: 8 }}>
              Coverage
            </div>
            <div className="goal-bar" style={{ width: '100%' }}>
              <div className={`goal-fill ${selected.coveragePct >= 80 ? 'ok' : 'behind'}`} style={{ width: `${selected.coveragePct}%` }} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <span className="mono" style={{ fontSize: 11, color: 'var(--muted)' }}>
                coverage {selected.coveragePct}%
              </span>
              <ConfidencePill value={selected.confidencePct} />
            </div>

            <div className="askai-hint" style={{ marginTop: 8 }}>
              Connected sources
            </div>
            {selected.sources.map((s) => (
              <div key={s.name} className="kv-row" style={{ width: '100%' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12 }}>
                  {s.connected ? (
                    <PlugZap size={13} strokeWidth={2} style={{ color: 'var(--success)' }} />
                  ) : (
                    <Plug size={13} strokeWidth={2} style={{ color: 'var(--warn)' }} />
                  )}
                  {s.name}
                </span>
                <span className={`badge ${s.connected ? 'sev-healthy' : 'sev-warning'}`}>
                  {s.connected ? 'connected' : 'missing'}
                </span>
              </div>
            ))}

            <div className="askai-hint" style={{ marginTop: 8 }}>
              What it drives
            </div>
            {selected.drives.map((d) => (
              <div key={d} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12 }}>
                <CheckCircle2 size={13} strokeWidth={2} style={{ color: 'var(--faint)' }} />
                {d}
              </div>
            ))}
          </div>

          <div className="askai-input" style={{ display: 'block' }}>
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
              <Plug size={14} strokeWidth={2.2} />
              Connect source
            </button>
          </div>
        </aside>
      )}
    </>
  )
}
