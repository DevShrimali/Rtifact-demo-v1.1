import { Link, useSearchParams } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { cases } from '../../mock/support'
import { SeverityBadge } from '../../components/SeverityBadge'
import { TimeAgo } from '../../components/TimeAgo'
import { ListSkeleton, useEnvLoad } from '../../components/PageLoad'

/* Screen 32 — Cases queue: status, severity, assignee, age. */
export function CasesPage() {
  const [searchParams] = useSearchParams()
  const list = searchParams.get('state') === 'empty' ? [] : cases
  const open = list.length
  const loading = useEnvLoad()

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">Support</div>
          <h1 className="page-title">Cases</h1>
          <p className="page-sub">
            {open > 0
              ? `${open} open · ${list.filter((c) => c.status === 'Triage').length} in triage`
              : 'No open cases'}
          </p>
        </div>
        <button className="btn btn-primary">
          <Plus size={14} strokeWidth={2.2} />
          Open case
        </button>
      </div>

      {loading ? (
        <ListSkeleton rows={5} />
      ) : list.length === 0 ? (
        <div className="placeholder-panel">
          <div className="empty-dot-wrap">
            <span className="dot healthy" />
          </div>
          Queue is clear — no open cases.
          <span className="mono">new cases from email, in-app, and Slack land here</span>
        </div>
      ) : (
        <div className="row-list">
          {list.map((c) => (
            <Link key={c.id} to={`/support/cases/${c.id}`} className="row">
              <span className="row-id">{c.id}</span>
              <span className="badge neutral">{c.status}</span>
              <SeverityBadge severity={c.severity} />
              <span className="row-title">{c.title}</span>
              <span className="pod-stat" style={{ minWidth: 84 }}>
                {c.assignee}
              </span>
              <TimeAgo timestamp={c.openedAt} />
            </Link>
          ))}
        </div>
      )}
    </>
  )
}
