/**
 * Status page type — Public / Customer / Internal as a compact segment,
 * with a short description for the selected option.
 */
import { Globe, Lock, Users } from 'lucide-react'
import type { StatusSite } from '../mock/support'

export const VISIBILITY_OPTIONS: {
  value: StatusSite['visibility']
  label: string
  blurb: string
  icon: typeof Globe
}[] = [
  {
    value: 'public',
    label: 'Public',
    blurb: 'Communicate real-time status updates publicly to all your users.',
    icon: Globe,
  },
  {
    value: 'customer',
    label: 'Customer',
    blurb: 'Securely provide private status updates to each of your customers.',
    icon: Users,
  },
  {
    value: 'internal',
    label: 'Internal',
    blurb: 'Share status updates with internal employees — only accessible to Rtifact users.',
    icon: Lock,
  },
]

export const VISIBILITY_LABEL: Record<StatusSite['visibility'], string> = {
  public: 'Public',
  customer: 'Customer',
  internal: 'Internal',
}

interface SiteVisibilityPickerProps {
  value: StatusSite['visibility']
  onChange: (v: StatusSite['visibility']) => void
}

export function SiteVisibilityPicker({ value, onChange }: SiteVisibilityPickerProps) {
  const active = VISIBILITY_OPTIONS.find((o) => o.value === value) ?? VISIBILITY_OPTIONS[0]

  return (
    <div className="field">
      <span className="field-label">Page type</span>
      <div className="group-switcher-segment" style={{ width: '100%' }}>
        {VISIBILITY_OPTIONS.map((opt) => {
          const Icon = opt.icon
          const selected = value === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              className={`segment-btn${selected ? ' active' : ''}`}
              style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              onClick={() => onChange(opt.value)}
            >
              <Icon size={13} strokeWidth={2.2} />
              {opt.label}
            </button>
          )
        })}
      </div>
      <p style={{ margin: '6px 0 0', fontSize: 11.5, color: 'var(--muted)', lineHeight: 1.4 }}>
        {active.blurb}
      </p>
    </div>
  )
}
