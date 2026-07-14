import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { BellOff, Plus, X } from 'lucide-react'
import { seedSilences, SILENCE_PATTERNS } from '../../mock/automateExtras'
import type { Silence } from '../../mock/automateExtras'
import { ListSkeleton, useEnvLoad } from '../../components/PageLoad'

function ExpiryCountdown({ minutes }: { minutes: number }) {
  const [secondsLeft, setSecondsLeft] = useState(minutes * 60)
  useEffect(() => {
    const t = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(t)
  }, [])
  const h = Math.floor(secondsLeft / 3600)
  const m = Math.floor((secondsLeft % 3600) / 60)
  const s = secondsLeft % 60
  return (
    <span className={`sla mono ${secondsLeft < 900 ? 'tight' : 'ok'}`}>
      expires in {h > 0 ? `${h}h ${m}m` : `${m}:${String(s).padStart(2, '0')}`}
    </span>
  )
}

/* Screen 42 — Silences. CONFIRMED home: Automate nav (resolved-conflicts #5). */
export function SilencesPage() {
  const [searchParams] = useSearchParams()
  const [silences, setSilences] = useState<Silence[]>(
    searchParams.get('state') === 'empty' ? [] : seedSilences,
  )
  const [creating, setCreating] = useState(false)
  const [pattern, setPattern] = useState(SILENCE_PATTERNS[0].pattern)
  const [duration, setDuration] = useState(120)
  const loading = useEnvLoad()

  const create = () => {
    const def = SILENCE_PATTERNS.find((p) => p.pattern === pattern)!
    setSilences((prev) => [
      {
        id: `SIL-${32 + prev.length}`,
        pattern: def.pattern,
        reason: 'Manual silence (demo)',
        createdBy: 'P. Sharma',
        expiresInMin: duration,
        matchedAlerts: def.matches,
      },
      ...prev,
    ])
    setCreating(false)
  }

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">Automate</div>
          <h1 className="page-title">Silences</h1>
          <p className="page-sub">
            {silences.length > 0
              ? `${silences.length} active · ${silences.reduce((s, x) => s + x.matchedAlerts.length, 0)} alerts currently suppressed`
              : 'No active silences'}
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setCreating(true)}>
          <Plus size={14} strokeWidth={2.2} />
          New silence
        </button>
      </div>

      {creating && (
        <section className="panel form-panel" style={{ maxWidth: 'none' }}>
          <div className="panel-head">
            <span className="panel-title" style={{ margin: 0 }}>
              New silence
            </span>
            <button className="askai-close" style={{ marginLeft: 'auto' }} onClick={() => setCreating(false)} aria-label="Cancel">
              <X size={14} strokeWidth={2.2} />
            </button>
          </div>
          <div className="field">
            <span className="field-label">Suppress pattern</span>
            <select className="text-input select" style={{ width: '100%' }} value={pattern} onChange={(e) => setPattern(e.target.value)}>
              {SILENCE_PATTERNS.map((p) => (
                <option key={p.pattern} value={p.pattern}>
                  {p.pattern} — matches {p.matches.length} active alert{p.matches.length === 1 ? '' : 's'}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <span className="field-label">Duration</span>
            <div className="pipeline-tabs" style={{ marginBottom: 0 }}>
              {[30, 120, 480].map((d) => (
                <button key={d} className={`pipeline-tab${duration === d ? ' active' : ''}`} onClick={() => setDuration(d)}>
                  {d < 60 ? `${d}m` : `${d / 60}h`}
                </button>
              ))}
            </div>
          </div>
          <button className="btn btn-primary" onClick={create}>
            <BellOff size={14} strokeWidth={2.2} />
            Create silence
          </button>
        </section>
      )}

      {loading ? (
        <ListSkeleton rows={3} />
      ) : silences.length === 0 ? (
        <div className="placeholder-panel">
          Nothing silenced — every alert is reaching its route.
          <span className="mono">silence known noise instead of ignoring it</span>
        </div>
      ) : (
        <div className="row-list">
          {silences.map((s) => (
            <div key={s.id} className="row" style={{ alignItems: 'flex-start' }}>
              <BellOff size={15} strokeWidth={2} className="nav-icon" style={{ marginTop: 2 }} />
              <span className="row-title">
                <span className="mono" style={{ fontSize: 12 }}>{s.pattern}</span>
                <span style={{ display: 'block', fontSize: 11.5, color: 'var(--muted)', fontWeight: 400 }}>
                  {s.reason} — {s.createdBy}
                </span>
              </span>
              {s.matchedAlerts.length > 0 ? (
                <span className="badge sev-warning">
                  suppressing {s.matchedAlerts.map((a) => a).join(', ')}
                </span>
              ) : (
                <span className="badge neutral">0 matches now</span>
              )}
              <ExpiryCountdown minutes={s.expiresInMin} />
            </div>
          ))}
        </div>
      )}
    </>
  )
}
