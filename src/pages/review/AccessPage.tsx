import { useState } from 'react'
import { CheckCircle2, Loader2, RefreshCw, ShieldQuestion } from 'lucide-react'
import { accessScope, permissions } from '../../mock/reviewExtras'
import { TimeAgo } from '../../components/TimeAgo'
import { minutesAgo } from '../../lib/time'

/* Screen 31 — Data & Access: scan permissions, access scope, rescan. */
export function AccessPage() {
  const [rescan, setRescan] = useState<'idle' | 'running' | 'done'>('idle')
  const [verifiedAt, setVerifiedAt] = useState<number | null>(null)

  const triggerRescan = () => {
    setRescan('running')
    setTimeout(() => {
      setRescan('done')
      setVerifiedAt(minutesAgo(0))
    }, 1800)
  }

  return (
    <>
      <div className="page-head" style={{ marginBottom: 14 }}>
        <div>
          <div className="eyebrow">Review</div>
          <h2 className="state-title" style={{ fontSize: 19 }}>
            Data &amp; Access
          </h2>
          <p className="page-sub">What Rtifact can see, and nothing more — read-only across all accounts.</p>
        </div>
        <button className="btn btn-primary" disabled={rescan === 'running'} onClick={triggerRescan}>
          {rescan === 'running' ? (
            <>
              <Loader2 size={14} strokeWidth={2.2} className="spin" />
              Rescanning…
            </>
          ) : (
            <>
              <RefreshCw size={14} strokeWidth={2.2} />
              Rescan permissions
            </>
          )}
        </button>
      </div>

      {rescan === 'done' && (
        <div className="contrib" aria-live="polite">
          <span className="contrib-chip">
            <CheckCircle2 size={13} strokeWidth={2.2} />
            Rescan complete — 4 of 5 scopes verified just now
          </span>
        </div>
      )}

      <div className="detail-grid">
        <div className="detail-main">
          <section className="panel">
            <div className="panel-title">Scan permissions</div>
            {permissions.map((p) => (
              <div key={p.scope} className="row" style={{ borderRadius: 8, paddingLeft: 4, paddingRight: 4 }}>
                {p.status === 'granted' ? (
                  <CheckCircle2 size={15} strokeWidth={2} style={{ color: 'var(--success)', flexShrink: 0 }} />
                ) : (
                  <ShieldQuestion size={15} strokeWidth={2} style={{ color: 'var(--warn)', flexShrink: 0 }} />
                )}
                <span className="row-title">
                  {p.scope}
                  <span style={{ display: 'block', fontSize: 11, color: 'var(--muted)', fontWeight: 400 }}>
                    {p.purpose}
                  </span>
                </span>
                {p.status === 'granted' ? (
                  rescan === 'running' ? (
                    <span className="badge neutral">
                      <Loader2 size={11} strokeWidth={2.2} className="spin" />
                      verifying
                    </span>
                  ) : (
                    <TimeAgo timestamp={verifiedAt ?? p.lastVerified!} />
                  )
                ) : (
                  <button className="btn btn-secondary" style={{ height: 26 }}>
                    Grant scope
                  </button>
                )}
              </div>
            ))}
          </section>
        </div>
        <div className="detail-side">
          <section className="panel">
            <div className="panel-title">Access scope</div>
            {accessScope.map((kv) => (
              <div key={kv.label} className="kv-row">
                <span className="kv-label">{kv.label}</span>
                <span className="kv-value" style={{ fontSize: 11.5 }}>
                  {kv.value}
                </span>
              </div>
            ))}
            <div className="panel-foot-note">
              Missing scopes cap AI confidence — the staging CI/CD gap held ALT-9012’s RCA at 74%.
            </div>
          </section>
        </div>
      </div>
    </>
  )
}
