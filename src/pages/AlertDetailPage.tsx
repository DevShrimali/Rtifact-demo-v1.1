import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Circle,
  CircleDashed,
  Loader2,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { useEnv } from '../state/env'
import { DAAV_ORDER, getScenario } from '../mock/daav'
import type { DaavScenario, DaavState, Playbook } from '../mock/daav'
import { DaavProgress } from '../components/DaavProgress'
import { CausalChain } from '../components/CausalChain'
import { ConfidencePill, LowConfidencePanel } from '../components/Confidence'
import { SeverityBadge } from '../components/SeverityBadge'
import { BeforeNowTable } from '../components/BeforeNow'
import { useNow } from '../lib/time'

type ActPhase = 'choose' | 'executing'

/* Screens 02–05: Detect / Assess / Act / Validate as four states of ONE
   routed page. The DAAV bar switches state locally — the URL never changes.
   Deeplinks land on the alert's current state (cold-entry primary). */
export function AlertDetailPage() {
  const { alertId } = useParams()
  const { env } = useEnv()
  const [searchParams, setSearchParams] = useSearchParams()
  /* DEV-10: `?agent=off` simulates the Deployment Intelligence agent being
     disconnected — Assess degrades gracefully instead of erroring. */
  const agentConnected = searchParams.get('agent') !== 'off'
  const scenario = useMemo(() => getScenario(alertId ?? ''), [alertId])

  const [loading, setLoading] = useState(true)
  const [viewing, setViewing] = useState<DaavState>(scenario.currentState)
  const [unlocked, setUnlocked] = useState<DaavState>(scenario.currentState)
  const [actPhase, setActPhase] = useState<ActPhase>('choose')
  const [approvedPlaybook, setApprovedPlaybook] = useState<Playbook | null>(null)
  const [resolved, setResolved] = useState(false)

  useEffect(() => {
    setLoading(true)
    setViewing(scenario.currentState)
    setUnlocked(scenario.currentState)
    setActPhase('choose')
    setApprovedPlaybook(null)
    setResolved(false)
    const t = setTimeout(() => setLoading(false), 550)
    return () => clearTimeout(t)
  }, [scenario])

  /* remediation executing → auto-advance to Validate when it completes */
  useEffect(() => {
    if (actPhase !== 'executing') return
    const t = setTimeout(() => {
      setUnlocked('validate')
      setViewing('validate')
    }, 2400)
    return () => clearTimeout(t)
  }, [actPhase])

  const advance = (to: DaavState) => {
    const toIdx = DAAV_ORDER.indexOf(to)
    if (toIdx > DAAV_ORDER.indexOf(unlocked)) setUnlocked(to)
    setViewing(to)
  }

  const executePlaybook = (p: Playbook) => {
    setApprovedPlaybook(p)
    setActPhase('executing')
  }

  const now = useNow()
  const activeFor = Math.max(1, Math.floor((now - scenario.startedAt) / 60_000))

  /* Screen 71 — load-failure error state with a recovery path */
  if (searchParams.get('state') === 'error') {
    return (
      <div className="error-panel" role="alert">
        <div className="error-title">Couldn’t load {alertId}</div>
        <div className="error-sub">
          The alert record didn’t come back in time. It still exists — the stream itself is
          healthy, so retrying usually resolves this.
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary" onClick={() => setSearchParams({})}>
            Retry loading
          </button>
          <Link to="/command" className="btn btn-secondary">
            Back to Alerts board
          </Link>
        </div>
      </div>
    )
  }

  if (loading) return <DetailSkeleton alertId={scenario.alertId} />

  return (
    <>
      <div className={`sev-banner sev-${scenario.severity}${resolved ? ' resolved' : ''}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="row-id" style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted)' }}>{scenario.alertId}</span>
          <span className="sev-banner-title" style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>{scenario.title}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="mono service" style={{ background: 'var(--surface)', padding: '3px 8px', borderRadius: 4, border: '1px solid var(--border)' }}>{scenario.service}</span>
          <span className="time-ref" style={{ color: 'var(--muted)', fontSize: 11.5 }}>
            {resolved ? 'Resolved' : `Active ${activeFor}m`} · {env.name}
          </span>
          <SeverityBadge severity={scenario.severity} />
        </div>
      </div>

      <DaavProgress viewing={viewing} unlocked={unlocked} onSelect={setViewing} />

      {resolved ? (
        <ResolvedPanel scenario={scenario} />
      ) : (
        <div key={viewing} className="daav-content">
          {viewing === 'detect' && <DetectState s={scenario} onAdvance={() => advance('assess')} />}
          {viewing === 'assess' && (
            <AssessState s={scenario} agentConnected={agentConnected} onAdvance={() => advance('act')} />
          )}
          {viewing === 'act' && (
            <ActState
              s={scenario}
              phase={actPhase}
              approved={approvedPlaybook}
              onExecute={executePlaybook}
            />
          )}
          {viewing === 'validate' && (
            <ValidateState s={scenario} playbook={approvedPlaybook} onResolve={() => setResolved(true)} />
          )}
        </div>
      )}
    </>
  )
}

/* ---------- Detect (Screen 02) ---------- */

function DetectState({ s, onAdvance }: { s: DaavScenario; onAdvance: () => void }) {
  const d = s.detect
  return (
    <>
      <div className="state-head">
        <h2 className="state-title">What happened?</h2>
        <button className="btn btn-primary" onClick={onAdvance}>
          Start assessment
          <ChevronRight size={14} strokeWidth={2.2} />
        </button>
      </div>

      <div className="detail-grid">
        <div className="detail-main">
          <section className="panel ai-panel">
            <div className="panel-head">
              <span className="ai-tile">
                <Sparkles size={15} strokeWidth={2} />
              </span>
              <span className="eyebrow" style={{ margin: 0 }}>
                Rtifact AI Assessment
              </span>
              <ConfidencePill value={d.detectionConfidence} label="detection confidence" />
            </div>
            <p className="panel-body-text">{d.summary}</p>
          </section>

          <section className="panel">
            <div className="panel-title">Signal Intelligence pipeline</div>
            <ul className="pipeline">
              {d.signals.map((step) => (
                <li key={step.label} className={`pipe-step ${step.status}`}>
                  {step.status === 'done' ? (
                    <CheckCircle2 size={15} strokeWidth={2} className="pipe-icon done" />
                  ) : step.status === 'running' ? (
                    <Loader2 size={15} strokeWidth={2} className="pipe-icon running spin" />
                  ) : (
                    <CircleDashed size={15} strokeWidth={2} className="pipe-icon pending" />
                  )}
                  <span>{step.label}</span>
                  {step.status === 'running' && <span className="pipe-tag mono">running</span>}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="detail-side">
          <section className="panel">
            <div className="panel-title">Impacted services</div>
            <div className="svc-chips">
              {d.impactedServices.map((svc) => (
                <span key={svc} className="svc-chip mono">
                  {svc}
                </span>
              ))}
            </div>
          </section>

          <section className="panel">
            <div className="panel-title">Similar past incidents</div>
            {d.similarIncidents.map((inc) => (
              <button key={inc.id} className="sim-row">
                <span className="row-id">{inc.id}</span>
                <span className="sim-title">{inc.title}</span>
                <span className="sim-meta">
                  <span className="mono sim-pct">{inc.similarity}%</span>
                  <span className="time-ref">{inc.resolvedAgo}</span>
                </span>
              </button>
            ))}
          </section>
        </div>
      </div>
    </>
  )
}

/* ---------- Assess (Screen 03) ---------- */

function AssessState({
  s,
  agentConnected,
  onAdvance,
}: {
  s: DaavScenario
  agentConnected: boolean
  onAdvance: () => void
}) {
  const a = s.assess
  /* agent disconnected → correlation degrades to time proximity and the
     confidence score is downgraded, never hidden (DEV-10) */
  const shownConfidence = agentConnected ? a.rcaConfidence : Math.max(35, a.rcaConfidence - 35)
  const budgetLow = a.errorBudget.remainingPct < 40

  return (
    <>
      <div className="state-head">
        <h2 className="state-title">Why did it happen?</h2>
        <button className="btn btn-primary" onClick={onAdvance}>
          Review fix options
          <ChevronRight size={14} strokeWidth={2.2} />
        </button>
      </div>

      <section className="panel ai-panel">
        <div className="panel-head">
          <span className="ai-tile">
            <Sparkles size={15} strokeWidth={2} />
          </span>
          <span className="eyebrow" style={{ margin: 0 }}>
            Root cause analysis
          </span>
          <ConfidencePill value={shownConfidence} label="RCA confidence" />
        </div>
        <p className="panel-body-text">{a.rootCause}</p>
        {!agentConnected && (
          <LowConfidencePanel
            why={[
              'Deployment Intelligence agent is disconnected — change correlation is limited to time proximity.',
              `Confidence downgraded ${a.rcaConfidence}% → ${shownConfidence}% until ranked change data returns.`,
            ]}
            improve={[
              `Reconnect the Deployment Intelligence source (Settings → Connections) to restore RCA confidence to ~${a.rcaConfidence}%.`,
            ]}
          />
        )}
        {agentConnected && a.lowConfidence && <LowConfidencePanel {...a.lowConfidence} />}
      </section>

      <section className="panel">
        <div className="panel-title">Causal chain</div>
        <CausalChain nodes={a.chain} />
      </section>

      <section className="panel">
        <div className="panel-title">Impacted services — before / now</div>
        <BeforeNowTable rows={a.beforeNow} />
      </section>

      <div className="detail-grid">
        <div className="detail-main">
          <section className="panel">
            <div className="panel-title">
              {agentConnected ? 'What changed — ranked by correlation' : 'Event log — time-based fallback'}
            </div>
            {agentConnected ? (
              a.correlatedChanges.map((c) => (
                <div key={c.label} className="corr-row">
                  <div className="corr-info">
                    <span className="corr-label">{c.label}</span>
                    <span className="time-ref">{c.when}</span>
                  </div>
                  <div className="corr-bar">
                    <div className="corr-fill" style={{ width: `${c.pct}%` }} />
                  </div>
                  <span className="mono corr-pct">{c.pct}%</span>
                </div>
              ))
            ) : (
              <>
                {a.correlatedChanges.map((c) => (
                  <div key={c.label} className="corr-row" style={{ gridTemplateColumns: '1fr 100px' }}>
                    <div className="corr-info">
                      <span className="corr-label">{c.label}</span>
                      <span className="time-ref">{c.when}</span>
                    </div>
                    <span className="mono corr-pct">unranked</span>
                  </div>
                ))}
                <div className="panel-foot-note">
                  Events ordered by time only — no correlation ranking while the agent is offline.
                </div>
              </>
            )}
          </section>
        </div>
        <div className="detail-side">
          <section className="panel">
            <div className="panel-title">SLO error budget</div>
            <div className="slo-row" style={{ gridTemplateColumns: '86px 1fr 52px' }}>
              <span className="slo-label">Remaining</span>
              <div className="slo-bar">
                <div
                  className={`slo-fill ${budgetLow ? 'recovering' : 'ok'}`}
                  style={{ width: `${a.errorBudget.remainingPct}%` }}
                />
              </div>
              <span className="mono slo-nums">{a.errorBudget.remainingPct}%</span>
            </div>
            <div className="kv-row">
              <span className="kv-label">Burn rate</span>
              <span className={`kv-value mono${a.errorBudget.burnRateX >= 4 ? ' warn-text' : ''}`}>
                {a.errorBudget.burnRateX}× normal
              </span>
            </div>
            <div className="panel-foot-note">{a.errorBudget.note}</div>
          </section>

          <section className="panel">
            <div className="panel-title">Service intelligence</div>
            {a.serviceIntel.map((kv) => (
              <div key={kv.label} className="kv-row">
                <span className="kv-label">{kv.label}</span>
                <span className="kv-value">{kv.value}</span>
              </div>
            ))}
          </section>
        </div>
      </div>
    </>
  )
}

/* ---------- Act (Screen 04) ---------- */

function ActState({
  s,
  phase,
  approved,
  onExecute,
}: {
  s: DaavScenario
  phase: ActPhase
  approved: Playbook | null
  onExecute: (p: Playbook) => void
}) {
  if (phase === 'executing' && approved) {
    return (
      <>
        <div className="state-head">
          <h2 className="state-title">Remediation executing</h2>
          <button className="btn btn-primary" disabled>
            <Loader2 size={14} strokeWidth={2.2} className="spin" />
            Executing…
          </button>
        </div>
        <section className="panel">
          <div className="panel-head">
            <Loader2 size={16} strokeWidth={2} className="spin" style={{ color: 'var(--muted)' }} />
            <span className="panel-title" style={{ margin: 0 }}>
              {approved.name}
            </span>
            <span className="time-ref">ETA {approved.eta}</span>
          </div>
          <ul className="pipeline">
            <li className="pipe-step done">
              <CheckCircle2 size={15} strokeWidth={2} className="pipe-icon done" />
              <span>Approval recorded — {approved.risk} risk gate passed</span>
            </li>
            <li className="pipe-step running">
              <Loader2 size={15} strokeWidth={2} className="pipe-icon running spin" />
              <span>Executing remediation steps</span>
              <span className="pipe-tag mono">running</span>
            </li>
            <li className="pipe-step pending">
              <CircleDashed size={15} strokeWidth={2} className="pipe-icon pending" />
              <span>Hand off to recovery validation</span>
            </li>
          </ul>
        </section>
      </>
    )
  }

  const top = s.act.playbooks[0]
  return (
    <>
      <div className="state-head">
        <h2 className="state-title">How to fix it</h2>
        {/* Primary action mirrors the #1 playbook — verb-labeled, above fold */}
        <button className="btn btn-primary" onClick={() => onExecute(top)}>
          <ShieldCheck size={14} strokeWidth={2.2} />
          {top.requiresApproval ? `Approve: ${top.name}` : `Execute: ${top.name}`}
        </button>
      </div>

      <div className="playbooks">
        {s.act.playbooks.map((p) => (
          <section key={p.rank} className={`panel playbook${p.rank === 1 ? ' recommended' : ''}`}>
            <div className="playbook-head">
              <span className="playbook-rank mono">#{p.rank}</span>
              <span className="playbook-name">{p.name}</span>
              {p.rank === 1 && <span className="badge sev-healthy">AI recommended</span>}
              <span className={`badge risk-${p.risk.toLowerCase()}`}>{p.risk} risk</span>
            </div>
            <p className="playbook-desc">{p.description}</p>
            <div className="playbook-foot">
              <span className="mono playbook-stat">ETA {p.eta}</span>
              <span className="mono playbook-stat">{p.successRate}% past success</span>
              {p.requiresApproval ? (
                <span className="gate-note">Approval required — {p.risk}-risk action</span>
              ) : (
                <span className="gate-note ok">No approval needed — low risk</span>
              )}
              <button
                className={`btn ${p.rank === 1 ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => onExecute(p)}
              >
                {p.requiresApproval ? 'Approve & execute' : 'Execute'}
              </button>
            </div>
          </section>
        ))}
      </div>
    </>
  )
}

/* ---------- Validate (Screen 05) ---------- */

function ValidateState({
  s,
  playbook,
  onResolve,
}: {
  s: DaavScenario
  playbook: Playbook | null
  onResolve: () => void
}) {
  const v = s.validate
  const [secondsLeft, setSecondsLeft] = useState(v.windowLeftMin * 60)
  useEffect(() => {
    const t = setInterval(() => setSecondsLeft((x) => Math.max(0, x - 1)), 1000)
    return () => clearInterval(t)
  }, [])
  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0')
  const ss = String(secondsLeft % 60).padStart(2, '0')
  const windowPct = Math.round((1 - secondsLeft / (v.windowTotalMin * 60)) * 100)
  const allDone = v.checklist.every((c) => c.status === 'done')

  return (
    <>
      <div className="state-head">
        <h2 className="state-title">Did it recover?</h2>
        <button className="btn btn-primary" onClick={onResolve}>
          <CheckCircle2 size={14} strokeWidth={2.2} />
          Mark resolved
        </button>
      </div>

      <div className="contrib" aria-label="AI contribution">
        <span className="contrib-chip">
          <span className="contrib-k">Cost</span> {v.contribution.cost}
        </span>
        <span className="contrib-chip">
          <span className="contrib-k">Time</span> {v.contribution.time}
        </span>
        <span className="contrib-chip">
          <span className="contrib-k">Risk</span> {v.contribution.risk}
        </span>
      </div>

      <div className="detail-grid">
        <div className="detail-main">
          <section className="panel">
            <div className="panel-title">Recovery checklist</div>
            <ul className="pipeline">
              {v.checklist.map((c) => (
                <li key={c.label} className={`pipe-step ${c.status}`}>
                  {c.status === 'done' ? (
                    <CheckCircle2 size={15} strokeWidth={2} className="pipe-icon done" />
                  ) : (
                    <Circle size={15} strokeWidth={2} className="pipe-icon pending" />
                  )}
                  <span>{c.label}</span>
                  {c.status === 'pending' && <span className="pipe-tag mono">observing</span>}
                </li>
              ))}
            </ul>
            {playbook && (
              <div className="panel-foot-note">
                Remediation applied: {playbook.name} · {playbook.risk} risk · approved
              </div>
            )}
          </section>

          <section className="panel">
            <div className="panel-title">SLO recovery</div>
            {v.slos.map((slo) => (
              <div key={slo.label} className="slo-row">
                <span className="slo-label">{slo.label}</span>
                <div className="slo-bar">
                  <div
                    className={`slo-fill ${slo.pct >= 100 ? 'ok' : 'recovering'}`}
                    style={{ width: `${Math.min(100, slo.pct)}%` }}
                  />
                </div>
                <span className="mono slo-nums">
                  {slo.current} <span className="slo-target">/ {slo.target}</span>
                </span>
              </div>
            ))}
          </section>
        </div>

        <div className="detail-side">
          <section className="panel countdown-panel">
            <div className="panel-title">Observation window</div>
            <div className="countdown mono">{mm}:{ss}</div>
            <div className="goal-bar">
              <div className="goal-fill ok" style={{ width: `${windowPct}%` }} />
            </div>
            <div className="panel-foot-note">
              {allDone
                ? 'All checks green — safe to resolve.'
                : `of a ${v.windowTotalMin}m window · resolve enabled early if all checks pass`}
            </div>
          </section>
        </div>
      </div>
    </>
  )
}

/* ---------- Resolved + skeleton ---------- */

function ResolvedPanel({ scenario }: { scenario: DaavScenario }) {
  const c = scenario.validate.contribution
  return (
    <div className="panel resolved-panel">
      <CheckCircle2 size={22} strokeWidth={2} style={{ color: 'var(--success)' }} />
      <div className="error-title">{scenario.alertId} resolved</div>
      <div className="error-sub">
        {c.cost} · {c.time} · {c.risk}. Contribution rolls up to the Review executive summary.
      </div>
      <Link to="/command" className="btn btn-secondary">
        <ArrowLeft size={14} strokeWidth={2.2} />
        Back to Alerts board
      </Link>
    </div>
  )
}

function DetailSkeleton({ alertId }: { alertId: string }) {
  return (
    <div aria-busy="true" aria-label={`Loading ${alertId}`}>
      <div className="sev-banner">
        <span className="skeleton skeleton-text" style={{ width: 220 }} />
      </div>
      <div className="daav" style={{ pointerEvents: 'none' }}>
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className="skeleton" style={{ height: 42, flex: 1, borderRadius: 9 }} />
        ))}
      </div>
      <div className="panel">
        <span className="skeleton skeleton-text" style={{ width: '35%' }} />
        <span className="skeleton skeleton-text" style={{ width: '90%', marginTop: 10 }} />
        <span className="skeleton skeleton-text" style={{ width: '70%', marginTop: 6 }} />
      </div>
    </div>
  )
}
