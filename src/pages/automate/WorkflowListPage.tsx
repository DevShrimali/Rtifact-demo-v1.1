import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { workflows as seed } from '../../mock/workflows'
import type { Workflow } from '../../mock/workflows'
import { TimeAgo } from '../../components/TimeAgo'
import { useEnv } from '../../state/env'

/* Screen 18 — Workflow list: dense, scannable, with live status toggles.
   States: Default · Empty · Loading (`?state=` pins empty/loading). */
export function WorkflowListPage() {
  const { env } = useEnv()
  const [searchParams] = useSearchParams()
  const forced = searchParams.get('state')
  /* executions history links back with ?highlight=WF-xxx */
  const highlightId = searchParams.get('highlight')
  const [loaded, setLoaded] = useState(false)
  const [items, setItems] = useState<Workflow[]>(seed)

  useEffect(() => {
    setLoaded(false)
    const t = setTimeout(() => setLoaded(true), 550)
    return () => clearTimeout(t)
  }, [env.id])

  const loading = forced === 'loading' || !loaded
  const list = forced === 'empty' ? [] : items
  const counts = {
    active: list.filter((w) => w.status === 'active').length,
    disabled: list.filter((w) => w.status === 'disabled').length,
    draft: list.filter((w) => w.status === 'draft').length,
    executions: list.reduce((s, w) => s + w.executions, 0),
  }

  const toggle = (id: string) =>
    setItems((prev) =>
      prev.map((w) =>
        w.id === id
          ? { ...w, status: w.status === 'active' ? 'disabled' : 'active' }
          : w,
      ),
    )

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">Automate</div>
          <h1 className="page-title">Workflows</h1>
          <p className="page-sub">
            {loading
              ? 'Loading workflows…'
              : list.length === 0
                ? 'No workflows yet'
                : `${counts.active} active · ${counts.executions.toLocaleString()} executions all-time`}
          </p>
        </div>
        <Link to="/automate/workflows/new" className="btn btn-primary">
          <Plus size={14} strokeWidth={2.2} />
          Create workflow
        </Link>
      </div>

      <div className="stats-bar" style={{ marginBottom: 14 }}>
        {(
          [
            ['Active', counts.active],
            ['Disabled', counts.disabled],
            ['Draft', counts.draft],
            ['Executions', counts.executions.toLocaleString()],
          ] as const
        ).map(([label, value]) => (
          <div key={label} className="stats-bar-item">
            <span className="stat-label">{label}</span>
            <span className="mono stats-bar-value">{loading ? '—' : value}</span>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="row-list">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="row" style={{ pointerEvents: 'none' }}>
              <span className="skeleton skeleton-text" style={{ width: '70%' }} />
            </div>
          ))}
        </div>
      ) : list.length === 0 ? (
        <div className="placeholder-panel">
          No workflows yet — automate the toil first.
          <span className="mono">start from a template or build from scratch</span>
          <div style={{ marginTop: 14 }}>
            <Link to="/automate/workflows/new" className="btn btn-primary">
              <Plus size={14} strokeWidth={2.2} />
              Create first workflow
            </Link>
          </div>
        </div>
      ) : (
        <div className="row-list">
          {list.map((w) => (
            <div key={w.id} className={`row wf-row${w.id === highlightId ? ' pulse-border wf-highlight' : ''}`}>
              <button
                role="switch"
                aria-checked={w.status === 'active'}
                aria-label={`${w.name} status`}
                className={`switch${w.status === 'active' ? ' on' : ''}${w.status === 'draft' ? ' draft' : ''}`}
                disabled={w.status === 'draft'}
                onClick={() => toggle(w.id)}
              >
                <span className="switch-knob" />
              </button>
              <span className="row-title">
                {w.name}
                {w.status === 'draft' && <span className="badge neutral" style={{ marginLeft: 8 }}>Draft</span>}
              </span>
              <span className="mono trigger-tag">{w.trigger}</span>
              <span className="scope-tags">
                {w.scopeTags.length === 0 ? (
                  <span className="badge neutral">global</span>
                ) : (
                  w.scopeTags.map((t) => (
                    <span key={t} className="badge neutral mono" style={{ fontWeight: 500 }}>
                      {t}
                    </span>
                  ))
                )}
              </span>
              <span className={`mono pod-stat${w.successRate !== null && w.successRate < 95 ? ' warn-text' : ''}`}>
                {w.successRate === null ? '—' : `${w.successRate}%`}
              </span>
              {w.lastRun ? <TimeAgo timestamp={w.lastRun} /> : <span className="time-ref">never run</span>}
            </div>
          ))}
        </div>
      )}
    </>
  )
}
