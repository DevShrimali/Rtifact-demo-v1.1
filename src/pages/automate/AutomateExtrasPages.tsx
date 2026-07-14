import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle2, Lock, MinusCircle, OctagonX, Plus } from 'lucide-react'
import { auditLog, executions, templates } from '../../mock/automateExtras'
import { TimeAgo } from '../../components/TimeAgo'
import { ListSkeleton, useEnvLoad } from '../../components/PageLoad'

/* Screen 43 — Templates. */
export function TemplatesPage() {
  const [searchParams] = useSearchParams()
  const list = searchParams.get('state') === 'empty' ? [] : templates
  const loading = useEnvLoad()

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">Automate</div>
          <h1 className="page-title">Templates</h1>
          <p className="page-sub">
            {list.length > 0 ? `${list.length} reusable workflow templates` : 'No templates yet'}
          </p>
        </div>
        <button className="btn btn-primary">
          <Plus size={14} strokeWidth={2.2} />
          New template
        </button>
      </div>

      {loading ? (
        <ListSkeleton rows={4} />
      ) : list.length === 0 ? (
        <div className="placeholder-panel">
          No templates yet — save a workflow as a template to reuse it.
        </div>
      ) : (
        <div className="row-list">
          {list.map((t) => (
            <div key={t.id} className="row" style={{ alignItems: 'flex-start' }}>
              <span className="row-id">{t.id}</span>
              <span className="row-title">
                {t.name}
                <span style={{ display: 'block', fontSize: 11.5, color: 'var(--muted)', fontWeight: 400 }}>
                  {t.description}
                </span>
              </span>
              <span className="mono trigger-tag">{t.trigger}</span>
              <span className="mono pod-stat">used {t.usedCount}×</span>
              <Link to="/automate/workflows/new" className="btn btn-secondary" style={{ height: 28 }}>
                Use template
              </Link>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

const OUTCOME = {
  success: { Icon: CheckCircle2, cls: 'sev-healthy' },
  failed: { Icon: OctagonX, cls: 'sev-critical' },
  skipped: { Icon: MinusCircle, cls: 'neutral' },
} as const

/* Screen 44 — Executions history. */
export function ExecutionsPage() {
  const loading = useEnvLoad()
  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">Automate</div>
          <h1 className="page-title">Executions</h1>
          <p className="page-sub">
            {executions.length} recent · {executions.filter((e) => e.outcome === 'failed').length} failed —
            success rates roll up to the workflow list
          </p>
        </div>
      </div>

      {loading ? (
        <ListSkeleton rows={6} />
      ) : (
      <div className="row-list">
        {executions.map((e) => {
          const o = OUTCOME[e.outcome]
          return (
            <div key={e.id} className="row">
              <span className="row-id">{e.id}</span>
              <span className={`badge ${o.cls}`}>{e.outcome}</span>
              {/* links back to the triggering workflow, highlighted on arrival */}
              <Link to={`/automate?highlight=${e.workflowId}`} className="row-title" style={{ textDecoration: 'underline', textDecorationColor: 'var(--border-strong)', textUnderlineOffset: 3 }}>
                {e.workflowName}
              </Link>
              <span className="mono" style={{ fontSize: 10.5, color: 'var(--faint)', flexShrink: 0 }}>
                {e.trigger}
              </span>
              <span style={{ fontSize: 11.5, color: 'var(--muted)', flexShrink: 0 }}>{e.note}</span>
              <TimeAgo timestamp={e.at} />
            </div>
          )
        })}
      </div>
      )}
    </>
  )
}

/* Screen 45 — Audit log: immutable — rows render with zero edit/delete
   affordances by design. */
export function AuditLogPage() {
  const loading = useEnvLoad()
  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">Automate</div>
          <h1 className="page-title">Audit Log</h1>
          <p className="page-sub" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Lock size={12} strokeWidth={2.2} />
            Immutable — entries can never be edited or deleted
          </p>
        </div>
      </div>

      {loading ? (
        <ListSkeleton rows={6} />
      ) : (
      <div className="row-list">
        {auditLog.map((a) => (
          <div key={a.id} className="row" style={{ cursor: 'default' }}>
            <span className="row-id">{a.id}</span>
            <span className="pod-stat" style={{ minWidth: 80, textAlign: 'left' }}>
              {a.actor}
            </span>
            <span className="row-title" style={{ fontWeight: 400 }}>
              {a.action}
            </span>
            <TimeAgo timestamp={a.at} />
          </div>
        ))}
      </div>
      )}
    </>
  )
}
