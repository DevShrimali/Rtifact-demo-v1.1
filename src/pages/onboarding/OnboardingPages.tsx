import { useEffect, useRef, useState } from 'react'
import { Link, Outlet, useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowRight,
  Boxes,
  Check,
  CheckCircle2,
  Cloud,
  Copy,
  Eye,
  Loader2,
  Lock,
  PlayCircle,
  RefreshCw,
  Server,
} from 'lucide-react'

import { RtifactLogo } from '../../components/RtifactLogo'

/* Screens 59–63 — onboarding lives OUTSIDE the app shell (no sidebar; a
   user has no environment yet). Follows the global theme. */
export function OnboardingLayout() {
  return (
    <div className="onboard-wrap">
      <div className="onboard-brand">
        <RtifactLogo showText={true} height={24} />
      </div>

      <Outlet />
    </div>
  )
}

/* Screen 59 — Login. Demo mode is a first-class path, preserved for sales. */
export function LoginPage() {
  const navigate = useNavigate()
  return (
    <div className="onboard-card" style={{ maxWidth: 380 }}>
      <h1 className="onboard-title">Sign in</h1>
      <p className="onboard-sub">The AI SRE that watches your infrastructure.</p>

      <button className="btn btn-primary onboard-btn" onClick={() => navigate('/onboarding/provider')}>
        Continue with SSO
      </button>
      <button className="btn btn-secondary onboard-btn" onClick={() => navigate('/onboarding/provider')}>
        Continue with email
      </button>

      <div className="onboard-divider">
        <span>or</span>
      </div>

      {/* Demo mode — complete standalone path, no provider connection */}
      <button className="btn btn-secondary onboard-btn demo-btn" onClick={() => navigate('/command')}>
        <PlayCircle size={15} strokeWidth={2.2} />
        Explore demo mode
      </button>
      <p className="onboard-note">
        Demo mode opens a fully populated workspace — no cloud connection, nothing to install.
      </p>
    </div>
  )
}

/* Screen 60 — Provider selector. K8s nests under Private Cloud (locked). */
export function ProviderPage() {
  const navigate = useNavigate()
  const [privateOpen, setPrivateOpen] = useState(false)

  const providers = [
    { key: 'aws', name: 'AWS', desc: 'CloudShell pairing · read-only IAM role' },
    { key: 'gcp', name: 'GCP', desc: 'Cloud Shell pairing · viewer service account' },
    { key: 'azure', name: 'Azure', desc: 'Cloud Shell pairing · reader role' },
  ]

  return (
    <div className="onboard-card" style={{ maxWidth: 480 }}>
      <h1 className="onboard-title">Where does your infrastructure live?</h1>
      <p className="onboard-sub">Pick one to start — you can add more environments later.</p>

      <div className="provider-list">
        {providers.map((p) => (
          <button key={p.key} className="provider-card" onClick={() => navigate('/onboarding/pairing')}>
            <Cloud size={18} strokeWidth={2} className="nav-icon" />
            <span className="provider-name">{p.name}</span>
            <span className="provider-desc">{p.desc}</span>
            <ArrowRight size={15} strokeWidth={2.2} className="provider-go" />
          </button>
        ))}

        <button
          className="provider-card"
          aria-expanded={privateOpen}
          onClick={() => setPrivateOpen((o) => !o)}
        >
          <Server size={18} strokeWidth={2} className="nav-icon" />
          <span className="provider-name">Private Cloud</span>
          <span className="provider-desc">on-prem &amp; self-managed platforms</span>
          <ArrowRight
            size={15}
            strokeWidth={2.2}
            className="provider-go"
            style={{ transform: privateOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.12s ease' }}
          />
        </button>

        {privateOpen && (
          <button
            className="provider-card provider-nested"
            onClick={() => navigate('/onboarding/pairing')}
          >
            <Boxes size={16} strokeWidth={2} className="nav-icon" />
            <span className="provider-name">Kubernetes</span>
            <span className="provider-desc">agent install via kubectl · RBAC view-only</span>
            <ArrowRight size={15} strokeWidth={2.2} className="provider-go" />
          </button>
        )}
      </div>
    </div>
  )
}

/* Screen 61 — CloudShell pairing: one command, time-limited code,
   read-only trust front and center. */
export function PairingPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [secondsLeft, setSecondsLeft] = useState(searchParams.get('state') === 'timeout' ? 0 : 600)
  const [copied, setCopied] = useState(false)
  const code = 'RTF-8H4K-2Q9X'

  useEffect(() => {
    const t = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(t)
  }, [])

  const expired = secondsLeft === 0
  const mm = Math.floor(secondsLeft / 60)
  const ss = String(secondsLeft % 60).padStart(2, '0')

  return (
    <div className="onboard-card" style={{ maxWidth: 560 }}>
      <h1 className="onboard-title">Pair via CloudShell</h1>
      <p className="onboard-sub">One command. Nothing else to install.</p>

      {/* trust message — deliberately the loudest element on the screen */}
      <div className="trust-panel">
        <Eye size={16} strokeWidth={2} />
        <div>
          <div className="trust-title">Read-only. Always.</div>
          <div className="trust-sub">
            The pairing role can list and describe resources — it cannot modify, create, or delete
            anything. You can audit the exact policy before running the command.
          </div>
        </div>
        <Lock size={14} strokeWidth={2} style={{ marginLeft: 'auto', color: 'var(--success)' }} />
      </div>

      <div className={`code-block mono${expired ? ' expired' : ''}`}>
        <span>curl -sL rtifact.app/pair | sh -s -- --code {code}</span>
        <button
          className="askai-close"
          aria-label="Copy command"
          disabled={expired}
          onClick={() => {
            setCopied(true)
            setTimeout(() => setCopied(false), 1500)
          }}
        >
          {copied ? <Check size={14} strokeWidth={2.2} /> : <Copy size={14} strokeWidth={2.2} />}
        </button>
      </div>

      {expired ? (
        <div className="pairing-expired">
          <span className="sla breached mono" style={{ animation: 'none' }}>
            Pairing code expired
          </span>
          <button className="btn btn-primary" onClick={() => setSecondsLeft(600)}>
            <RefreshCw size={14} strokeWidth={2.2} />
            Generate new code
          </button>
        </div>
      ) : (
        <div className="pairing-meta">
          <span className="mono sla ok">
            code {code} · valid {mm}:{ss}
          </span>
          <button className="btn btn-primary" onClick={() => navigate('/onboarding/scan')}>
            I ran the command
            <ArrowRight size={14} strokeWidth={2.2} />
          </button>
        </div>
      )}
    </div>
  )
}

/* Screen 62 — Scan progress: real-time counts, % bar, live item feed. */
const SCAN_ITEMS = [
  'VPC vpc-0a81f discovered (us-east-1)',
  'VPC vpc-9c22d discovered (us-east-1)',
  '48 EC2 instances catalogued',
  'EKS cluster k8s-prod-1 detected — 86 nodes',
  'RDS orders-db mapped with 3 replicas',
  'EKS cluster k8s-prod-2 detected — 56 nodes',
  '112 security groups analyzed',
  'Lambda fleet catalogued — 96 functions',
  'CloudFront distribution mapped — 40 PoPs',
  '3 availability zones verified',
  'Dependency graph assembled — 24 services',
]

export function ScanPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  /* Screen 74 — scan-failure error state with recovery */
  const failed = searchParams.get('state') === 'failed'
  const [pct, setPct] = useState(0)
  const [items, setItems] = useState<string[]>([])
  const [counts, setCounts] = useState({ vpcs: 0, assets: 0, clusters: 0, zones: 0 })
  const step = useRef(0)

  useEffect(() => {
    if (failed) return
    const t = setInterval(() => {
      step.current += 1
      setPct((p) => Math.min(100, p + 9 + (step.current % 3)))
      setItems((prev) =>
        step.current <= SCAN_ITEMS.length ? [SCAN_ITEMS[step.current - 1], ...prev] : prev,
      )
      setCounts((c) => ({
        vpcs: Math.min(2, c.vpcs + (step.current <= 2 ? 1 : 0)),
        assets: Math.min(769, c.assets + 71),
        clusters: Math.min(2, c.clusters + (step.current === 4 || step.current === 6 ? 1 : 0)),
        zones: Math.min(3, c.zones + (step.current === 10 ? 3 : 0)),
      }))
    }, 700)
    return () => clearInterval(t)
  }, [failed])

  const complete = pct >= 100

  if (failed) {
    return (
      <div className="onboard-card" style={{ maxWidth: 560 }}>
        <h1 className="onboard-title">Scan couldn’t finish</h1>
        <p className="onboard-sub">
          We reached your account but lost access partway through — usually an expired pairing
          session or a missing read permission on one region.
        </p>
        <div className="stats-bar" style={{ marginBottom: 16 }}>
          <div className="stats-bar-item">
            <span className="stat-label">Progress before failure</span>
            <span className="mono stats-bar-value">37%</span>
          </div>
          <div className="stats-bar-item">
            <span className="stat-label">Assets already mapped</span>
            <span className="mono stats-bar-value">284</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary" onClick={() => setSearchParams({})}>
            <RefreshCw size={14} strokeWidth={2.2} />
            Retry scan — resumes from 37%
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/onboarding/pairing')}>
            Re-pair CloudShell
          </button>
        </div>
        <p className="onboard-note" style={{ textAlign: 'left', marginTop: 12 }}>
          Still stuck? support@rtifact.app answers in under an hour during onboarding.
        </p>
      </div>
    )
  }

  return (
    <div className="onboard-card" style={{ maxWidth: 560 }}>
      <h1 className="onboard-title">{complete ? 'Scan complete' : 'Scanning your environment…'}</h1>
      <p className="onboard-sub">
        {complete ? 'Everything mapped — read-only, as promised.' : 'This usually takes under two minutes.'}
      </p>

      <div className="goal-bar" style={{ height: 7, marginBottom: 8 }}>
        <div className={`goal-fill ${complete ? 'ok' : 'behind'}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="mono" style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 14 }}>
        {pct}%
      </div>

      <div className="stats-bar" style={{ marginBottom: 14 }}>
        {(
          [
            ['VPCs', counts.vpcs],
            ['Assets', counts.assets],
            ['Clusters', counts.clusters],
            ['Zones', counts.zones],
          ] as const
        ).map(([label, value]) => (
          <div key={label} className="stats-bar-item">
            <span className="stat-label">{label}</span>
            <span className="mono stats-bar-value">{value}</span>
          </div>
        ))}
      </div>

      <div className="scan-feed" aria-live="polite">
        {items.map((i) => (
          <div key={i} className="scan-line">
            <CheckCircle2 size={13} strokeWidth={2} style={{ color: 'var(--success)', flexShrink: 0 }} />
            <span className="mono">{i}</span>
          </div>
        ))}
        {!complete && (
          <div className="scan-line">
            <Loader2 size={13} strokeWidth={2} className="spin" style={{ color: 'var(--muted)', flexShrink: 0 }} />
            <span className="mono" style={{ color: 'var(--muted)' }}>
              discovering…
            </span>
          </div>
        )}
      </div>

      {complete && (
        <button className="btn btn-primary onboard-btn" style={{ marginTop: 16 }} onClick={() => navigate('/onboarding/live')}>
          Continue
          <ArrowRight size={14} strokeWidth={2.2} />
        </button>
      )}
    </div>
  )
}

/* Screen 63 — First environment live. */
export function FirstEnvPage() {
  const [schedule, setSchedule] = useState<'daily' | 'manual'>('daily')

  return (
    <div className="onboard-card" style={{ maxWidth: 480 }}>
      <div className="empty-dot-wrap" style={{ marginBottom: 6 }}>
        <CheckCircle2 size={30} strokeWidth={2} style={{ color: 'var(--success)' }} />
      </div>
      <h1 className="onboard-title" style={{ textAlign: 'center' }}>
        Production is live
      </h1>
      <p className="onboard-sub" style={{ textAlign: 'center' }}>
        769 assets · 2 clusters · 3 zones — monitored from this moment on.
      </p>

      <div className="field" style={{ marginTop: 8 }}>
        <span className="field-label">Rescan schedule</span>
        <div className="pipeline-tabs" style={{ marginBottom: 0 }}>
          <button className={`pipeline-tab${schedule === 'daily' ? ' active' : ''}`} onClick={() => setSchedule('daily')}>
            Daily · 08:00 UTC
          </button>
          <button className={`pipeline-tab${schedule === 'manual' ? ' active' : ''}`} onClick={() => setSchedule('manual')}>
            Manual only
          </button>
        </div>
      </div>

      {/* terminates at Screen 01 — the confirmed Command entry point */}
      <Link to="/command" className="btn btn-primary onboard-btn" style={{ marginTop: 18 }}>
        Enter Rtifact
        <ArrowRight size={14} strokeWidth={2.2} />
      </Link>
    </div>
  )
}
