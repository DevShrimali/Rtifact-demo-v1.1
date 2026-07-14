import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import { knowledgeBrowse, knowledgeStats, knownPatterns } from '../../mock/settings'
import { useAskAI } from '../../components/AskAI'
import { ListSkeleton, useEnvLoad } from '../../components/PageLoad'

const TABS = ['Services', 'Environments', 'Incidents'] as const

/* Screen 52 — Operational Knowledge: what the platform has learned. */
export function KnowledgePage() {
  const [searchParams] = useSearchParams()
  const empty = searchParams.get('state') === 'empty'
  const [tab, setTab] = useState<(typeof TABS)[number]>('Services')
  const { setOpen } = useAskAI()
  const loading = useEnvLoad()

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">Settings</div>
          <h1 className="page-title">Operational Knowledge</h1>
          <p className="page-sub">Everything the platform has learned from your incidents.</p>
        </div>
        <button className="btn btn-secondary" onClick={() => setOpen(true)}>
          <Sparkles size={14} strokeWidth={2.2} />
          Ask AI about knowledge gaps
        </button>
      </div>
      {loading ? (
        <ListSkeleton rows={5} />
      ) : empty ? (
        <div className="placeholder-panel">
          Nothing learned yet — knowledge accrues as incidents resolve.
          <span className="mono">patterns, runbooks, and dependencies appear here automatically</span>
        </div>
      ) : (
        <>
          <div className="stats-bar" style={{ marginBottom: 18 }}>
            {knowledgeStats.map((s) => (
              <div key={s.label} className="stats-bar-item">
                <span className="stat-label">{s.label}</span>
                <span className="mono stats-bar-value">{s.value}</span>
              </div>
            ))}
          </div>

          <div className="section-label">Known patterns</div>
          <div className="row-list" style={{ marginBottom: 18 }}>
            {knownPatterns.map((p) => (
              <div key={p.id} className="row">
                <span className="row-id">{p.id}</span>
                <span className="row-title">
                  {p.name}
                  <span style={{ display: 'block', fontSize: 11.5, color: 'var(--muted)', fontWeight: 400 }}>
                    resolution: {p.resolution}
                  </span>
                </span>
                <span className="mono pod-stat">seen {p.seen}×</span>
                <span className="time-ref">{p.lastSeen}</span>
              </div>
            ))}
          </div>

          <div className="pipeline-tabs" role="tablist" aria-label="Browse knowledge">
            {TABS.map((t) => (
              <button
                key={t}
                role="tab"
                aria-selected={tab === t}
                className={`pipeline-tab${tab === t ? ' active' : ''}`}
                onClick={() => setTab(t)}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="row-list">
            {knowledgeBrowse[tab].map((line) => (
              <div key={line} className="row">
                <span className="row-title" style={{ fontWeight: 400 }}>
                  {line}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  )
}
