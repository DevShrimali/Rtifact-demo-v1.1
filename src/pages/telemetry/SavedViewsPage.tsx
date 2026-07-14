import { useSearchParams } from 'react-router-dom'
import { Layers, LineChart, FileText, Route, Plus } from 'lucide-react'
import { savedViews } from '../../mock/telemetry'
import type { ViewType } from '../../mock/telemetry'
import { TimeAgo } from '../../components/TimeAgo'

const TYPE_META: Record<ViewType, { Icon: typeof Layers }> = {
  Combined: { Icon: Layers },
  Metrics: { Icon: LineChart },
  Logs: { Icon: FileText },
  Traces: { Icon: Route },
}

/* Screen 27 — Saved Views: name, type, owner, last updated. */
export function SavedViewsPage() {
  const [searchParams] = useSearchParams()
  const views = searchParams.get('state') === 'empty' ? [] : savedViews

  return (
    <>
      <div className="page-head" style={{ marginBottom: 14 }}>
        <div>
          <div className="eyebrow">Telemetry</div>
          <h2 className="state-title" style={{ fontSize: 19 }}>
            Saved views
          </h2>
          <p className="page-sub">
            {views.length > 0 ? `${views.length} views shared across the team` : 'No saved views yet'}
          </p>
        </div>
        <button className="btn btn-primary">
          <Plus size={14} strokeWidth={2.2} />
          New view
        </button>
      </div>

      {views.length === 0 ? (
        <div className="placeholder-panel">
          Save an investigation as a view to get back to it in one click.
          <span className="mono">views capture lens, filters, and time range</span>
        </div>
      ) : (
        <div className="row-list">
          {views.map((v) => {
            const { Icon } = TYPE_META[v.type]
            return (
              <button key={v.id} className="row" style={{ width: '100%', textAlign: 'left' }}>
                <Icon size={15} strokeWidth={2} className="nav-icon" />
                <span className="row-title">{v.name}</span>
                <span className="badge neutral">{v.type}</span>
                <span className="pod-stat" style={{ minWidth: 90 }}>
                  {v.owner}
                </span>
                <TimeAgo timestamp={v.updatedAt} />
              </button>
            )
          })}
        </div>
      )}
    </>
  )
}
