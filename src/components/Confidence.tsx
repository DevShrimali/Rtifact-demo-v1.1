import { LOW_CONFIDENCE_THRESHOLD } from '../mock/daav'

/* Shared component: AI confidence indicator. The % is data, not decoration —
   always visible (principle #10). Low confidence renders the inline
   why + how-to-improve panel via <LowConfidencePanel>. */
export function ConfidencePill({ value, label = 'confidence' }: { value: number; label?: string }) {
  const low = value < LOW_CONFIDENCE_THRESHOLD
  return (
    <span className={`conf-pill${low ? ' low' : ''}`} title={low ? 'Below confidence threshold' : undefined}>
      <span className="mono">{value}%</span> {label}
    </span>
  )
}

export function LowConfidencePanel({ why, improve }: { why: string[]; improve: string[] }) {
  return (
    <div className="low-conf" role="note">
      <div className="low-conf-title">Why confidence is low</div>
      <ul>
        {why.map((w) => (
          <li key={w}>{w}</li>
        ))}
      </ul>
      <div className="low-conf-title">How to improve it</div>
      <ul>
        {improve.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ul>
    </div>
  )
}
