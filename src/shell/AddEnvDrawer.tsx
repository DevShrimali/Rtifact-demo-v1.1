import { useEffect, useState } from 'react'
import { Loader2, Plug, PlugZap, X } from 'lucide-react'
import { detectedClusters } from '../mock/settingsAdmin'
import { useEnv } from '../state/env'

/* Screen 64 — Add environment: side drawer reachable from anywhere via the
   env selector. Same non-modal drawer pattern as Ask AI / agent detail. */
export function AddEnvDrawer({ onClose }: { onClose: () => void }) {
  const { environments } = useEnv()
  const [detected, setDetected] = useState(detectedClusters)
  const [connected, setConnected] = useState<string[]>([])
  const [connecting, setConnecting] = useState<string | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const connect = (name: string) => {
    setConnecting(name)
    setTimeout(() => {
      setDetected((prev) => prev.filter((d) => d.name !== name))
      setConnected((prev) => [...prev, name])
      setConnecting(null)
    }, 1500)
  }

  return (
    <aside className="askai-panel agent-drawer" aria-label="Add environment">
      <header className="askai-head">
        <span className="ai-tile" style={{ background: 'var(--chip)', color: 'var(--fg)' }}>
          <PlugZap size={15} strokeWidth={2} />
        </span>
        <span className="askai-title">
          Add environment
          <span className="askai-surface">connected &amp; detected</span>
        </span>
        <button className="askai-close" onClick={onClose} aria-label="Close drawer">
          <X size={16} strokeWidth={2.2} />
        </button>
      </header>

      <div className="askai-body">
        <div className="askai-hint">Connected</div>
        {environments.map((e) => (
          <div key={e.id} className="kv-row" style={{ width: '100%' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
              <span className={`dot ${e.health}`} style={{ animation: 'none' }} />
              {e.name}
            </span>
            <span className="mono" style={{ fontSize: 10.5, color: 'var(--faint)' }}>
              {e.provider} · {e.region}
            </span>
          </div>
        ))}
        {connected.map((name) => (
          <div key={name} className="kv-row" style={{ width: '100%' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
              <span className="dot healthy" />
              <span className="mono">{name}</span>
            </span>
            <span className="badge sev-healthy">connected · scanning</span>
          </div>
        ))}

        <div className="askai-hint" style={{ marginTop: 10 }}>
          Detected — not connected
        </div>
        {detected.length === 0 ? (
          <div className="panel-foot-note" style={{ border: 'none', padding: 0, margin: 0 }}>
            Nothing else detected. New clusters appear here automatically.
          </div>
        ) : (
          detected.map((d) => (
            <div key={d.name} className="kv-row" style={{ width: '100%' }}>
              <span style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12 }}>
                <Plug size={13} strokeWidth={2} style={{ color: 'var(--faint)', marginTop: 2 }} />
                <span>
                  <span className="mono" style={{ display: 'block' }}>
                    {d.name}
                  </span>
                  <span style={{ fontSize: 10.5, color: 'var(--faint)' }}>{d.hint}</span>
                </span>
              </span>
              <button
                className="btn btn-secondary"
                style={{ height: 26 }}
                disabled={connecting === d.name}
                onClick={() => connect(d.name)}
              >
                {connecting === d.name ? (
                  <>
                    <Loader2 size={12} strokeWidth={2.2} className="spin" />
                    Connecting…
                  </>
                ) : (
                  'Connect'
                )}
              </button>
            </div>
          ))
        )}
      </div>

      <div className="askai-input" style={{ display: 'block' }}>
        <div className="panel-foot-note" style={{ border: 'none', padding: 0, margin: 0 }}>
          Connecting a new provider from scratch? Use the guided flow in Settings → Connections.
        </div>
      </div>
    </aside>
  )
}
