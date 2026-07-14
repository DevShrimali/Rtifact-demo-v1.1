import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ArrowRight, Plus, Search } from 'lucide-react'
import { flowAnomalies, traceLatency, traceLayers, traceStats, TRACE_FILTER_FIELDS } from '../../mock/telemetry'
import { ConfidencePill } from '../../components/Confidence'
import { LineChart } from '../../components/LineChart'
import { useEnv } from '../../state/env'

/* Screen 16 — Traces: distributed health stats, layered service map
   (Ingress → Core → App → Dependencies), AI Flow Anomalies below. */
export function TracesPage() {
  const { env } = useEnv()
  const [searchParams] = useSearchParams()
  const forcedState = searchParams.get('state')
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<{ field: string; value: string }[]>([
    { field: 'status', value: 'error' },
  ])
  const [field, setField] = useState<string>(TRACE_FILTER_FIELDS[0])
  const [value, setValue] = useState('')

  useEffect(() => {
    setLoading(true)
    const t = setTimeout(() => setLoading(false), 550)
    return () => clearTimeout(t)
  }, [env.id])

  const addFilter = () => {
    if (!value.trim()) return
    setFilters((f) => [...f, { field, value: value.trim() }])
    setValue('')
  }

  if (forcedState === 'error') {
    return (
      <div className="error-panel" role="alert">
        <div className="error-title">Tracing pipeline unavailable</div>
        <div className="error-sub">The distributed tracing backend is temporarily offline.</div>
      </div>
    )
  }

  if (forcedState === 'empty') {
    return (
      <div className="placeholder-panel">
        No trace data found.
        <span className="mono">instrument your services with OpenTelemetry to see traces here</span>
      </div>
    )
  }

  if (loading || forcedState === 'loading') {
    return (
      <div className="panel" aria-busy="true">
        <span className="skeleton skeleton-text" style={{ width: '35%' }} />
        <span className="skeleton" style={{ width: '100%', height: 200, display: 'block', marginTop: 12 }} />
      </div>
    )
  }

  return (
    <>
      {/* query / filter builder (DEV-30) — kept simple-first above the map */}
      <div className="trace-query">
        <div className="trace-query-row">
          <select className="text-input select" value={field} onChange={(e) => setField(e.target.value)} aria-label="Filter field">
            {TRACE_FILTER_FIELDS.map((f) => (
              <option key={f}>{f}</option>
            ))}
          </select>
          <input
            className="text-input"
            style={{ flex: 1 }}
            placeholder="value — e.g. checkout-svc, >500ms"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addFilter()}
            aria-label="Filter value"
          />
          <button className="btn btn-secondary" onClick={addFilter}>
            <Plus size={14} strokeWidth={2.2} />
            Add filter
          </button>
        </div>
        {filters.length > 0 && (
          <div className="trace-filter-chips">
            {filters.map((f, i) => (
              <button
                key={`${f.field}-${i}`}
                className="badge neutral mono trace-chip"
                onClick={() => setFilters((prev) => prev.filter((_, j) => j !== i))}
                title="Remove filter"
              >
                {f.field}: {f.value} ✕
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="stats-bar" style={{ marginBottom: 14 }}>
        {traceStats.map((s) => (
          <div key={s.label} className="stats-bar-item">
            <span className="stat-label">{s.label}</span>
            <span className="mono stats-bar-value">{s.value}</span>
          </div>
        ))}
      </div>

      {/* latency-change overlay with deploy/config markers (Karan's spec) */}
      <section className="panel">
        <div className="panel-title">p99 latency — with deploy &amp; config markers</div>
        <LineChart
          data={traceLatency.series}
          markers={traceLatency.markers}
          unit={traceLatency.unit}
          stroke="var(--warn)"
        />
      </section>

      <section className="panel">
        <div className="panel-title">Distributed service map</div>
        <div className="trace-map">
          {traceLayers.map((layer, i) => (
            <div key={layer.name} style={{ display: 'contents' }}>
              <div className="trace-layer">
                <div className="trace-layer-name">{layer.name}</div>
                {layer.nodes.map((n) => (
                  <button key={n.id} className="trace-node">
                    <span className={`dot ${n.health}`} />
                    <span className="mono">{n.id}</span>
                  </button>
                ))}
              </div>
              {i < traceLayers.length - 1 && (
                <ArrowRight size={16} strokeWidth={2} className="trace-arrow" aria-hidden />
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-title">AI flow anomalies</div>
        {flowAnomalies.map((a) => (
          <div key={a.id} className="flow-row">
            <span className="mono row-id">{a.id}</span>
            <div className="flow-info">
              <span className="mono flow-path">{a.path}</span>
              <span className="flow-finding">{a.finding}</span>
            </div>
            <span className="mono flow-latency">{a.latencyShare}</span>
            <ConfidencePill value={a.confidence} />
            <button className="btn btn-secondary" style={{ height: 28 }}>
              <Search size={12} strokeWidth={2.2} />
              Investigate
            </button>
          </div>
        ))}
      </section>
    </>
  )
}
