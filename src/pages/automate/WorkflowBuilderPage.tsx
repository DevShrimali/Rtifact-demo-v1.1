import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Check, CheckCircle2, ChevronLeft, ChevronRight, Plus, X } from 'lucide-react'
import {
  ACTION_TYPES,
  CONDITION_FIELDS,
  CONDITION_OPERATORS,
  SCOPE_OPTIONS,
  TRIGGER_EVENTS,
} from '../../mock/workflows'

const STEPS = ['Basic Info', 'Trigger', 'Scope', 'Conditions', 'Actions', 'Review'] as const

interface Condition {
  field: (typeof CONDITION_FIELDS)[number]
  operator: (typeof CONDITION_OPERATORS)[number]
  value: string
}

interface Draft {
  name: string
  description: string
  status: 'Enabled' | 'Disabled' | 'Draft'
  trigger: string | null
  scope: Record<string, string[]>
  logic: 'ALL' | 'ANY'
  conditions: Condition[]
  actions: string[]
}

const emptyDraft: Draft = {
  name: '',
  description: '',
  status: 'Draft',
  trigger: null,
  scope: { Environments: [], Clusters: [], Namespaces: [], Services: [] },
  logic: 'ALL',
  conditions: [{ field: 'severity', operator: 'equals', value: '' }],
  actions: [],
}

function firesWhen(d: Draft): string {
  const parts = d.conditions
    .map((c) => `${c.field} ${c.operator} ${c.value || '—'}`)
    .join(d.logic === 'ALL' ? ' AND ' : ' OR ')
  return `Fires when: ${parts || '—'}`
}

/* Screens 19–24 — the 6-step workflow builder. One routed page, an on-page
   stepper (no modals anywhere); steps validate before advancing. */
export function WorkflowBuilderPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [maxStep, setMaxStep] = useState(0)
  const [d, setD] = useState<Draft>(emptyDraft)
  const [activated, setActivated] = useState(false)

  const canAdvance =
    step === 0 ? d.name.trim().length > 0 : step === 1 ? d.trigger !== null : step === 4 ? d.actions.length > 0 : true

  const next = () => {
    const n = Math.min(step + 1, STEPS.length - 1)
    setStep(n)
    setMaxStep((m) => Math.max(m, n))
  }

  if (activated) {
    return (
      <div className="panel resolved-panel">
        <CheckCircle2 size={22} strokeWidth={2} style={{ color: 'var(--success)' }} />
        <div className="error-title">“{d.name}” is live</div>
        <div className="error-sub">
          Trigger {d.trigger} · {d.actions.length} action{d.actions.length === 1 ? '' : 's'} · outcomes will roll up
          to the Review module automatically.
        </div>
        <button className="btn btn-secondary" onClick={() => navigate('/automate')}>
          <ChevronLeft size={14} strokeWidth={2.2} />
          Back to workflows
        </button>
      </div>
    )
  }

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">Automate · New workflow</div>
          <h1 className="page-title">{d.name.trim() || 'Untitled workflow'}</h1>
          <p className="page-sub">
            Step {step + 1} of 6 — {STEPS[step]}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link to="/automate" className="btn btn-secondary">
            Discard
          </Link>
          {step < 5 ? (
            <button className="btn btn-primary" disabled={!canAdvance} onClick={next}>
              Continue to {STEPS[step + 1]}
              <ChevronRight size={14} strokeWidth={2.2} />
            </button>
          ) : (
            <button className="btn btn-primary" onClick={() => setActivated(true)}>
              <CheckCircle2 size={14} strokeWidth={2.2} />
              Activate Workflow
            </button>
          )}
        </div>
      </div>

      {/* Stepper — reuses the DAAV progress pattern */}
      <div className="daav" role="tablist" aria-label="Builder steps">
        {STEPS.map((s, i) => {
          const reachable = i <= maxStep
          return (
            <button
              key={s}
              role="tab"
              aria-selected={i === step}
              disabled={!reachable}
              className={`daav-step${i === step ? ' viewing' : ''}${i < step ? ' done' : ''}${!reachable ? ' locked' : ''}`}
              onClick={() => reachable && setStep(i)}
            >
              <span className="daav-dot">
                {i < step ? <Check size={11} strokeWidth={2.6} /> : <span className="daav-num mono">{i + 1}</span>}
              </span>
              <span className="daav-text">
                <span className="daav-title">{s}</span>
              </span>
            </button>
          )
        })}
      </div>

      <div key={step} className="daav-content">
        {step === 0 && (
          <section className="panel form-panel">
            <label className="field">
              <span className="field-label">Name</span>
              <input
                className="text-input"
                value={d.name}
                placeholder="e.g. Auto-restart pod on OOM"
                onChange={(e) => setD({ ...d, name: e.target.value })}
              />
            </label>
            <label className="field">
              <span className="field-label">Description</span>
              <textarea
                className="text-input"
                rows={3}
                value={d.description}
                placeholder="What this workflow does and why it exists"
                onChange={(e) => setD({ ...d, description: e.target.value })}
              />
            </label>
            <div className="field">
              <span className="field-label">Initial status</span>
              <div className="pipeline-tabs" style={{ marginBottom: 0 }}>
                {(['Enabled', 'Disabled', 'Draft'] as const).map((s) => (
                  <button
                    key={s}
                    className={`pipeline-tab${d.status === s ? ' active' : ''}`}
                    onClick={() => setD({ ...d, status: s })}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        {step === 1 && (
          <section className="panel form-panel">
            <div className="gate-note" style={{ marginBottom: 12 }}>
              One trigger per workflow — selecting another replaces the current one.
            </div>
            {TRIGGER_EVENTS.map((g) => (
              <div key={g.group} className="field">
                <span className="field-label">{g.group} events</span>
                <div className="pipeline-tabs" style={{ marginBottom: 0 }}>
                  {g.events.map((ev) => (
                    <button
                      key={ev}
                      role="radio"
                      aria-checked={d.trigger === ev}
                      className={`pipeline-tab mono${d.trigger === ev ? ' active' : ''}`}
                      onClick={() => setD({ ...d, trigger: ev })}
                    >
                      {ev}
                      {d.trigger === ev && <Check size={12} strokeWidth={2.4} />}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </section>
        )}

        {step === 2 && (
          <section className="panel form-panel">
            <div className="panel-foot-note" style={{ border: 'none', padding: 0, marginBottom: 14, marginTop: 0 }}>
              Leave every field empty to run globally. Multiple values per field are allowed.
            </div>
            {Object.entries(SCOPE_OPTIONS).map(([group, opts]) => (
              <div key={group} className="field">
                <span className="field-label">
                  {group}
                  {d.scope[group].length === 0 && <span className="scope-global mono"> · global</span>}
                </span>
                <div className="pipeline-tabs" style={{ marginBottom: 0 }}>
                  {opts.map((o) => {
                    const on = d.scope[group].includes(o)
                    return (
                      <button
                        key={o}
                        role="checkbox"
                        aria-checked={on}
                        className={`pipeline-tab mono${on ? ' active' : ''}`}
                        onClick={() =>
                          setD((prev) => ({
                            ...prev,
                            scope: {
                              ...prev.scope,
                              [group]: prev.scope[group].includes(o)
                                ? prev.scope[group].filter((x) => x !== o)
                                : [...prev.scope[group], o],
                            },
                          }))
                        }
                      >
                        {o}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </section>
        )}

        {step === 3 && (
          <section className="panel form-panel">
            <div className="field">
              <span className="field-label">Match</span>
              <div className="pipeline-tabs" style={{ marginBottom: 0 }}>
                {(['ALL', 'ANY'] as const).map((l) => (
                  <button
                    key={l}
                    className={`pipeline-tab${d.logic === l ? ' active' : ''}`}
                    onClick={() => setD({ ...d, logic: l })}
                  >
                    {l} conditions
                  </button>
                ))}
              </div>
            </div>
            {d.conditions.map((c, i) => (
              <div key={i} className="condition-row">
                <span className="mono" style={{ fontSize: 11, color: 'var(--faint)' }}>
                  IF
                </span>
                <select
                  className="text-input select"
                  value={c.field}
                  onChange={(e) => {
                    const next = [...d.conditions]
                    next[i] = { ...c, field: e.target.value as Condition['field'] }
                    setD({ ...d, conditions: next })
                  }}
                >
                  {CONDITION_FIELDS.map((f) => (
                    <option key={f}>{f}</option>
                  ))}
                </select>
                <select
                  className="text-input select"
                  value={c.operator}
                  onChange={(e) => {
                    const next = [...d.conditions]
                    next[i] = { ...c, operator: e.target.value as Condition['operator'] }
                    setD({ ...d, conditions: next })
                  }}
                >
                  {CONDITION_OPERATORS.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
                <input
                  className="text-input"
                  style={{ flex: 1 }}
                  placeholder="value"
                  value={c.value}
                  onChange={(e) => {
                    const next = [...d.conditions]
                    next[i] = { ...c, value: e.target.value }
                    setD({ ...d, conditions: next })
                  }}
                />
                <button
                  className="askai-close"
                  aria-label="Remove condition"
                  disabled={d.conditions.length === 1}
                  onClick={() => setD({ ...d, conditions: d.conditions.filter((_, j) => j !== i) })}
                >
                  <X size={14} strokeWidth={2.2} />
                </button>
              </div>
            ))}
            <button
              className="btn btn-secondary"
              onClick={() =>
                setD({ ...d, conditions: [...d.conditions, { field: 'service', operator: 'equals', value: '' }] })
              }
            >
              <Plus size={14} strokeWidth={2.2} />
              Add condition
            </button>
            <div className="fires-when mono" aria-live="polite">
              {firesWhen(d)}
            </div>
          </section>
        )}

        {step === 4 && (
          <section className="panel form-panel">
            <div className="panel-foot-note" style={{ border: 'none', padding: 0, marginBottom: 14, marginTop: 0 }}>
              Pick one or more actions. Fields support template variables like{' '}
              <span className="mono">{'{{alert.title}}'}</span>. “Request Approval” gates the actions after it.
            </div>
            <div className="action-grid">
              {ACTION_TYPES.map((a) => {
                const on = d.actions.includes(a.key)
                return (
                  <button
                    key={a.key}
                    role="checkbox"
                    aria-checked={on}
                    className={`action-card${on ? ' selected' : ''}`}
                    onClick={() =>
                      setD((prev) => ({
                        ...prev,
                        actions: prev.actions.includes(a.key)
                          ? prev.actions.filter((x) => x !== a.key)
                          : [...prev.actions, a.key],
                      }))
                    }
                  >
                    <span className="action-name">
                      {a.name}
                      {on && <Check size={13} strokeWidth={2.4} />}
                    </span>
                    <span className="action-hint">{a.hint}</span>
                  </button>
                )
              })}
            </div>
          </section>
        )}

        {step === 5 && (
          <section className="panel form-panel">
            <div className="panel-title">Review — everything this workflow will do</div>
            <div className="kv-row">
              <span className="kv-label">Name</span>
              <span className="kv-value">{d.name || '—'}</span>
            </div>
            <div className="kv-row">
              <span className="kv-label">Initial status</span>
              <span className="kv-value">{d.status}</span>
            </div>
            <div className="kv-row">
              <span className="kv-label">Trigger</span>
              <span className="kv-value mono">{d.trigger ?? '—'}</span>
            </div>
            <div className="kv-row">
              <span className="kv-label">Scope</span>
              <span className="kv-value mono">
                {Object.values(d.scope).flat().length === 0 ? 'global' : Object.values(d.scope).flat().join(', ')}
              </span>
            </div>
            <div className="kv-row">
              <span className="kv-label">Conditions</span>
              <span className="kv-value mono" style={{ fontSize: 11 }}>
                {firesWhen(d).replace('Fires when: ', `${d.logic}: `)}
              </span>
            </div>
            <div className="kv-row">
              <span className="kv-label">Actions</span>
              <span className="kv-value">
                {d.actions.length === 0
                  ? '—'
                  : d.actions.map((k) => ACTION_TYPES.find((a) => a.key === k)?.name).join(' → ')}
              </span>
            </div>
          </section>
        )}
      </div>
    </>
  )
}
