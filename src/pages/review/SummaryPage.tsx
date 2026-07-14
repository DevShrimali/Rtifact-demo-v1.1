import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ChevronRight, Layers, Sparkles, TrendingUp, Clock, ShieldAlert, DollarSign, Check } from 'lucide-react'
import { useEnv } from '../../state/env'
import {
  aggregateRollup,
  aggregateSecurity,
  formatUsd,
  getExecParagraph,
} from '../../mock/review'
import { ConfidencePill } from '../../components/Confidence'
import { AreaChart } from '../../components/AreaChart'
import { OptimizationGoals } from '../../components/OptimizationGoals'
import { getBoard } from '../../mock/alerts'
import { useEnvLoad } from '../../components/PageLoad'

/* Review › Overview (DEV-29, was Screen 09). Consolidated Summary / Cost / Time / Risk pillars. */
export function SummaryPage() {
  const { selectedEnvs, selectedIds, env, aggregating } = useEnv()
  const [searchParams] = useSearchParams()
  const intervalParam = searchParams.get('interval') || 'daily'
  const interval = ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'].includes(intervalParam)
    ? intervalParam
    : 'daily'
  const loading = useEnvLoad()
  const forcedState = searchParams.get('state')

  // Overview Tab State
  const [tab, setTab] = useState<'summary' | 'cost' | 'time' | 'risk'>('summary')

  if (forcedState === 'error') {
    return (
      <div className="error-panel" role="alert">
        <div className="error-title">Couldn’t load overview data</div>
        <div className="error-sub">
          The overview aggregation service timed out. Check connection health.
        </div>
      </div>
    )
  }

  if (forcedState === 'empty') {
    return (
      <div className="placeholder-panel">
        No platform summary data available.
        <span className="mono">active telemetry and workflows will populate this summary</span>
      </div>
    )
  }

  if (loading) {
    return (
      <div aria-busy="true">
        <div className="panel">
          <span className="skeleton skeleton-text" style={{ width: '30%' }} />
          <span className="skeleton skeleton-text" style={{ width: '95%', marginTop: 10 }} />
          <span className="skeleton skeleton-text" style={{ width: '80%', marginTop: 6 }} />
        </div>
        <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
          {[0, 1, 2].map((i) => (
            <div key={i} className="stat-card">
              <span className="skeleton skeleton-text" style={{ width: '60%' }} />
              <span className="skeleton skeleton-text" style={{ width: '40%', marginTop: 12 }} />
            </div>
          ))}
        </div>
      </div>
    )
  }

  const scopeName = aggregating ? `${selectedEnvs.length} environments` : env.name
  const exec = aggregating
    ? { text: `Aggregated across ${selectedEnvs.map((e) => e.name).join(', ')}: the platform handled ${aggregateRollup(selectedIds).incidents} incidents automatically, protecting ~${formatUsd(aggregateRollup(selectedIds).costUsd)} in revenue and saving ${aggregateRollup(selectedIds).engHours} engineer-hours this week. Security, cost, and reliability figures below sum every selected environment.`, confidence: 90 }
    : getExecParagraph(env.id, env.name)
  const rollup = aggregateRollup(selectedIds)
  const sec = aggregateSecurity(selectedIds)
  const board = getBoard(env.id)

  const execCards = [
    {
      key: 'cost',
      label: 'Cost',
      pillar: 'Cost Optimization',
      to: '#cost',
      value: `${formatUsd(612000)}`,
      delta: '↑ since Jan 2025',
      desc: 'Total downtime prevented + right-sizing to date',
      color: 'var(--success)',
      fill: true,
      series: [120, 180, 240, 210, 300, 360, 340, 430, 470, 520, 560, 612],
    },
    {
      key: 'time',
      label: 'Time',
      pillar: 'Reliability Risk',
      to: '#time',
      value: '−54%',
      delta: 'MTTR down 54% vs baseline',
      desc: `${rollup.engHours >= 100 ? rollup.engHours : 410} eng-hrs reclaimed since rollout`,
      color: 'var(--brand)',
      fill: true,
      series: [100, 96, 92, 95, 88, 84, 80, 74, 70, 66, 60, 46],
    },
    {
      key: 'risk',
      label: 'Risk',
      pillar: 'Security Exposure',
      to: '#risk',
      value: '82%',
      delta: `${sec.topFindings.length ? 146 : 0} findings remediated to date`,
      desc: 'SLO budget held at 82%, posture trending up',
      color: 'var(--warn)',
      fill: true,
      series: [40, 44, 52, 48, 60, 58, 66, 70, 68, 74, 78, 82],
    },
  ] as const

  // Cost items mock data with separation & effort/impact & achieved outcome
  const costSuggestions = [
    { name: '14 idle EC2 instances · m5.xlarge', save: '$6.2k/mo', tag: 'Right-size', effort: 'Low effort', impact: 'High impact' },
    { name: 'Over-provisioned RDS · orders-db', save: '$3.1k/mo', tag: 'Downsize', effort: 'Medium effort', impact: 'High impact' },
  ]
  const costHistory = [
    { name: 'Unattached EBS volumes ×22 deleted', tag: 'Delete', outcome: 'Saved $1.4k/mo immediately', user: '@mei', date: '3d ago' },
    { name: 'CloudFront cache-miss ratio optimization', tag: 'Tune', outcome: 'Saved $0.9k/mo, improved latency 12%', user: '@arjun', date: '1w ago' },
  ]

  // Time (reliability) items mock data with separation & effort/impact & achieved outcome
  const timeSuggestions = [
    { title: 'orders-db — define p99 latency SLO', kind: 'Observability gap', effort: 'Low effort', impact: 'Medium impact', urgency: 'Medium' },
    { title: 'kafka-broker — address restart loop', kind: 'Workload risk', effort: 'High effort', impact: 'High impact', urgency: 'High' },
  ]
  const timeHistory = [
    { title: 'payments-api — rolled back bad deploy', kind: 'Deployment instability', outcome: 'Restored checkout success rate to 100% in 6m', user: 'Auto-runbook', date: '2h ago' },
    { title: 'edge-ingress — added rate-limit rules', kind: 'Traffic surge', outcome: 'Blocked synthetic retry storm, reclaimed 4.2 eng-hrs', user: '@oncall', date: '1d ago' },
  ]

  // Risk (security) items mock data with separation & effort/impact & achieved outcome
  const riskSuggestions = [
    { title: 'Over-permissive IAM role · ci-deploy', priority: 'This week', effort: 'Low effort', impact: 'High impact' },
    { title: 'Unencrypted S3 bucket · logs-archive', priority: 'Backlog', effort: 'Low effort', impact: 'Medium impact' },
  ]
  const riskHistory = [
    { title: 'Public RDS snapshot · payments-db', priority: 'Immediate', outcome: 'Auto-remediated exposed RDS snapshot in 3m', user: 'Rtifact scanner', date: '2d ago' },
  ]

  return (
    <>
      {aggregating && (
        <div className="agg-banner" style={{ marginBottom: 14 }}>
          <Layers size={14} strokeWidth={2.2} />
          Aggregating {selectedEnvs.length} environments — {selectedEnvs.map((e) => e.name).join(' · ')}
        </div>
      )}

      {/* Overview Sub-navigation Row */}
      <div className="pipeline-tabs" style={{ marginBottom: 18, borderBottom: '1px solid var(--border-default)' }}>
        <button
          className={`pipeline-tab${tab === 'summary' ? ' active' : ''}`}
          onClick={() => setTab('summary')}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <TrendingUp size={13} />
          <span>Summary</span>
        </button>
        <button
          className={`pipeline-tab${tab === 'cost' ? ' active' : ''}`}
          onClick={() => setTab('cost')}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <DollarSign size={13} />
          <span>Cost</span>
        </button>
        <button
          className={`pipeline-tab${tab === 'time' ? ' active' : ''}`}
          onClick={() => setTab('time')}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <Clock size={13} />
          <span>Time</span>
        </button>
        <button
          className={`pipeline-tab${tab === 'risk' ? ' active' : ''}`}
          onClick={() => setTab('risk')}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <ShieldAlert size={13} />
          <span>Risk</span>
        </button>
      </div>

      {tab === 'summary' && (
        <>
          <section className="panel ai-panel">
            <div className="panel-head">
              <span className="ai-tile">
                <Sparkles size={15} strokeWidth={2} />
              </span>
              <span className="eyebrow" style={{ margin: 0, textTransform: 'capitalize' }}>
                Rtifact AI {interval} briefing
              </span>

              <ConfidencePill value={exec.confidence} />
            </div>
            <p className="panel-body-text" style={{ fontSize: 14.5 }}>
              {exec.text}
            </p>
          </section>

          {/* Contribution rollup */}
          <div className="contrib" aria-label="AI contribution rollup">
            <span className="contrib-chip">
              <span className="contrib-k">Protected</span> {formatUsd(rollup.costUsd)} revenue
            </span>
            <span className="contrib-chip">
              <span className="contrib-k">Saved</span> {rollup.engHours} engineer-hours
            </span>
            <span className="contrib-chip">
              <span className="contrib-k">Handled</span> {rollup.incidents} incidents · {rollup.workflows} workflows
            </span>
          </div>

          {/* Exec trend cards */}
          <div className="exec-grid">
            {execCards.map((c) => (
              <div key={c.key} className="exec-card" onClick={() => setTab(c.key as any)} style={{ cursor: 'pointer' }}>
                <div className="exec-head">
                  <span className="exec-label" style={{ color: c.color }}>
                    {c.label}
                  </span>
                  <ChevronRight size={14} className="pillar-go" strokeWidth={2.2} />
                </div>
                <div className="exec-value">{c.value}</div>
                <div className="exec-delta" style={{ color: c.color }}>
                  {c.delta}
                </div>
                <div className="exec-chart">
                  <AreaChart data={c.series as unknown as number[]} stroke={c.color} fill={c.fill} height={92} />
                </div>
                <div className="exec-desc">{c.desc}</div>
                <div className="exec-pillar">{c.pillar}</div>
              </div>
            ))}
          </div>

          <div className="section-label">Optimization goals — {scopeName}</div>
          <OptimizationGoals goals={board.goals} />
        </>
      )}

      {tab === 'cost' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="panel" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
              <span className="eyebrow" style={{ color: 'var(--muted)' }}>Savings trend — lifetime to date</span>
              <span className="mono" style={{ fontSize: 13, fontWeight: 600, color: 'var(--success)' }}>$612k total</span>
            </div>
            <div style={{ height: 150 }}>
              <AreaChart data={[120, 180, 240, 210, 300, 360, 340, 430, 470, 520, 560, 612]} stroke="var(--success)" fill={true} height={150} />
            </div>
          </div>

          <div className="panel" style={{ padding: 22, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>FinOps · projected annualized savings</div>
              <div style={{ fontSize: 40, fontWeight: 300, letterSpacing: '-.02em', color: 'var(--text-primary)' }}>
                $138k<span style={{ fontSize: 18, color: 'var(--faint)' }}>/yr</span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>This month</div>
              <div className="mono" style={{ fontSize: 24, fontWeight: 600, color: 'var(--success)' }}>$11.6k</div>
            </div>
          </div>

          {/* New Suggestions Section */}
          <div className="panel" style={{ padding: '16px 4px' }}>
            <div style={{ padding: '0 18px 12px', fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--muted)' }}>
              New Suggestions · AI Cost recommendations
            </div>
            <div className="row-list" style={{ border: 'none' }}>
              {costSuggestions.map((item, i) => (
                <div key={i} className="row" style={{ borderTop: '1px solid var(--border-subtle)', borderRadius: 0, padding: '12px 18px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1 }}>
                    <span className="mono" style={{ fontSize: 13.5, fontWeight: 500 }}>{item.name}</span>
                    <span style={{ fontSize: 11, color: 'var(--faint)' }}>
                      Estimated effect: <span className="mono text-success">{item.save}</span>
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span className="badge neutral mono" style={{ fontSize: 10, padding: '2px 8px' }}>
                      {item.effort} · {item.impact}
                    </span>
                    <span className="badge sev-healthy mono" style={{ fontSize: 10, fontWeight: 600 }}>
                      {item.tag}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Accepted in Past Section */}
          <div className="panel" style={{ padding: '16px 4px' }}>
            <div style={{ padding: '0 18px 12px', fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--faint)' }}>
              Remediation History · Accepted in Past
            </div>
            <div className="row-list" style={{ border: 'none' }}>
              {costHistory.map((item, i) => (
                <div key={i} className="row" style={{ borderTop: '1px solid var(--border-subtle)', borderRadius: 0, padding: '12px 18px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1 }}>
                    <span className="mono" style={{ fontSize: 13.5, color: 'var(--muted)' }}>{item.name}</span>
                    <span style={{ fontSize: 11, color: 'var(--faint)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Check size={12} className="text-success" /> Outcome: <strong style={{ color: 'var(--text-secondary)' }}>{item.outcome}</strong>
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 11, color: 'var(--faint)' }}>
                      Actioned {item.date} by {item.user}
                    </span>
                    <span className="badge neutral mono" style={{ fontSize: 10 }}>
                      {item.tag}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'time' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="panel" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
              <span className="eyebrow" style={{ color: 'var(--muted)' }}>MTTR trend — lifetime to date</span>
              <span className="mono" style={{ fontSize: 13, fontWeight: 600, color: 'var(--brand)' }}>-54% MTTR</span>
            </div>
            <div style={{ height: 150 }}>
              <AreaChart data={[100, 96, 92, 95, 88, 84, 80, 74, 70, 66, 60, 46]} stroke="var(--brand)" fill={true} height={150} />
            </div>
          </div>

          {/* New Suggestions Section */}
          <div className="panel" style={{ padding: '16px 4px' }}>
            <div style={{ padding: '0 18px 12px', fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--muted)' }}>
              New Suggestions · AI Reliability gaps
            </div>
            <div className="row-list" style={{ border: 'none' }}>
              {timeSuggestions.map((item, i) => (
                <div key={i} className="row" style={{ borderTop: '1px solid var(--border-subtle)', borderRadius: 0, padding: '12px 18px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1 }}>
                    <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{item.title}</span>
                    <span className="mono" style={{ fontSize: 11, color: 'var(--faint)' }}>{item.kind}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span className="badge neutral mono" style={{ fontSize: 10 }}>
                      {item.effort} · {item.impact}
                    </span>
                    <span className={`badge ${item.urgency === 'High' ? 'sev-critical' : 'sev-warning'} mono`} style={{ fontSize: 10, fontWeight: 600 }}>
                      {item.urgency} Urgency
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Accepted in Past Section */}
          <div className="panel" style={{ padding: '16px 4px' }}>
            <div style={{ padding: '0 18px 12px', fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--faint)' }}>
              Reliability History · Accepted in Past
            </div>
            <div className="row-list" style={{ border: 'none' }}>
              {timeHistory.map((item, i) => (
                <div key={i} className="row" style={{ borderTop: '1px solid var(--border-subtle)', borderRadius: 0, padding: '12px 18px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1 }}>
                    <span style={{ fontSize: 14, color: 'var(--muted)' }}>{item.title}</span>
                    <span style={{ fontSize: 11, color: 'var(--faint)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Check size={12} className="text-success" /> Outcome: <strong style={{ color: 'var(--text-secondary)' }}>{item.outcome}</strong>
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 11, color: 'var(--faint)' }}>
                      Resolved {item.date} via {item.user}
                    </span>
                    <span className="badge neutral mono" style={{ fontSize: 10 }}>
                      {item.kind}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'risk' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="panel" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
              <span className="eyebrow" style={{ color: 'var(--muted)' }}>Posture trend — lifetime to date</span>
              <span className="mono" style={{ fontSize: 13, fontWeight: 600, color: 'var(--warn-text)' }}>82% readiness</span>
            </div>
            <div style={{ height: 150 }}>
              <AreaChart data={[40, 44, 52, 48, 60, 58, 66, 70, 68, 74, 78, 82]} stroke="var(--warn-text)" fill={true} height={150} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            <div className="panel" style={{ padding: 18 }}>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>Open findings</div>
              <div style={{ fontSize: 30, fontWeight: 300, color: 'var(--text-primary)' }}>23</div>
            </div>
            <div className="panel" style={{ padding: 18 }}>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>Resources at risk</div>
              <div style={{ fontSize: 30, fontWeight: 300, color: 'var(--text-primary)' }}>7</div>
            </div>
            <div className="panel" style={{ padding: 18, background: 'rgba(239, 68, 68, 0.05)', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>Critical findings</div>
              <div style={{ fontSize: 30, fontWeight: 600, color: 'var(--error)' }}>1</div>
            </div>
          </div>

          {/* New Suggestions Section */}
          <div className="panel" style={{ padding: '16px 4px' }}>
            <div style={{ padding: '0 18px 12px', fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--muted)' }}>
              New Suggestions · Security Exposure
            </div>
            <div className="row-list" style={{ border: 'none' }}>
              {riskSuggestions.map((item, i) => (
                <div key={i} className="row" style={{ borderTop: '1px solid var(--border-subtle)', borderRadius: 0, padding: '12px 18px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1 }}>
                    <span className="mono" style={{ fontSize: 13.5, fontWeight: 500 }}>{item.title}</span>
                    <span style={{ fontSize: 11, color: 'var(--faint)' }}>
                      Resolve priority: <strong style={{ color: 'var(--text-secondary)' }}>{item.priority}</strong>
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span className="badge neutral mono" style={{ fontSize: 10 }}>
                      {item.effort} · {item.impact}
                    </span>
                    <span className="badge sev-warning mono" style={{ fontSize: 10, fontWeight: 600 }}>
                      Open finding
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Accepted in Past Section */}
          <div className="panel" style={{ padding: '16px 4px' }}>
            <div style={{ padding: '0 18px 12px', fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--faint)' }}>
              Remediation History · Accepted in Past
            </div>
            <div className="row-list" style={{ border: 'none' }}>
              {riskHistory.map((item, i) => (
                <div key={i} className="row" style={{ borderTop: '1px solid var(--border-subtle)', borderRadius: 0, padding: '12px 18px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1 }}>
                    <span className="mono" style={{ fontSize: 13.5, color: 'var(--muted)' }}>{item.title}</span>
                    <span style={{ fontSize: 11, color: 'var(--faint)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Check size={12} className="text-success" /> Outcome: <strong style={{ color: 'var(--text-secondary)' }}>{item.outcome}</strong>
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 11, color: 'var(--faint)' }}>
                      Actioned {item.date} by {item.user}
                    </span>
                    <span className="badge sev-healthy mono" style={{ fontSize: 10 }}>
                      Remediated
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
