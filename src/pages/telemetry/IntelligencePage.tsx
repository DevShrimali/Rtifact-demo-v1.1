import { useRef, useState, useCallback, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { PlugZap, ChevronUp, ChevronDown } from 'lucide-react'
import type { GraphNode } from '../../mock/telemetry'
import { graphEdges, graphNodes, intelligenceStats } from '../../mock/telemetry'
import { useEnv } from '../../state/env'

/* ── helpers ──────────────────────────────────────────────────────────────── */
function nodeRadius(rps: number) { return 8 + Math.sqrt(rps) / 9 }

function ringColor(errorPct: number) {
  if (errorPct >= 2) return 'var(--error)'
  if (errorPct >= 0.5) return 'var(--warn)'
  return 'var(--success)'
}

function fmtRps(r: number) { return r >= 1000 ? `${(r / 1000).toFixed(1)}k` : String(r) }
function fmtMs(ms: number) { return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms` }

/* ── Cursor-following tooltip ─────────────────────────────────────────────── */
interface TooltipProps {
  node: GraphNode
  cursor: { x: number; y: number }
}

function NodeTooltip({ node, cursor }: TooltipProps) {
  const TIP_W = 224
  const OFFSET_X = 18
  const OFFSET_Y = -12

  /* flip left when near right viewport edge */
  const left = cursor.x + OFFSET_X + TIP_W > window.innerWidth
    ? cursor.x - TIP_W - OFFSET_X
    : cursor.x + OFFSET_X

  /* flip up when near bottom edge */
  const estimatedH = 158
  const top = cursor.y + OFFSET_Y + estimatedH > window.innerHeight
    ? cursor.y - estimatedH - OFFSET_Y
    : cursor.y + OFFSET_Y

  const statusColor = node.errorPct >= 2 ? 'var(--error)' : node.errorPct >= 0.5 ? 'var(--warn)' : 'var(--success)'
  const statusLabel = node.errorPct >= 2 ? 'Critical'   : node.errorPct >= 0.5 ? 'Degraded'   : 'Healthy'

  return (
    <div className="dep-tooltip" style={{ left, top, width: TIP_W }}>
      <div className="dep-tip-head">
        <span className="dep-tip-name">{node.label}</span>
        <span className="badge" style={{ background: statusColor, color: '#fff', fontSize: 10, padding: '2px 8px', flexShrink: 0 }}>
          {statusLabel}
        </span>
      </div>
      <p className="dep-tip-desc">{node.desc}</p>
      <div className="dep-tip-grid">
        <span className="dep-tip-k">Requests/s</span>
        <span className="dep-tip-v">{fmtRps(node.rps)}</span>
        <span className="dep-tip-k">Error rate</span>
        <span className="dep-tip-v" style={{ color: statusColor }}>{node.errorPct}%</span>
        <span className="dep-tip-k">p99 latency</span>
        <span className="dep-tip-v" style={{ color: node.highP99 ? 'var(--warn)' : 'var(--fg)' }}>
          {fmtMs(node.p99Ms)}{node.highP99 ? ' ⚠' : ''}
        </span>
      </div>
    </div>
  )
}


export function IntelligencePage() {
  const { env } = useEnv()
  const [searchParams] = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    setLoading(true)
    const t = setTimeout(() => setLoading(false), 550)
    return () => clearTimeout(t)
  }, [env.id])

  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 810, height: 370 })

  useEffect(() => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    setDimensions({ width: rect.width || 810, height: 370 })

    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        if (entry.contentRect.width) {
          setDimensions({ width: entry.contentRect.width, height: 370 })
        }
      }
    })
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  /* ── node positions (draggable) ── */
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>(() =>
    Object.fromEntries(graphNodes.map((n) => [n.id, { x: n.x, y: n.y }]))
  )

  useEffect(() => {
    setPositions(
      Object.fromEntries(
        graphNodes.map((n) => [
          n.id,
          {
            x: (n.x / 810) * dimensions.width,
            y: (n.y / 370) * dimensions.height,
          },
        ])
      )
    )
  }, [dimensions.width, dimensions.height])

  /* ── hover + cursor-following tooltip ── */
  const [hovered, setHovered] = useState<string | null>(null)
  const [cursor, setCursor] = useState({ x: 0, y: 0 })
  const svgRef = useRef<SVGSVGElement>(null)

  /* ── drag logic ── */
  const dragging = useRef<{ id: string; ox: number; oy: number } | null>(null)

  const onPointerDown = useCallback((e: React.PointerEvent<SVGGElement>, id: string) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    const rect = svgRef.current!.getBoundingClientRect()
    const scaleX = dimensions.width / rect.width
    const scaleY = dimensions.height / rect.height
    const svgX = (e.clientX - rect.left) * scaleX
    const svgY = (e.clientY - rect.top) * scaleY
    dragging.current = { id, ox: svgX - positions[id].x, oy: svgY - positions[id].y }
    setHovered(null)
  }, [positions, dimensions])

  const onPointerMove = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    /* update cursor for tooltip */
    setCursor({ x: e.clientX, y: e.clientY })
    if (!dragging.current) return
    const rect = svgRef.current!.getBoundingClientRect()
    const scaleX = dimensions.width / rect.width
    const scaleY = dimensions.height / rect.height
    const svgX = (e.clientX - rect.left) * scaleX
    const svgY = (e.clientY - rect.top) * scaleY
    const { id, ox, oy } = dragging.current
    setPositions((prev) => ({
      ...prev,
      [id]: {
        x: Math.max(20, Math.min(dimensions.width - 20, svgX - ox)),
        y: Math.max(20, Math.min(dimensions.height - 20, svgY - oy)),
      },
    }))
  }, [dimensions])

  const onPointerUp = useCallback(() => {
    dragging.current = null
  }, [])

  /* ── empty / loading / error states ── */
  if (searchParams.get('state') === 'error') {
    return (
      <div className="error-panel" role="alert">
        <div className="error-title">Intelligence pipeline unavailable</div>
        <div className="error-sub">Unable to build the service graph. Check your telemetry connections.</div>
      </div>
    )
  }

  if (searchParams.get('state') === 'empty') {
    return (
      <div className="placeholder-panel" style={{ padding: 44 }}>
        <PlugZap size={24} strokeWidth={1.8} style={{ color: 'var(--faint)', marginBottom: 8 }} />
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--fg)', marginBottom: 4 }}>
          No services discovered in {env.name}
        </div>
        The dependency graph draws itself from your telemetry — connect a metrics or tracing source
        and it appears here within minutes.
        <div style={{ marginTop: 14 }}>
          <Link to="/settings/connections?tab=monitoring" className="btn btn-primary">
            <PlugZap size={14} strokeWidth={2.2} />
            Connect telemetry source
          </Link>
        </div>
      </div>
    )
  }

  if (loading || searchParams.get('state') === 'loading') {
    return (
      <div className="panel" aria-busy="true">
        <span className="skeleton" style={{ width: '100%', height: 370, display: 'block' }} />
      </div>
    )
  }

  const hoveredNode = hovered ? graphNodes.find((n) => n.id === hovered) ?? null : null

  return (
    <>
      <section ref={containerRef} className="panel" style={{ padding: 0, overflow: 'visible', position: 'relative' }}>
        <div className="graph-toolbar">
          <span className="panel-title" style={{ margin: 0 }}>
            Service dependency graph
          </span>
          <div className="graph-legend">
            <span className="legend-item">size = request rate</span>
            <span className="legend-item">
              ring = error % (<span className="dot healthy" style={{ display: 'inline-block' }} />{' '}
              <span className="dot degraded" style={{ display: 'inline-block' }} />{' '}
              <span className="dot critical" style={{ display: 'inline-block', animation: 'none' }} />)
            </span>
            <span className="legend-item">dashed = high p99</span>
            <span className="legend-item" style={{ color: 'var(--faint)', fontStyle: 'italic' }}>drag to rearrange</span>
          </div>

          <button
            className="graph-collapse-btn"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? 'Expand graph' : 'Collapse graph'}
            title={collapsed ? 'Expand' : 'Collapse'}
          >
            {collapsed ? <ChevronDown size={14} strokeWidth={2.2} /> : <ChevronUp size={14} strokeWidth={2.2} />}
          </button>
        </div>

        <svg
          ref={svgRef}
          viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
          className={`dep-graph${collapsed ? ' dep-graph--collapsed' : ''}`}
          role="img"
          aria-label="Service dependency graph"
          style={{ cursor: dragging.current ? 'grabbing' : 'default' }}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        >
          {/* ── grid background ── */}
          <defs>
            <pattern id="dep-grid" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
              <circle cx="1.5" cy="1.5" r="1" fill="var(--fg)" opacity="0.08" />
            </pattern>
          </defs>
          <rect width={dimensions.width} height={dimensions.height} fill="url(#dep-grid)" />

          {/* edges — re-render live as nodes are dragged */}
          {graphEdges.map((e) => {
            const a = positions[e.from]
            const b = positions[e.to]
            return (
              <line
                key={`${e.from}-${e.to}`}
                x1={a.x} y1={a.y}
                x2={b.x} y2={b.y}
                stroke="var(--border-strong)"
                strokeWidth="1.4"
              />
            )
          })}


          {/* nodes */}
          {graphNodes.map((n) => {
            const pos = positions[n.id]
            const r = nodeRadius(n.rps)
            const isHovered = hovered === n.id
            return (
              <g
                key={n.id}
                className="dep-node"
                tabIndex={0}
                aria-label={`${n.label}: ${n.rps} rps, ${n.errorPct}% errors`}
                style={{ cursor: 'grab' }}
                onPointerDown={(e) => onPointerDown(e, n.id)}
                onPointerEnter={() => { if (!dragging.current) setHovered(n.id) }}
                onPointerLeave={() => setHovered(null)}
              >
                {/* outer dashed ring for high p99 */}
                {n.highP99 && (
                  <circle
                    cx={pos.x} cy={pos.y} r={r + 7}
                    fill="none"
                    stroke={isHovered ? 'var(--fg)' : 'var(--faint)'}
                    strokeWidth="1.4"
                    strokeDasharray="4 4"
                  />
                )}
                {/* hover glow ring */}
                {isHovered && (
                  <circle
                    cx={pos.x} cy={pos.y} r={r + (n.highP99 ? 13 : 6)}
                    fill="none"
                    stroke={ringColor(n.errorPct)}
                    strokeWidth="1"
                    opacity="0.3"
                  />
                )}
                {/* main node circle */}
                <circle
                  cx={pos.x} cy={pos.y} r={r}
                  fill={isHovered ? 'var(--surface)' : 'var(--chip)'}
                  stroke={ringColor(n.errorPct)}
                  strokeWidth={isHovered ? 3 : 2.4}
                  style={{ transition: 'stroke-width 0.12s, fill 0.12s' }}
                />
                {/* RPS label inside */}
                <text x={pos.x} y={pos.y + 3} textAnchor="middle" className="dep-rps">
                  {fmtRps(n.rps)}
                </text>
                {/* service name below */}
                <text x={pos.x} y={pos.y + r + 12} textAnchor="middle" className="dep-label">
                  {n.label}
                </text>
              </g>
            )
          })}
        </svg>

        {/* Cursor-following tooltip — rendered outside SVG via fixed position */}
        {hoveredNode && !dragging.current && (
          <NodeTooltip node={hoveredNode} cursor={cursor} />
        )}
      </section>

      {/* bottom stats bar */}
      <div className="stats-bar">
        {intelligenceStats.map((s) => (
          <div key={s.label} className="stats-bar-item">
            <span className="stat-label">{s.label}</span>
            <span className="mono stats-bar-value">{s.value}</span>
          </div>
        ))}
      </div>
    </>
  )
}
