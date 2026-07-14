import { useMemo, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import {
  Check,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Circle,
  Clock,
  Copy,
  ExternalLink,
  FileText,
  Globe,
  Link2,
  Loader2,
  RefreshCw,
  Search,
  Trash2,
  Users,
  X,
  XCircle,
  Zap,
  ShieldCheck,
} from 'lucide-react'
import {
  getPublicPageConfig,
  savePublicPageConfig,
  sites,
  statusSubscribersForSite,
  updateSite,
  type PublicPageConfig,
  type StatusSite,
} from '../../mock/support'
import { TimeAgo } from '../../components/TimeAgo'
import { Select } from '../../components/Select'
import { Switch } from '../../components/Switch'
import { StatusSiteBasicsFields } from '../../components/StatusSiteBasicsForm'
import { PublicPageBrandingFields } from '../../components/PublicPageBrandingFields'
import { PublicPageContentFields } from '../../components/PublicPageContentFields'
import { PublicPagePreview } from '../../components/PublicPagePreview'
import { SiteVisibilityPicker, VISIBILITY_LABEL } from '../../components/SiteVisibilityPicker'

const TABS = [
  { id: 'content', label: 'Content', icon: FileText },
  { id: 'subscribers', label: 'Subscribers', icon: Users },
  { id: 'domain', label: 'Domain', icon: Link2 },
] as const
type Tab = (typeof TABS)[number]['id']

type SiteDomain = {
  domain: string
  dnsStatus: 'Pending' | 'Verified' | 'Failed'
  sslStatus: 'Provisioning' | 'Active' | 'Failed'
  cdnStatus: 'Propagating' | 'Active'
  sslExpiry: string
  createdAt: string
}

function domainFromSite(site: StatusSite): SiteDomain | null {
  if (!site.customDomain) return null
  const active = site.customDomainStatus === 'Active'
  return {
    domain: site.customDomain,
    dnsStatus: active ? 'Verified' : 'Pending',
    sslStatus: active ? 'Active' : 'Provisioning',
    cdnStatus: active ? 'Active' : 'Propagating',
    sslExpiry: active ? 'Dec 12, 2026' : '—',
    createdAt: active ? 'Connected' : 'Just now',
  }
}

type SubsSortKey = 'email' | 'firstSubscribedAt' | 'lastNotificationAt'
type SortDir = 'asc' | 'desc'

export function SiteDetailPage() {
  const { siteId } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const site = sites.find((s) => s.id === siteId)
  const tabParam = (searchParams.get('tab') ?? 'content').toLowerCase()
  const tab: Tab = TABS.some((t) => t.id === tabParam) ? (tabParam as Tab) : 'content'

  const [siteName, setSiteName] = useState(site?.name ?? '')
  const [siteSubdomain, setSiteSubdomain] = useState(siteId ?? '')
  const [siteVisibility, setSiteVisibility] = useState<StatusSite['visibility']>(site?.visibility ?? 'public')
  const [logoPointUrl, setLogoPointUrl] = useState('https://rtifact.io')
  const [contactUrl, setContactUrl] = useState('https://rtifact.io/support')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [savedFlash, setSavedFlash] = useState(false)
  const [config, setConfig] = useState<PublicPageConfig>(() => getPublicPageConfig(siteId ?? ''))

  // Domain (this site only — configure / manage, no multi-site “Add Domain” flow)
  const [domain, setDomain] = useState<SiteDomain | null>(() => (site ? domainFromSite(site) : null))
  const [domainDraft, setDomainDraft] = useState('')
  const [domainExpanded, setDomainExpanded] = useState(true)
  const [verifying, setVerifying] = useState(false)
  const [copiedValue, setCopiedValue] = useState<string | null>(null)

  // Subscribers (this site only)
  const siteSubs = useMemo(() => statusSubscribersForSite(siteId ?? ''), [siteId])
  const [subSearch, setSubSearch] = useState('')
  const [subsSortKey, setSubsSortKey] = useState<SubsSortKey>('email')
  const [subsSortDir, setSubsSortDir] = useState<SortDir>('asc')

  if (!site) {
    return (
      <div className="error-panel" role="alert">
        <div className="error-title">Site {siteId} not found</div>
      </div>
    )
  }

  const updateConfig = (patch: Partial<PublicPageConfig>) => setConfig((prev) => ({ ...prev, ...patch }))

  const handleSaveChanges = (e: React.FormEvent) => {
    e.preventDefault()
    savePublicPageConfig(siteId ?? '', config)
    updateSite(siteId ?? '', {
      name: siteName.trim() || site.name,
      visibility: siteVisibility,
    })
    setSavedFlash(true)
    setTimeout(() => setSavedFlash(false), 2000)
  }

  const handleCopy = (value: string) => {
    navigator.clipboard?.writeText(value)
    setCopiedValue(value)
    setTimeout(() => setCopiedValue((prev) => (prev === value ? null : prev)), 1500)
  }

  const connectDomain = (e: React.FormEvent) => {
    e.preventDefault()
    const value = domainDraft.trim().toLowerCase()
    if (!value) return
    const next: SiteDomain = {
      domain: value,
      dnsStatus: 'Pending',
      sslStatus: 'Provisioning',
      cdnStatus: 'Propagating',
      sslExpiry: '—',
      createdAt: 'Just now',
    }
    setDomain(next)
    setDomainDraft('')
    setDomainExpanded(true)
    updateSite(siteId ?? '', { customDomain: value, customDomainStatus: 'Pending' })
  }

  const verifyDomain = () => {
    if (!domain) return
    setVerifying(true)
    setTimeout(() => {
      setDomain({
        ...domain,
        dnsStatus: 'Verified',
        sslStatus: 'Active',
        cdnStatus: 'Active',
        sslExpiry: 'Dec 12, 2026',
      })
      updateSite(siteId ?? '', { customDomainStatus: 'Active' })
      setVerifying(false)
    }, 1200)
  }

  const removeDomain = () => {
    setDomain(null)
    updateSite(siteId ?? '', { customDomain: null, customDomainStatus: null })
  }

  const filteredSubs = siteSubs
    .filter((s) => {
      const q = subSearch.trim().toLowerCase()
      return !q || s.email.toLowerCase().includes(q)
    })
    .sort((a, b) => {
      const dir = subsSortDir === 'asc' ? 1 : -1
      if (subsSortKey === 'email') return a.email.localeCompare(b.email, undefined, { sensitivity: 'base' }) * dir
      if (subsSortKey === 'firstSubscribedAt') return (a.firstSubscribedAt - b.firstSubscribedAt) * dir
      return ((a.lastNotificationAt ?? 0) - (b.lastNotificationAt ?? 0)) * dir
    })

  const toggleSubsSort = (key: SubsSortKey) => {
    if (subsSortKey === key) setSubsSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSubsSortKey(key)
      setSubsSortDir('asc')
    }
  }

  const isFullyActive =
    domain != null && domain.dnsStatus === 'Verified' && domain.sslStatus === 'Active' && domain.cdnStatus === 'Active'
  const validationHost = domain ? `_verify.${domain.domain}` : ''
  const validationTarget = domain ? `verify-${(siteId ?? 'site').slice(-4)}.rtifact.io` : ''

  const dnsRow = (host: string, value: string, showActiveBadge: boolean) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', fontSize: 12.5 }}>
      <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--brand)', background: 'var(--brand-soft)', padding: '2px 7px', borderRadius: 5, flexShrink: 0 }}>
        CNAME
      </span>
      <span style={{ fontFamily: 'monospace', fontWeight: 600, flexShrink: 0 }}>{host}</span>
      <button type="button" onClick={() => handleCopy(host)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--faint)', display: 'flex', flexShrink: 0 }}>
        {copiedValue === host ? <Check size={12} style={{ color: 'var(--success)' }} /> : <Copy size={12} />}
      </button>
      <span style={{ fontFamily: 'monospace', color: 'var(--faint)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</span>
      <button type="button" onClick={() => handleCopy(value)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--faint)', display: 'flex', flexShrink: 0 }}>
        {copiedValue === value ? <Check size={12} style={{ color: 'var(--success)' }} /> : <Copy size={12} />}
      </button>
      {showActiveBadge && <span className="badge sev-healthy" style={{ fontSize: 10, flexShrink: 0 }}>Active</span>}
    </div>
  )

  const kvRow = (label: string, value: string, color?: string) => (
    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', fontSize: 12.5 }}>
      <span style={{ color: 'var(--muted)' }}>{label}</span>
      <span style={{ fontWeight: 600, color: color ?? 'var(--fg)' }}>{value}</span>
    </div>
  )

  return (
    <>
      <div className="page-head" style={{ marginBottom: 14 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h1 className="page-title" style={{ fontSize: 21 }}>
              {siteName}
            </h1>
            <span
              className="badge"
              style={{
                background: siteVisibility === 'public' ? 'var(--brand-soft)' : 'var(--chip)',
                color: siteVisibility === 'public' ? 'var(--brand)' : 'var(--muted)',
                fontSize: 10,
                padding: '2px 7px',
              }}
            >
              {VISIBILITY_LABEL[siteVisibility]}
            </span>
          </div>
          <p className="page-sub mono" style={{ fontSize: 11.5 }}>
            {site.url}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <a
            href={`/status/${siteId}`}
            target="_blank"
            rel="noreferrer"
            className="btn btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}
          >
            <ExternalLink size={13} /> Open public page
          </a>
          {tab === 'content' && (
            <button type="submit" form="site-content-form" className="btn btn-primary">
              Save changes
            </button>
          )}
          {savedFlash && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12.5, color: 'var(--success)', fontWeight: 600 }}>
              <Check size={14} /> Saved
            </span>
          )}
        </div>
      </div>

      <nav className="subnav" role="tablist" aria-label="Site edit sections" style={{ marginBottom: 18 }}>
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            className={`subnav-item${tab === id ? ' active' : ''}`}
            onClick={() => setSearchParams({ tab: id })}
          >
            <Icon size={12} strokeWidth={2.2} style={{ marginRight: 4, verticalAlign: -1 }} />
            {label}
          </button>
        ))}
      </nav>

      {/* ── Content (create flow, prefilled) ── */}
      {tab === 'content' && (
        <form id="site-content-form" onSubmit={handleSaveChanges}>
          <div className="status-site-editor">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <section className="panel" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="section-label" style={{ margin: 0 }}>Site details</div>
                <StatusSiteBasicsFields
                  values={{ name: siteName, subdomain: siteSubdomain }}
                  onChange={(patch) => {
                    if (patch.name !== undefined) setSiteName(patch.name)
                    if (patch.subdomain !== undefined) setSiteSubdomain(patch.subdomain)
                  }}
                >
                  <SiteVisibilityPicker value={siteVisibility} onChange={setSiteVisibility} />
                </StatusSiteBasicsFields>
              </section>

              <section className="panel" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="section-label" style={{ margin: 0 }}>Appearance</div>
                <PublicPageBrandingFields config={config} onChange={updateConfig} />
              </section>

              <section className="panel" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="section-label" style={{ margin: 0 }}>Page content</div>
                <PublicPageContentFields config={config} onChange={updateConfig} />
              </section>

              <section className="panel" style={{ padding: 16 }}>
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'var(--muted)',
                    background: 'none',
                    border: 'none',
                    padding: 0,
                  }}
                >
                  <ChevronRight size={14} style={{ transform: showAdvanced ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s ease' }} />
                  Advanced
                </button>
                {showAdvanced && (
                  <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                      <div className="field">
                        <span className="field-label">Logo link URL</span>
                        <input
                          className="text-input"
                          value={logoPointUrl}
                          placeholder="https://acme.com"
                          onChange={(e) => setLogoPointUrl(e.target.value)}
                        />
                      </div>
                      <div className="field">
                        <span className="field-label">Get in touch URL</span>
                        <input
                          className="text-input"
                          value={contactUrl}
                          placeholder="https://acme.com/support"
                          onChange={(e) => setContactUrl(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="field">
                      <span className="field-label">Default page language</span>
                      <Select
                        value="en"
                        onValueChange={() => {}}
                        options={[
                          { value: 'en', label: 'English (US)' },
                          { value: 'es', label: 'Spanish' },
                          { value: 'de', label: 'German' },
                        ]}
                      />
                    </div>
                    <Switch
                      checked={config.showAttribution}
                      onCheckedChange={(v) => updateConfig({ showAttribution: v })}
                      label="Show Rtifact attribution in page footer"
                    />
                  </div>
                )}
              </section>
            </div>

            <PublicPagePreview config={config} siteName={siteName} subdomain={siteSubdomain} />
          </div>
        </form>
      )}

      {/* ── Subscribers (this site only) ── */}
      {tab === 'subscribers' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="rt-filter-bar">
            <div className="rt-filter-search">
              <Search size={14} strokeWidth={2.2} />
              <input
                type="text"
                placeholder="Search"
                value={subSearch}
                onChange={(e) => setSubSearch(e.target.value)}
                aria-label="Search subscribers by email"
              />
              {subSearch.trim() !== '' && (
                <button type="button" className="rt-filter-facet-clear" aria-label="Clear search" onClick={() => setSubSearch('')}>
                  <X size={12} strokeWidth={2.4} />
                </button>
              )}
            </div>
            <div className="rt-filter-meta">
              {subSearch.trim() !== '' && (
                <button type="button" className="rt-filter-clear-all" onClick={() => setSubSearch('')}>
                  Clear
                </button>
              )}
              <span>
                {filteredSubs.length} subscriber{filteredSubs.length === 1 ? '' : 's'}
              </span>
            </div>
          </div>

          {filteredSubs.length === 0 ? (
            <div className="placeholder-panel">
              {subSearch.trim() ? 'No subscribers match your search.' : 'No subscribers yet.'}
              <span className="mono">
                {subSearch.trim() ? 'try a different email' : 'subscribers appear when people opt in on this status page'}
              </span>
            </div>
          ) : (
            <div className="panel" style={{ overflow: 'hidden', padding: 0 }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.6fr 160px 160px',
                  gap: 12,
                  padding: '12px 20px',
                  borderBottom: '1px solid var(--border)',
                  background: 'var(--surface)',
                }}
              >
                {(
                  [
                    { key: 'email' as const, label: 'Email' },
                    { key: 'firstSubscribedAt' as const, label: 'Subscribed' },
                    { key: 'lastNotificationAt' as const, label: 'Last Notification', align: 'right' as const },
                  ]
                ).map((col) => {
                  const active = subsSortKey === col.key
                  return (
                    <button
                      key={col.key}
                      type="button"
                      onClick={() => toggleSubsSort(col.key)}
                      className="stat-label"
                      style={{
                        textTransform: 'uppercase',
                        fontSize: 10,
                        letterSpacing: '0.07em',
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        justifyContent: col.align === 'right' ? 'flex-end' : 'flex-start',
                        color: active ? 'var(--fg)' : 'var(--muted)',
                        width: '100%',
                      }}
                    >
                      {col.label}
                      {active && (subsSortDir === 'asc' ? <ChevronUp size={11} strokeWidth={2.4} /> : <ChevronDown size={11} strokeWidth={2.4} />)}
                    </button>
                  )
                })}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {filteredSubs.map((sub) => (
                  <div
                    key={sub.id}
                    className="row"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1.6fr 160px 160px',
                      gap: 12,
                      padding: '14px 20px',
                      borderBottom: '1px solid var(--border)',
                      alignItems: 'center',
                      fontSize: 13,
                    }}
                  >
                    <div style={{ fontFamily: 'monospace', fontSize: 12.5, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {sub.email}
                    </div>
                    <div style={{ color: 'var(--faint)', fontSize: 12 }}>
                      <TimeAgo timestamp={sub.firstSubscribedAt} />
                    </div>
                    <div style={{ textAlign: 'right', color: 'var(--faint)', fontSize: 12 }}>
                      {sub.lastNotificationAt == null ? '—' : <TimeAgo timestamp={sub.lastNotificationAt} />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Domain (this site only — configure / manage, no Add Domain picker) ── */}
      {tab === 'domain' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {!domain ? (
            <div className="panel" style={{ padding: 24, maxWidth: 560 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    display: 'grid',
                    placeItems: 'center',
                    background: 'var(--brand-soft)',
                    color: 'var(--brand)',
                  }}
                >
                  <Globe size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Custom domain</h3>
                  <p style={{ fontSize: 12.5, color: 'var(--muted)', margin: '2px 0 0' }}>
                    Serve this status page from your own hostname.
                  </p>
                </div>
              </div>
              <form onSubmit={connectDomain} style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 16 }}>
                <div className="field">
                  <span className="field-label">Domain</span>
                  <input
                    className="text-input"
                    required
                    placeholder="status.example.com"
                    value={domainDraft}
                    onChange={(e) => setDomainDraft(e.target.value)}
                  />
                </div>
                <div>
                  <button type="submit" className="btn btn-primary" disabled={!domainDraft.trim()}>
                    Connect domain
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
              <div
                onClick={() => setDomainExpanded(!domainExpanded)}
                style={{
                  padding: '18px 22px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'start',
                  gap: 16,
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', gap: 14, alignItems: 'start' }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      display: 'grid',
                      placeItems: 'center',
                      flexShrink: 0,
                      background: isFullyActive ? 'var(--success-soft)' : 'var(--warn-soft)',
                      color: isFullyActive ? 'var(--success)' : 'var(--warn)',
                    }}
                  >
                    {isFullyActive ? <CheckCircle size={18} /> : <Clock size={18} />}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: 'var(--fg)' }}>{domain.domain}</h3>
                      <span className={`badge ${isFullyActive ? 'sev-healthy' : 'sev-warning'}`} style={{ fontSize: 10.5 }}>
                        {isFullyActive ? 'Domain Active' : 'Pending DNS Validation'}
                      </span>
                    </div>
                    <p style={{ fontSize: 12.5, color: 'var(--muted)', margin: 0, maxWidth: 480, lineHeight: 1.5 }}>
                      {isFullyActive
                        ? `Serving ${siteName}'s status page via CDN`
                        : 'Add the DNS records below to complete domain verification. Changes may take up to 48 hours to propagate.'}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                  {isFullyActive ? (
                    <a
                      href={`https://${domain.domain}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-secondary"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}
                    >
                      <ExternalLink size={13} /> Open
                    </a>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={verifying}
                      onClick={verifyDomain}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                    >
                      {verifying ? <Loader2 size={13} className="spin" /> : <RefreshCw size={13} />}
                      {verifying ? 'Checking…' : 'Check DNS'}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={removeDomain}
                    title="Remove domain"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: 4, display: 'flex' }}
                  >
                    <Trash2 size={14} />
                  </button>
                  <ChevronDown
                    size={16}
                    style={{ color: 'var(--muted)', transform: domainExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }}
                  />
                </div>
              </div>

              {domainExpanded && (
                <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 22 }}>
                  {isFullyActive ? (
                    <>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28 }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <ShieldCheck size={14} style={{ color: 'var(--success)' }} />
                            <span style={{ fontSize: 13.5, fontWeight: 700 }}>SSL Certificate</span>
                          </div>
                          <p style={{ fontSize: 11.5, color: 'var(--faint)', margin: '2px 0 8px 0' }}>Managed automatically</p>
                          {kvRow('Status', 'Issued', 'var(--success)')}
                          {kvRow('Expires', domain.sslExpiry)}
                          {kvRow('Auto-renew', 'Enabled', 'var(--success)')}
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Zap size={14} style={{ color: 'var(--brand)' }} />
                            <span style={{ fontSize: 13.5, fontWeight: 700 }}>CDN</span>
                          </div>
                          <p style={{ fontSize: 11.5, color: 'var(--faint)', margin: '2px 0 8px 0' }}>Global edge distribution</p>
                          {kvRow('Edge locations', '450+')}
                          {kvRow('Avg latency', '18ms', 'var(--success)')}
                          {kvRow('Cache hit rate', '97.4%', 'var(--success)')}
                        </div>
                      </div>
                      <div>
                        <span style={{ fontSize: 13.5, fontWeight: 700, display: 'block', marginBottom: 10 }}>DNS Configuration</span>
                        <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                          <div style={{ borderBottom: '1px solid var(--border)' }}>{dnsRow(domain.domain, 'statuspage.rtifact.io', true)}</div>
                          {dnsRow(validationHost, validationTarget, true)}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <span style={{ fontSize: 13.5, fontWeight: 700, display: 'block' }}>Step 1 — Add CNAME record</span>
                        <p style={{ fontSize: 11.5, color: 'var(--faint)', margin: '2px 0 10px 0' }}>Point your domain to the Rtifact edge network</p>
                        <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                          {dnsRow(domain.domain, 'statuspage.rtifact.io', domain.dnsStatus === 'Verified')}
                        </div>
                      </div>
                      <div>
                        <span style={{ fontSize: 13.5, fontWeight: 700, display: 'block' }}>Step 2 — SSL certificate validation</span>
                        <p style={{ fontSize: 11.5, color: 'var(--faint)', margin: '2px 0 10px 0' }}>Add this record so we can issue your SSL certificate</p>
                        <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                          {dnsRow(validationHost, validationTarget, domain.sslStatus === 'Active')}
                        </div>
                      </div>
                      <div>
                        <span style={{ fontSize: 13.5, fontWeight: 700, display: 'block', marginBottom: 14 }}>Validation progress</span>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          {[
                            { label: 'Domain submitted', sub: domain.createdAt, state: 'done' as const },
                            {
                              label: 'CNAME record detected',
                              sub: 'Waiting for DNS propagation',
                              state: domain.dnsStatus === 'Verified' ? ('done' as const) : domain.dnsStatus === 'Failed' ? ('failed' as const) : ('current' as const),
                            },
                            {
                              label: 'SSL certificate issued',
                              sub: 'Waiting for CNAME verification',
                              state: domain.sslStatus === 'Active' ? ('done' as const) : domain.dnsStatus === 'Verified' ? ('current' as const) : ('upcoming' as const),
                            },
                            {
                              label: 'Domain active',
                              sub: 'Final activation step',
                              state: domain.cdnStatus === 'Active' ? ('done' as const) : ('upcoming' as const),
                            },
                          ].map((step, idx, arr) => (
                            <div key={step.label} style={{ display: 'flex', gap: 12 }}>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                                {step.state === 'done' ? (
                                  <CheckCircle size={16} style={{ color: 'var(--success)' }} />
                                ) : step.state === 'failed' ? (
                                  <XCircle size={16} style={{ color: 'var(--error)' }} />
                                ) : step.state === 'current' ? (
                                  <Clock size={16} style={{ color: 'var(--warn)' }} />
                                ) : (
                                  <Circle size={16} style={{ color: 'var(--border-strong)' }} />
                                )}
                                {idx < arr.length - 1 && <div style={{ width: 1, flex: 1, minHeight: 22, background: 'var(--border)', marginTop: 2 }} />}
                              </div>
                              <div style={{ paddingBottom: 22 }}>
                                <div
                                  style={{
                                    fontSize: 13,
                                    fontWeight: 700,
                                    color: step.state === 'upcoming' ? 'var(--faint)' : step.state === 'current' ? 'var(--warn)' : 'var(--fg)',
                                  }}
                                >
                                  {step.label}
                                </div>
                                <div style={{ fontSize: 11.5, color: 'var(--faint)', marginTop: 2 }}>{step.sub}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  )
}
