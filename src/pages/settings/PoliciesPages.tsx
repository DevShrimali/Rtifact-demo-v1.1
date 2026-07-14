import { useState } from 'react'
import { ArrowDown, ArrowUp, Lock } from 'lucide-react'
import {
  automationActions,
  confidencePolicies,
  DEFAULT_HEALTHY_MINUTES,
  investigationPhases,
  recoveryChecks,
} from '../../mock/settings'
import type { AutomationAction, InvestigationPhase, RecoveryCheck } from '../../mock/settings'

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

/* Screen 48 — Investigation Policies: 6 phases, enable/disable + reorder. */
export function InvestigationPage() {
  const [phases, setPhases] = useState<InvestigationPhase[]>(investigationPhases)

  const move = (i: number, dir: -1 | 1) => {
    setPhases((prev) => {
      const next = [...prev]
      const j = i + dir
      if (j < 0 || j >= next.length) return prev
      ;[next[i], next[j]] = [next[j], next[i]]
      return next
    })
  }

  const toggle = (key: string) =>
    setPhases((prev) => prev.map((p) => (p.key === key ? { ...p, enabled: !p.enabled } : p)))

  return (
    <>
      <PageHead title="Investigation Policies" sub="The phases every automated investigation runs, in order." />      <div className="row-list">
        {phases.map((p, i) => (
          <div key={p.key} className="row" style={{ opacity: p.enabled ? 1 : 0.55 }}>
            <span className="daav-dot" style={{ width: 22, height: 22 }}>
              <span className="daav-num mono">{i + 1}</span>
            </span>
            <span className="row-title">
              {p.name}
              <span style={{ display: 'block', fontSize: 11.5, color: 'var(--muted)', fontWeight: 400 }}>
                {p.description}
              </span>
            </span>
            <button className="askai-close" aria-label={`Move ${p.name} up`} disabled={i === 0} onClick={() => move(i, -1)}>
              <ArrowUp size={14} strokeWidth={2.2} />
            </button>
            <button
              className="askai-close"
              aria-label={`Move ${p.name} down`}
              disabled={i === phases.length - 1}
              onClick={() => move(i, 1)}
            >
              <ArrowDown size={14} strokeWidth={2.2} />
            </button>
            <button
              role="switch"
              aria-checked={p.enabled}
              aria-label={`${p.name} enabled`}
              className={`switch${p.enabled ? ' on' : ''}`}
              onClick={() => toggle(p.key)}
            >
              <span className="switch-knob" />
            </button>
          </div>
        ))}
      </div>
    </>
  )
}

/* ── Custom tick-track slider ─────────────────────────────────────────────── */
interface TickSliderProps {
  value: number     // 50–99
  min?: number
  max?: number
  onChange: (v: number) => void
  id?: string
}

function TickSlider({ value, min = 50, max = 99, onChange, id }: TickSliderProps) {
  const range = max - min
  const pct = ((value - min) / range) * 100

  const handlePointer = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = e.currentTarget
    el.setPointerCapture(e.pointerId)

    const calc = (ev: PointerEvent | React.PointerEvent) => {
      const rect = el.getBoundingClientRect()
      const raw = Math.max(0, Math.min(1, (ev.clientX - rect.left) / rect.width))
      const next = Math.round(min + raw * range)
      onChange(next)
    }

    calc(e)

    const onMove = (ev: PointerEvent) => calc(ev)
    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  // tick positions every 5 units
  const ticks: number[] = []
  for (let t = min; t <= max; t += 5) ticks.push(t)

  return (
    <div
      id={id}
      className="tick-slider"
      role="slider"
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      tabIndex={0}
      onPointerDown={handlePointer}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowUp') onChange(Math.min(max, value + 1))
        if (e.key === 'ArrowLeft'  || e.key === 'ArrowDown') onChange(Math.max(min, value - 1))
      }}
    >
      {/* track */}
      <div className="tick-track">
        {/* filled fill */}
        <div className="tick-fill" style={{ width: `${pct}%` }} />
        {/* tick marks */}
        {ticks.map((t) => (
          <div
            key={t}
            className={`tick-mark${t <= value ? ' filled' : ''}`}
            style={{ left: `${((t - min) / range) * 100}%` }}
          />
        ))}
        {/* thumb */}
        <div className="tick-thumb" style={{ left: `${pct}%` }}>
          <div className="tick-thumb-ring" />
          <div className="tick-thumb-dot" />
          {/* floating label */}
          <div className="tick-label">{value}%</div>
        </div>
      </div>
    </div>
  )
}

/* Screen 49 — Confidence Policies: sliders that drive Assess-state behavior. */
export function ConfidencePoliciesPage() {
  const [values, setValues] = useState<Record<string, number>>(
    Object.fromEntries(confidencePolicies.map((p) => [p.key, p.defaultPct])),
  )

  return (
    <>
      <PageHead
        title="Confidence Policies"
        sub="Thresholds the AI must clear before acting — these directly drive the Assess and Act states."
      />
      {confidencePolicies.map((p) => {
        const v = values[p.key]
        return (
          <section key={p.key} className="panel">
            <div className="goal-top" style={{ marginBottom: 18 }}>
              <span className="goal-label">{p.label}</span>
              <span className="mono" style={{ fontSize: 16, fontWeight: 700 }}>
                {v}%
              </span>
            </div>

            <TickSlider
              id={`slider-${p.key}`}
              value={v}
              onChange={(next) => setValues((prev) => ({ ...prev, [p.key]: next }))}
            />

            <div className="panel-foot-note" aria-live="polite" style={{ marginTop: 14 }}>
              {p.affects}{' '}
              {p.key === 'rollback' && (
                <>
                  At {v}%, ALT-4819's 92% deploy correlation{' '}
                  <strong>{92 >= v ? 'would rank rollback #1' : 'would NOT auto-rank rollback #1'}</strong> in its
                  Act state.
                </>
              )}
              {p.key === 'promote' && (
                <>
                  At {v}%, ALT-4819 (87% RCA) <strong>{87 >= v ? 'auto-promotes' : 'stays an alert'}</strong>; ALT-9012
                  (74%) <strong>{74 >= v ? 'auto-promotes' : 'stays an alert'}</strong>.
                </>
              )}
            </div>
          </section>
        )
      })}
    </>
  )
}



/* Screen 50 — Automation Policies. Permanently disabled actions cannot be
   enabled by any UI path. */
export function AutomationPoliciesPage() {
  const [actions, setActions] = useState<AutomationAction[]>(automationActions)

  const toggle = (name: string) =>
    setActions((prev) =>
      prev.map((a) => (a.name === name && !a.permanentlyDisabled ? { ...a, enabled: !a.enabled } : a)),
    )

  return (
    <>
      <PageHead title="Automation Policies" sub="What the platform may do on its own, and what always needs a human." />      <div className="row-list">
        {actions.map((a) => (
          <div key={a.name} className={`row${a.permanentlyDisabled ? ' perm-disabled' : ''}`}>
            <span className="row-title">{a.name}</span>
            <span className={`badge risk-${a.risk.toLowerCase()}`}>{a.risk} risk</span>
            <span className={`badge ${a.approval === 'required' ? 'sev-warning' : 'neutral'}`}>
              {a.approval === 'required' ? 'approval required' : 'no approval'}
            </span>
            {a.permanentlyDisabled ? (
              <span className="badge sev-critical perm-badge">
                <Lock size={11} strokeWidth={2.2} />
                permanently disabled
              </span>
            ) : (
              <button
                role="switch"
                aria-checked={a.enabled}
                aria-label={`${a.name} enabled`}
                className={`switch${a.enabled ? ' on' : ''}`}
                onClick={() => toggle(a.name)}
              >
                <span className="switch-knob" />
              </button>
            )}
          </div>
        ))}
      </div>
      <div className="panel-foot-note" style={{ border: 'none' }}>
        Permanently disabled actions have no toggle by design — they cannot be enabled from any UI path.
      </div>
    </>
  )
}

/* Screen 51 — Recovery Validation checks. */
export function RecoveryPage() {
  const [checks, setChecks] = useState<RecoveryCheck[]>(recoveryChecks)
  const [minutes, setMinutes] = useState(DEFAULT_HEALTHY_MINUTES)

  return (
    <>
      <PageHead title="Recovery Validation" sub="What must be true before an incident may close." />      <div className="row-list" style={{ marginBottom: 14 }}>
        {checks.map((c) => (
          <div key={c.key} className="row">
            <span className="row-title">
              {c.label}
              <span style={{ display: 'block', fontSize: 11.5, color: 'var(--muted)', fontWeight: 400 }}>
                {c.description}
              </span>
            </span>
            <button
              role="switch"
              aria-checked={c.enabled}
              aria-label={`${c.label} enabled`}
              className={`switch${c.enabled ? ' on' : ''}`}
              onClick={() => setChecks((prev) => prev.map((x) => (x.key === c.key ? { ...x, enabled: !x.enabled } : x)))}
            >
              <span className="switch-knob" />
            </button>
          </div>
        ))}
      </div>
      <section className="panel form-panel">
        <div className="field" style={{ marginBottom: 0 }}>
          <span className="field-label">Healthy state duration (minutes)</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <input
              type="number"
              min={5}
              max={120}
              value={minutes}
              className="text-input mono"
              style={{ width: 90 }}
              aria-label="Healthy state duration in minutes"
              onChange={(e) => setMinutes(Number(e.target.value))}
            />
            <span className="panel-foot-note" style={{ border: 'none', padding: 0, margin: 0 }}>
              Observation window used by the Validate state countdown ({minutes}m).
            </span>
          </div>
        </div>
      </section>
    </>
  )
}
