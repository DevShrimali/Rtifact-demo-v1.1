/**
 * Template, theme, monitor detail level, logo & favicon — shared by the
 * create (SitesPage) and edit (SiteDetailPage) status site flows.
 */
import type { PublicPageConfig, StatusTemplate } from '../mock/support'
import { Select } from './Select'
import { ImageUploadField } from './ImageUploadField'

const TEMPLATE_OPTIONS: { value: StatusTemplate; label: string; blurb: string }[] = [
  { value: 'minimal', label: 'Minimal', blurb: 'Clean status banner' },
  { value: 'banner', label: 'Banner', blurb: 'Centered headline' },
  { value: 'dashboard', label: 'Dashboard', blurb: 'Dense service grid' },
  { value: 'grouped', label: 'Grouped', blurb: 'Collapsible groups' },
]

function TemplateThumbnail({ template }: { template: StatusTemplate }) {
  const base: React.CSSProperties = {
    height: 36,
    background: 'var(--border)',
    borderRadius: 5,
    padding: 5,
    overflow: 'hidden',
    boxSizing: 'border-box',
  }

  if (template === 'minimal') {
    return (
      <div style={{ ...base, display: 'flex', flexDirection: 'column', gap: 3 }}>
        <div style={{ height: 4, width: '30%', background: 'var(--border-strong)', borderRadius: 2 }} />
        <div style={{ height: 8, background: 'var(--success-soft)', border: '1px solid var(--success)', borderRadius: 2, boxSizing: 'border-box' }} />
        <div style={{ height: 4, width: '75%', background: 'var(--border-strong)', borderRadius: 2 }} />
      </div>
    )
  }
  if (template === 'banner') {
    return (
      <div style={{ ...base, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--success)', flexShrink: 0 }} />
        <div style={{ height: 4, width: '50%', background: 'var(--border-strong)', borderRadius: 2 }} />
      </div>
    )
  }
  if (template === 'dashboard') {
    return (
      <div style={{ ...base, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} style={{ background: 'var(--border-strong)', borderRadius: 2 }} />
        ))}
      </div>
    )
  }
  return (
    <div style={{ ...base, display: 'flex', flexDirection: 'column', gap: 3 }}>
      <div style={{ height: 6, width: '85%', background: 'var(--border-strong)', borderRadius: 2 }} />
      <div style={{ height: 5, width: '65%', marginLeft: 6, background: 'var(--success-soft)', border: '1px solid var(--success)', borderRadius: 2, boxSizing: 'border-box' }} />
      <div style={{ height: 5, width: '65%', marginLeft: 6, background: 'var(--success-soft)', border: '1px solid var(--success)', borderRadius: 2, boxSizing: 'border-box' }} />
    </div>
  )
}

interface PublicPageBrandingFieldsProps {
  config: PublicPageConfig
  onChange: (patch: Partial<PublicPageConfig>) => void
  /** When false, hide logo/favicon (e.g. shown in another section) */
  showAssets?: boolean
}

export function PublicPageBrandingFields({ config, onChange, showAssets = true }: PublicPageBrandingFieldsProps) {
  return (
    <>
      <div className="field">
        <span className="field-label">Template</span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 8 }} className="template-picker-grid">
          {TEMPLATE_OPTIONS.map((t) => {
            const active = config.template === t.value
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => onChange({ template: t.value })}
                style={{
                  border: `1.5px solid ${active ? 'var(--brand)' : 'var(--border-strong)'}`,
                  borderRadius: 8,
                  padding: 10,
                  cursor: 'pointer',
                  background: active ? 'var(--brand-soft)' : 'var(--surface)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  textAlign: 'left',
                  transition: 'border-color 0.12s ease, background 0.12s ease',
                  color: 'inherit',
                  font: 'inherit',
                }}
              >
                <span style={{ fontSize: 12.5, fontWeight: 650 }}>{t.label}</span>
                <span style={{ fontSize: 10.5, color: 'var(--muted)', lineHeight: 1.3 }}>{t.blurb}</span>
                <TemplateThumbnail template={t.value} />
              </button>
            )
          })}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div className="field">
          <span className="field-label">Color theme</span>
          <Select
            value={config.theme}
            onValueChange={(v) => onChange({ theme: v as PublicPageConfig['theme'] })}
            options={[
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
              { value: 'system', label: 'Auto (match visitor)' },
            ]}
          />
        </div>

        <div className="field">
          <span className="field-label">Monitor detail</span>
          <Select
            value={config.monitorDetailLevel}
            onValueChange={(v) => onChange({ monitorDetailLevel: v as PublicPageConfig['monitorDetailLevel'] })}
            options={[
              { value: 'tick', label: 'Simple tick' },
              { value: 'timeline', label: '90-day timeline' },
              { value: 'hover', label: 'Timeline + hover' },
            ]}
          />
        </div>
      </div>

      {showAssets && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div className="field">
            <span className="field-label">Logo</span>
            <ImageUploadField value={config.logoImageUrl} onChange={(v) => onChange({ logoImageUrl: v })} />
          </div>
          <div className="field">
            <span className="field-label">Favicon</span>
            <ImageUploadField
              value={config.faviconImageUrl}
              onChange={(v) => onChange({ faviconImageUrl: v })}
              placeholder="Square image, e.g. 32×32"
            />
          </div>
        </div>
      )}
    </>
  )
}
