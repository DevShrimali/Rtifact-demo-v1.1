import { useState } from 'react'
import { Loader2, Plus } from 'lucide-react'
import { connectedEnvironments, detectedEnvironments } from '../../mock/reviewExtras'
import type { ConnectedEnv, DetectedEnv } from '../../mock/reviewExtras'
import { TimeAgo } from '../../components/TimeAgo'
import { minutesAgo } from '../../lib/time'

/* Screen 30 — connected environments + detected-not-connected candidates.
   Connecting is inline (no modal): connecting → connected, list updates. */
export function EnvironmentsPage() {
  const [connected, setConnected] = useState<ConnectedEnv[]>(connectedEnvironments)
  const [detected, setDetected] = useState<DetectedEnv[]>(detectedEnvironments)
  const [connecting, setConnecting] = useState<string | null>(null)
  const [highlight, setHighlight] = useState(false)

  const connect = (d: DetectedEnv) => {
    setConnecting(d.id)
    setTimeout(() => {
      setDetected((prev) => prev.filter((x) => x.id !== d.id))
      setConnected((prev) => [
        ...prev,
        {
          id: d.id,
          name: d.name,
          provider: 'Detected',
          region: 'pending scan',
          health: 'healthy',
          clusters: 1,
          scanStatus: 'scanning',
          scanPct: 5,
          lastScan: minutesAgo(0),
        },
      ])
      setConnecting(null)
    }, 1500)
  }

  return (
    <>
      <div className="page-head" style={{ marginBottom: 14 }}>
        <div>
          <div className="eyebrow">Review</div>
          <h2 className="state-title" style={{ fontSize: 19 }}>
            Environments
          </h2>
          <p className="page-sub">{connected.length} connected · {detected.length} detected, not connected</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            setHighlight(true)
            setTimeout(() => setHighlight(false), 1200)
          }}
        >
          <Plus size={14} strokeWidth={2.2} />
          Add environment
        </button>
      </div>

      <div className="section-label" style={{ marginTop: 0 }}>
        Connected
      </div>
      <div className="row-list" style={{ marginBottom: 18 }}>
        {connected.map((e) => (
          <div key={e.id} className="row">
            <span className={`dot ${e.health}`} />
            <span className="row-title" style={{ flex: '0 0 150px' }}>
              {e.name}
            </span>
            <span className="mono" style={{ fontSize: 11, color: 'var(--faint)', flex: 1 }}>
              {e.provider} · {e.region}
            </span>
            <span className="mono pod-stat">{e.clusters} cluster{e.clusters === 1 ? '' : 's'}</span>
            {e.scanStatus === 'scanning' ? (
              <span className="badge sev-warning">
                <Loader2 size={11} strokeWidth={2.2} className="spin" />
                scanning {e.scanPct}%
              </span>
            ) : (
              <span className="badge sev-healthy">scanned</span>
            )}
            <TimeAgo timestamp={e.lastScan} />
          </div>
        ))}
      </div>

      <div className="section-label">Detected — not connected</div>
      {detected.length === 0 ? (
        <div className="placeholder-panel">
          Nothing detected that isn’t already connected.
          <span className="mono">new clusters and accounts show up here automatically</span>
        </div>
      ) : (
        <div className={`row-list${highlight ? ' pulse-border' : ''}`}>
          {detected.map((d) => (
            <div key={d.id} className="row">
              <span className="dot" style={{ background: 'var(--faint)' }} />
              <span className="mono row-title" style={{ flex: '0 0 150px', fontSize: 12 }}>
                {d.name}
              </span>
              <span className="row-title" style={{ fontWeight: 400, color: 'var(--muted)' }}>
                {d.hint}
              </span>
              <button
                className="btn btn-primary"
                style={{ height: 28 }}
                disabled={connecting === d.id}
                onClick={() => connect(d)}
              >
                {connecting === d.id ? (
                  <>
                    <Loader2 size={12} strokeWidth={2.2} className="spin" />
                    Connecting…
                  </>
                ) : (
                  'Connect'
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
