/* SVG line chart with an optional compare series and optional vertical
   markers (used by Telemetry Explore compare + Traces deploy overlay, DEV-30).
   Monochrome by default; markers carry severity-neutral accent. */

export interface ChartMarker {
  at: number
  label: string
  kind: 'deploy' | 'config'
}

function path(data: number[], w: number, h: number, min: number, range: number, pad: number) {
  return data
    .map((v, i) => {
      const x = pad + (i / (data.length - 1)) * (w - pad * 2)
      const y = h - pad - ((v - min) / range) * (h - pad * 2)
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
}

export function LineChart({
  data,
  compare,
  markers = [],
  width = 720,
  height = 200,
  stroke = 'var(--brand)',
  unit,
}: {
  data: number[]
  compare?: number[]
  markers?: ChartMarker[]
  width?: number
  height?: number
  stroke?: string
  unit?: string
}) {
  const all = [...data, ...(compare ?? [])]
  const min = Math.min(...all)
  const max = Math.max(...all)
  const range = max - min || 1
  const pad = 8
  const xAt = (i: number) => pad + (i / (data.length - 1)) * (width - pad * 2)

  return (
    <div className="linechart">
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} role="img" aria-label="Time series chart">
        {/* deploy/config markers behind the lines */}
        {markers.map((m) => (
          <g key={m.label}>
            <line
              x1={xAt(m.at)}
              y1={pad}
              x2={xAt(m.at)}
              y2={height - pad}
              stroke="var(--border-strong)"
              strokeWidth="1.4"
              strokeDasharray="4 3"
            />
            <circle cx={xAt(m.at)} cy={pad + 3} r="3.5" fill={m.kind === 'deploy' ? 'var(--brand)' : 'var(--warn)'} />
          </g>
        ))}
        {compare && (
          <path d={path(compare, width, height, min, range, pad)} fill="none" stroke="var(--faint)" strokeWidth="1.6" strokeDasharray="5 4" />
        )}
        <path d={path(data, width, height, min, range, pad)} fill="none" stroke={stroke} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>

      {(unit || markers.length > 0 || compare) && (
        <div className="linechart-legend">
          {unit && <span className="mono linechart-unit">{unit}</span>}
          {compare && (
            <span className="linechart-key">
              <span className="linechart-swatch dashed" /> previous period
            </span>
          )}
          {markers.map((m) => (
            <span key={m.label} className="linechart-key">
              <span className={`linechart-swatch ${m.kind}`} /> {m.label}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
