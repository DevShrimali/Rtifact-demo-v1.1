import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  GitCommitHorizontal,
  LineChart,
  Megaphone,
  Route,
  Sparkles,
} from 'lucide-react'
import { BeforeNowTable } from '../components/BeforeNow'
import { useEnv } from '../state/env'
import { findIncident, INCIDENT_PIPELINE } from '../mock/incidents'
import type { EvidenceItem } from '../mock/incidents'
import { CausalChain } from '../components/CausalChain'
import { ConfidencePill } from '../components/Confidence'
import { SeverityBadge } from '../components/SeverityBadge'
import { SlaCountdown } from '../components/SlaCountdown'
import { TimeAgo } from '../components/TimeAgo'
import { useNow } from '../lib/time'

const EVIDENCE_ICONS: Record<EvidenceItem['kind'], typeof FileText> = {
  logs: FileText,
  metric: LineChart,
  deploy: GitCommitHorizontal,
  trace: Route,
}

/* Screen 07 — Incident detail, the "AI Command Center". Deeplink-primary;
   Acknowledge / Escalate / Resolve above the fold. States: Default · Loading. */
export function IncidentDetailPage() {
  const { incidentId } = useParams()
  const { env } = useEnv()
  const [searchParams, setSearchParams] = useSearchParams()
  const incident = findIncident(incidentId ?? '')

  const [loading, setLoading] = useState(true)
  const [ack, setAck] = useState(false)
  const [escalated, setEscalated] = useState(false)
  const [resolved, setResolved] = useState(false)

  useEffect(() => {
    setLoading(true)
    setAck(false)
    setEscalated(false)
    setResolved(false)
    const t = setTimeout(() => setLoading(false), 550)
    return () => clearTimeout(t)
  }, [incidentId])

  const now = useNow()

  /* Screen 72 — load-failure error state with a recovery path */
  if (searchParams.get('state') === 'error') {
    return (
      <div className="error-panel" role="alert">
        <div className="error-title">Couldn’t load {incidentId}</div>
        <div className="error-sub">
          The incident timeline didn’t come back in time. Evidence keeps accruing server-side —
          nothing is lost while this view is down.
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary" onClick={() => setSearchParams({})}>
            Retry loading
          </button>
          <Link to="/command/incidents" className="btn btn-secondary">
            Back to Incidents
          </Link>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div aria-busy="true" aria-label={`Loading ${incidentId}`}>
        <div className="sev-banner">
          <span className="skeleton skeleton-text" style={{ width: 260 }} />
        </div>
        <div className="panel">
          <span className="skeleton skeleton-text" style={{ width: '40%' }} />
          <span className="skeleton skeleton-text" style={{ width: '85%', marginTop: 10 }} />
        </div>
      </div>
    )
  }

  if (!incident) {
    return (
      <div className="error-panel" role="alert">
        <div className="error-title">Incident {incidentId} not found</div>
        <div className="error-sub">It may have been merged into another incident.</div>
      </div>
    )
  }

  const d = incident.detail
  const activeFor = Math.max(1, Math.floor((now - incident.startedAt) / 60_000))
  const statusLabel = INCIDENT_PIPELINE.find((p) => p.key === incident.status)?.label

  return (
    <>
      <div className={`sev-banner sev-${incident.severity}${resolved ? ' resolved' : ''}`}>
        <SeverityBadge severity={incident.severity} />
        <span className="row-id">{incident.id}</span>
        <span className="sev-banner-title">
          {incident.title}
          {incident.aiCreated && (
            <span className="ai-tag">
              <Sparkles size={10} strokeWidth={2.2} />
              AI Created
            </span>
          )}
        </span>
        <span className="badge neutral">{resolved ? 'Resolved' : statusLabel}</span>
        {!resolved && <SlaCountdown minutesLeft={incident.slaMinutesLeft} />}
        <span className="time-ref">
          {resolved ? 'Resolved' : `Active ${activeFor}m`} · {env.name}
        </span>
      </div>

      {/* Acknowledge / Escalate / Resolve — verb-labeled, above the fold */}
      <div className="incident-actions">
        <button
          className={`btn ${ack ? 'btn-secondary' : 'btn-primary'}`}
          disabled={ack || resolved}
          onClick={() => setAck(true)}
        >
          <CheckCircle2 size={14} strokeWidth={2.2} />
          {ack ? 'Acknowledged' : 'Acknowledge incident'}
        </button>
        <button
          className="btn btn-secondary"
          disabled={escalated || resolved}
          onClick={() => setEscalated(true)}
        >
          <Megaphone size={14} strokeWidth={2.2} />
          {escalated ? 'Escalated to on-call' : 'Escalate to on-call'}
        </button>
        <button className="btn btn-secondary" disabled={resolved} onClick={() => setResolved(true)}>
          <CheckCircle2 size={14} strokeWidth={2.2} />
          {resolved ? 'Resolved' : 'Resolve incident'}
        </button>
        <span className="incident-owner">
          Owner: <span className="mono">{incident.owner}</span>
        </span>
      </div>

      <div key={String(resolved)} className="daav-content">
        <section className="panel ai-panel">
          <div className="panel-head">
            <span className="ai-tile">
              <Sparkles size={15} strokeWidth={2} />
            </span>
            <span className="eyebrow" style={{ margin: 0 }}>
              AI Command Center
            </span>
            <ConfidencePill value={d.confidence} label="confidence" />
          </div>
          <p className="panel-body-text">{d.summary}</p>
          <div className="recommendation">
            <ArrowRight size={14} strokeWidth={2.2} />
            <span>
              <strong>Recommended:</strong> {d.recommendation}
            </span>
          </div>
        </section>

        <section className="panel">
          <div className="panel-title">Causal chain</div>
          <CausalChain nodes={d.chain} />
        </section>

        <div className="detail-grid">
          <div className="detail-main">
            <section className="panel">
              <div className="panel-title">Impacted services — before / now</div>
              <BeforeNowTable rows={d.beforeNow} />
            </section>
          </div>

          <div className="detail-side">
            <section className="panel">
              <div className="panel-title">Supporting evidence</div>
              {d.evidence.map((e) => {
                const Icon = EVIDENCE_ICONS[e.kind]
                return (
                  <button key={e.label} className="sim-row evidence-row">
                    <span className="evidence-head">
                      <Icon size={13} strokeWidth={2} className="evidence-icon" />
                      <span className="sim-title">{e.label}</span>
                    </span>
                    <span className="sim-meta">
                      <span className="evidence-src">{e.source}</span>
                      <TimeAgo timestamp={e.at} />
                    </span>
                  </button>
                )
              })}
            </section>
          </div>
        </div>
      </div>
    </>
  )
}
