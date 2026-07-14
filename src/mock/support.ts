import { minutesAgo } from '../lib/time'
import type { Severity } from './alerts'

/* ---------- Screens 32–33: Cases ---------- */

export type CaseStatus = 'Triage' | 'Investigating' | 'Fixing' | 'Resolved'

export interface SupportCase {
  id: string
  title: string
  status: CaseStatus
  severity: Severity
  assignee: string
  openedAt: number
  context: { label: string; value: string }[]
  timeline: { label: string; at: number; actor: string }[]
}

export const cases: SupportCase[] = [
  {
    id: 'CASE-88',
    title: 'Payment webhook retries hitting customer endpoint',
    status: 'Investigating',
    severity: 'high',
    assignee: 'A. Rivera',
    openedAt: minutesAgo(4320),
    context: [
      { label: 'Customer', value: 'Northwind Retail (enterprise)' },
      { label: 'Channel', value: 'Email → support@' },
      { label: 'Linked incident', value: 'INC-311' },
      { label: 'Affected surface', value: 'payments webhook v2' },
    ],
    timeline: [
      { label: 'Case opened from customer email', at: minutesAgo(4320), actor: 'system' },
      { label: 'Triaged as High — linked to INC-311', at: minutesAgo(4100), actor: 'M. Chen' },
      { label: 'Retry storm confirmed as root cause', at: minutesAgo(300), actor: 'A. Rivera' },
      { label: 'Awaiting rollback completion before reply', at: minutesAgo(60), actor: 'A. Rivera' },
    ],
  },
  {
    id: 'CASE-87',
    title: 'Status page shows stale incident for EU customers',
    status: 'Fixing',
    severity: 'medium',
    assignee: 'M. Chen',
    openedAt: minutesAgo(2880),
    context: [
      { label: 'Customer', value: '3 reports (EU region)' },
      { label: 'Channel', value: 'Status page feedback' },
      { label: 'Linked incident', value: '—' },
      { label: 'Affected surface', value: 'status.acme.com CDN cache' },
    ],
    timeline: [
      { label: 'Case opened', at: minutesAgo(2880), actor: 'system' },
      { label: 'Cache TTL misconfiguration found', at: minutesAgo(600), actor: 'M. Chen' },
      { label: 'Fix rolling out to EU PoPs', at: minutesAgo(90), actor: 'M. Chen' },
    ],
  },
  {
    id: 'CASE-86',
    title: 'Request: webhook signature rotation docs',
    status: 'Triage',
    severity: 'low',
    assignee: 'unassigned',
    openedAt: minutesAgo(1100),
    context: [
      { label: 'Customer', value: 'Fabrikam (growth)' },
      { label: 'Channel', value: 'In-app' },
      { label: 'Linked incident', value: '—' },
      { label: 'Affected surface', value: 'docs' },
    ],
    timeline: [{ label: 'Case opened', at: minutesAgo(1100), actor: 'system' }],
  },
  {
    id: 'CASE-85',
    title: 'API rate limits hit during checkout incident',
    status: 'Investigating',
    severity: 'medium',
    assignee: 'J. Okafor',
    openedAt: minutesAgo(700),
    context: [
      { label: 'Customer', value: 'Contoso (enterprise)' },
      { label: 'Channel', value: 'Slack shared channel' },
      { label: 'Linked incident', value: 'INC-311' },
      { label: 'Affected surface', value: 'public API' },
    ],
    timeline: [
      { label: 'Case opened', at: minutesAgo(700), actor: 'system' },
      { label: 'Correlated with retry storm traffic', at: minutesAgo(400), actor: 'J. Okafor' },
    ],
  },
  {
    id: 'CASE-84',
    title: 'SSO login loop for one workspace',
    status: 'Triage',
    severity: 'high',
    assignee: 'unassigned',
    openedAt: minutesAgo(150),
    context: [
      { label: 'Customer', value: 'Initech (enterprise)' },
      { label: 'Channel', value: 'Email → support@' },
      { label: 'Linked incident', value: '—' },
      { label: 'Affected surface', value: 'auth / SSO' },
    ],
    timeline: [{ label: 'Case opened', at: minutesAgo(150), actor: 'system' }],
  },
]

/* ---------- Screens 34–39: Status Pages ---------- */

export type SiteLiveStatus = 'operational' | 'degraded' | 'outage'

export interface StatusSite {
  id: string
  name: string
  visibility: 'public' | 'customer' | 'internal'
  /** Public path shown on the status page (subdomain or custom host) */
  url: string
  live: SiteLiveStatus
  subscribers: number
  customDomain: string | null
  customDomainStatus: 'Active' | 'Pending' | null
  lastUpdatedAt: number
}

export const LIVE_STATUS_LABEL: Record<SiteLiveStatus, string> = {
  operational: 'Operational',
  degraded: 'Degraded Performance',
  outage: 'Partial Outage',
}

export const sites: StatusSite[] = [
  {
    id: 'acme-ops',
    name: 'Acme Operations',
    visibility: 'public',
    url: 'status.rtifact.io/acme',
    live: 'degraded',
    subscribers: 1841,
    customDomain: 'status.acme.com',
    customDomainStatus: 'Active',
    lastUpdatedAt: minutesAgo(58),
  },
  {
    id: 'internal',
    name: 'Internal Platform Status',
    visibility: 'internal',
    url: 'status.rtifact.io/platform',
    live: 'operational',
    subscribers: 214,
    customDomain: null,
    customDomainStatus: null,
    lastUpdatedAt: minutesAgo(180),
  },
  {
    id: 'staging',
    name: 'Staging Status',
    visibility: 'customer',
    url: 'status.rtifact.io/staging',
    live: 'outage',
    subscribers: 12,
    customDomain: null,
    customDomainStatus: null,
    lastUpdatedAt: minutesAgo(1440),
  },
]

const CUSTOM_SITES_STORAGE_KEY = 'rtifact:custom-sites'

function loadCustomSites(): StatusSite[] {
  try {
    const raw = localStorage.getItem(CUSTOM_SITES_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Array<StatusSite & { visibility: string }>
      return parsed.map((s) => ({
        ...s,
        visibility: (s.visibility === 'private' ? 'internal' : s.visibility) as StatusSite['visibility'],
      }))
    }
  } catch {
    // localStorage unavailable — sites created this session still work via the in-memory push below
  }
  return []
}

// Hydrate any sites created in a previous session so SiteDetailPage/PublicStatusPage can find them
sites.push(...loadCustomSites().filter((s) => !sites.some((existing) => existing.id === s.id)))

/** Registers a newly created status site so SiteDetailPage / PublicStatusPage can render it immediately. */
export function addSite(site: StatusSite) {
  if (sites.some((s) => s.id === site.id)) return
  sites.push(site)
  try {
    localStorage.setItem(CUSTOM_SITES_STORAGE_KEY, JSON.stringify([...loadCustomSites(), site]))
  } catch {
    // localStorage unavailable — the site still works for the rest of this session
  }
}

/** Patches an existing site's record (e.g. visibility) in place, persisting the change if it was custom-created. */
export function updateSite(id: string, patch: Partial<StatusSite>) {
  const idx = sites.findIndex((s) => s.id === id)
  if (idx === -1) return
  sites[idx] = { ...sites[idx], ...patch }
  try {
    const custom = loadCustomSites()
    const customIdx = custom.findIndex((s) => s.id === id)
    if (customIdx !== -1) {
      custom[customIdx] = sites[idx]
      localStorage.setItem(CUSTOM_SITES_STORAGE_KEY, JSON.stringify(custom))
    }
  } catch {
    // localStorage unavailable — the change still applies for the rest of this session
  }
}

/* ---------- Service Registry: reusable groups & services, selected onto status pages ---------- */

export interface RegistryService {
  id: string
  name: string
  type: string
  env: string
  path: string
  health: string
  platformServiceIds: string[]
  // Every service is built from one of two sources — one or more Asset Graph
  // entries, or one or more Monitored Endpoints, rolled up by healthStrategy.
  source: 'asset' | 'endpoint'
  sourceRefs: string[]
  healthStrategy: 'worst' | 'average'
  monitoring: { latency: boolean; ssl: boolean }
}

export interface ServiceGroup {
  id: string
  name: string
  description: string
  health: string
  /** Status sites that currently display this group */
  siteIds: string[]
  services: RegistryService[]
}

const defaultServiceGroups: ServiceGroup[] = [
  {
    id: 'customer-apps',
    name: 'Customer Applications',
    description: 'User-facing APIs and web interfaces',
    health: 'Partial Outage',
    siteIds: ['acme-ops'],
    services: [
      { id: 'checkout-api', name: 'Checkout API', type: 'API', env: 'prod', path: 'checkout-api', health: 'Degraded Performance', platformServiceIds: ['checkout-svc'], source: 'asset', sourceRefs: ['asset-checkout-api'], healthStrategy: 'worst', monitoring: { latency: true, ssl: true } },
      { id: 'payment-service', name: 'Payment Service', type: 'API', env: 'prod', path: 'payment-api', health: 'Partial Outage', platformServiceIds: ['payments-api'], source: 'asset', sourceRefs: ['asset-payment-api', 'asset-stripe'], healthStrategy: 'worst', monitoring: { latency: true, ssl: true } },
      { id: 'web-app', name: 'Web App', type: 'Web App', env: 'prod', path: 'web-app', health: 'Operational', platformServiceIds: [], source: 'asset', sourceRefs: ['asset-user-portal', 'asset-admin-dashboard'], healthStrategy: 'worst', monitoring: { latency: true, ssl: true } },
    ],
  },
  {
    id: 'databases',
    name: 'Databases',
    description: 'Primary data stores and caches',
    health: 'Operational',
    siteIds: ['acme-ops', 'internal'],
    services: [
      { id: 'postgresql', name: 'PostgreSQL', type: 'Database', env: 'prod', path: 'cnpg-postgres', health: 'Operational', platformServiceIds: ['orders-db'], source: 'asset', sourceRefs: ['asset-orders-db'], healthStrategy: 'worst', monitoring: { latency: true, ssl: true } },
    ],
  },
  {
    id: 'queues',
    name: 'Messaging / Queues',
    description: 'Event streaming and async processing',
    health: 'Operational',
    siteIds: ['internal'],
    services: [
      { id: 'kafka', name: 'Kafka', type: 'Queue', env: 'prod', path: 'kafka-cluster', health: 'Operational', platformServiceIds: [], source: 'asset', sourceRefs: ['asset-kafka-cluster'], healthStrategy: 'worst', monitoring: { latency: true, ssl: true } },
    ],
  },
]

const SERVICE_REGISTRY_STORAGE_KEY = 'rtifact:service-registry'

/** The Service Registry is the single source of truth for groups & services — both the Registry tab and every status page's component picker read/write here. */
export function getServiceGroups(): ServiceGroup[] {
  try {
    const raw = localStorage.getItem(SERVICE_REGISTRY_STORAGE_KEY)
    if (raw) return JSON.parse(raw) as ServiceGroup[]
  } catch {
    // localStorage unavailable or corrupt entry — fall through to seed default
  }
  return defaultServiceGroups
}

export function saveServiceGroups(groups: ServiceGroup[]) {
  try {
    localStorage.setItem(SERVICE_REGISTRY_STORAGE_KEY, JSON.stringify(groups))
  } catch {
    // localStorage unavailable — edits still apply for the current session via component state
  }
}

/** Maps a Service Registry health string onto the coarser public-page health tier. */
export function normalizeHealth(health: string): ComponentHealth {
  if (health === 'Partial Outage' || health === 'Major Outage') return 'outage'
  if (health === 'Degraded Performance') return 'degraded'
  return 'operational'
}

function hashString(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

/** Deterministic 90-day tick history synthesized from a service's current health — the registry doesn't track real point-in-time history. */
export function serviceHistory(service: RegistryService): ComponentHealth[] {
  const current = normalizeHealth(service.health)
  const hash = hashString(service.id)
  return Array.from({ length: 90 }, (_, i) => {
    if (i < 3) return current
    if ((hash + i * 7) % 37 === 0) return 'degraded'
    return 'operational'
  })
}

export function serviceLatencyMs(service: RegistryService): number {
  return 8 + (hashString(service.id) % 180)
}

/** A status page's ordered selection of registry groups/services — see resolvePageEntries. */
export type PageEntryType = 'group' | 'service'

export interface PageEntry {
  type: PageEntryType
  /** ServiceGroup.id (type 'group') or RegistryService.id (type 'service') */
  refId: string
}

export interface ResolvedGroupEntry {
  type: 'group'
  group: ServiceGroup
}

export interface ResolvedServiceEntry {
  type: 'service'
  service: RegistryService
}

export type ResolvedPageEntry = ResolvedGroupEntry | ResolvedServiceEntry

/** Resolves a page's stored entries against the live registry, dropping any that reference a deleted group/service. */
export function resolvePageEntries(entries: PageEntry[], groups: ServiceGroup[]): ResolvedPageEntry[] {
  const groupById = new Map(groups.map((g) => [g.id, g]))
  const serviceById = new Map(groups.flatMap((g) => g.services.map((s) => [s.id, s] as const)))
  const resolved: ResolvedPageEntry[] = []
  for (const e of entries) {
    if (e.type === 'group') {
      const g = groupById.get(e.refId)
      if (g) resolved.push({ type: 'group', group: g })
    } else {
      const s = serviceById.get(e.refId)
      if (s) resolved.push({ type: 'service', service: s })
    }
  }
  return resolved
}

/** Flattens resolved entries down to the services they contain, in order. */
export function servicesFromResolvedEntries(resolved: ResolvedPageEntry[]): RegistryService[] {
  return resolved.flatMap((e) => (e.type === 'group' ? e.group.services : [e.service]))
}

export interface SiteIncident {
  id: string
  title: string
  publicUpdate: string
  linkedIncident: string | null
  postedAt: number
  resolved: boolean
}

export const siteIncidents: Record<string, SiteIncident[]> = {
  'acme-ops': [
    {
      id: 'PUB-42',
      title: 'Elevated checkout errors',
      publicUpdate: 'We are seeing elevated error rates on checkout. A fix is being applied; most customers are unaffected.',
      linkedIncident: 'INC-311',
      postedAt: minutesAgo(18),
      resolved: false,
    },
    {
      id: 'PUB-41',
      title: 'CDN cache degradation',
      publicUpdate: 'Static asset delivery was slower than normal for ~40 minutes. Fully recovered.',
      linkedIncident: 'INC-305',
      postedAt: minutesAgo(1500),
      resolved: true,
    },
  ],
  internal: [],
  staging: [
    {
      id: 'PUB-40',
      title: 'Staging environment unstable',
      publicUpdate: 'Load testing is saturating staging ingress. QA pipelines paused.',
      linkedIncident: 'INC-402',
      postedAt: minutesAgo(9),
      resolved: false,
    },
  ],
}

export interface StatusSubscriber {
  id: string
  email: string
  siteId: string
  componentIds: string[]
  firstSubscribedAt: number
  lastNotificationAt: number | null
}

/** Flat subscriber list — SitesPage (fleet) and SiteDetailPage (per-site) both read this. */
export const statusSubscribers: StatusSubscriber[] = [
  {
    id: 'sub-1',
    email: 'noc@northwind.com',
    siteId: 'acme-ops',
    componentIds: ['checkout-api', 'payment-service', 'web-app', 'postgresql'],
    firstSubscribedAt: minutesAgo(80000),
    lastNotificationAt: minutesAgo(90),
  },
  {
    id: 'sub-2',
    email: 'ops-alerts@contoso.com',
    siteId: 'acme-ops',
    componentIds: ['checkout-api', 'payment-service'],
    firstSubscribedAt: minutesAgo(51000),
    lastNotificationAt: minutesAgo(90),
  },
  {
    id: 'sub-3',
    email: 'sre@fabrikam.io',
    siteId: 'acme-ops',
    componentIds: ['web-app', 'postgresql'],
    firstSubscribedAt: minutesAgo(22000),
    lastNotificationAt: minutesAgo(1500),
  },
  {
    id: 'sub-4',
    email: 'platform@acme.com',
    siteId: 'acme-ops',
    componentIds: ['checkout-api', 'payment-service', 'web-app', 'postgresql'],
    firstSubscribedAt: minutesAgo(120000),
    lastNotificationAt: minutesAgo(90),
  },
  {
    id: 'sub-5',
    email: 'eng-leads@rtifact.app',
    siteId: 'internal',
    componentIds: ['postgresql', 'kafka'],
    firstSubscribedAt: minutesAgo(90000),
    lastNotificationAt: minutesAgo(3200),
  },
  {
    id: 'sub-6',
    email: 'oncall@rtifact.app',
    siteId: 'internal',
    componentIds: ['postgresql', 'kafka'],
    firstSubscribedAt: minutesAgo(90000),
    lastNotificationAt: minutesAgo(3200),
  },
  {
    id: 'sub-7',
    email: 'infra@rtifact.app',
    siteId: 'internal',
    componentIds: ['kafka'],
    firstSubscribedAt: minutesAgo(45000),
    lastNotificationAt: null,
  },
  {
    id: 'sub-8',
    email: 'qa@rtifact.app',
    siteId: 'staging',
    componentIds: ['checkout-api', 'web-app'],
    firstSubscribedAt: minutesAgo(40000),
    lastNotificationAt: minutesAgo(9),
  },
  {
    id: 'sub-9',
    email: 'release-train@rtifact.app',
    siteId: 'staging',
    componentIds: ['checkout-api', 'payment-service', 'web-app'],
    firstSubscribedAt: minutesAgo(18000),
    lastNotificationAt: minutesAgo(9),
  },
  {
    id: 'sub-10',
    email: 'status-watch@partner.io',
    siteId: 'acme-ops',
    componentIds: ['payment-service'],
    firstSubscribedAt: minutesAgo(6000),
    lastNotificationAt: minutesAgo(90),
  },
]

/** Full per-site subscribers (for edit-mode Subscribers tab). */
export function statusSubscribersForSite(siteId: string): StatusSubscriber[] {
  return statusSubscribers.filter((s) => s.siteId === siteId)
}

/** Per-site slice used by PublicStatusPage. */
export function subscribersForSite(siteId: string): { email: string; addedAt: number }[] {
  return statusSubscribersForSite(siteId).map((s) => ({ email: s.email, addedAt: s.firstSubscribedAt }))
}

export type MaintenanceStatus = 'Scheduled' | 'In Progress' | 'Completed'

export interface MaintenanceUpdate {
  id: string
  time: string
  message: string
}

export interface MaintenanceWindow {
  id: string
  siteId: string
  title: string
  status: MaintenanceStatus
  affectedComponents: string[]
  scheduledStart: string
  scheduledEnd: string
  description: string
  /** Short public blurb (status page / detail list) */
  scope: string
  startsInHours: number
  durationMin: number
  updates: MaintenanceUpdate[]
}

/** Flat maintenance list — fleet UI and per-site detail both read this. */
export const maintenanceList: MaintenanceWindow[] = [
  {
    id: 'maint-1',
    siteId: 'acme-ops',
    title: 'Database failover testing',
    status: 'In Progress',
    affectedComponents: ['PostgreSQL'],
    scheduledStart: 'Jul 13, 4:00 PM',
    scheduledEnd: 'Jul 13, 5:00 PM',
    description: 'Testing automatic failover to the standby replica. Brief connection drops may occur.',
    scope: 'checkout may queue briefly',
    startsInHours: 0,
    durationMin: 60,
    updates: [
      { id: 'mu-1', time: 'Jul 13, 4:02 PM', message: 'Maintenance is now in progress. We are running failover tests against the standby database.' },
    ],
  },
  {
    id: 'maint-2',
    siteId: 'acme-ops',
    title: 'Checkout API version upgrade',
    status: 'Scheduled',
    affectedComponents: ['Checkout API', 'Payment Service'],
    scheduledStart: 'Jul 16, 2:00 AM',
    scheduledEnd: 'Jul 16, 3:30 AM',
    description: 'Rolling upgrade to the latest checkout service runtime. No downtime expected, but latency may briefly increase.',
    scope: 'checkout may queue briefly',
    startsInHours: 52,
    durationMin: 90,
    updates: [
      { id: 'mu-2', time: 'Jul 12, 11:00 AM', message: 'This maintenance window has been scheduled and will appear on affected status pages.' },
    ],
  },
  {
    id: 'maint-3',
    siteId: 'acme-ops',
    title: 'Web app dependency upgrade',
    status: 'Scheduled',
    affectedComponents: ['Web App'],
    scheduledStart: 'Jul 18, 3:00 AM',
    scheduledEnd: 'Jul 18, 3:30 AM',
    description: 'Routine dependency upgrade for the customer-facing web app. No customer impact expected.',
    scope: 'no expected customer impact',
    startsInHours: 96,
    durationMin: 30,
    updates: [
      { id: 'mu-3', time: 'Jul 13, 9:00 AM', message: 'This maintenance window has been scheduled and will appear on affected status pages.' },
    ],
  },
  {
    id: 'maint-4',
    siteId: 'acme-ops',
    title: 'Kafka broker patching',
    status: 'Completed',
    affectedComponents: ['Kafka'],
    scheduledStart: 'Jul 10, 1:00 AM',
    scheduledEnd: 'Jul 10, 1:45 AM',
    description: 'Security patching across the Kafka broker cluster, performed one node at a time.',
    scope: 'rolling, no expected impact',
    startsInHours: -72,
    durationMin: 45,
    updates: [
      { id: 'mu-4', time: 'Jul 10, 1:41 AM', message: 'Patching completed successfully across all brokers with no customer impact.' },
      { id: 'mu-5', time: 'Jul 10, 1:00 AM', message: 'Maintenance has started. Brokers are being patched in a rolling fashion.' },
    ],
  },
  {
    id: 'maint-5',
    siteId: 'acme-ops',
    title: 'Payment service dependency rotation',
    status: 'Completed',
    affectedComponents: ['Payment Service'],
    scheduledStart: 'Jul 6, 2:00 AM',
    scheduledEnd: 'Jul 6, 2:20 AM',
    description: 'Rotated third-party payment provider credentials as part of routine security hygiene.',
    scope: 'no service interruption',
    startsInHours: -168,
    durationMin: 20,
    updates: [
      { id: 'mu-6', time: 'Jul 6, 2:18 AM', message: 'Credential rotation completed with no service interruption.' },
    ],
  },
  {
    id: 'MW-8',
    siteId: 'internal',
    title: 'K8s 1.32 upgrade — prod clusters',
    status: 'Scheduled',
    affectedComponents: ['K8s Prod Cluster'],
    scheduledStart: 'Jul 15, 1:00 AM',
    scheduledEnd: 'Jul 15, 2:30 AM',
    description: 'Rolling Kubernetes control-plane and node upgrade across production clusters.',
    scope: 'rolling, no expected impact',
    startsInHours: 26,
    durationMin: 90,
    updates: [
      { id: 'mu-8', time: 'Jul 12, 10:00 AM', message: 'This maintenance window has been scheduled and will appear on affected status pages.' },
    ],
  },
  {
    id: 'maint-6',
    siteId: 'acme-ops',
    title: 'PostgreSQL minor version upgrade',
    status: 'Completed',
    affectedComponents: ['PostgreSQL'],
    scheduledStart: 'Jun 29, 1:00 AM',
    scheduledEnd: 'Jun 29, 1:30 AM',
    description: 'Upgraded the primary database to the latest minor release for security patches.',
    scope: 'connections recovered automatically',
    startsInHours: -360,
    durationMin: 30,
    updates: [
      { id: 'mu-7', time: 'Jun 29, 1:26 AM', message: 'Upgrade completed successfully. All connections recovered automatically.' },
    ],
  },
]

export function maintenanceForSite(siteId: string): MaintenanceWindow[] {
  return maintenanceList.filter((m) => m.siteId === siteId)
}

/** Upcoming / in-progress windows for the public status page. */
export function maintenanceWindows(siteId: string): MaintenanceWindow[] {
  return maintenanceForSite(siteId).filter((m) => m.status === 'Scheduled' || m.status === 'In Progress')
}

/* ---------- Public status page: templates, branding & component health ---------- */

export type StatusTemplate = 'minimal' | 'banner' | 'dashboard' | 'grouped'
export type MonitorDetailLevel = 'tick' | 'timeline' | 'hover'
export type PageTheme = 'light' | 'dark' | 'system'
export type ComponentHealth = 'operational' | 'degraded' | 'outage'

export interface HeaderLink {
  label: string
  url: string
}

export interface PublicPageConfig {
  template: StatusTemplate
  theme: PageTheme
  monitorDetailLevel: MonitorDetailLevel
  /** Data URI of an uploaded image, or null to fall back to the initial-letter badge */
  logoImageUrl: string | null
  faviconImageUrl: string | null
  headerLinks: HeaderLink[]
  subscribeEnabled: boolean
  showAttribution: boolean
  welcomeMessage: string
  /** Ordered, flat selection of Service Registry groups & individual services to show on this page */
  entries: PageEntry[]
}

export const publicPageConfigs: Record<string, PublicPageConfig> = {
  'acme-ops': {
    template: 'banner',
    theme: 'dark',
    monitorDetailLevel: 'timeline',
    logoImageUrl: null,
    faviconImageUrl: null,
    headerLinks: [{ label: 'Website', url: 'https://acme.com' }],
    subscribeEnabled: true,
    showAttribution: true,
    welcomeMessage: '',
    entries: [
      { type: 'group', refId: 'customer-apps' },
      { type: 'group', refId: 'databases' },
    ],
  },
  internal: {
    template: 'dashboard',
    theme: 'dark',
    monitorDetailLevel: 'hover',
    logoImageUrl: null,
    faviconImageUrl: null,
    headerLinks: [],
    subscribeEnabled: false,
    showAttribution: true,
    welcomeMessage: 'Internal platform health — visible to Rtifact employees only.',
    entries: [
      { type: 'group', refId: 'databases' },
      { type: 'service', refId: 'checkout-api' },
      { type: 'group', refId: 'queues' },
    ],
  },
  staging: {
    template: 'minimal',
    theme: 'light',
    monitorDetailLevel: 'tick',
    logoImageUrl: null,
    faviconImageUrl: null,
    headerLinks: [{ label: 'Get in touch', url: 'mailto:qa@rtifact.app' }],
    subscribeEnabled: true,
    showAttribution: true,
    welcomeMessage: '',
    entries: [
      { type: 'service', refId: 'web-app' },
      { type: 'service', refId: 'checkout-api' },
    ],
  },
}

const PUBLIC_CONFIG_STORAGE_PREFIX = 'rtifact:site-config:'

export function getPublicPageConfig(siteId: string): PublicPageConfig {
  try {
    const raw = localStorage.getItem(`${PUBLIC_CONFIG_STORAGE_PREFIX}${siteId}`)
    if (raw) {
      const parsed = JSON.parse(raw) as PublicPageConfig
      // Guards against an older schema (e.g. a pre-registry `groups` shape) left over in localStorage.
      if (Array.isArray(parsed.entries)) return parsed
    }
  } catch {
    // localStorage unavailable or corrupt entry — fall through to seed default
  }
  return publicPageConfigs[siteId] ?? publicPageConfigs['acme-ops']
}

export function savePublicPageConfig(siteId: string, config: PublicPageConfig) {
  try {
    localStorage.setItem(`${PUBLIC_CONFIG_STORAGE_PREFIX}${siteId}`, JSON.stringify(config))
  } catch {
    // localStorage unavailable — edits still apply for the current session via component state
  }
}

/** Open incident + component counts for the fleet table. */
export function getSiteListStats(siteId: string): { incidents: number; components: number } {
  const incidents = (siteIncidents[siteId] ?? []).filter((i) => !i.resolved).length
  const config = getPublicPageConfig(siteId)
  const resolved = resolvePageEntries(config.entries, getServiceGroups())
  const components = servicesFromResolvedEntries(resolved).length
  return { incidents, components }
}
