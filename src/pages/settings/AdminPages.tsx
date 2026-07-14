import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Building2,
  Plug,
  PlugZap,
  Plus,
  Star,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Copy,
  Terminal,
} from 'lucide-react'
import {
  ACCENT_SWATCHES,
  cloudConnections,
  customFields,
  detectedClusters,
  FONT_OPTIONS,
  members as seedMembers,
  monitoringIntegrations,
  notificationChannels,
  ROLES,
} from '../../mock/settingsAdmin'
import type { Member } from '../../mock/settingsAdmin'
import { TimeAgo } from '../../components/TimeAgo'
import { useTheme } from '../../state/theme'
import { useEnv } from '../../state/env'
import { addClusterToMock } from '../../mock/infra'
import { RtifactLogo } from '../../components/RtifactLogo'


function PageHead({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="page-head">
      <div>
        <div className="eyebrow">Settings</div>
        <h1 className="page-title">{title}</h1>
        <p className="page-sub">{sub}</p>
      </div>
    </div>
  )
}

function ConnectWizard({ onClose }: { onClose: () => void }) {
  const { addEnvironment } = useEnv()
  const [step, setStep] = useState(1)
  const [provider, setProvider] = useState<'AWS' | 'GCP' | 'Azure' | 'Private Cloud'>('AWS')
  const [envName, setEnvName] = useState('')
  const [region, setRegion] = useState('')
  const [copied, setCopied] = useState(false)

  // Simulation state for Step 3 (Scan)
  const [scanProgress, setScanProgress] = useState(0)
  const [scanLogs, setScanLogs] = useState<string[]>([])
  const [scanStats, setScanStats] = useState({ vpcs: 0, assets: 0, clusters: 0, zones: 0 })

  useEffect(() => {
    if (step !== 3) return

    setScanProgress(0)
    setScanLogs(['Initializing secure connection tunnel...', 'Authenticating credentials...'])
    setScanStats({ vpcs: 0, assets: 0, clusters: 0, zones: 0 })

    const logs = [
      'Establishing connection to region API endpoint...',
      'VPC discovered successfully.',
      'Resolving subnets, network interfaces, and routing tables...',
      'Scanning for Kubernetes control planes...',
      'Discovered primary Elastic Kubernetes Service endpoint.',
      'Scanning container nodes and workload pods...',
      'Cataloguing assets (EC2 instances, databases, queues)...',
      'Configuring read-only telemetry data pipelines...',
      'Environment scan completed. Data ingestion ready.',
    ]

    let logIndex = 0
    const interval = setInterval(() => {
      setScanProgress((prev) => {
        const next = Math.min(prev + Math.floor(Math.random() * 8) + 4, 100)
        
        // Dynamically add stats based on progress
        if (next > 20 && next <= 40) {
          setScanStats({ vpcs: 1, assets: 24, clusters: 0, zones: 1 })
        } else if (next > 40 && next <= 70) {
          setScanStats({ vpcs: 1, assets: 78, clusters: 1, zones: 2 })
        } else if (next > 70) {
          setScanStats({ vpcs: 2, assets: 142, clusters: 1, zones: 3 })
        }

        // Add a log line periodically
        if (next > (logIndex + 1) * 10 && logIndex < logs.length) {
          setScanLogs((prevLogs) => [...prevLogs, logs[logIndex]])
          logIndex++
        }

        if (next >= 100) {
          clearInterval(interval)
          // Automatically proceed to Step 4 after a brief delay
          setTimeout(() => {
            setStep(4)
          }, 800)
        }
        return next
      })
    }, 200)

    return () => clearInterval(interval)
  }, [step])

  const copyCommand = () => {
    navigator.clipboard.writeText('curl -sL rtifact.app/pair | sh -s -- --code RTF-8H4K-2Q9X')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleFinish = () => {
    const canonicalId = envName.toLowerCase().replace(/\s+/g, '-') + '-' + Math.random().toString(36).substring(2, 5)
    const clusterId = `k8s-${envName.toLowerCase().replace(/\s+/g, '-')}-1`

    // 1. Add mock cluster to list
    addClusterToMock({
      id: clusterId,
      envId: canonicalId,
      health: 'healthy',
      nodes: 18,
      utilization: 48,
      version: 'v1.31.2',
      pods: []
    })

    // 2. Add environment to EnvState (will trigger localStorage write)
    addEnvironment({
      name: envName,
      provider: provider,
      region: region,
      clusters: [clusterId]
    })

    // 3. Return
    onClose()
  }

  const stepsList = [
    { num: 1, label: 'Provider' },
    { num: 2, label: 'Pair' },
    { num: 3, label: 'Scan' },
    { num: 4, label: 'Live' }
  ]

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', padding: '20px 0' }}>
      {/* Steps Indicator */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginBottom: '40px' }}>
        {stepsList.map((s, idx) => (
          <div key={s.num} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: 700,
              background: step === s.num ? 'var(--brand)' : step > s.num ? 'var(--success)' : 'var(--chip)',
              color: step >= s.num ? '#ffffff' : 'var(--muted)',
              border: step === s.num ? '1px solid var(--brand)' : '1px solid transparent'
            }}>
              {step > s.num ? '✓' : s.num}
            </div>
            <span style={{
              fontSize: '13px',
              fontWeight: step === s.num ? 600 : 500,
              color: step === s.num ? 'var(--fg)' : 'var(--muted)'
            }}>
              {s.label}
            </span>
            {idx < stepsList.length - 1 && (
              <div style={{ width: '40px', height: '1.5px', background: step > s.num ? 'var(--success)' : 'var(--border)', marginLeft: '12px' }} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Provider selection */}
      {step === 1 && (
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 600, color: 'var(--fg)', marginBottom: '8px' }}>
            Where does your infrastructure run?
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: '32px' }}>
            Rtifact connects read-only. Pick a provider to begin.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', maxWidth: '520px', margin: '0 auto 32px', textAlign: 'left' }}>
            {[
              { key: 'AWS', name: 'AWS', desc: 'EC2 · EKS · RDS · Lambda' },
              { key: 'GCP', name: 'GCP', desc: 'GCE · GKE · Cloud SQL' },
              { key: 'Azure', name: 'Azure', desc: 'VMs · AKS · SQL DB' },
              { key: 'Private Cloud', name: 'Private Cloud', desc: 'K8s · on-prem · bare metal', badge: 'Kubernetes nested' }
            ].map((opt) => {
              const active = provider === opt.key
              return (
                <div
                  key={opt.key}
                  style={{
                    padding: '18px 16px',
                    borderRadius: '8px',
                    border: `1px solid ${active ? 'var(--brand)' : 'var(--border)'}`,
                    background: active ? 'var(--brand-soft)' : 'var(--card)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    position: 'relative',
                  }}
                  onClick={() => setProvider(opt.key as any)}
                >
                  {opt.badge && (
                    <span style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      fontSize: '9px',
                      background: 'var(--brand-soft)',
                      color: 'var(--brand)',
                      padding: '1px 5px',
                      borderRadius: '8px',
                      fontWeight: 600,
                      border: '1px solid var(--border-strong)'
                    }}>
                      {opt.badge}
                    </span>
                  )}
                  <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--fg)', marginBottom: '4px' }}>{opt.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)', lineHeight: 1.3 }}>{opt.desc}</div>
                </div>
              )
            })}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
            <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={() => setStep(2)}>
              Continue with {provider} <ArrowRight size={14} style={{ marginLeft: '4px' }} />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Pair */}
      {step === 2 && (
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: 600, color: 'var(--fg)', marginBottom: '8px', textAlign: 'center' }}>
            Pair via CloudShell
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: '24px', textAlign: 'center' }}>
            One command. Nothing else to install.
          </p>

          <div style={{
            background: 'var(--brand-soft)',
            border: '1px solid var(--border-strong)',
            borderRadius: '8px',
            padding: '14px 16px',
            fontSize: '13px',
            color: 'var(--fg)',
            lineHeight: 1.4,
            marginBottom: '24px'
          }}>
            <strong style={{ color: 'var(--brand)' }}>Read-only. Always.</strong> The pairing role can list and describe resources — it cannot modify, create, or delete anything.
          </div>

          <div style={{
            background: '#090a0f',
            border: '1px solid var(--border-strong)',
            borderRadius: '8px',
            padding: '16px',
            position: 'relative',
            fontFamily: 'var(--mono)',
            fontSize: '12px',
            color: '#c5c9db',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}>
            <div style={{ wordBreak: 'break-all', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Terminal size={14} style={{ color: 'var(--brand)', flexShrink: 0 }} />
              <span>curl -sL rtifact.app/pair | sh -s -- --code RTF-8H4K-2Q9X</span>
            </div>
            <button
              className="btn btn-secondary"
              style={{ padding: '6px 10px', height: '28px', flexShrink: 0 }}
              onClick={copyCommand}
            >
              {copied ? 'Copied!' : <Copy size={13} />}
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--fg)', marginBottom: '6px' }}>
                Environment Name
              </label>
              <input
                className="form-control"
                style={{ width: '100%', height: '36px', padding: '0 12px', background: 'var(--card)', border: '1px solid var(--border-strong)', borderRadius: '6px', color: 'var(--fg)' }}
                value={envName}
                onChange={(e) => setEnvName(e.target.value)}
                placeholder="e.g. prod-asia"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--fg)', marginBottom: '6px' }}>
                Region / Scope
              </label>
              <input
                className="form-control"
                style={{ width: '100%', height: '36px', padding: '0 12px', background: 'var(--card)', border: '1px solid var(--border-strong)', borderRadius: '6px', color: 'var(--fg)' }}
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder="e.g. ap-southeast-1"
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button className="btn btn-secondary" onClick={() => setStep(1)}>
              <ArrowLeft size={14} style={{ marginRight: '4px' }} /> Back
            </button>
            <button
              className="btn btn-primary"
              disabled={!envName.trim() || !region.trim()}
              onClick={() => setStep(3)}
            >
              I ran the command <ArrowRight size={14} style={{ marginLeft: '4px' }} />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Scan */}
      {step === 3 && (
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 600, color: 'var(--fg)', marginBottom: '8px' }}>
            Scanning your environment...
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: '24px' }}>
            This usually takes under two minutes.
          </p>


          {/* ── Radial progress ring ─────────────────────────────────── */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
            <div style={{ position: 'relative', width: 120, height: 120 }}>
              {/* pulsing halo */}
              <div style={{
                position: 'absolute', inset: -8,
                borderRadius: '50%',
                background: 'radial-gradient(circle, color-mix(in srgb, var(--brand) 18%, transparent), transparent 70%)',
                animation: 'scan-halo 2s ease-in-out infinite',
              }} />
              <svg width="120" height="120" style={{ transform: 'rotate(-90deg)' }}>
                {/* track */}
                <circle
                  cx="60" cy="60" r="50"
                  fill="none"
                  stroke="var(--chip)"
                  strokeWidth="7"
                />
                {/* fill */}
                <circle
                  cx="60" cy="60" r="50"
                  fill="none"
                  stroke="var(--brand)"
                  strokeWidth="7"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 50}`}
                  strokeDashoffset={`${2 * Math.PI * 50 * (1 - scanProgress / 100)}`}
                  style={{ transition: 'stroke-dashoffset 0.35s ease-out', filter: 'drop-shadow(0 0 6px var(--brand))' }}
                />
              </svg>
              {/* percentage label */}
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: 1,
              }}>
                <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--fg)', letterSpacing: '-0.03em', fontFamily: 'var(--mono)' }}>
                  {scanProgress}<span style={{ fontSize: 13, fontWeight: 500, color: 'var(--muted)' }}>%</span>
                </span>
                <span style={{ fontSize: 10, color: 'var(--faint)', fontWeight: 500 }}>scanning</span>
              </div>
            </div>
          </div>


          {/* Stats boxes */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
            {[
              { label: 'VPCs Discovered', value: scanStats.vpcs },
              { label: 'Assets Catalogued', value: scanStats.assets },
              { label: 'Clusters Detected', value: scanStats.clusters },
              { label: 'Availability Zones', value: scanStats.zones }
            ].map((stat) => (
              <div key={stat.label} style={{ background: 'var(--card)', border: '1px solid var(--border-strong)', padding: '12px', borderRadius: '8px' }}>
                <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--fg)' }}>{stat.value}</div>
                <div style={{ fontSize: '10.5px', color: 'var(--muted)' }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Console logs */}
          <div style={{
            background: '#090a0f',
            border: '1px solid var(--border-strong)',
            borderRadius: '8px',
            padding: '16px',
            textAlign: 'left',
            fontFamily: 'var(--mono)',
            fontSize: '11px',
            color: '#a0a3b3',
            height: '160px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            marginBottom: '24px'
          }}>
            {scanLogs.map((log, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '8px' }}>
                <span style={{ color: 'var(--brand)' }}>❯</span>
                <span>{log}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 4: Live */}
      {step === 4 && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px', borderRadius: '50%', background: 'var(--success-soft)', color: 'var(--success)', marginBottom: '16px' }}>
            <CheckCircle2 size={32} />
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 600, color: 'var(--fg)', marginBottom: '8px' }}>
            {envName} is live
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: '32px' }}>
            Monitored from this moment on.
          </p>

          <div style={{ maxWidth: '380px', margin: '0 auto 32px', textAlign: 'left', background: 'var(--card)', border: '1px solid var(--border-strong)', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--fg)' }}>Rescan schedule</div>
                <div style={{ fontSize: '11.5px', color: 'var(--muted)' }}>Keep resource topology up to date</div>
              </div>
              <select className="text-input select" style={{ width: 'auto', minWidth: 90, fontSize: '12px', padding: '4px 28px 4px 8px' }}>
                <option>Daily</option>
                <option>Hourly</option>
                <option>Manual</option>
              </select>
            </div>
            <div style={{ borderTop: '1px solid var(--border)' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--fg)' }}>Slack Alerts Integration</div>
                <div style={{ fontSize: '11.5px', color: 'var(--muted)' }}>Notify on critical drift events</div>
              </div>
              <input type="checkbox" defaultChecked style={{ width: '15px', height: '15px' }} />
            </div>
          </div>

          <button className="btn btn-primary" onClick={handleFinish} style={{ minWidth: '120px' }}>
            Done
          </button>
        </div>
      )}
    </div>
  )
}

/* Screens 53–54 — Connections: Cloud tab + Monitoring & Notifications tab. */
export function ConnectionsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = searchParams.get('tab') === 'monitoring' ? 'monitoring' : 'cloud'
  const isConnecting = searchParams.get('connect') === 'true'

  if (isConnecting) {
    return (
      <>
        <PageHead title="Connect Environment" sub="Link new cloud infrastructure to Rtifact" />
        <ConnectWizard onClose={() => setSearchParams({})} />
      </>
    )
  }

  return (
    <>
      <PageHead title="Connections" sub="What Rtifact reads from, and where it notifies." />
      <div className="pipeline-tabs" role="tablist" aria-label="Connection type" style={{ marginBottom: 14 }}>
        <button
          role="tab"
          aria-selected={tab === 'cloud'}
          className={`pipeline-tab${tab === 'cloud' ? ' active' : ''}`}
          onClick={() => setSearchParams({})}
        >
          Cloud
        </button>
        <button
          role="tab"
          aria-selected={tab === 'monitoring'}
          className={`pipeline-tab${tab === 'monitoring' ? ' active' : ''}`}
          onClick={() => setSearchParams({ tab: 'monitoring' })}
        >
          Monitoring &amp; Notifications
        </button>
      </div>

      {tab === 'cloud' ? (
        <>
          <div className="section-label" style={{ marginTop: 0 }}>
            Connected providers
          </div>
          <div className="row-list" style={{ marginBottom: 18 }}>
            {cloudConnections.map((c) => (
              <div key={c.name} className="row">
                <PlugZap size={15} strokeWidth={2} style={{ color: 'var(--success)', flexShrink: 0 }} />
                <span className="row-title">
                  {c.name}
                  <span style={{ display: 'block', fontSize: 11.5, color: 'var(--muted)', fontWeight: 400 }}>
                    {c.detail}
                  </span>
                </span>
                <span className="badge sev-healthy">connected</span>
              </div>
            ))}
          </div>

          <div className="section-label">Detected — not connected</div>
          <div className="row-list detected-list" style={{ marginBottom: 14 }}>
            {detectedClusters.map((d) => (
              <div key={d.name} className="row">
                <Plug size={15} strokeWidth={2} style={{ color: 'var(--faint)', flexShrink: 0 }} />
                <span className="mono row-title" style={{ fontSize: 12 }}>
                  {d.name}
                  <span style={{ display: 'block', fontSize: 11.5, color: 'var(--muted)', fontWeight: 400, fontFamily: 'Inter' }}>
                    {d.hint}
                  </span>
                </span>
                <span className="badge neutral">detected</span>
                <button className="btn btn-secondary" style={{ height: 28 }} onClick={() => setSearchParams({ connect: 'true' })}>
                  Connect
                </button>
              </div>
            ))}
          </div>
          <button className="btn btn-primary" onClick={() => setSearchParams({ connect: 'true' })}>
            <Plus size={14} strokeWidth={2.2} />
            Add connection
          </button>
        </>
      ) : (
        <>
          <div className="section-label" style={{ marginTop: 0 }}>
            Monitoring
          </div>
          <div className="row-list" style={{ marginBottom: 18 }}>
            {monitoringIntegrations.map((m) => (
              <div key={m.name} className="row">
                <span className="row-title">
                  {m.name}
                  <span style={{ display: 'block', fontSize: 11.5, color: 'var(--muted)', fontWeight: 400 }}>
                    {m.detail}
                  </span>
                </span>
                {m.connected ? (
                  <span className="badge sev-healthy">connected</span>
                ) : (
                  <button className="btn btn-secondary" style={{ height: 28 }}>
                    Connect
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="section-label">Notifications</div>
          <div className="row-list">
            {notificationChannels.map((n) => (
              <div key={n.name} className="row">
                <span className="row-title">
                  {n.name}
                  {n.recommended && (
                    <span className="badge sev-healthy" style={{ marginLeft: 8, gap: 4 }}>
                      <Star size={10} strokeWidth={2.4} />
                      recommended
                    </span>
                  )}
                  <span style={{ display: 'block', fontSize: 11.5, color: 'var(--muted)', fontWeight: 400 }}>
                    {n.detail}
                  </span>
                </span>
                {n.connected ? (
                  <span className="badge sev-healthy">connected</span>
                ) : (
                  <button className="btn btn-secondary" style={{ height: 28 }}>
                    Connect
                  </button>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </>
  )
}

/* Screen 55 — Users & Roles. */
export function UsersPage() {
  const [searchParams] = useSearchParams()
  const [members, setMembers] = useState<Member[]>(
    searchParams.get('state') === 'empty' ? [] : seedMembers,
  )

  return (
    <>
      <PageHead title="Users & Roles" sub={`${members.length} members`} />
      {members.length === 0 ? (
        <div className="placeholder-panel">
          No members yet — invite your team.
          <div style={{ marginTop: 14 }}>
            <button className="btn btn-primary">
              <Plus size={14} strokeWidth={2.2} />
              Invite member
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="row-list" style={{ marginBottom: 14 }}>
            {members.map((m) => (
              <div key={m.email} className="row">
                <span className="avatar" style={{ width: 26, height: 26, fontSize: 10 }}>
                  {m.name
                    .split(' ')
                    .map((x) => x[0])
                    .join('')
                    .slice(0, 2)}
                </span>
                <span className="row-title" style={{ flex: '0 0 160px' }}>
                  {m.name}
                </span>
                <span className="mono" style={{ fontSize: 11, color: 'var(--faint)', flex: 1 }}>
                  {m.email}
                </span>
                <select
                  className="text-input select"
                  style={{ width: 120, padding: '5px 8px', fontSize: 12 }}
                  value={m.role}
                  aria-label={`${m.name} role`}
                  onChange={(e) =>
                    setMembers((prev) =>
                      prev.map((x) => (x.email === m.email ? { ...x, role: e.target.value as Member['role'] } : x)),
                    )
                  }
                >
                  {ROLES.map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
                <TimeAgo timestamp={m.lastActive} />
              </div>
            ))}
          </div>
          <div className="panel-foot-note" style={{ border: 'none' }}>
            RBAC boundary: platform automation always operates within each cluster’s own RBAC — a
            Responder here cannot make the automation do anything the cluster wouldn’t allow.
          </div>
        </>
      )}
    </>
  )
}

/* Screen 56 — Custom Fields. */
export function CustomFieldsPage() {
  const [searchParams] = useSearchParams()
  const fields = searchParams.get('state') === 'empty' ? [] : customFields

  return (
    <>
      <PageHead title="Custom Fields" sub="Extend alerts, incidents, and cases with your own metadata." />
      {fields.length === 0 ? (
        <div className="placeholder-panel">
          No custom fields yet.
          <span className="mono">e.g. business unit, customer tier, ticket key</span>
          <div style={{ marginTop: 14 }}>
            <button className="btn btn-primary">
              <Plus size={14} strokeWidth={2.2} />
              Add field
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="row-list" style={{ marginBottom: 14 }}>
            {fields.map((f) => (
              <div key={f.name} className="row">
                <span className="row-title" style={{ flex: '0 0 180px' }}>
                  {f.name}
                </span>
                <span className="badge neutral mono" style={{ fontWeight: 500 }}>
                  {f.type}
                </span>
                <span className="scope-tags">
                  {f.appliesTo.map((a) => (
                    <span key={a} className="badge neutral">
                      {a}
                    </span>
                  ))}
                </span>
              </div>
            ))}
          </div>
          <button className="btn btn-primary">
            <Plus size={14} strokeWidth={2.2} />
            Add field
          </button>
        </>
      )}
    </>
  )
}

/* Screen 57 — Organization: designed coming-soon placeholder. */
export function OrganizationPage() {
  return (
    <>
      <PageHead title="Organization" sub="Org-level controls." />      <div className="placeholder-panel" style={{ padding: 48 }}>
        <Building2 size={26} strokeWidth={1.8} style={{ color: 'var(--faint)', marginBottom: 10 }} />
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--fg)', marginBottom: 4 }}>
          Organization settings are coming soon
        </div>
        SSO enforcement, audit exports, and multi-workspace management land here.
        <span className="mono">planned · not part of this release</span>
        <div style={{ marginTop: 14 }}>
          <button className="btn btn-secondary">Notify me when available</button>
        </div>
      </div>
    </>
  )
}

/* Screen 58 — Theming with live preview. The theme control writes the
   real global theme (single default + toggle, per client feedback). */
export function ThemingPage() {
  const [productName, setProductName] = useState('Rtifact')
  const [accent, setAccent] = useState(ACCENT_SWATCHES[0])
  const [font, setFont] = useState(FONT_OPTIONS[0])
  const { theme, setTheme } = useTheme()

  return (
    <>
      <PageHead title="Theming" sub="Brand the workspace and its public status pages." />
      <div className="detail-grid">
        <div className="detail-main">
          <section className="panel form-panel">
            <div className="field">
              <span className="field-label">Product name</span>
              <input className="text-input" value={productName} onChange={(e) => setProductName(e.target.value)} />
            </div>
            <div className="field">
              <span className="field-label">Accent color (AI surfaces only)</span>
              <div style={{ display: 'flex', gap: 8 }}>
                {ACCENT_SWATCHES.map((c) => (
                  <button
                    key={c}
                    className="swatch"
                    style={{ background: c, outline: accent === c ? '2px solid var(--fg)' : 'none' }}
                    aria-label={`Accent ${c}`}
                    aria-pressed={accent === c}
                    onClick={() => setAccent(c)}
                  />
                ))}
              </div>
            </div>
            <div className="field">
              <span className="field-label">Font</span>
              <select className="text-input select" style={{ width: 200 }} value={font} onChange={(e) => setFont(e.target.value)}>
                {FONT_OPTIONS.map((f) => (
                  <option key={f}>{f}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <span className="field-label">Default theme — applies immediately</span>
              <div className="pipeline-tabs" style={{ marginBottom: 0 }}>
                {(['dark', 'light'] as const).map((t) => (
                  <button key={t} className={`pipeline-tab${theme === t ? ' active' : ''}`} onClick={() => setTheme(t)}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <button className="btn btn-primary">Save branding</button>
          </section>
        </div>

        <div className="detail-side">
          <section className="panel" aria-label="Live preview">
            <div className="panel-title">Live preview</div>
            <div className="wl-preview" style={{ fontFamily: font === 'System UI' ? 'system-ui' : font }}>
              <div className="wl-nav">
                <RtifactLogo showText={false} height={18} />
                <span style={{ fontWeight: 800, fontSize: 13, marginLeft: 2 }}>{productName.trim() || 'Product'}</span>
              </div>

              <div className="wl-body">
                <span className="ai-tile" style={{ width: 24, height: 24, borderRadius: 6, background: accent }} />
                <button className="btn" style={{ background: accent, color: '#fff', height: 28, pointerEvents: 'none' }}>
                  Ask AI
                </button>
              </div>
              <div className="wl-themes mono">theme: {theme} · applied workspace-wide</div>
            </div>
            <div className="panel-foot-note">
              Applies to the app shell and public status pages (Support → Status Pages → Domains &
              Branding).
            </div>
          </section>
        </div>
      </div>
    </>
  )
}
