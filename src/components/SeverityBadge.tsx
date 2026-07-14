import type { Severity } from '../mock/alerts'

/* Shared component (inventory component list): Critical/High/Medium/Low,
   color-semantic only — red/amber for signal, monochrome for low. */
const SEVERITY_STYLE: Record<Severity, { label: string; cls: string }> = {
  critical: { label: 'Critical', cls: 'sev-critical' },
  high: { label: 'High', cls: 'sev-warning' },
  medium: { label: 'Medium', cls: 'sev-warning' },
  low: { label: 'Low', cls: 'neutral' },
}

export function SeverityBadge({ severity }: { severity: Severity }) {
  const s = SEVERITY_STYLE[severity]
  return <span className={`badge ${s.cls}`}>{s.label}</span>
}
