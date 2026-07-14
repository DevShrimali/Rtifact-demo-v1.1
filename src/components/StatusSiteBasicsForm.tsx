/**
 * Shared site identity fields (name + subdomain) for create and edit flows.
 * Intentionally slim — visibility, branding, and content live in sibling sections.
 */
import type { ReactNode } from 'react'

export interface StatusSiteBasicsValues {
  name: string
  subdomain: string
  logoPointUrl?: string
  contactUrl?: string
  customDomain?: string
}

interface StatusSiteBasicsFieldsProps {
  values: StatusSiteBasicsValues
  onChange: (patch: Partial<StatusSiteBasicsValues>) => void
  /** Extra row after name/subdomain (e.g. visibility) */
  children?: ReactNode
  /** Custom domain + DNS — typically edit-only */
  showCustomDomain?: boolean
}

export function StatusSiteBasicsFields({
  values,
  onChange,
  children,
  showCustomDomain = false,
}: StatusSiteBasicsFieldsProps) {
  const customDomain = values.customDomain ?? ''

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div className="field">
          <span className="field-label">Company name *</span>
          <input
            required
            className="text-input"
            value={values.name}
            placeholder="e.g. Acme Corporation"
            onChange={(e) => onChange({ name: e.target.value })}
          />
        </div>

        <div className="field">
          <span className="field-label">Subdomain *</span>
          <div style={{ display: 'flex', alignItems: 'stretch' }}>
            <input
              required
              className="text-input"
              value={values.subdomain}
              placeholder="acme"
              onChange={(e) => onChange({ subdomain: e.target.value })}
              style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0, flex: 1, minWidth: 0 }}
            />
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '0 12px',
                background: 'var(--chip)',
                border: '1px solid var(--border-strong)',
                borderLeft: 'none',
                borderTopRightRadius: 9,
                borderBottomRightRadius: 9,
                fontSize: 12.5,
                color: 'var(--faint)',
              }}
            >
              .rtifact.io
            </span>
          </div>
        </div>
      </div>

      {children}

      {showCustomDomain && (
        <>
          <div className="field">
            <span className="field-label">Custom domain</span>
            <input
              className="text-input"
              value={customDomain}
              placeholder="status.example.com"
              onChange={(e) => onChange({ customDomain: e.target.value })}
            />
          </div>

          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border-strong)',
              borderRadius: 10,
              padding: 14,
              fontSize: 12.5,
            }}
          >
            <span style={{ fontWeight: 600, display: 'block', marginBottom: 8 }}>DNS CNAME</span>
            <p style={{ color: 'var(--muted)', marginBottom: 10, lineHeight: 1.4 }}>
              Point{' '}
              <span className="mono" style={{ color: 'var(--fg)', fontWeight: 600 }}>
                {customDomain.trim() || 'status.example.com'}
              </span>{' '}
              to Rtifact:
            </p>
            <div
              className="mono"
              style={{
                display: 'grid',
                gridTemplateColumns: '90px 1fr',
                gap: 8,
                padding: '8px 12px',
                background: 'var(--chip)',
                borderRadius: 6,
                fontSize: 11,
              }}
            >
              <span style={{ color: 'var(--faint)' }}>Host</span>
              <span>{customDomain.trim() || 'status.example.com'}</span>
              <span style={{ color: 'var(--faint)' }}>Target</span>
              <span>statuspage.rtifact.io</span>
            </div>
          </div>
        </>
      )}
    </>
  )
}
