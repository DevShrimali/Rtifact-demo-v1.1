import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Bell, ChevronDown, Play, Sparkles } from 'lucide-react'
import {
  dashboards,
  exploreSample,
  METRIC_CATEGORIES,
  PROMQL_SUGGESTIONS,
} from '../../mock/telemetry'
import type { MetricCategory } from '../../mock/telemetry'
import { Sparkline } from '../../components/Sparkline'
import { LineChart } from '../../components/LineChart'
import { useAskAI } from '../../components/AskAI'
import { useEnvLoad } from '../../components/PageLoad'

/* Screen 14 + DEV-30 upgrade — Metrics as a dashboard system with an Explore
   mode. Dashboard selector, Create, New-with-AI and Save are solid, always-
   visible controls (never ghosted). Explore accepts a visual builder or raw
   PromQL, runs, and compares with the previous period. */
export function MetricsPage() {
  const { setOpen } = useAskAI()
  const [searchParams] = useSearchParams()
  const forcedState = searchParams.get('state')
  const [mode, setMode] = useState<'dashboards' | 'explore'>('dashboards')
  const [category, setCategory] = useState<MetricCategory>('Kubernetes')
  const envLoading = useEnvLoad()
  const loading = envLoading || forcedState === 'loading'

  const charts = dashboards[category]

  if (forcedState === 'error') {
    return (
      <div className="error-panel" role="alert">
        <div className="error-title">Metrics pipeline unavailable</div>
        <div className="error-sub">The metrics ingestion pipeline is temporarily offline or unreachable.</div>
      </div>
    )
  }

  if (forcedState === 'empty') {
    return (
      <div className="placeholder-panel">
        No metrics data collected yet.
        <span className="mono">connect a metrics source to start building dashboards</span>
        <div style={{ marginTop: 14 }}>
          <button className="btn btn-primary">Connect metrics source</button>
        </div>
      </div>
    )
  }

  const totalPanels = charts.length * 2

  // Helpers
  const formatChartTitle = (title: string): { service: string; metric: string } => {
    const lower = title.toLowerCase()
    if (lower.startsWith('checkout-svc')) {
      return { service: 'checkout-svc', metric: title.substring(13) }
    }
    if (lower.startsWith('payments-api')) {
      return { service: 'payments-api', metric: title.substring(13) }
    }
    if (lower.startsWith('orders-db')) {
      return { service: 'orders-db', metric: title.substring(10) }
    }
    if (lower.startsWith('k8s-')) {
      return { service: 'k8s', metric: title.substring(4) }
    }
    if (lower.startsWith('cluster')) {
      return { service: 'cluster', metric: title.substring(8) }
    }
    if (lower.startsWith('gateway')) {
      return { service: 'gateway', metric: title.substring(8) }
    }
    const parts = title.split(' ')
    return { service: parts[0].toLowerCase(), metric: parts.slice(1).join(' ') }
  }

  const getFooterText = (chartId: string): string => {
    if (chartId === 'db-pool') return 'Approaching pool limit'
    return 'Nominal'
  }

  return (
    <>
      {/* Subnav & Scope toolbar layout from screenshot */}
      <div className="telemetry-sub-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div className="pipeline-tabs" style={{ marginBottom: 0 }}>
          <button
            className={`pipeline-tab${mode === 'dashboards' ? ' active' : ''}`}
            onClick={() => setMode('dashboards')}
          >
            Dashboards
          </button>
          <button
            className={`pipeline-tab${mode === 'explore' ? ' active' : ''}`}
            onClick={() => setMode('explore')}
          >
            Explore
          </button>
          <button
            className="pipeline-tab"
            style={{ display: 'flex', alignItems: 'center', gap: 4 }}
            onClick={() => {
              setMode('dashboards')
              setCategory('Services')
            }}
          >
            <span>Golden Signals</span>
            <ChevronDown size={12} strokeWidth={2.2} />
          </button>
        </div>

        <div className="scope-row" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="scope-label" style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--faint)', textTransform: 'uppercase', letterSpacing: '0.08em', marginRight: 4 }}>
            SCOPE
          </span>
          {METRIC_CATEGORIES.map((c) => (
            <button
              key={c}
              className={`scope-pill${c === category ? ' active' : ''}`}
              onClick={() => {
                setCategory(c)
                setMode('dashboards')
              }}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {mode === 'explore' ? (
        <ExploreSurface />
      ) : (
        <div className="metrics-layout-redesign">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ color: 'var(--muted)', fontSize: 11.5 }}>
              {totalPanels} panels · Latency · Traffic · Errors · Saturation across all services
            </div>
            <div className="metrics-actions-minimal" style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-secondary" style={{ fontSize: 11.5, padding: '5px 10px' }} onClick={() => setOpen(true)}>
                <Sparkles size={12} strokeWidth={2.2} />
                Refine with AI
              </button>
              <button className="btn btn-primary" style={{ fontSize: 11.5, padding: '5px 10px' }}>
                <Bell size={12} strokeWidth={2.2} />
                Create alert
              </button>
            </div>
          </div>

          {loading ? (
            <div className="charts-grid">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="panel chart-card" aria-busy="true">
                  <span className="skeleton skeleton-text" style={{ width: '50%' }} />
                  <span className="skeleton" style={{ width: '100%', height: 48, display: 'block', marginTop: 10 }} />
                </div>
              ))}
            </div>
          ) : charts.length === 0 ? (
            <div className="placeholder-panel">
              No dashboards in {category} yet.
              <span className="mono">connect a cost source or create the first dashboard</span>
              <div style={{ marginTop: 14 }}>
                <button className="btn btn-primary">Create {category} dashboard</button>
              </div>
            </div>
          ) : (
            <>
              <div className="charts-grid">
                {charts.map((chart) => {
                  const { service, metric } = formatChartTitle(chart.title)
                  return (
                    <div key={chart.id} className="panel chart-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 120 }}>
                      <div>
                        <div className="chart-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--fg)' }}>{service}</span>
                            <span style={{ fontSize: 13, color: 'var(--muted)' }}>·</span>
                            <span style={{ fontSize: 13, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>{metric}</span>
                          </div>
                          <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--fg)', fontFamily: 'var(--font-mono)' }}>{chart.current}</span>
                        </div>
                        <div className="chart-sparkline-wrap" style={{ position: 'relative', overflow: 'hidden', padding: '4px 0', height: 48 }}>
                          <Sparkline data={chart.series} width={520} height={48} stroke={chart.anomaly ? 'var(--warn)' : 'var(--muted)'} />
                        </div>
                      </div>
                      
                      {chart.anomaly ? (
                        <div className="telemetry-ai-box">
                          <span className="telemetry-ai-dot" />
                          <span>AI: {chart.anomaly.text}</span>
                        </div>
                      ) : (
                        <div className="telemetry-card-footer-text" style={{ fontSize: 11, color: 'var(--faint)', marginTop: 4 }}>
                          {getFooterText(chart.id)}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* OPERATIONAL METRICS · DERIVED Section */}
              <div className="derived-metrics-section">
                <div className="derived-metrics-title">OPERATIONAL METRICS · DERIVED</div>
                <div className="derived-metrics-grid">
                  <div className="derived-metric-card">
                    <div className="derived-metric-head">
                      <span className="derived-metric-dot danger" />
                      <span>Error budget burn</span>
                    </div>
                    <div className="derived-metric-value">9.1×</div>
                    <div className="derived-metric-desc">payments SLO · 14h to exhaust</div>
                  </div>

                  <div className="derived-metric-card">
                    <div className="derived-metric-head">
                      <span className="derived-metric-dot warn" />
                      <span>Deployment risk</span>
                    </div>
                    <div className="derived-metric-value">72</div>
                    <div className="derived-metric-desc">v2.34.1 · elevated</div>
                  </div>

                  <div className="derived-metric-card">
                    <div className="derived-metric-head">
                      <span className="derived-metric-dot warn" />
                      <span>Saturation index</span>
                    </div>
                    <div className="derived-metric-value">0.88</div>
                    <div className="derived-metric-desc">orders-db pool</div>
                  </div>

                  <div className="derived-metric-card">
                    <div className="derived-metric-head">
                      <span className="derived-metric-dot success" />
                      <span>MTTR trend</span>
                    </div>
                    <div className="derived-metric-value">22m</div>
                    <div className="derived-metric-desc">-18% vs 30d</div>
                  </div>

                  <div className="derived-metric-card">
                    <div className="derived-metric-head">
                      <span className="derived-metric-dot warn" />
                      <span>SLO consumption</span>
                    </div>
                    <div className="derived-metric-value">61%</div>
                    <div className="derived-metric-desc">this 30d window</div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  )
}

/* Explore — visual builder OR raw PromQL, Run, Compare-with-previous. */
function ExploreSurface() {
  const [tab, setTab] = useState<'visual' | 'promql'>('visual')
  const [promql, setPromql] = useState(exploreSample.query)
  const [metric, setMetric] = useState('http_requests_total')
  const [agg, setAgg] = useState('rate 5m')
  const [groupBy, setGroupBy] = useState('service')
  const [compare, setCompare] = useState(false)
  const [ran, setRan] = useState(true)

  const run = () => setRan(true)

  return (
    <section className="panel">
      <div className="pipeline-tabs" role="tablist" aria-label="Query mode" style={{ marginBottom: 12 }}>
        <button role="tab" aria-selected={tab === 'visual'} className={`pipeline-tab${tab === 'visual' ? ' active' : ''}`} onClick={() => setTab('visual')}>
          Visual builder
        </button>
        <button role="tab" aria-selected={tab === 'promql'} className={`pipeline-tab${tab === 'promql' ? ' active' : ''}`} onClick={() => setTab('promql')}>
          PromQL
        </button>
      </div>

      {tab === 'visual' ? (
        <div className="explore-builder">
          <label className="explore-field">
            <span className="field-label">Metric</span>
            <select className="text-input select" value={metric} onChange={(e) => setMetric(e.target.value)}>
              {PROMQL_SUGGESTIONS.map((s) => (
                <option key={s} value={s.split('(')[0]}>{s.split('(')[0]}</option>
              ))}
              <option value="http_requests_total">http_requests_total</option>
            </select>
          </label>
          <label className="explore-field">
            <span className="field-label">Aggregation</span>
            <select className="text-input select" value={agg} onChange={(e) => setAgg(e.target.value)}>
              <option>rate 5m</option>
              <option>increase 1h</option>
              <option>avg</option>
              <option>p99</option>
            </select>
          </label>
          <label className="explore-field">
            <span className="field-label">Group by</span>
            <select className="text-input select" value={groupBy} onChange={(e) => setGroupBy(e.target.value)}>
              <option>service</option>
              <option>pod</option>
              <option>status</option>
              <option>region</option>
            </select>
          </label>
          <button className="btn btn-primary explore-run" onClick={run}>
            <Play size={14} strokeWidth={2.2} />
            Run
          </button>
        </div>
      ) : (
        <div className="explore-promql">
          <textarea
            className="text-input mono"
            rows={2}
            value={promql}
            onChange={(e) => setPromql(e.target.value)}
            aria-label="PromQL query"
          />
          <button className="btn btn-primary explore-run" onClick={run}>
            <Play size={14} strokeWidth={2.2} />
            Run
          </button>
        </div>
      )}

      <div className="explore-controls">
        <label className="explore-compare">
          <input type="checkbox" checked={compare} onChange={(e) => setCompare(e.target.checked)} />
          Compare with previous period
        </label>
      </div>

      {ran && (
        <>
          <LineChart
            data={exploreSample.current}
            compare={compare ? exploreSample.previous : undefined}
            unit={exploreSample.unit}
            stroke="var(--brand)"
          />
          <div className="section-label">Breakdown by {groupBy}</div>
          <div className="row-list">
            {exploreSample.breakdown.map((b) => (
              <div key={b.label} className="row">
                <span className="mono row-title">{b.label}</span>
                <span className="corr-bar" style={{ maxWidth: 200 }}>
                  <span className="corr-fill" style={{ width: `${b.pct}%` }} />
                </span>
                <span className="mono pod-stat">{b.value}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  )
}
