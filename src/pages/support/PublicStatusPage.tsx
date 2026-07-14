import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Wrench,
  Search,
  Sun,
  Moon,
  ArrowLeft,
} from 'lucide-react'
import {
  getPublicPageConfig,
  getServiceGroups,
  maintenanceWindows,
  normalizeHealth,
  resolvePageEntries,
  serviceHistory,
  serviceLatencyMs,
  servicesFromResolvedEntries,
  siteIncidents,
  sites,
  type ComponentHealth,
  type MonitorDetailLevel,
  type PublicPageConfig,
  type RegistryService,
  type ResolvedPageEntry,
  type ServiceGroup,
} from '../../mock/support'

function resolveTheme(theme: PublicPageConfig['theme']): 'light' | 'dark' {
  if (theme !== 'system') return theme
  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches) return 'dark'
  return 'light'
}

const HEALTH_META: Record<ComponentHealth, { label: string; dot: string; badge: string; colorVar: string; softVar: string }> = {
  operational: { label: 'Operational', dot: 'healthy', badge: 'sev-healthy', colorVar: 'var(--success)', softVar: 'var(--success-soft)' },
  degraded: { label: 'Degraded Performance', dot: 'degraded', badge: 'sev-warning', colorVar: 'var(--warn)', softVar: 'var(--warn-soft)' },
  outage: { label: 'Outage', dot: 'critical', badge: 'sev-critical', colorVar: 'var(--error)', softVar: 'var(--error-soft)' },
}

function overallHealth(services: RegistryService[]): ComponentHealth {
  if (services.some((s) => normalizeHealth(s.health) === 'outage')) return 'outage'
  if (services.some((s) => normalizeHealth(s.health) === 'degraded')) return 'degraded'
  return 'operational'
}

function uptimePct(history: ComponentHealth[]): string {
  if (history.length === 0) return '100.00'
  const bad = history.filter((h) => h !== 'operational').length
  return (100 - (bad / history.length) * 100).toFixed(2)
}

/* Shared monitor health display — the 3 detail levels the user picks per status page. */
function MonitorHealth({ service, level }: { service: RegistryService; level: MonitorDetailLevel }) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)
  const health = normalizeHealth(service.health)
  const history = serviceHistory(service)
  const avgLatencyMs = serviceLatencyMs(service)
  const meta = HEALTH_META[health]

  if (level === 'tick') {
    return (
      <span className={`badge ${meta.badge}`}>
        <span className={`dot ${meta.dot}`} style={{ width: 6, height: 6 }} />
        {meta.label}
      </span>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
      <div style={{ display: 'flex', gap: 2, height: 26, position: 'relative' }}>
        {history.map((h, i) => {
          const hm = HEALTH_META[h]
          return (
            <div
              key={i}
              onMouseEnter={level === 'hover' ? () => setHoverIdx(i) : undefined}
              onMouseLeave={level === 'hover' ? () => setHoverIdx(null) : undefined}
              style={{ flex: 1, background: hm.colorVar, borderRadius: 1, opacity: 0.95, cursor: level === 'hover' ? 'pointer' : 'default', position: 'relative' }}
            >
              {level === 'hover' && hoverIdx === i && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: '120%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'var(--fg)',
                    color: 'var(--bg)',
                    borderRadius: 6,
                    padding: '8px 10px',
                    fontSize: 11,
                    whiteSpace: 'nowrap',
                    zIndex: 20,
                    boxShadow: 'var(--shadow)',
                    lineHeight: 1.5,
                  }}
                >
                  <div style={{ fontWeight: 700 }}>{90 - i} days ago</div>
                  <div>{hm.label}</div>
                  <div style={{ opacity: 0.75 }}>~{avgLatencyMs}ms avg latency</div>
                </div>
              )}
            </div>
          )
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: 'var(--faint)' }}>
        <span>90 days ago</span>
        <span>{uptimePct(history)}% uptime</span>
        <span>Today</span>
      </div>
    </div>
  )
}

/** A single flat service — no accordion. Reused both at the top level and (indented) inside an expanded group. */
function ServiceRow({ service, level, isLast, indent }: { service: RegistryService; level: MonitorDetailLevel; isLast?: boolean; indent?: boolean }) {
  return (
    <div style={{ padding: indent ? '14px 20px 14px 40px' : '16px 20px', borderBottom: isLast ? 'none' : '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--fg)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className={`dot ${HEALTH_META[normalizeHealth(service.health)].dot}`} style={{ width: 6, height: 6 }} />
          {service.name}
        </span>
        {level === 'tick' && <MonitorHealth service={service} level="tick" />}
      </div>
      {level !== 'tick' && <MonitorHealth service={service} level={level} />}
    </div>
  )
}

/** A group, rendered as a collapsible accordion of its services. */
function GroupAccordion({ group, level, expanded, onToggle }: { group: ServiceGroup; level: MonitorDetailLevel; expanded: boolean; onToggle: () => void }) {
  const gMeta = HEALTH_META[overallHealth(group.services)]
  return (
    <div>
      <div
        onClick={onToggle}
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', cursor: 'pointer', background: 'var(--surface)', borderBottom: expanded ? '1px solid var(--border)' : 'none' }}
      >
        <span style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--fg)', display: 'flex', alignItems: 'center', gap: 8 }}>
          {expanded ? <ChevronDown size={14} style={{ color: 'var(--muted)' }} /> : <ChevronRight size={14} style={{ color: 'var(--muted)' }} />}
          {group.name}
        </span>
        <span className={`badge ${gMeta.badge}`}>
          <span className={`dot ${gMeta.dot}`} style={{ width: 6, height: 6 }} />
          {gMeta.label}
        </span>
      </div>
      {expanded && group.services.map((s, idx) => (
        <ServiceRow key={s.id} service={s} level={level} isLast={idx === group.services.length - 1} indent />
      ))}
    </div>
  )
}

export function PublicStatusPage() {
  const { siteId } = useParams()
  const site = sites.find((s) => s.id === siteId) ?? sites[0]
  const [config] = useState<PublicPageConfig>(() => getPublicPageConfig(siteId ?? site.id))
  const [subscribed, setSubscribed] = useState(false)
  const [emailInput, setEmailInput] = useState('')
  const [showSubModal, setShowSubModal] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})

  // Interactive Health Dashboard states
  const [themeOverride, setThemeOverride] = useState<'light' | 'dark' | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'operational' | 'degraded' | 'outage'>('all')
  const [sortBy, setSortBy] = useState<'name-asc' | 'name-desc' | 'latency-asc' | 'latency-desc'>('name-asc')
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null)

  const resolvedTheme = themeOverride || resolveTheme(config.theme)
  const incidents = siteIncidents[site.id] ?? []
  const openIncidents = incidents.filter((i) => !i.resolved)
  const windows = maintenanceWindows(site.id)
  const resolvedEntries: ResolvedPageEntry[] = resolvePageEntries(config.entries, getServiceGroups())
  const health = overallHealth(servicesFromResolvedEntries(resolvedEntries))
  const healthMeta = HEALTH_META[health]

  useEffect(() => {
    document.title = `${site.name} Status`
    if (!config.faviconImageUrl) return
    let link = document.querySelector<HTMLLinkElement>("link[rel='icon']")
    if (!link) {
      link = document.createElement('link')
      link.rel = 'icon'
      document.head.appendChild(link)
    }
    link.href = config.faviconImageUrl
  }, [site.name, config.faviconImageUrl])

  const handleSubscribeSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!emailInput.trim()) return
    setSubscribed(true)
    setTimeout(() => {
      setShowSubModal(false)
      setSubscribed(false)
      setEmailInput('')
    }, 1800)
  }

  const toggleGroup = (id: string) => setExpandedGroups((prev) => ({ ...prev, [id]: !(prev[id] ?? true) }))

  const Header = (
    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {config.logoImageUrl ? (
          <img src={config.logoImageUrl} alt={site.name} style={{ height: 28, maxWidth: 140, objectFit: 'contain' }} />
        ) : (
          <span style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--brand)', color: '#fff', fontWeight: 800, fontSize: 14, display: 'grid', placeItems: 'center' }}>
            {site.name[0]?.toUpperCase()}
          </span>
        )}
        <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.01em', color: 'var(--fg)' }}>{site.name}</span>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        {(config.headerLinks && config.headerLinks.length > 0
          ? config.headerLinks
          : [{ label: 'Get in touch', url: 'mailto:support@rtifact.io' }]
        ).map((link) => (
          <a
            key={link.url}
            href={link.url}
            target="_blank"
            rel="noreferrer"
            className="btn btn-secondary"
            style={{ textDecoration: 'none', fontSize: 12.5 }}
          >
            {link.label}
          </a>
        ))}
        {(config.subscribeEnabled || site.id === 'internal') && (
          <button className="btn btn-primary" onClick={() => setShowSubModal(true)} style={{ fontSize: 12.5 }}>
            Subscribe to updates
          </button>
        )}
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => setThemeOverride(resolvedTheme === 'dark' ? 'light' : 'dark')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 10px', minWidth: 36, justifyContent: 'center' }}
          title="Toggle Light/Dark Theme"
        >
          {resolvedTheme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
        </button>
      </div>
    </header>
  )

  const WelcomeMessage = config.welcomeMessage.trim() ? (
    <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>{config.welcomeMessage}</p>
  ) : null

  const IncidentsSection = openIncidents.length > 0 ? (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--error)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Active Incidents
      </div>
      {openIncidents.map((inc) => (
        <div key={inc.id} className="panel" style={{ padding: 18 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: 'var(--fg)' }}>{inc.title}</h3>
          <p style={{ fontSize: 13, color: 'var(--muted)', margin: '8px 0 0 0', lineHeight: 1.5 }}>{inc.publicUpdate}</p>
        </div>
      ))}
    </div>
  ) : null

  const MaintenanceSection = windows.length > 0 ? (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Upcoming Maintenance
      </div>
      {windows.map((w) => (
        <div key={w.id} className="panel" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Wrench size={16} style={{ color: 'var(--brand)', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--fg)' }}>{w.title}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{w.scope}</div>
          </div>
          <span className="badge neutral" style={{ flexShrink: 0 }}>starts in {w.startsInHours}h · {w.durationMin}m</span>
        </div>
      ))}
    </div>
  ) : null

  const Footer = (
    <footer style={{ textAlign: 'center', fontSize: 11, color: 'var(--faint)', marginTop: 12 }}>
      {config.showAttribution && (
        <div>Powered by <span style={{ fontWeight: 700, color: 'var(--muted)' }}>Rtifact</span></div>
      )}
    </footer>
  )

  // Shared body for banner/minimal — a single bordered panel mixing flat service
  // rows with inline group accordions, in the order the operator arranged them.
  const EntriesPanel = (title: string) => (
    <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: 13.5, color: 'var(--fg)' }}>
        {title}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {resolvedEntries.map((e, idx, arr) => {
          const isLastEntry = idx === arr.length - 1
          if (e.type === 'service') return <ServiceRow key={e.service.id} service={e.service} level={config.monitorDetailLevel} isLast={isLastEntry} />
          return (
            <div key={e.group.id} style={{ borderBottom: isLastEntry ? 'none' : '1px solid var(--border)' }}>
              <GroupAccordion group={e.group} level={config.monitorDetailLevel} expanded={expandedGroups[e.group.id] ?? true} onToggle={() => toggleGroup(e.group.id)} />
            </div>
          )
        })}
      </div>
    </div>
  )

  let body: React.ReactNode

  if (config.template === 'banner') {
    body = (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
        {Header}
        {WelcomeMessage}
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: healthMeta.softVar, color: healthMeta.colorVar, display: 'grid', placeItems: 'center', margin: '0 auto 16px' }}>
            {health === 'operational' ? <CheckCircle size={30} /> : <AlertTriangle size={30} />}
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--fg)', margin: 0 }}>
            {health === 'operational' ? 'All services are online' : health === 'degraded' ? 'Some services are degraded' : 'We are experiencing an outage'}
          </h1>
          <p style={{ fontSize: 12.5, color: 'var(--faint)', marginTop: 8 }}>Last updated just now</p>
        </div>
        {IncidentsSection}
        {MaintenanceSection}
        {EntriesPanel('Services')}
        {Footer}
      </div>
    )
  } else if (config.template === 'dashboard') {
    const allServices = servicesFromResolvedEntries(resolvedEntries)

    if (selectedServiceId && allServices.some((s) => s.id === selectedServiceId)) {
      const selectedService = allServices.find((s) => s.id === selectedServiceId)!
      const currentHealth = normalizeHealth(selectedService.health)
      const meta = HEALTH_META[currentHealth]
      const latency = serviceLatencyMs(selectedService)
      const history = serviceHistory(selectedService)

      body = (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {Header}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setSelectedServiceId(null)}
              style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5 }}
            >
              <ArrowLeft size={14} /> Back to Dashboard
            </button>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
              <div>
                <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--fg)', margin: 0 }}>{selectedService.name}</h1>
                <p style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 4 }}>
                  Type: {selectedService.type} · Environment: {selectedService.env} · Path: {selectedService.path}
                </p>
              </div>
              <span className={`badge ${meta.badge}`} style={{ fontSize: 12, padding: '4px 10px' }}>
                {meta.label}
              </span>
            </div>

            {/* Stats Panel Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14 }}>
              <div className="panel" style={{ padding: 16, textAlign: 'center', background: 'var(--surface)' }}>
                <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>Current Status</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: meta.colorVar, marginTop: 8 }}>
                  {currentHealth === 'operational' ? 'Operational' : currentHealth === 'degraded' ? 'Degraded' : 'Outage'}
                </div>
              </div>
              <div className="panel" style={{ padding: 16, textAlign: 'center', background: 'var(--surface)' }}>
                <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>Avg Latency</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--fg)', marginTop: 8, fontFamily: 'monospace' }}>
                  {latency}ms
                </div>
              </div>
              <div className="panel" style={{ padding: 16, textAlign: 'center', background: 'var(--surface)' }}>
                <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>Latency Range</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--fg)', marginTop: 8, fontFamily: 'monospace' }}>
                  {Math.max(1, Math.round(latency * 0.75))} - {Math.round(latency * 1.45)}ms
                </div>
              </div>
              <div className="panel" style={{ padding: 16, textAlign: 'center', background: 'var(--surface)' }}>
                <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>Last Check</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--fg)', marginTop: 8 }}>
                  Just now
                </div>
              </div>
            </div>

            {/* Check History Timeline */}
            <div className="panel" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14, background: 'var(--surface)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--fg)' }}>Recent Checks (90 days)</span>
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                  Uptime: <span style={{ fontWeight: 700, color: 'var(--success)' }}>{uptimePct(history)}%</span>
                </span>
              </div>
              <div style={{ display: 'flex', gap: 2, height: 28 }}>
                {history.map((h, i) => (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      borderRadius: 1.5,
                      background: h === 'operational' ? 'var(--success)' : h === 'degraded' ? 'var(--warn)' : 'var(--error)',
                      opacity: 0.95
                    }}
                    title={`${90 - i} checks ago: ${h}`}
                  />
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--faint)' }}>
                <span>90 days ago</span>
                <span>Today</span>
              </div>
            </div>

            {/* Latency Line Graph */}
            <div className="panel" style={{ padding: 20, background: 'var(--surface)' }}>
              <h3 style={{ fontWeight: 700, fontSize: 14, color: 'var(--fg)', marginBottom: 16 }}>Response Time Trend (last 24h)</h3>
              <div style={{ height: 140, width: '100%' }}>
                <svg viewBox="0 0 500 120" preserveAspectRatio="none" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                  <defs>
                    <linearGradient id={`chartGrad-${selectedService.id}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--brand)" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="var(--brand)" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  <line x1="0" y1="20" x2="500" y2="20" stroke="var(--border)" strokeWidth="0.5" strokeDasharray="3 3" />
                  <line x1="0" y1="60" x2="500" y2="60" stroke="var(--border)" strokeWidth="0.5" strokeDasharray="3 3" />
                  <line x1="0" y1="100" x2="500" y2="100" stroke="var(--border)" strokeWidth="0.5" strokeDasharray="3 3" />

                  {/* Gradient Area Fill */}
                  <path
                    d={(() => {
                      const baseLatency = latency
                      const points = Array.from({ length: 30 }, (_, idx) => {
                        const noise = Math.sin(idx * 0.8) * (baseLatency * 0.15)
                        const spike = idx === 12 || idx === 25 ? baseLatency * 0.4 : 0
                        return baseLatency + noise + spike
                      })
                      const max = Math.max(...points) * 1.15
                      const min = Math.min(...points) * 0.8
                      const range = max - min || 20

                      const coordinates = points.map((p, idx) => {
                        const x = (idx / (points.length - 1)) * 500
                        const y = 110 - ((p - min) / range) * 90
                        return { x, y }
                      })

                      const linePath = coordinates.map((c, idx) => `${idx === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ')
                      const areaPath = `${linePath} L 500 110 L 0 110 Z`

                      return { linePath, areaPath }
                    })().areaPath}
                    fill={`url(#chartGrad-${selectedService.id})`}
                  />

                  {/* Top Line */}
                  <path
                    d={(() => {
                      const baseLatency = latency
                      const points = Array.from({ length: 30 }, (_, idx) => {
                        const noise = Math.sin(idx * 0.8) * (baseLatency * 0.15)
                        const spike = idx === 12 || idx === 25 ? baseLatency * 0.4 : 0
                        return baseLatency + noise + spike
                      })
                      const max = Math.max(...points) * 1.15
                      const min = Math.min(...points) * 0.8
                      const range = max - min || 20

                      return points.map((p, idx) => {
                        const x = (idx / (points.length - 1)) * 500
                        const y = 110 - ((p - min) / range) * 90
                        return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`
                      }).join(' ')
                    })()}
                    fill="none"
                    stroke="var(--brand)"
                    strokeWidth="2"
                  />
                </svg>
              </div>
            </div>

            {/* Historical Uptime Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12 }}>
              {[
                { label: 'Last 30 days', uptime: '99.96%', checks: '43,200' },
                { label: 'Last 7 days', uptime: '99.98%', checks: '10,080' },
                { label: 'Last 24 hours', uptime: '100%', checks: '1,440' },
                { label: 'Last hour', uptime: '100%', checks: '60' },
              ].map((period) => (
                <div key={period.label} className="panel" style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 4, background: 'var(--surface)' }}>
                  <span style={{ fontSize: 11, color: 'var(--muted)' }}>{period.label}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--fg)' }}>{period.uptime}</span>
                  <span style={{ fontSize: 9.5, color: 'var(--faint)' }}>{period.checks} checks</span>
                </div>
              ))}
            </div>

            {/* Events Timeline */}
            <div className="panel" style={{ padding: 20, background: 'var(--surface)' }}>
              <h3 style={{ fontWeight: 700, fontSize: 14, color: 'var(--fg)', marginBottom: 16 }}>Events</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { title: 'Restored to healthy', time: '2 hours ago', desc: 'Latency returned to normal. No anomalous error rates.', status: 'success' },
                  { title: 'Degraded Performance detected', time: '5 hours ago', desc: 'Average latency crossed threshold (420ms).', status: 'warn' },
                  { title: 'Monitoring started', time: '3 days ago', desc: 'Endpoint check registered and active.', status: 'info' }
                ].map((ev, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: 12 }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%', marginTop: 5,
                      background: ev.status === 'success' ? 'var(--success)' : ev.status === 'warn' ? 'var(--warn)' : 'var(--brand)'
                    }} />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--fg)' }}>{ev.title}</span>
                        <span style={{ fontSize: 11, color: 'var(--faint)' }}>{ev.time}</span>
                      </div>
                      <p style={{ fontSize: 12, color: 'var(--muted)', margin: '4px 0 0', lineHeight: 1.4 }}>{ev.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {Footer}
        </div>
      )
    } else {
      // Main dashboard list view
      const filteredServices = allServices
        .filter((s) => {
          const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase())
          const currentHealth = normalizeHealth(s.health)
          const matchesStatus = statusFilter === 'all' || currentHealth === statusFilter
          return matchesSearch && matchesStatus
        })
        .sort((a, b) => {
          if (sortBy === 'name-asc') return a.name.localeCompare(b.name)
          if (sortBy === 'name-desc') return b.name.localeCompare(a.name)
          const aLatency = serviceLatencyMs(a)
          const bLatency = serviceLatencyMs(b)
          if (sortBy === 'latency-asc') return aLatency - bLatency
          return bLatency - aLatency
        })

      body = (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {Header}
          {WelcomeMessage}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--fg)', margin: 0 }}>Health Dashboard</h1>
              <p style={{ fontSize: 12.5, color: 'var(--faint)', marginTop: 4 }}>Monitoring {allServices.length} services in real time</p>
            </div>
          </div>

          {/* Search, Filter, Sort Row */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <div className="search-input-container" style={{ flex: 1, minWidth: 200 }}>
              <Search size={14} className="search-icon-svg" />
              <input
                type="text"
                placeholder="Search endpoints..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="text-input"
                style={{ paddingLeft: 30, fontSize: 13 }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>Filter:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="text-input select"
                style={{ padding: '6px 28px 6px 12px', fontSize: 12.5 }}
              >
                <option value="all">All</option>
                <option value="operational">Operational</option>
                <option value="degraded">Degraded</option>
                <option value="outage">Outage</option>
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="text-input select"
                style={{ padding: '6px 28px 6px 12px', fontSize: 12.5 }}
              >
                <option value="name-asc">Name (A-Z)</option>
                <option value="name-desc">Name (Z-A)</option>
                <option value="latency-asc">Latency (Lowest)</option>
                <option value="latency-desc">Latency (Highest)</option>
              </select>
            </div>
          </div>

          {IncidentsSection}
          {MaintenanceSection}

          {filteredServices.length === 0 ? (
            <div className="placeholder-panel" style={{ padding: '40px 20px', textAlign: 'center' }}>
              No services match your filters.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 14 }}>
              {filteredServices.map((s) => {
                const health = normalizeHealth(s.health)
                const meta = HEALTH_META[health]
                const ticks = serviceHistory(s).slice(-30)
                const latency = serviceLatencyMs(s)

                return (
                  <div
                    key={s.id}
                    className="panel"
                    onClick={() => setSelectedServiceId(s.id)}
                    style={{
                      padding: 16,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12,
                      cursor: 'pointer',
                      transition: 'transform 0.12s ease, border-color 0.12s ease',
                      border: '1px solid var(--border)',
                      background: 'var(--surface)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)'
                      e.currentTarget.style.borderColor = 'var(--border-strong)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'none'
                      e.currentTarget.style.borderColor = 'var(--border)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--fg)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {s.name}
                        </div>
                        <div style={{ fontSize: 10.5, color: 'var(--muted)', marginTop: 2 }}>
                          {s.type} · {s.env}
                        </div>
                      </div>
                      <span className={`badge ${meta.badge}`} style={{ fontSize: 10, padding: '2px 6px', flexShrink: 0 }}>
                        {health === 'operational' ? 'Healthy' : health === 'degraded' ? 'Degraded' : 'Outage'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: 2, height: 16, width: '100%' }}>
                      {ticks.map((t, idx) => (
                        <div
                          key={idx}
                          style={{
                            flex: 1,
                            borderRadius: 1.5,
                            background: t === 'operational' ? 'var(--success)' : t === 'degraded' ? 'var(--warn)' : 'var(--error)',
                            opacity: 0.9,
                          }}
                        />
                      ))}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: 'var(--faint)' }}>
                      <span>{ticks.length} checks</span>
                      <span className="mono">{latency}ms</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          {Footer}
        </div>
      )
    }
  } else if (config.template === 'grouped') {
    body = (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {Header}
        {WelcomeMessage}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px', borderRadius: 10,
          background: healthMeta.softVar, color: healthMeta.colorVar, fontWeight: 700, fontSize: 14,
        }}>
          {health === 'operational' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
          {health === 'operational' ? "We're fully operational" : health === 'degraded' ? 'Degraded performance on some services' : 'Active outage affecting services'}
        </div>
        {IncidentsSection}
        {MaintenanceSection}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {resolvedEntries.map((e) => {
            if (e.type === 'service') {
              return (
                <div key={e.service.id} className="panel" style={{ padding: 0, overflow: 'hidden' }}>
                  <ServiceRow service={e.service} level={config.monitorDetailLevel} isLast />
                </div>
              )
            }
            const expanded = expandedGroups[e.group.id] ?? true
            return (
              <div key={e.group.id} className="panel" style={{ padding: 0, overflow: 'hidden' }}>
                <GroupAccordion group={e.group} level={config.monitorDetailLevel} expanded={expanded} onToggle={() => toggleGroup(e.group.id)} />
              </div>
            )
          })}
        </div>
        {Footer}
      </div>
    )
  } else {
    // minimal
    body = (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {Header}
        {WelcomeMessage}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '16px 20px', borderRadius: 10,
          background: healthMeta.softVar, color: healthMeta.colorVar,
        }}>
          {health === 'operational' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>
              {health === 'operational' ? "We're fully operational" : health === 'degraded' ? 'Degraded performance' : 'Active outage'}
            </div>
            <div style={{ fontSize: 12.5, opacity: 0.85, marginTop: 2 }}>
              {health === 'operational' ? "We're not aware of any issues affecting our systems." : 'See affected components below for details.'}
            </div>
          </div>
        </div>
        {IncidentsSection}
        {MaintenanceSection}
        {EntriesPanel('System status')}
        {Footer}
      </div>
    )
  }

  const isDashboard = config.template === 'dashboard'

  return (
    <div data-theme={resolvedTheme} style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--fg)' }}>
      <div style={{ maxWidth: isDashboard ? 1200 : 760, margin: '0 auto', padding: '48px 20px' }}>{body}</div>

      {showSubModal && (
        <div
          onClick={() => setShowSubModal(false)}
          style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'grid', placeItems: 'center', zIndex: 9999, padding: 20 }}
        >
          <div className="panel" onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 420, padding: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 8, color: 'var(--fg)' }}>Subscribe to updates</h3>
            <p style={{ color: 'var(--muted)', fontSize: 12.5, lineHeight: 1.5, marginBottom: 16 }}>
              Get notified whenever an incident is created, updated, or resolved.
            </p>
            {subscribed ? (
              <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--success)', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <CheckCircle size={16} /> Subscribed successfully!
              </div>
            ) : (
              <form onSubmit={handleSubscribeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <input
                  required
                  type="email"
                  className="text-input"
                  placeholder="name@company.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowSubModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Subscribe</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
