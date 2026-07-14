import { Link, useParams, useSearchParams } from 'react-router-dom'
import { CheckCircle2, MinusCircle, OctagonX } from 'lucide-react'
import { RUNBOOK_TOTAL, runbooks } from '../../mock/automateExtras'
import { ConfidencePill } from '../../components/Confidence'
import { TimeAgo } from '../../components/TimeAgo'
import { ListSkeleton, useEnvLoad } from '../../components/PageLoad'

/* Screen 40 — Playbooks/Runbooks list. */
export function PlaybooksPage() {
  const [searchParams] = useSearchParams()
  const list = searchParams.get('state') === 'empty' ? [] : runbooks
  const loading = useEnvLoad()

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">Automate</div>
          <h1 className="page-title">Playbooks</h1>
          <p className="page-sub">
            {list.length > 0
              ? `${RUNBOOK_TOTAL} runbooks learned · top ${list.length} by usage shown`
              : 'No runbooks yet'}
          </p>
        </div>
        <button className="btn btn-primary">New runbook</button>
      </div>

      {loading ? (
        <ListSkeleton rows={5} />
      ) : list.length === 0 ? (
        <div className="placeholder-panel">
          No runbooks yet — resolved incidents teach the platform new ones.
          <span className="mono">runbooks power the ranked playbooks in the Act state</span>
        </div>
      ) : (
        <div className="row-list">
          {list.map((r) => (
            <Link key={r.id} to={`/automate/playbooks/${r.id}`} className="row">
              <span className="row-id">{r.id}</span>
              <span className="row-title">{r.name}</span>
              <ConfidencePill value={r.confidence} />
              <span className="mono" style={{ fontSize: 10.5, color: 'var(--faint)', flexShrink: 0 }}>
                {r.services.join(', ')}
              </span>
              {r.lastUsed ? <TimeAgo timestamp={r.lastUsed} /> : <span className="time-ref">never used</span>}
            </Link>
          ))}
        </div>
      )}
    </>
  )
}

const OUTCOME_ICON = {
  success: { Icon: CheckCircle2, color: 'var(--success)' },
  partial: { Icon: MinusCircle, color: 'var(--warn)' },
  failed: { Icon: OctagonX, color: 'var(--error)' },
} as const

/* Screen 41 — Runbook detail. */
export function RunbookDetailPage() {
  const { runbookId } = useParams()
  const r = runbooks.find((x) => x.id === runbookId)

  if (!r) {
    return (
      <div className="error-panel" role="alert">
        <div className="error-title">Runbook {runbookId} not found</div>
      </div>
    )
  }

  return (
    <>
      <div className="page-head" style={{ marginBottom: 14 }}>
        <div>
          <div className="eyebrow">Automate · Runbook</div>
          <h1 className="page-title" style={{ fontSize: 20 }}>
            {r.name}
          </h1>
          <p className="page-sub">
            {r.services.join(' · ')} ·{' '}
            {r.lastUsed ? (
              <>
                last used <TimeAgo timestamp={r.lastUsed} />
              </>
            ) : (
              'never used'
            )}
          </p>
        </div>
        <ConfidencePill value={r.confidence} />
      </div>

      <div className="detail-grid">
        <div className="detail-main">
          <section className="panel">
            <div className="panel-title">Purpose</div>
            <p className="panel-body-text">{r.purpose}</p>
          </section>

          <section className="panel">
            <div className="panel-title">Steps</div>
            <ul className="pipeline">
              {r.steps.map((s, i) => (
                <li key={s} className="pipe-step">
                  <span className="daav-dot" style={{ width: 20, height: 20 }}>
                    <span className="daav-num mono">{i + 1}</span>
                  </span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="panel">
            <div className="panel-title">Historical outcomes</div>
            {r.outcomes.length === 0 ? (
              <div className="panel-foot-note" style={{ border: 'none', padding: 0, margin: 0 }}>
                Not yet executed — confidence is derived from similar signatures.
              </div>
            ) : (
              r.outcomes.map((o) => {
                const { Icon, color } = OUTCOME_ICON[o.result]
                return (
                  <div key={`${o.incident}-${o.when}`} className="row" style={{ borderRadius: 8 }}>
                    <Icon size={15} strokeWidth={2} style={{ color, flexShrink: 0 }} />
                    <Link to={`/command/incidents/${o.incident}`} className="row-id" style={{ width: 70 }}>
                      {o.incident}
                    </Link>
                    <span className="row-title" style={{ fontWeight: 400 }}>
                      {o.note}
                    </span>
                    <span className={`badge ${o.result === 'success' ? 'sev-healthy' : o.result === 'partial' ? 'sev-warning' : 'sev-critical'}`}>
                      {o.result}
                    </span>
                    <TimeAgo timestamp={o.when} />
                  </div>
                )
              })
            )}
          </section>
        </div>

        <div className="detail-side">
          <section className="panel">
            <div className="panel-title">Recommended when</div>
            <p className="panel-body-text" style={{ fontSize: 12.5 }}>
              {r.recommendedFix}
            </p>
            <div className="panel-foot-note">
              Surfaces as a ranked playbook in the Act state when signatures match.
            </div>
          </section>
        </div>
      </div>
    </>
  )
}
