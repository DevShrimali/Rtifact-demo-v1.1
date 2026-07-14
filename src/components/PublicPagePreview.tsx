/**
 * Sticky live preview of the public status page — mirrors PublicStatusPage
 * template shapes (header links, status banner, group accordions, monitor detail).
 */
import { useState } from 'react'
import { AlertTriangle, CheckCircle, ChevronDown, ChevronRight } from 'lucide-react'
import {
  getServiceGroups,
  normalizeHealth,
  resolvePageEntries,
  servicesFromResolvedEntries,
  type ComponentHealth,
  type PublicPageConfig,
  type RegistryService,
  type ResolvedPageEntry,
} from '../mock/support'

interface PublicPagePreviewProps {
  config: PublicPageConfig
  siteName: string
  /** Shown in the browser chrome URL bar */
  subdomain?: string
}

function healthMeta(h: ComponentHealth) {
  if (h === 'operational') {
    return { label: 'Operational', color: 'var(--success)', soft: 'var(--success-soft)', badge: 'sev-healthy', dot: 'healthy' }
  }
  if (h === 'degraded') {
    return { label: 'Degraded', color: 'var(--warn)', soft: 'var(--warn-soft)', badge: 'sev-warning', dot: 'degraded' }
  }
  return { label: 'Outage', color: 'var(--error)', soft: 'var(--error-soft)', badge: 'sev-critical', dot: 'critical' }
}

function groupWorstHealth(services: RegistryService[]): ComponentHealth {
  if (services.some((s) => normalizeHealth(s.health) === 'outage')) return 'outage'
  if (services.some((s) => normalizeHealth(s.health) === 'degraded')) return 'degraded'
  return 'operational'
}

function MiniTimeline({ level }: { level: PublicPageConfig['monitorDetailLevel'] }) {
  if (level === 'tick') return null
  return (
    <div style={{ display: 'flex', gap: 1, height: 14, width: '100%' }}>
      {Array.from({ length: 28 }, (_, i) => (
        <span key={i} style={{ flex: 1, borderRadius: 1, background: 'var(--success)', opacity: 0.9 }} />
      ))}
    </div>
  )
}

function ServiceRow({
  service,
  level,
  indent,
  isLast,
}: {
  service: RegistryService
  level: PublicPageConfig['monitorDetailLevel']
  indent?: boolean
  isLast?: boolean
}) {
  const health = normalizeHealth(service.health)
  const meta = healthMeta(health)
  return (
    <div
      style={{
        padding: indent ? '8px 12px 8px 28px' : '9px 12px',
        borderBottom: isLast ? 'none' : '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        gap: 5,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, fontSize: 11.5 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--fg)', fontWeight: 600, minWidth: 0 }}>
          <span className={`dot ${meta.dot}`} style={{ width: 6, height: 6, flexShrink: 0 }} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{service.name}</span>
        </span>
        {level === 'tick' && (
          <span className={`badge ${meta.badge}`} style={{ fontSize: 9.5, padding: '1px 6px', flexShrink: 0 }}>
            {meta.label}
          </span>
        )}
      </div>
      <MiniTimeline level={level} />
    </div>
  )
}

function EntriesPanel({
  title,
  entries,
  level,
  expanded,
  toggle,
}: {
  title: string
  entries: ResolvedPageEntry[]
  level: PublicPageConfig['monitorDetailLevel']
  expanded: Record<string, boolean>
  toggle: (id: string) => void
}) {
  const isOpen = (id: string) => expanded[id] ?? true

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', background: 'var(--card)' }}>
      <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: 11.5, color: 'var(--fg)' }}>
        {title}
      </div>
      {entries.length === 0 ? (
        <div style={{ padding: 12, fontSize: 11, color: 'var(--faint)' }}>Add groups or services to preview rows</div>
      ) : (
        entries.slice(0, 5).map((e, idx, arr) => {
          const isLast = idx === arr.length - 1
          if (e.type === 'service') {
            return <ServiceRow key={e.service.id} service={e.service} level={level} isLast={isLast} />
          }
          const open = isOpen(e.group.id)
          const gMeta = healthMeta(groupWorstHealth(e.group.services))
          return (
            <div key={e.group.id} style={{ borderBottom: isLast ? 'none' : '1px solid var(--border)' }}>
              <button
                type="button"
                onClick={() => toggle(e.group.id)}
                style={{
                  display: 'flex',
                  width: '100%',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 12px',
                  cursor: 'pointer',
                  background: 'var(--surface)',
                  border: 'none',
                  font: 'inherit',
                  color: 'inherit',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 700, color: 'var(--fg)' }}>
                  {open ? <ChevronDown size={12} style={{ color: 'var(--muted)' }} /> : <ChevronRight size={12} style={{ color: 'var(--muted)' }} />}
                  {e.group.name}
                </span>
                <span className={`badge ${gMeta.badge}`} style={{ fontSize: 9.5, padding: '1px 6px' }}>
                  <span className={`dot ${gMeta.dot}`} style={{ width: 5, height: 5 }} />
                  {gMeta.label}
                </span>
              </button>
              {open &&
                e.group.services.slice(0, 3).map((s, sIdx, sArr) => (
                  <ServiceRow key={s.id} service={s} level={level} indent isLast={sIdx === sArr.length - 1} />
                ))}
            </div>
          )
        })
      )}
    </div>
  )
}

export function PublicPagePreview({ config, siteName, subdomain }: PublicPagePreviewProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const toggle = (id: string) => setExpanded((prev) => ({ ...prev, [id]: !(prev[id] ?? true) }))

  const registryGroups = getServiceGroups()
  const resolved = resolvePageEntries(config.entries, registryGroups)
  const allServices = servicesFromResolvedEntries(resolved)
  const worst: ComponentHealth = allServices.some((s) => normalizeHealth(s.health) === 'outage')
    ? 'outage'
    : allServices.some((s) => normalizeHealth(s.health) === 'degraded')
      ? 'degraded'
      : 'operational'
  const previewTheme = config.theme === 'system' ? 'light' : config.theme
  const meta = healthMeta(worst)
  const displayName = siteName.trim() || 'Your Company'
  const chromeUrl = subdomain?.trim()
    ? `${subdomain.trim().toLowerCase()}.rtifact.io`
    : 'status.rtifact.io/preview'

  const Header = (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--fg)', display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
        {config.logoImageUrl ? (
          <img src={config.logoImageUrl} alt="" style={{ height: 16, maxWidth: 52, objectFit: 'contain' }} />
        ) : (
          <span
            style={{
              width: 16,
              height: 16,
              borderRadius: 4,
              background: 'var(--brand)',
              color: '#fff',
              fontSize: 9,
              fontWeight: 800,
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
            }}
          >
            {displayName[0].toUpperCase()}
          </span>
        )}
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</span>
      </span>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {config.headerLinks.slice(0, 2).map((link) => (
          <span
            key={link.url}
            className="btn btn-secondary"
            style={{ fontSize: 9.5, padding: '2px 7px', pointerEvents: 'none', lineHeight: 1.4 }}
          >
            {link.label}
          </span>
        ))}
        {config.subscribeEnabled && (
          <span className="btn btn-primary" style={{ fontSize: 9.5, padding: '2px 7px', pointerEvents: 'none', lineHeight: 1.4 }}>
            Subscribe
          </span>
        )}
      </div>
    </div>
  )

  const Welcome = config.welcomeMessage.trim() ? (
    <p style={{ fontSize: 10.5, color: 'var(--muted)', margin: 0, lineHeight: 1.4 }}>{config.welcomeMessage}</p>
  ) : null

  const Footer = config.showAttribution ? (
    <div style={{ textAlign: 'center', fontSize: 9.5, color: 'var(--faint)', marginTop: 4 }}>
      Powered by <span style={{ fontWeight: 700, color: 'var(--muted)' }}>Rtifact</span>
    </div>
  ) : null

  let body: React.ReactNode

  if (config.template === 'banner') {
    body = (
      <>
        {Header}
        {Welcome}
        <div style={{ textAlign: 'center', padding: '6px 0 4px' }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: meta.soft,
              color: meta.color,
              display: 'grid',
              placeItems: 'center',
              margin: '0 auto 6px',
            }}
          >
            {worst === 'operational' ? <CheckCircle size={15} /> : <AlertTriangle size={15} />}
          </div>
          <div style={{ fontSize: 12.5, fontWeight: 750, color: 'var(--fg)' }}>
            {worst === 'operational' ? 'All services are online' : worst === 'degraded' ? 'Some services are degraded' : 'We are experiencing an outage'}
          </div>
          <div style={{ fontSize: 9.5, color: 'var(--faint)', marginTop: 3 }}>Last updated just now</div>
        </div>
        <EntriesPanel title="Services" entries={resolved} level={config.monitorDetailLevel} expanded={expanded} toggle={toggle} />
        {Footer}
      </>
    )
  } else if (config.template === 'dashboard') {
    body = (
      <>
        {Header}
        {Welcome}
        <div>
          <div style={{ fontSize: 13, fontWeight: 750, color: 'var(--fg)' }}>Health Dashboard</div>
          <div style={{ fontSize: 10, color: 'var(--faint)', marginTop: 2 }}>
            Monitoring {allServices.length} service{allServices.length === 1 ? '' : 's'}
          </div>
        </div>
        {resolved.length === 0 ? (
          <div style={{ fontSize: 11, color: 'var(--faint)' }}>Add groups or services to preview cards</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {resolved.slice(0, 4).map((e) => {
              if (e.type === 'service') {
                const h = normalizeHealth(e.service.health)
                const hm = healthMeta(h)
                return (
                  <div key={e.service.id} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 10, background: 'var(--card)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11 }}>
                      <span style={{ color: 'var(--fg)', fontWeight: 650 }}>{e.service.name}</span>
                      <span className={`badge ${hm.badge}`} style={{ fontSize: 9.5, padding: '1px 6px' }}>{hm.label}</span>
                    </div>
                    <MiniTimeline level={config.monitorDetailLevel} />
                  </div>
                )
              }
              const open = expanded[e.group.id] ?? true
              return (
                <div key={e.group.id} style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', background: 'var(--card)' }}>
                  <button
                    type="button"
                    onClick={() => toggle(e.group.id)}
                    style={{
                      display: 'flex',
                      width: '100%',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 10px',
                      cursor: 'pointer',
                      background: 'var(--surface)',
                      border: 'none',
                      borderBottom: open ? '1px solid var(--border)' : 'none',
                      font: 'inherit',
                      color: 'inherit',
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    {e.group.name}
                    {open ? <ChevronDown size={12} style={{ color: 'var(--muted)' }} /> : <ChevronRight size={12} style={{ color: 'var(--muted)' }} />}
                  </button>
                  {open &&
                    e.group.services.slice(0, 2).map((s, sIdx, arr) => (
                      <ServiceRow key={s.id} service={s} level={config.monitorDetailLevel} indent isLast={sIdx === arr.length - 1} />
                    ))}
                </div>
              )
            })}
          </div>
        )}
        {Footer}
      </>
    )
  } else if (config.template === 'grouped') {
    body = (
      <>
        {Header}
        {Welcome}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 10px',
            borderRadius: 8,
            background: meta.soft,
            color: meta.color,
            fontSize: 11,
            fontWeight: 700,
          }}
        >
          {worst === 'operational' ? <CheckCircle size={13} /> : <AlertTriangle size={13} />}
          {worst === 'operational' ? "We're fully operational" : worst === 'degraded' ? 'Degraded performance' : 'Active outage'}
        </div>
        {resolved.length === 0 ? (
          <div style={{ fontSize: 11, color: 'var(--faint)' }}>Add groups or services to preview</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {resolved.slice(0, 3).map((e) => {
              if (e.type === 'service') {
                return (
                  <div key={e.service.id} style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', background: 'var(--card)' }}>
                    <ServiceRow service={e.service} level={config.monitorDetailLevel} isLast />
                  </div>
                )
              }
              const open = expanded[e.group.id] ?? true
              return (
                <div key={e.group.id} style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', background: 'var(--card)' }}>
                  <button
                    type="button"
                    onClick={() => toggle(e.group.id)}
                    style={{
                      width: '100%',
                      padding: '7px 10px',
                      background: 'var(--surface)',
                      border: 'none',
                      borderBottom: open ? '1px solid var(--border)' : 'none',
                      fontSize: 11.5,
                      fontWeight: 700,
                      color: 'var(--fg)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'pointer',
                      font: 'inherit',
                    }}
                  >
                    <span style={{ fontWeight: 700 }}>{e.group.name}</span>
                    {open ? <ChevronDown size={12} style={{ color: 'var(--muted)' }} /> : <ChevronRight size={12} style={{ color: 'var(--muted)' }} />}
                  </button>
                  {open &&
                    e.group.services.slice(0, 2).map((s, sIdx, arr) => (
                      <ServiceRow key={s.id} service={s} level={config.monitorDetailLevel} indent isLast={sIdx === arr.length - 1} />
                    ))}
                </div>
              )
            })}
          </div>
        )}
        {Footer}
      </>
    )
  } else {
    body = (
      <>
        {Header}
        {Welcome}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 8,
            padding: '10px 12px',
            borderRadius: 8,
            background: meta.soft,
            color: meta.color,
          }}
        >
          {worst === 'operational' ? <CheckCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} /> : <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 1 }} />}
          <div>
            <div style={{ fontWeight: 700, fontSize: 12 }}>
              {worst === 'operational' ? "We're fully operational" : worst === 'degraded' ? 'Degraded performance' : 'Active outage'}
            </div>
            <div style={{ fontSize: 10, opacity: 0.85, marginTop: 2, lineHeight: 1.35 }}>
              {worst === 'operational' ? "We're not aware of any issues affecting our systems." : 'See affected components below.'}
            </div>
          </div>
        </div>
        <EntriesPanel title="System status" entries={resolved} level={config.monitorDetailLevel} expanded={expanded} toggle={toggle} />
        {Footer}
      </>
    )
  }

  return (
    <div style={{ position: 'sticky', top: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
        <span className="field-label" style={{ margin: 0 }}>Live preview</span>
        <span style={{ fontSize: 10.5, color: 'var(--faint)', textTransform: 'capitalize' }}>{config.template}</span>
      </div>
      <div
        style={{
          border: '1px solid var(--border-strong)',
          borderRadius: 12,
          overflow: 'hidden',
          background: 'var(--card)',
          boxShadow: 'var(--shadow)',
        }}
      >
        {/* Browser chrome */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 10px',
            borderBottom: '1px solid var(--border)',
            background: 'var(--surface)',
          }}
        >
          <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--border-strong)' }} />
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--border-strong)' }} />
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--border-strong)' }} />
          </div>
          <div
            className="mono"
            style={{
              flex: 1,
              minWidth: 0,
              fontSize: 10.5,
              color: 'var(--muted)',
              background: 'var(--chip)',
              borderRadius: 5,
              padding: '3px 8px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {chromeUrl}
          </div>
        </div>
        <div
          data-theme={previewTheme}
          style={{
            background: 'var(--bg)',
            padding: 14,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            minHeight: 280,
            maxHeight: 'calc(100vh - 160px)',
            overflowY: 'auto',
          }}
        >
          {body}
        </div>
      </div>
    </div>
  )
}
