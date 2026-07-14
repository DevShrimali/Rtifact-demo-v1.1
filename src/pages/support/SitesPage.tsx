import { useEffect, useState } from 'react'
import { Link, useMatch, useNavigate, useSearchParams } from 'react-router-dom'
import * as Popover from '@radix-ui/react-popover'
import { getAllIncidents, type Incident } from '../../mock/incidents'
import { getAssets } from '../../mock/assets'
import { getSyntheticChecks, type SyntheticCheck } from '../../mock/telemetry'
import {
  LIVE_STATUS_LABEL,
  addSite,
  getServiceGroups,
  getSiteListStats,
  maintenanceList as seedMaintenanceList,
  resolvePageEntries,
  savePublicPageConfig,
  saveServiceGroups,
  servicesFromResolvedEntries,
  sites as seedSites,
  statusSubscribers,
  type MaintenanceWindow,
  type PublicPageConfig,
  type RegistryService,
  type ServiceGroup,
  type StatusSite,
  type StatusSubscriber,
} from '../../mock/support'
import { PublicPageBrandingFields } from '../../components/PublicPageBrandingFields'
import { PublicPageContentFields } from '../../components/PublicPageContentFields'
import { PublicPagePreview } from '../../components/PublicPagePreview'
import { SiteVisibilityPicker, VISIBILITY_LABEL } from '../../components/SiteVisibilityPicker'
import {
  Globe,
  Plus,
  AlertTriangle,
  Users,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Database,
  Sliders,
  Download,
  ArrowUp,
  ArrowDown,
  Clock,
  Calendar,
  CheckCircle,
  ShieldCheck,
  Zap,
  Loader2,
  XCircle,
  Trash2,
  RefreshCw,
  Copy,
  Check,
  Circle,
  Boxes,
  Activity,
  Search,
  Mail,
  X,
} from 'lucide-react'
import { ListSkeleton, useEnvLoad } from '../../components/PageLoad'
import { Select } from '../../components/Select'
import { DateTimePicker } from '../../components/DateTimePicker'
import { Switch } from '../../components/Switch'
import { MultiSelect } from '../../components/MultiSelect'
import { TimeAgo } from '../../components/TimeAgo'
import { StatusSiteBasicsFields } from '../../components/StatusSiteBasicsForm'

export interface StatusSiteItem {
  id: string
  name: string
  url: string
  status: string
  statusType: string
  visibility: string
  incidents: number
  components: number
  subscribers: number
  customDomain: string | null
  customDomainStatus: string | null
  lastUpdatedAt: number
}

function siteToListItem(s: StatusSite): StatusSiteItem {
  const stats = getSiteListStats(s.id)
  return {
    id: s.id,
    name: s.name,
    url: s.url,
    status: LIVE_STATUS_LABEL[s.live],
    statusType: s.live,
    visibility: VISIBILITY_LABEL[s.visibility],
    incidents: stats.incidents,
    components: stats.components,
    subscribers: s.subscribers,
    customDomain: s.customDomain,
    customDomainStatus: s.customDomainStatus,
    lastUpdatedAt: s.lastUpdatedAt,
  }
}

type TopTab = 'sites' | 'registry' | 'incidents' | 'maintenance' | 'domains' | 'subscribers'

type SortDir = 'asc' | 'desc'

type SitesSortKey = 'name' | 'status' | 'visibility' | 'incidents' | 'components' | 'subscribers' | 'customDomain' | 'lastUpdated'
type SubscribersSortKey = 'email' | 'siteName' | 'components' | 'firstSubscribedAt' | 'lastNotificationAt'

export function SitesPage() {
  const loading = useEnvLoad()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const isCreating = Boolean(useMatch({ path: '/support/status-pages/new', end: true }))

  // Local state for sites list (allows adding/deleting) — seeded from shared mock
  const [sites, setSites] = useState<StatusSiteItem[]>(() => seedSites.map(siteToListItem))

  // Empty state from Screen State widget (`?state=empty`)
  const isEmpty = searchParams.get('state') === 'empty'

  // Top Tabs
  const [activeTab, setActiveTab] = useState<TopTab>('sites')

  // Status Sites table sort
  const [sitesSortKey, setSitesSortKey] = useState<SitesSortKey>('name')
  const [sitesSortDir, setSitesSortDir] = useState<SortDir>('asc')

  // Subscribers tab state — shared mock; resolve site names from current sites list
  const [subscribers] = useState<StatusSubscriber[]>(statusSubscribers)
  const siteNameById = Object.fromEntries(sites.map((s) => [s.id, s.name]))
  const [subSearch, setSubSearch] = useState('')
  const [subSiteFilter, setSubSiteFilter] = useState('all')
  const [subComponentFilter, setSubComponentFilter] = useState<string[]>([])
  const [subsSortKey, setSubsSortKey] = useState<SubscribersSortKey>('email')
  const [subsSortDir, setSubsSortDir] = useState<SortDir>('asc')

  // Form states for Create Status Page (shared Structure basics)
  const [formName, setFormName] = useState('')
  const [formSubdomain, setFormSubdomain] = useState('')
  const [formLogoUrl, setFormLogoUrl] = useState('')
  const [formContactUrl, setFormContactUrl] = useState('')
  const [formVisibility, setFormVisibility] = useState<StatusSite['visibility']>('public')
  const [formLanguage, setFormLanguage] = useState('en')
  const [showAdvanced, setShowAdvanced] = useState(false)

  const defaultPublicPageConfig = (): PublicPageConfig => ({
    template: 'minimal',
    theme: 'dark',
    monitorDetailLevel: 'timeline',
    logoImageUrl: null,
    faviconImageUrl: null,
    headerLinks: [],
    subscribeEnabled: true,
    showAttribution: true,
    welcomeMessage: '',
    entries: [],
  })

  // Template, theme, detail level, branding, header links, components — everything
  // needed to render the public page, authored up front at creation time.
  const [formConfig, setFormConfig] = useState<PublicPageConfig>(defaultPublicPageConfig)
  const updateFormConfig = (patch: Partial<PublicPageConfig>) => setFormConfig((prev) => ({ ...prev, ...patch }))

  // Handle form submit
  const handleCreateSite = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName.trim() || !formSubdomain.trim()) return

    const id = formSubdomain.trim().toLowerCase()
    const url = `status.rtifact.io/${id}`
    const componentCount = servicesFromResolvedEntries(resolvePageEntries(formConfig.entries, serviceGroups)).length

    const newSite: StatusSiteItem = {
      id,
      name: formName.trim(),
      url,
      status: 'Operational',
      statusType: 'operational',
      visibility: VISIBILITY_LABEL[formVisibility],
      incidents: 0,
      components: componentCount,
      subscribers: 0,
      customDomain: null,
      customDomainStatus: null,
      lastUpdatedAt: Date.now(),
    }

    setSites((prev) => [newSite, ...prev])

    // Register with the shared mock/support.ts model so SiteDetailPage / PublicStatusPage
    // can find and render this site immediately (not just show it in this table).
    addSite({
      id,
      name: formName.trim(),
      visibility: formVisibility,
      url,
      live: 'operational',
      subscribers: 0,
      customDomain: null,
      customDomainStatus: null,
      lastUpdatedAt: Date.now(),
    })
    savePublicPageConfig(id, formConfig)

    // Reset form
    setFormName('')
    setFormSubdomain('')
    setFormLogoUrl('')
    setFormContactUrl('')
    setFormVisibility('public')
    setFormLanguage('en')
    setShowAdvanced(false)
    setFormConfig(defaultPublicPageConfig())
    navigate(`/support/status-pages/${id}`)
  }

  // Derived stats
  const activeList = isEmpty ? [] : sites
  const totalSites = activeList.length
  const activeIncidents = activeList.reduce((acc, s) => acc + s.incidents, 0)
  const totalSubscribers = activeList.reduce((acc, s) => acc + s.subscribers, 0)
  const customDomains = activeList.filter((s) => s.customDomain).length

  const toggleSitesSort = (key: SitesSortKey) => {
    if (sitesSortKey === key) setSitesSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSitesSortKey(key)
      setSitesSortDir('asc')
    }
  }

  const toggleSubsSort = (key: SubscribersSortKey) => {
    if (subsSortKey === key) setSubsSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSubsSortKey(key)
      setSubsSortDir('asc')
    }
  }

  const exportSubscribersCsv = () => {
    const componentNameById = Object.fromEntries(
      serviceGroups.flatMap((g) => g.services.map((svc) => [svc.id, svc.name]))
    )
    const rows = (isEmpty ? [] : subscribers).filter((sub) => {
      const q = subSearch.trim().toLowerCase()
      if (q && !sub.email.toLowerCase().includes(q)) return false
      if (subSiteFilter !== 'all' && sub.siteId !== subSiteFilter) return false
      if (subComponentFilter.length > 0 && !subComponentFilter.some((id) => sub.componentIds.includes(id))) return false
      return true
    })

    const escape = (value: string) => {
      if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`
      return value
    }
    const toIso = (ts: number | null) => (ts == null ? '' : new Date(ts).toISOString())

    const header = ['Email', 'Status Site', 'Components', 'Component Count', 'First Subscribed', 'Last Notification']
    const lines = [
      header.join(','),
      ...rows.map((sub) => {
        const names = sub.componentIds.map((id) => componentNameById[id] ?? id).join('; ')
        return [
          escape(sub.email),
          escape(siteNameById[sub.siteId] ?? sub.siteId),
          escape(names),
          String(sub.componentIds.length),
          toIso(sub.firstSubscribedAt),
          toIso(sub.lastNotificationAt),
        ].join(',')
      }),
    ]

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `subscribers-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const sortedSites = [...activeList].sort((a, b) => {
    const dir = sitesSortDir === 'asc' ? 1 : -1
    const cmp = (x: string | number, y: string | number) => {
      if (typeof x === 'number' && typeof y === 'number') return (x - y) * dir
      return String(x).localeCompare(String(y), undefined, { sensitivity: 'base' }) * dir
    }
    switch (sitesSortKey) {
      case 'name': return cmp(a.name, b.name)
      case 'status': return cmp(a.status, b.status)
      case 'visibility': return cmp(a.visibility, b.visibility)
      case 'incidents': return cmp(a.incidents, b.incidents)
      case 'components': return cmp(a.components, b.components)
      case 'subscribers': return cmp(a.subscribers, b.subscribers)
      case 'customDomain': return cmp(a.customDomain ?? '', b.customDomain ?? '')
      case 'lastUpdated': return cmp(a.lastUpdatedAt, b.lastUpdatedAt)
      default: return 0
    }
  })

  // Service Registry State — persisted so the status page builder's group/service
  // picker (PublicPageContentFields) sees the same data this tab edits.
  const [serviceGroups, setServiceGroups] = useState<ServiceGroup[]>(getServiceGroups)

  useEffect(() => {
    saveServiceGroups(serviceGroups)
  }, [serviceGroups])

  // Collapsed groups state
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({
    'customer-apps': false,
    'databases': false,
    'queues': false,
  })

  // Modal & Drawer State
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false)
  const [selectedService, setSelectedService] = useState<RegistryService | null>(null)
  const [selectedServiceGroupId, setSelectedServiceGroupId] = useState<string | null>(null)
  const [showServiceDrawer, setShowServiceDrawer] = useState(false)

  // Deep linking — ?service=<id> opens that service's detail drawer directly
  const openServiceDetail = (groupId: string, svc: RegistryService) => {
    setSelectedService(svc)
    setSelectedServiceGroupId(groupId)
    setShowServiceDrawer(true)
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('tab', 'registry')
      next.set('service', svc.id)
      return next
    })
  }

  const closeServiceDetail = () => {
    setShowServiceDrawer(false)
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.delete('service')
      return next
    })
  }

  // Form fields for creating service group
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupDesc, setNewGroupDesc] = useState('')

  // Reorder services within a group
  const moveServiceUp = (groupId: string, svcIdx: number) => {
    if (svcIdx === 0) return
    setServiceGroups((prev) =>
      prev.map((group) => {
        if (group.id !== groupId) return group
        const services = [...group.services]
        const temp = services[svcIdx]
        services[svcIdx] = services[svcIdx - 1]
        services[svcIdx - 1] = temp
        return { ...group, services }
      })
    )
  }

  const moveServiceDown = (groupId: string, svcIdx: number) => {
    setServiceGroups((prev) =>
      prev.map((group) => {
        if (group.id !== groupId) return group
        if (svcIdx >= group.services.length - 1) return group
        const services = [...group.services]
        const temp = services[svcIdx]
        services[svcIdx] = services[svcIdx + 1]
        services[svcIdx + 1] = temp
        return { ...group, services }
      })
    )
  }

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newGroupName.trim()) return

    const newGroup = {
      id: newGroupName.toLowerCase().replace(/\s+/g, '-'),
      name: newGroupName,
      description: newGroupDesc,
      health: 'Operational',
      siteIds: [] as string[],
      services: [] as typeof serviceGroups[number]['services'],
    }

    setServiceGroups((prev) => [...prev, newGroup])
    setShowCreateGroupModal(false)

    // Reset Form
    setNewGroupName('')
    setNewGroupDesc('')
  }

  // Add/Edit/Remove Service State — sourced from either the Asset Graph or Monitored Endpoints
  const allAssets = getAssets()
  const allChecks = getSyntheticChecks('prod-us')

  const [showServiceFormModal, setShowServiceFormModal] = useState(false)
  const [serviceFormMode, setServiceFormMode] = useState<'add' | 'edit'>('add')
  const [serviceFormGroupId, setServiceFormGroupId] = useState<string | null>(null)
  const [serviceFormEditingId, setServiceFormEditingId] = useState<string | null>(null)
  const [serviceFormSource, setServiceFormSource] = useState<'asset' | 'endpoint'>('asset')
  const [serviceFormAssetIds, setServiceFormAssetIds] = useState<string[]>([])
  const [serviceFormEndpointIds, setServiceFormEndpointIds] = useState<string[]>([])
  const [serviceFormHealthStrategy, setServiceFormHealthStrategy] = useState<'worst' | 'average'>('worst')
  const [serviceFormName, setServiceFormName] = useState('')
  const [serviceFormMonitorLatency, setServiceFormMonitorLatency] = useState(true)
  const [serviceFormMonitorSsl, setServiceFormMonitorSsl] = useState(true)
  const [serviceFormAdvancedOpen, setServiceFormAdvancedOpen] = useState(false)
  const [removeConfirmOpen, setRemoveConfirmOpen] = useState(false)

  const HEALTH_RANK = { 'Partial Outage': 2, 'Degraded Performance': 1, Operational: 0 } as const

  // Worst-of rollup for asset health (discrete tiers — no meaningful "average" of states)
  const computeAssetHealth = (items: { health: string }[]): string => {
    if (items.length === 0) return 'Operational'
    return items.reduce((worst, item) => {
      const rank = HEALTH_RANK[item.health as keyof typeof HEALTH_RANK] ?? 0
      const worstRank = HEALTH_RANK[worst as keyof typeof HEALTH_RANK] ?? 0
      return rank > worstRank ? item.health : worst
    }, 'Operational')
  }

  const computeEndpointHealth = (checks: SyntheticCheck[], strategy: 'worst' | 'average'): string => {
    if (checks.length === 0) return 'Operational'
    if (strategy === 'worst') {
      if (checks.some((c) => c.status === 'failing')) return 'Partial Outage'
      if (checks.some((c) => c.status === 'degraded')) return 'Degraded Performance'
      return 'Operational'
    }
    const avg = checks.reduce((sum, c) => sum + c.uptimePct, 0) / checks.length
    if (avg < 97) return 'Partial Outage'
    if (avg < 99.5) return 'Degraded Performance'
    return 'Operational'
  }

  const resetServiceForm = () => {
    setServiceFormSource('asset')
    setServiceFormAssetIds([])
    setServiceFormEndpointIds([])
    setServiceFormHealthStrategy('worst')
    setServiceFormName('')
    setServiceFormMonitorLatency(true)
    setServiceFormMonitorSsl(true)
    setServiceFormAdvancedOpen(false)
    setServiceFormEditingId(null)
  }

  const openAddService = (groupId: string) => {
    resetServiceForm()
    setServiceFormMode('add')
    setServiceFormGroupId(groupId)
    setShowServiceFormModal(true)
  }

  const openEditService = (groupId: string, svc: RegistryService) => {
    setServiceFormMode('edit')
    setServiceFormGroupId(groupId)
    setServiceFormEditingId(svc.id)
    setServiceFormSource(svc.source)
    setServiceFormAssetIds(svc.source === 'asset' ? svc.sourceRefs : [])
    setServiceFormEndpointIds(svc.source === 'endpoint' ? svc.sourceRefs : [])
    setServiceFormHealthStrategy(svc.healthStrategy)
    setServiceFormName(svc.name)
    setServiceFormMonitorLatency(svc.monitoring.latency)
    setServiceFormMonitorSsl(svc.monitoring.ssl)
    setServiceFormAdvancedOpen(false)
    setShowServiceFormModal(true)
    setShowServiceDrawer(false)
  }

  const selectedFormAssets = allAssets.filter((a) => serviceFormAssetIds.includes(a.id))
  const selectedFormChecks = allChecks.filter((c) => serviceFormEndpointIds.includes(c.id))

  const handleSubmitServiceForm = (e: React.FormEvent) => {
    e.preventDefault()
    if (!serviceFormGroupId) return
    if (serviceFormSource === 'asset' && selectedFormAssets.length === 0) return
    if (serviceFormSource === 'endpoint' && selectedFormChecks.length === 0) return

    const name = serviceFormName.trim() || (serviceFormSource === 'asset' ? selectedFormAssets[0].name : selectedFormChecks[0].name)

    const builtService: RegistryService = serviceFormSource === 'asset'
      ? {
        id: serviceFormEditingId ?? `svc-${Date.now()}`,
        name,
        type: selectedFormAssets.length === 1 ? selectedFormAssets[0].type : 'Bundled',
        env: selectedFormAssets[0].env,
        path: selectedFormAssets.map((a) => a.id.replace('asset-', '')).join('+'),
        health: computeAssetHealth(selectedFormAssets),
        platformServiceIds: selectedFormAssets.flatMap((a) => a.platformServiceIds),
        source: 'asset',
        sourceRefs: selectedFormAssets.map((a) => a.id),
        healthStrategy: 'worst',
        monitoring: { latency: serviceFormMonitorLatency, ssl: serviceFormMonitorSsl },
      }
      : {
        id: serviceFormEditingId ?? `svc-${Date.now()}`,
        name,
        type: 'Monitored Endpoint',
        env: 'prod',
        path: selectedFormChecks[0].path,
        health: computeEndpointHealth(selectedFormChecks, serviceFormHealthStrategy),
        platformServiceIds: [],
        source: 'endpoint',
        sourceRefs: selectedFormChecks.map((c) => c.id),
        healthStrategy: serviceFormHealthStrategy,
        monitoring: { latency: serviceFormMonitorLatency, ssl: serviceFormMonitorSsl },
      }

    setServiceGroups((prev) =>
      prev.map((group) => {
        if (group.id !== serviceFormGroupId) return group
        if (serviceFormEditingId) {
          return { ...group, services: group.services.map((s) => (s.id === serviceFormEditingId ? builtService : s)) }
        }
        return { ...group, services: [...group.services, builtService] }
      })
    )

    setShowServiceFormModal(false)
    resetServiceForm()
  }

  const handleRemoveService = (groupId: string, serviceId: string) => {
    setServiceGroups((prev) =>
      prev.map((group) => (group.id === groupId ? { ...group, services: group.services.filter((s) => s.id !== serviceId) } : group))
    )
    setRemoveConfirmOpen(false)
    setShowServiceDrawer(false)
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.delete('service')
      return next
    })
  }

  // Deep link: ?service=<id> opens that service's detail drawer directly on load
  useEffect(() => {
    const serviceId = searchParams.get('service')
    if (!serviceId) return
    for (const group of serviceGroups) {
      const svc = group.services.find((s) => s.id === serviceId)
      if (svc) {
        setActiveTab('registry')
        setSelectedService(svc)
        setSelectedServiceGroupId(group.id)
        setShowServiceDrawer(true)
        return
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  // Incidents State (screenshot 4)
  const [incidentsList, setIncidentsList] = useState([
    {
      id: 'inc-1',
      linkedIncident: 'INC-311' as string | null,
      title: 'Elevated errors on Checkout and Payment services',
      status: 'Identified' as 'Investigating' | 'Identified' | 'Monitoring' | 'Resolved',
      severity: 'Major' as 'Minor' | 'Major' | 'Critical',
      openedTime: 'Opened 1h ago',
      affectedComponents: ['Checkout API', 'Payment Service'],
      targetSites: ['Acme Operations'],
      timeline: [
        {
          id: 't-1',
          status: 'Identified',
          time: 'Jul 13, 3:40 PM (1h ago)',
          message: 'We have identified the cause of elevated errors affecting checkout flows. Our engineering team is applying a fix and monitoring recovery.',
        },
        {
          id: 't-2',
          status: 'Investigating',
          time: 'Jul 13, 2:53 PM (2h ago)',
          message: 'We are investigating reports of elevated error rates on checkout and payment services. Customer impact is confirmed. We will post updates as available.',
        },
      ],
    },
  ])

  const [incidentView, setIncidentView] = useState<'open' | 'resolved'>('open')
  const [expandedIncId, setExpandedIncId] = useState<string | null>(null)
  const [incVisibleCount, setIncVisibleCount] = useState<Record<'open' | 'resolved', number>>({ open: 5, resolved: 5 })

  const [showPublishModal, setShowPublishModal] = useState(false)
  const [publishingIncidentId, setPublishingIncidentId] = useState<string | null>(null)

  // Publish form states
  const [publishStage, setPublishStage] = useState<'Investigating' | 'Identified' | 'Monitoring' | 'Resolved'>('Identified')
  const [publishMessage, setPublishMessage] = useState('')
  const [showAdjustComponentHealth, setShowAdjustComponentHealth] = useState(false)
  const [publishComponentStatus, setPublishComponentStatus] = useState<Record<string, string>>({
    'Checkout API': 'Degraded Performance',
    'Payment Service': 'Partial Outage',
  })

  const [showNewIncidentModal, setShowNewIncidentModal] = useState(false)
  const [newIncSourceId, setNewIncSourceId] = useState<string | null>(null)
  const [newIncCustomTitle, setNewIncCustomTitle] = useState('')
  const [newIncPublicUpdate, setNewIncPublicUpdate] = useState('')

  // Map an internal platform incident's severity/services onto our public-facing model
  const mapSeverity = (sev: Incident['severity']): 'Minor' | 'Major' | 'Critical' =>
    sev === 'critical' ? 'Critical' : sev === 'low' ? 'Minor' : 'Major'

  // Which of our Service Registry entries correspond to a platform incident's affected services
  const registryServicesFor = (platformServices: string[]) =>
    serviceGroups.flatMap((g) => g.services.filter((svc) => svc.platformServiceIds.some((id) => platformServices.includes(id))))

  // Component display names to attach to the public incident
  const componentsForServices = (platformServices: string[]) =>
    registryServicesFor(platformServices).map((svc) => svc.name)

  // Every status site that currently shows a group containing one of these services
  const sitesForServices = (platformServices: string[]) => {
    const matchedGroups = serviceGroups.filter((g) => g.services.some((svc) => svc.platformServiceIds.some((id) => platformServices.includes(id))))
    const siteIds = new Set(matchedGroups.flatMap((g) => g.siteIds))
    return sites.filter((s) => siteIds.has(s.id)).map((s) => s.name)
  }

  // Platform incidents not already published to a status page
  const publishableIncidents = getAllIncidents().filter(
    (inc) => !incidentsList.some((i) => i.linkedIncident === inc.id)
  )
  const selectedSourceIncident = publishableIncidents.find((inc) => inc.id === newIncSourceId) ?? null

  // Maintenance State — seeded from shared mock (same source as SiteDetailPage)
  const [maintenanceList, setMaintenanceList] = useState<MaintenanceWindow[]>(seedMaintenanceList)

  const [maintView, setMaintView] = useState<'inProgress' | 'upcoming' | 'completed'>('inProgress')
  const [expandedMaintId, setExpandedMaintId] = useState<string | null>(null)
  const [maintVisibleCount, setMaintVisibleCount] = useState<Record<'inProgress' | 'upcoming' | 'completed', number>>({
    inProgress: 5,
    upcoming: 5,
    completed: 5,
  })

  const [showNewMaintenanceModal, setShowNewMaintenanceModal] = useState(false)
  const [newMaintTitle, setNewMaintTitle] = useState('')
  const [newMaintComponents, setNewMaintComponents] = useState<string[]>(['Checkout API'])
  const [newMaintStart, setNewMaintStart] = useState<Date | undefined>(undefined)
  const [newMaintEnd, setNewMaintEnd] = useState<Date | undefined>(undefined)
  const [newMaintDesc, setNewMaintDesc] = useState('')

  const formatSchedule = (date: Date) =>
    date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })

  const handleCreateMaintenance = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMaintTitle.trim() || !newMaintStart || !newMaintEnd) return

    const newWindow: MaintenanceWindow = {
      id: `maint-${Date.now()}`,
      siteId: sites[0]?.id ?? 'acme-ops',
      title: newMaintTitle,
      status: 'Scheduled',
      affectedComponents: newMaintComponents,
      scheduledStart: formatSchedule(newMaintStart),
      scheduledEnd: formatSchedule(newMaintEnd),
      description: newMaintDesc,
      scope: newMaintDesc.trim() || 'Scheduled maintenance',
      startsInHours: Math.max(0, Math.round((newMaintStart.getTime() - Date.now()) / 3_600_000)),
      durationMin: Math.max(1, Math.round((newMaintEnd.getTime() - newMaintStart.getTime()) / 60_000)),
      updates: [
        { id: `mu-${Date.now()}`, time: 'Just now', message: 'This maintenance window has been scheduled and will appear on affected status pages.' },
      ],
    }

    setMaintenanceList((prev) => [newWindow, ...prev])
    setShowNewMaintenanceModal(false)
    setNewMaintTitle('')
    setNewMaintComponents(['Checkout API'])
    setNewMaintStart(undefined)
    setNewMaintEnd(undefined)
    setNewMaintDesc('')
  }

  // Post Update (works from any maintenance window, in any state)
  const [showPostMaintModal, setShowPostMaintModal] = useState(false)
  const [postingMaintId, setPostingMaintId] = useState<string | null>(null)
  const [postMaintStatus, setPostMaintStatus] = useState<'Scheduled' | 'In Progress' | 'Completed'>('In Progress')
  const [postMaintMessage, setPostMaintMessage] = useState('')

  const openPostMaintModal = (m: typeof maintenanceList[number]) => {
    setPostingMaintId(m.id)
    setPostMaintStatus(m.status)
    setPostMaintMessage('')
    setShowPostMaintModal(true)
  }

  const handlePostMaintenanceUpdate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!postingMaintId || !postMaintMessage.trim()) return

    setMaintenanceList((prev) =>
      prev.map((m) =>
        m.id === postingMaintId
          ? {
            ...m,
            status: postMaintStatus,
            updates: [{ id: `mu-${Date.now()}`, time: 'Just now', message: postMaintMessage.trim() }, ...m.updates],
          }
          : m
      )
    )

    setShowPostMaintModal(false)
    setPostingMaintId(null)
    setPostMaintMessage('')
  }

  // Domains State
  const [domainRecords, setDomainRecords] = useState([
    {
      id: 'dom-1',
      siteId: 'acme-ops',
      siteName: 'Acme Operations',
      domain: 'status.acme.com',
      dnsStatus: 'Verified' as 'Pending' | 'Verified' | 'Failed',
      sslStatus: 'Active' as 'Provisioning' | 'Active' | 'Failed',
      cdnStatus: 'Active' as 'Propagating' | 'Active',
      lastChecked: '12m ago',
      sslExpiry: 'Dec 12, 2026',
      createdAt: 'Jul 1, 9:00 AM',
    },
    {
      id: 'dom-2',
      siteId: 'staging',
      siteName: 'Staging Status',
      domain: 'status.staging.acme.com',
      dnsStatus: 'Pending' as 'Pending' | 'Verified' | 'Failed',
      sslStatus: 'Provisioning' as 'Provisioning' | 'Active' | 'Failed',
      cdnStatus: 'Propagating' as 'Propagating' | 'Active',
      lastChecked: 'Never',
      sslExpiry: '—',
      createdAt: 'Jul 13, 2:14 PM',
    },
  ])

  const [showAddDomainModal, setShowAddDomainModal] = useState(false)
  const [newDomainSiteId, setNewDomainSiteId] = useState('')
  const [newDomainValue, setNewDomainValue] = useState('')
  const [expandedDomainId, setExpandedDomainId] = useState<string | null>(null)
  const [verifyingDomainId, setVerifyingDomainId] = useState<string | null>(null)
  const [copiedValue, setCopiedValue] = useState<string | null>(null)

  const handleCopy = (value: string) => {
    navigator.clipboard?.writeText(value)
    setCopiedValue(value)
    setTimeout(() => setCopiedValue((prev) => (prev === value ? null : prev)), 1500)
  }

  const handleAddDomain = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newDomainSiteId || !newDomainValue.trim()) return

    const targetSite = sites.find((s) => s.id === newDomainSiteId)
    const newDomain = {
      id: `dom-${Date.now()}`,
      siteId: newDomainSiteId,
      siteName: targetSite?.name ?? newDomainSiteId,
      domain: newDomainValue.trim(),
      dnsStatus: 'Pending' as 'Pending' | 'Verified' | 'Failed',
      sslStatus: 'Provisioning' as 'Provisioning' | 'Active' | 'Failed',
      cdnStatus: 'Propagating' as 'Propagating' | 'Active',
      lastChecked: 'Never',
      sslExpiry: '—',
      createdAt: 'Just now',
    }

    setDomainRecords((prev) => [newDomain, ...prev])
    setShowAddDomainModal(false)
    setExpandedDomainId(newDomain.id)
    setNewDomainSiteId('')
    setNewDomainValue('')
  }

  const handleVerifyDomain = (id: string) => {
    setVerifyingDomainId(id)
    setTimeout(() => {
      setDomainRecords((prev) =>
        prev.map((d) =>
          d.id === id
            ? { ...d, dnsStatus: 'Verified', sslStatus: 'Active', cdnStatus: 'Active', lastChecked: 'Just now' }
            : d
        )
      )
      setVerifyingDomainId(null)
    }, 1200)
  }

  const handleRemoveDomain = (id: string) => {
    setDomainRecords((prev) => prev.filter((d) => d.id !== id))
    setExpandedDomainId((prev) => (prev === id ? null : prev))
  }

  const handlePublishUpdate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!publishingIncidentId) return
    const targetIncident = incidentsList.find((inc) => inc.id === publishingIncidentId)
    if (!targetIncident) return

    setIncidentsList((prev) =>
      prev.map((inc) => {
        if (inc.id === publishingIncidentId) {
          const newUpdate = {
            id: `t-${Date.now()}`,
            status: publishStage,
            time: 'Just now',
            message: publishMessage || `Incident stage updated to ${publishStage}.`,
          }
          return {
            ...inc,
            status: publishStage,
            timeline: [newUpdate, ...inc.timeline],
          }
        }
        return inc
      })
    )

    applySiteStatusEffect(targetIncident.targetSites, publishStage)

    setShowPublishModal(false)
    setPublishMessage('')
    setShowAdjustComponentHealth(false)
  }

  // Shared by incident creation & publish-update: reflects incident stage onto the target sites' public status
  const applySiteStatusEffect = (targetSiteNames: string[], stage: 'Investigating' | 'Identified' | 'Monitoring' | 'Resolved') => {
    setSites((prevSites) =>
      prevSites.map((site) => {
        if (targetSiteNames.includes(site.name)) {
          return {
            ...site,
            status: stage === 'Resolved' ? 'Operational' : 'Degraded Performance',
            statusType: stage === 'Resolved' ? 'operational' : 'degraded',
            incidents: stage === 'Resolved' ? 0 : 1,
            lastUpdatedAt: Date.now(),
          }
        }
        return site
      })
    )
  }

  const handleCreateNewIncident = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSourceIncident || !newIncCustomTitle.trim() || !newIncPublicUpdate.trim()) return

    const affectedComponents = componentsForServices(selectedSourceIncident.services)
    const targetSites = sitesForServices(selectedSourceIncident.services)

    const newInc = {
      id: `inc-${Date.now()}`,
      linkedIncident: selectedSourceIncident.id as string | null,
      title: newIncCustomTitle.trim(),
      status: 'Investigating' as 'Investigating' | 'Identified' | 'Monitoring' | 'Resolved',
      severity: mapSeverity(selectedSourceIncident.severity),
      openedTime: 'Opened Just now',
      affectedComponents,
      targetSites,
      timeline: [
        {
          id: `t-${Date.now()}`,
          status: 'Investigating',
          time: 'Just now',
          message: newIncPublicUpdate.trim(),
        },
      ],
    }

    setIncidentsList((prev) => [newInc, ...prev])
    applySiteStatusEffect(targetSites, 'Investigating')

    setShowNewIncidentModal(false)
    setNewIncSourceId(null)
    setNewIncCustomTitle('')
    setNewIncPublicUpdate('')
  }

  if (isCreating) {
    return (
      <>
        <div className="page-head" style={{ marginBottom: 14 }}>
          <div>
            <h1 className="page-title">Create Status Site</h1>
            <p className="page-sub">Identity, appearance, and what visitors see — preview updates as you go.</p>
          </div>
          <button type="submit" form="create-status-site" className="btn btn-primary">
            Create Status Site
          </button>
        </div>

        <form id="create-status-site" onSubmit={handleCreateSite}>
          <div className="status-site-editor">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <section className="panel" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="section-label" style={{ margin: 0 }}>Site details</div>
                <StatusSiteBasicsFields
                  values={{ name: formName, subdomain: formSubdomain }}
                  onChange={(patch) => {
                    if (patch.name !== undefined) setFormName(patch.name)
                    if (patch.subdomain !== undefined) setFormSubdomain(patch.subdomain)
                  }}
                >
                  <SiteVisibilityPicker value={formVisibility} onChange={setFormVisibility} />
                </StatusSiteBasicsFields>
              </section>

              <section className="panel" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="section-label" style={{ margin: 0 }}>Appearance</div>
                <PublicPageBrandingFields config={formConfig} onChange={updateFormConfig} />
              </section>

              <section className="panel" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="section-label" style={{ margin: 0 }}>Page content</div>
                <PublicPageContentFields config={formConfig} onChange={updateFormConfig} />
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
                    font: 'inherit',
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
                          value={formLogoUrl}
                          placeholder="https://acme.com"
                          onChange={(e) => setFormLogoUrl(e.target.value)}
                        />
                      </div>
                      <div className="field">
                        <span className="field-label">Get in touch URL</span>
                        <input
                          className="text-input"
                          value={formContactUrl}
                          placeholder="https://acme.com/support"
                          onChange={(e) => setFormContactUrl(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="field">
                      <span className="field-label">Default page language</span>
                      <Select
                        value={formLanguage}
                        onValueChange={setFormLanguage}
                        options={[
                          { value: 'en', label: 'English (US)' },
                          { value: 'es', label: 'Spanish' },
                          { value: 'de', label: 'German' },
                        ]}
                      />
                    </div>
                    <Switch
                      checked={formConfig.showAttribution}
                      onCheckedChange={(v) => updateFormConfig({ showAttribution: v })}
                      label="Show Rtifact attribution in page footer"
                    />
                  </div>
                )}
              </section>
            </div>

            <PublicPagePreview config={formConfig} siteName={formName} subdomain={formSubdomain} />
          </div>
        </form>
      </>
    )
  }

  return (
    <>
      {/* Page Header */}
      <div className="page-head" style={{ marginBottom: 14 }}>
        <div>
          <div className="eyebrow">Support</div>
          <h1 className="page-title">Status Pages</h1>
          <p className="page-sub">
            {activeTab === 'sites' && (loading ? 'Loading status sites…' : `${activeList.length} sites · ${activeList.filter((s) => s.visibility.toLowerCase() === 'public').length} public`)}
            {activeTab === 'registry' && 'Service definitions and internal health mapping.'}
            {activeTab === 'incidents' && 'Cross-site customer notification logs.'}
            {activeTab === 'maintenance' && 'Plan, run, and communicate scheduled work across your status pages.'}
            {activeTab === 'domains' && 'Connect custom domains and verify DNS, SSL & CDN setup.'}
            {activeTab === 'subscribers' && 'People receiving status updates across your sites.'}
          </p>
        </div>
        {activeTab === 'sites' && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" onClick={() => navigate('/support/status-pages/new')}>
              <Plus size={14} strokeWidth={2.2} />
              Create Status Site
            </button>
          </div>
        )}

        {activeTab === 'registry' && (
          <div style={{ display: 'flex', gap: 8 }}>
            {/* <button className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Download size={13} /> Import
            </button> */}
            <button className="btn btn-primary" onClick={() => setShowCreateGroupModal(true)}>
              <Plus size={14} strokeWidth={2.2} />
              Create Group
            </button>
          </div>
        )}

        {activeTab === 'incidents' && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" onClick={() => setShowNewIncidentModal(true)}>
              <Plus size={14} strokeWidth={2.2} />
              Publish Incident
            </button>
          </div>
        )}

        {activeTab === 'maintenance' && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" onClick={() => setShowNewMaintenanceModal(true)}>
              <Plus size={14} strokeWidth={2.2} />
              Schedule Maintenance
            </button>
          </div>
        )}

        {activeTab === 'domains' && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" onClick={() => setShowAddDomainModal(true)}>
              <Plus size={14} strokeWidth={2.2} />
              Add Domain
            </button>
          </div>
        )}

        {activeTab === 'subscribers' && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" onClick={exportSubscribersCsv}>
              <Download size={14} strokeWidth={2.2} />
              Export CSV
            </button>
          </div>
        )}
      </div>



      {/* Status Page specific top sub-tabs */}
      <nav className="subnav" role="tablist" aria-label="Status pages sections">
        <button
          role="tab"
          aria-selected={activeTab === 'sites'}
          className={`subnav-item${activeTab === 'sites' ? ' active' : ''}`}
          onClick={() => setActiveTab('sites')}
        >
          <Globe size={12} strokeWidth={2.2} style={{ marginRight: 4, verticalAlign: -1 }} />
          Status Sites
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'registry'}
          className={`subnav-item${activeTab === 'registry' ? ' active' : ''}`}
          onClick={() => setActiveTab('registry')}
        >
          <Database size={12} strokeWidth={2.2} style={{ marginRight: 4, verticalAlign: -1 }} />
          Service Registry
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'incidents'}
          className={`subnav-item${activeTab === 'incidents' ? ' active' : ''}`}
          onClick={() => setActiveTab('incidents')}
        >
          <AlertTriangle size={12} strokeWidth={2.2} style={{ marginRight: 4, verticalAlign: -1 }} />
          Incidents
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'maintenance'}
          className={`subnav-item${activeTab === 'maintenance' ? ' active' : ''}`}
          onClick={() => setActiveTab('maintenance')}
        >
          <Calendar size={12} strokeWidth={2.2} style={{ marginRight: 4, verticalAlign: -1 }} />
          Maintenance
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'domains'}
          className={`subnav-item${activeTab === 'domains' ? ' active' : ''}`}
          onClick={() => setActiveTab('domains')}
        >
          <Sliders size={12} strokeWidth={2.2} style={{ marginRight: 4, verticalAlign: -1 }} />
          Domains
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'subscribers'}
          className={`subnav-item${activeTab === 'subscribers' ? ' active' : ''}`}
          onClick={() => setActiveTab('subscribers')}
        >
          <Mail size={12} strokeWidth={2.2} style={{ marginRight: 4, verticalAlign: -1 }} />
          Subscribers
        </button>
      </nav>

      {/* Loading state */}
      {loading ? (
        <ListSkeleton rows={3} />
      ) : (
        <>
          {/* TAB 1: Status Sites */}
          {activeTab === 'sites' && (
            <>
              {/* Stat Cards Grid — icon-left layout per design.md */}
              <div className="stat-grid">
                <div className="stat-card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    display: 'grid',
                    placeItems: 'center',
                    background: 'var(--brand-soft)',
                    color: 'var(--brand)',
                    flexShrink: 0,
                  }}>
                    <Globe size={18} strokeWidth={2.2} />
                  </div>
                  <div>
                    <div className="stat-value" style={{ fontSize: 22, marginTop: 0, lineHeight: 1.1 }}>{totalSites}</div>
                    <div className="stat-label" style={{ marginTop: 2 }}>Total Sites</div>
                  </div>
                </div>

                <div className={`stat-card${activeIncidents > 0 ? ' accent-error' : ' accent-success'}`} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    display: 'grid',
                    placeItems: 'center',
                    background: activeIncidents > 0 ? 'var(--error-soft)' : 'var(--success-soft)',
                    color: activeIncidents > 0 ? 'var(--error)' : 'var(--success)',
                    flexShrink: 0,
                  }}>
                    <AlertTriangle size={18} strokeWidth={2.2} />
                  </div>
                  <div>
                    <div className="stat-value" style={{ fontSize: 22, marginTop: 0, lineHeight: 1.1 }}>{activeIncidents}</div>
                    <div className="stat-label" style={{ marginTop: 2 }}>Active Incidents</div>
                  </div>
                </div>

                <div className="stat-card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    display: 'grid',
                    placeItems: 'center',
                    background: 'var(--brand-soft)',
                    color: 'var(--brand)',
                    flexShrink: 0,
                  }}>
                    <Users size={18} strokeWidth={2.2} />
                  </div>
                  <div>
                    <div className="stat-value" style={{ fontSize: 22, marginTop: 0, lineHeight: 1.1 }}>{totalSubscribers}</div>
                    <div className="stat-label" style={{ marginTop: 2 }}>Total Subscribers</div>
                  </div>
                </div>

                <div className="stat-card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    display: 'grid',
                    placeItems: 'center',
                    background: 'var(--success-soft)',
                    color: 'var(--success)',
                    flexShrink: 0,
                  }}>
                    <ExternalLink size={18} strokeWidth={2.2} />
                  </div>
                  <div>
                    <div className="stat-value" style={{ fontSize: 22, marginTop: 0, lineHeight: 1.1 }}>{customDomains}</div>
                    <div className="stat-label" style={{ marginTop: 2 }}>Custom Domains</div>
                  </div>
                </div>
              </div>

              {/* Table / Row list */}
              {activeList.length === 0 ? (
                <div className="placeholder-panel">
                  No status sites yet.
                  <span className="mono">public pages keep customers informed without support load</span>
                  <div style={{ marginTop: 14 }}>
                    <button className="btn btn-primary" onClick={() => navigate('/support/status-pages/new')}>
                      <Plus size={14} strokeWidth={2.2} />
                      Create Status Site
                    </button>
                  </div>
                </div>
              ) : (
                <div className="panel" style={{ overflow: 'hidden', padding: 0 }}>
                  {/* Table Header Row */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '200px 180px 100px 90px 110px 110px 180px 1fr',
                    gap: 12,
                    padding: '12px 20px',
                    borderBottom: '1px solid var(--border)',
                    background: 'var(--surface)',
                  }}>
                    {([
                      { key: 'name' as const, label: 'Site', align: 'left' as const },
                      { key: 'status' as const, label: 'Status', align: 'left' as const },
                      { key: 'visibility' as const, label: 'Visibility', align: 'left' as const },
                      { key: 'incidents' as const, label: 'Incidents', align: 'left' as const },
                      { key: 'components' as const, label: 'Components', align: 'left' as const },
                      { key: 'subscribers' as const, label: 'Subscribers', align: 'left' as const },
                      { key: 'customDomain' as const, label: 'Custom Domain', align: 'left' as const },
                      { key: 'lastUpdated' as const, label: 'Last Updated', align: 'right' as const },
                    ]).map((col) => {
                      const active = sitesSortKey === col.key
                      return (
                        <button
                          key={col.key}
                          type="button"
                          onClick={() => toggleSitesSort(col.key)}
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
                          {active && (sitesSortDir === 'asc' ? <ChevronUp size={11} strokeWidth={2.4} /> : <ChevronDown size={11} strokeWidth={2.4} />)}
                        </button>
                      )
                    })}
                  </div>

                  {/* Table Content Rows */}
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {sortedSites.map((s) => {
                      const isDegraded = s.statusType === 'degraded'
                      const isOperational = s.statusType === 'operational'

                      const statusClass = isOperational
                        ? 'sev-healthy'
                        : isDegraded
                          ? 'sev-warning'
                          : 'sev-critical'

                      const dotClass = isOperational
                        ? 'healthy'
                        : isDegraded
                          ? 'degraded'
                          : 'critical'

                      return (
                        <div
                          key={s.id}
                          role="link"
                          tabIndex={0}
                          onClick={() => navigate(`/support/status-pages/${s.id}`)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault()
                              navigate(`/support/status-pages/${s.id}`)
                            }
                          }}
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '200px 180px 100px 90px 110px 110px 180px 1fr',
                            gap: 12,
                            padding: '14px 20px',
                            borderBottom: '1px solid var(--border)',
                            alignItems: 'center',
                            fontSize: 13,
                            transition: 'background 0.1s ease',
                            cursor: 'pointer',
                          }}
                          className="row"
                        >
                          {/* Site Info */}
                          <div>
                            <span style={{ fontWeight: 600, display: 'block', color: 'var(--fg)' }}>
                              {s.name}
                            </span>
                            <span className="mono" style={{ fontSize: 11, color: 'var(--faint)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                              {s.url}
                              <Link
                                to={`/status/${s.id}`}
                                target="_blank"
                                onClick={(e) => e.stopPropagation()}
                                style={{ color: 'var(--brand)', display: 'inline-flex', alignItems: 'center' }}
                                title="View Public Status Page"
                              >
                                <ExternalLink size={10} />
                              </Link>
                            </span>
                          </div>

                          {/* Status Badge */}
                          <div>
                            <span className={`badge ${statusClass}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                              <span className={`dot ${dotClass}`} style={{ width: 6, height: 6 }} />
                              {s.status}
                            </span>
                          </div>

                          {/* Visibility */}
                          <div>
                            <span className="badge" style={{
                              background: s.visibility === 'Public' ? 'var(--brand-soft)' : 'var(--chip)',
                              color: s.visibility === 'Public' ? 'var(--brand)' : 'var(--muted)',
                              fontSize: 10.5,
                              fontWeight: 700,
                            }}>
                              {s.visibility}
                            </span>
                          </div>

                          {/* Incidents */}
                          <div className="mono" style={{ fontWeight: 600, color: s.incidents > 0 ? 'var(--error)' : 'var(--muted)' }}>
                            {s.incidents}
                          </div>

                          {/* Components */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--muted)', fontSize: 12.5 }}>
                            <Database size={13} style={{ color: 'var(--muted)' }} />
                            <span>{s.components}</span>
                          </div>

                          {/* Subscribers */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--muted)', fontSize: 12.5 }}>
                            <Users size={13} style={{ color: 'var(--muted)' }} />
                            <span>{s.subscribers}</span>
                          </div>

                          {/* Custom Domain */}
                          <div>
                            {s.customDomain ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span className="mono" style={{ fontSize: 12, fontWeight: 500 }}>{s.customDomain}</span>
                                <span className="badge sev-healthy" style={{ fontSize: 9, padding: '1px 5px' }}>Active</span>
                              </div>
                            ) : (
                              <span style={{ color: 'var(--faint)', fontSize: 12 }}>Not configured</span>
                            )}
                          </div>

                          {/* Last Updated */}
                          <div style={{ textAlign: 'right', color: 'var(--faint)', fontSize: 12 }}>
                            <TimeAgo timestamp={s.lastUpdatedAt} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </>
          )}

          {/* TAB 2: Service Registry (Revamped - screenshot 2) */}
          {activeTab === 'registry' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Groups List */}
              {serviceGroups.length === 0 ? (
                <div className="placeholder-panel">
                  No service groups yet.
                  <span className="mono">group assets and endpoints for your public status page</span>
                  <div style={{ marginTop: 14 }}>
                    <button className="btn btn-primary" onClick={() => setShowCreateGroupModal(true)}>
                      <Plus size={14} strokeWidth={2.2} />
                      Create Group
                    </button>
                  </div>
                </div>
              ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {serviceGroups.map((group) => {
                  const isCollapsed = collapsedGroups[group.id] || false
                  const isDegraded = group.health === 'Degraded Performance' || group.services.some(s => s.health === 'Degraded Performance')
                  const isOutage = group.health === 'Partial Outage' || group.services.some(s => s.health === 'Partial Outage')

                  const groupStatusLabel = isOutage ? 'Partial Outage' : isDegraded ? 'Degraded Performance' : 'Operational'
                  const groupStatusClass = isOutage ? 'sev-critical' : isDegraded ? 'sev-warning' : 'sev-healthy'
                  const groupDotClass = isOutage ? 'critical' : isDegraded ? 'degraded' : 'healthy'

                  return (
                    <div
                      key={group.id}
                      className="panel"
                      style={{
                        padding: 0,
                        overflow: 'hidden',
                        borderColor: 'var(--border)',
                      }}
                    >
                      {/* Group Header Row */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px 20px',
                        background: 'var(--surface)',
                        borderBottom: isCollapsed ? 'none' : '1px solid var(--border)',
                      }}>
                        {/* Left items */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontWeight: 700, fontSize: 14 }}>{group.name}</span>
                              <span style={{ fontSize: 11, color: 'var(--muted)', background: 'var(--chip)', padding: '1px 5px', borderRadius: 4 }}>
                                {group.services.length} services
                              </span>
                            </div>
                            <span style={{ fontSize: 11.5, color: 'var(--muted)' }}>{group.description}</span>
                          </div>
                        </div>

                        {/* Right items */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          {/* Group Status */}
                          <span className={`badge ${groupStatusClass}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5 }}>
                            <span className={`dot ${groupDotClass}`} style={{ width: 5, height: 5 }} />
                            {groupStatusLabel}
                          </span>

                          <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: 11.5 }} onClick={() => openAddService(group.id)}>
                            + Add Service
                          </button>

                          <button
                            onClick={() => setCollapsedGroups(prev => ({ ...prev, [group.id]: !isCollapsed }))}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)' }}
                          >
                            {isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                          </button>
                        </div>
                      </div>

                      {/* Inner Services Rows */}
                      {!isCollapsed && (
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          {group.services.length === 0 ? (
                            <div className="placeholder-panel" style={{ margin: 12, padding: 20, borderRadius: 10 }}>
                              No services in this group yet.
                              <span className="mono">click Add Service to map an asset or endpoint</span>
                            </div>
                          ) : (
                            group.services.map((svc, svcIdx) => {
                              const sIsDegraded = svc.health === 'Degraded Performance'
                              const sIsOutage = svc.health === 'Partial Outage'

                              const sStatusClass = sIsOutage
                                ? 'sev-critical'
                                : sIsDegraded
                                  ? 'sev-warning'
                                  : 'sev-healthy'

                              const sDotClass = sIsOutage
                                ? 'critical'
                                : sIsDegraded
                                  ? 'degraded'
                                  : 'healthy'

                              const refCount = svc.sourceRefs.length
                              const unit = svc.source === 'asset' ? 'asset' : 'endpoint'
                              const units = `${refCount} ${unit}${refCount === 1 ? '' : 's'}`
                              let subtitle: { text: string; mono?: boolean }
                              if (refCount > 1) {
                                subtitle = {
                                  text: svc.healthStrategy === 'worst'
                                    ? `Worst of ${units}`
                                    : `Average of ${units}`,
                                }
                              } else if (refCount === 1 && svc.source === 'asset') {
                                const linked = allAssets.find((a) => a.id === svc.sourceRefs[0])
                                subtitle = linked && linked.name !== svc.name
                                  ? { text: `↳ ${linked.name}` }
                                  : { text: `↳ ${svc.path}`, mono: true }
                              } else if (refCount === 1 && svc.source === 'endpoint') {
                                const linked = allChecks.find((c) => c.id === svc.sourceRefs[0])
                                subtitle = linked && linked.name !== svc.name
                                  ? { text: `↳ ${linked.name}` }
                                  : { text: `↳ ${svc.path}`, mono: true }
                              } else {
                                subtitle = { text: `↳ ${svc.path}`, mono: true }
                              }

                              return (
                                <div
                                  key={svc.id}
                                  role="button"
                                  tabIndex={0}
                                  onClick={() => openServiceDetail(group.id, svc)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                      e.preventDefault()
                                      openServiceDetail(group.id, svc)
                                    }
                                  }}
                                  style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '14px 20px',
                                    borderBottom: svcIdx === group.services.length - 1 ? 'none' : '1px solid var(--border)',
                                    fontSize: 13,
                                    cursor: 'pointer',
                                  }}
                                  className="row"
                                >
                                  {/* Left details */}
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    {/* Reorder actions — excluded from row click */}
                                    <div
                                      style={{ display: 'flex', gap: 2 }}
                                      onClick={(e) => e.stopPropagation()}
                                      onKeyDown={(e) => e.stopPropagation()}
                                    >
                                      <button
                                        onClick={() => moveServiceUp(group.id, svcIdx)}
                                        disabled={svcIdx === 0}
                                        style={{
                                          background: 'none',
                                          border: 'none',
                                          padding: 2,
                                          cursor: svcIdx === 0 ? 'not-allowed' : 'pointer',
                                          color: svcIdx === 0 ? 'var(--faint)' : 'var(--muted)',
                                        }}
                                        title="Move Service Up"
                                      >
                                        <ArrowUp size={12} />
                                      </button>
                                      <button
                                        onClick={() => moveServiceDown(group.id, svcIdx)}
                                        disabled={svcIdx === group.services.length - 1}
                                        style={{
                                          background: 'none',
                                          border: 'none',
                                          padding: 2,
                                          cursor: svcIdx === group.services.length - 1 ? 'not-allowed' : 'pointer',
                                          color: svcIdx === group.services.length - 1 ? 'var(--faint)' : 'var(--muted)',
                                        }}
                                        title="Move Service Down"
                                      >
                                        <ArrowDown size={12} />
                                      </button>
                                    </div>

                                    <div style={{
                                      width: 22,
                                      height: 22,
                                      borderRadius: 4,
                                      background: 'var(--brand-soft)',
                                      color: 'var(--brand)',
                                      display: 'grid',
                                      placeItems: 'center',
                                      flexShrink: 0,
                                    }}>
                                      {svc.source === 'endpoint'
                                        ? <Activity size={12} strokeWidth={2.2} />
                                        : svc.type === 'Database'
                                          ? <Database size={12} strokeWidth={2.2} />
                                          : svc.type === 'Web App'
                                            ? <Globe size={12} strokeWidth={2.2} />
                                            : svc.type === 'Queue'
                                              ? <Zap size={12} strokeWidth={2.2} />
                                              : <Boxes size={12} strokeWidth={2.2} />}
                                    </div>

                                    <div>
                                      <span style={{ fontWeight: 600, display: 'block' }}>{svc.name}</span>
                                      <span className={subtitle.mono ? 'mono' : undefined} style={{
                                        fontSize: 11,
                                        color: 'var(--faint)',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 6,
                                      }}>
                                        {subtitle.text}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Right details */}
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                    <span className={`badge ${sStatusClass}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11 }}>
                                      <span className={`dot ${sDotClass}`} style={{ width: 5, height: 5 }} />
                                      {svc.health}
                                    </span>
                                    <ChevronRight size={14} style={{ color: 'var(--muted)' }} />
                                  </div>
                                </div>
                              )
                            })
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
              )}
            </div>
          )}

          {/* TAB 3: Incidents */}
          {activeTab === 'incidents' && (() => {
            const baseList = isEmpty ? [] : incidentsList
            const open = baseList.filter((i) => i.status !== 'Resolved')
            const resolved = baseList.filter((i) => i.status === 'Resolved')
            const listByView = { open, resolved }
            const activeList = listByView[incidentView]
            const visibleCount = incVisibleCount[incidentView]
            const visibleList = activeList.slice(0, visibleCount)
            const remaining = activeList.length - visibleList.length

            const severityBadgeClass = { Critical: 'sev-critical', Major: 'sev-warning', Minor: 'neutral' } as const
            const statusMeta = {
              Investigating: { badgeClass: 'sev-warning', dotColor: 'var(--warn)' },
              Identified: { badgeClass: 'sev-warning', dotColor: 'var(--warn)' },
              Monitoring: { badgeClass: 'neutral', dotColor: 'var(--brand)' },
              Resolved: { badgeClass: 'sev-healthy', dotColor: 'var(--success)' },
            } as const

            const renderIncRow = (inc: typeof incidentsList[number], isLast: boolean) => {
              const isExpanded = expandedIncId === inc.id
              const meta = statusMeta[inc.status]

              return (
                <div key={inc.id} style={{ borderBottom: isLast ? 'none' : '1px solid var(--border)' }}>
                  <div
                    onClick={() => setExpandedIncId(isExpanded ? null : inc.id)}
                    className="row"
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14, padding: '14px 20px', border: 'none', cursor: 'pointer' }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span className={`badge ${meta.badgeClass}`} style={{ fontSize: 10.5 }}>{inc.status}</span>
                        <span className={`badge ${severityBadgeClass[inc.severity]}`} style={{ fontSize: 10.5 }}>{inc.severity}</span>
                        <span style={{ fontWeight: 600, fontSize: 13.5 }}>{inc.title}</span>
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--faint)', marginTop: 4 }}>
                        {inc.openedTime} · {inc.affectedComponents.join(', ')}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '5px 12px', fontSize: 12 }}
                        onClick={() => {
                          setPublishingIncidentId(inc.id)
                          setPublishStage(inc.status)
                          setPublishMessage('')
                          setShowAdjustComponentHealth(false)
                          setShowPublishModal(true)
                        }}
                      >
                        Publish Update
                      </button>
                      <ChevronDown
                        size={15}
                        style={{ color: 'var(--muted)', transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }}
                      />
                    </div>
                  </div>

                  {isExpanded && (
                    <div style={{ padding: '18px 20px' }}>
                      <div className="section-label" style={{ margin: '0 0 12px' }}>
                        Update Timeline
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingLeft: 10 }}>
                        {inc.timeline.map((item, itemIdx) => (
                          <div key={item.id} style={{ display: 'flex', gap: 12, position: 'relative' }}>
                            {itemIdx < inc.timeline.length - 1 && (
                              <div style={{ position: 'absolute', left: 5, top: 12, bottom: -20, width: 1, background: 'var(--border)' }} />
                            )}
                            <div style={{ width: 10, height: 10, borderRadius: '50%', border: `2px solid ${meta.dotColor}`, background: 'var(--card)', marginTop: 4, zIndex: 2 }} />
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--fg)' }}>{item.status}</span>
                                <span style={{ fontSize: 11, color: 'var(--faint)' }}>{item.time}</span>
                              </div>
                              <p style={{ fontSize: 12.5, color: 'var(--muted)', margin: '4px 0 0 0', lineHeight: 1.4 }}>{item.message}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            }

            const tabs: Array<{ key: 'open' | 'resolved'; label: string; count: number }> = [
              { key: 'open', label: 'Open', count: open.length },
              { key: 'resolved', label: 'Resolved', count: resolved.length },
            ]

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="group-switcher-segment" style={{ width: 'fit-content' }}>
                    {tabs.map((t) => (
                      <button
                        key={t.key}
                        className={`segment-btn ${incidentView === t.key ? 'active' : ''}`}
                        onClick={() => setIncidentView(t.key)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                      >
                        {t.label}
                        <span style={{ fontSize: 10.5, color: 'var(--muted)', background: 'var(--chip)', padding: '1px 5px', borderRadius: 4 }}>
                          {t.count}
                        </span>
                      </button>
                    ))}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--muted)' }}>
                    <Clock size={13} />
                    Avg. resolution time <span style={{ fontWeight: 700, color: 'var(--fg)' }}>1h 34m</span>
                  </div>
                </div>

                {activeList.length === 0 ? (
                  <div className="placeholder-panel">
                    {incidentView === 'open' ? 'No open incidents.' : 'No resolved incidents yet.'}
                    <span className="mono">
                      {incidentView === 'open' ? 'your services are running smoothly' : 'resolved incidents will appear here'}
                    </span>
                  </div>
                ) : (
                  <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
                    {visibleList.map((inc, idx) => renderIncRow(inc, idx === visibleList.length - 1 && remaining === 0))}
                    {remaining > 0 && (
                      <button
                        className="btn btn-secondary"
                        style={{ width: '100%', border: 'none', borderRadius: 0, borderTop: '1px solid var(--border)' }}
                        onClick={() => setIncVisibleCount((prev) => ({ ...prev, [incidentView]: prev[incidentView] + 10 }))}
                      >
                        Show {Math.min(remaining, 10)} more
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })()}

          {/* TAB 4: Maintenance */}
          {activeTab === 'maintenance' && (() => {
            const inProgress = maintenanceList.filter((m) => m.status === 'In Progress')
            const upcoming = maintenanceList.filter((m) => m.status === 'Scheduled')
            const completed = maintenanceList.filter((m) => m.status === 'Completed')
            const listByView = { inProgress, upcoming, completed }
            const activeList = listByView[maintView]
            const visibleCount = maintVisibleCount[maintView]
            const visibleList = activeList.slice(0, visibleCount)
            const remaining = activeList.length - visibleList.length

            const statusMeta = {
              'In Progress': { badgeClass: 'sev-warning', dotColor: 'var(--warn)' },
              Scheduled: { badgeClass: 'neutral', dotColor: 'var(--brand)' },
              Completed: { badgeClass: 'sev-healthy', dotColor: 'var(--success)' },
            } as const

            const renderMaintRow = (m: typeof maintenanceList[number], isLast: boolean) => {
              const isExpanded = expandedMaintId === m.id
              const meta = statusMeta[m.status]

              return (
                <div key={m.id} style={{ borderBottom: isLast ? 'none' : '1px solid var(--border)' }}>
                  <div
                    onClick={() => setExpandedMaintId(isExpanded ? null : m.id)}
                    className="row"
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14, padding: '14px 20px', border: 'none', cursor: 'pointer' }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span className={`badge ${meta.badgeClass}`} style={{ fontSize: 10.5 }}>{m.status}</span>
                        <span style={{ fontWeight: 600, fontSize: 13.5 }}>{m.title}</span>
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--faint)', marginTop: 4 }}>
                        {m.scheduledStart} – {m.scheduledEnd} · {m.affectedComponents.join(', ')}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                      <button className="btn btn-secondary" style={{ padding: '5px 12px', fontSize: 12 }} onClick={() => openPostMaintModal(m)}>
                        Post Update
                      </button>
                      <ChevronDown
                        size={15}
                        style={{ color: 'var(--muted)', transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }}
                        onClick={() => setExpandedMaintId(isExpanded ? null : m.id)}
                      />
                    </div>
                  </div>

                  {isExpanded && (
                    <div style={{ padding: '18px 20px' }}>
                      <p style={{ fontSize: 12.5, color: 'var(--muted)', margin: '0 0 16px 0', lineHeight: 1.5, maxWidth: 640 }}>{m.description}</p>
                      <div className="section-label" style={{ margin: '0 0 12px' }}>
                        Update Timeline
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingLeft: 10 }}>
                        {m.updates.map((item, itemIdx) => (
                          <div key={item.id} style={{ display: 'flex', gap: 12, position: 'relative' }}>
                            {itemIdx < m.updates.length - 1 && (
                              <div style={{ position: 'absolute', left: 5, top: 12, bottom: -20, width: 1, background: 'var(--border)' }} />
                            )}
                            <div style={{ width: 10, height: 10, borderRadius: '50%', border: `2px solid ${meta.dotColor}`, background: 'var(--card)', marginTop: 4, zIndex: 2 }} />
                            <p style={{ fontSize: 12.5, color: 'var(--muted)', margin: 0, lineHeight: 1.4 }}>
                              {item.message}
                              <span style={{ display: 'block', fontSize: 11, color: 'var(--faint)', marginTop: 2 }}>{item.time}</span>
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            }

            const tabs: Array<{ key: 'inProgress' | 'upcoming' | 'completed'; label: string; count: number }> = [
              { key: 'inProgress', label: 'In Progress', count: inProgress.length },
              { key: 'upcoming', label: 'Upcoming', count: upcoming.length },
              { key: 'completed', label: 'Completed', count: completed.length },
            ]

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="group-switcher-segment" style={{ width: 'fit-content' }}>
                  {tabs.map((t) => (
                    <button
                      key={t.key}
                      className={`segment-btn ${maintView === t.key ? 'active' : ''}`}
                      onClick={() => setMaintView(t.key)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                    >
                      {t.label}
                      <span style={{ fontSize: 10.5, color: 'var(--muted)', background: 'var(--chip)', padding: '1px 5px', borderRadius: 4 }}>
                        {t.count}
                      </span>
                    </button>
                  ))}
                </div>

                {activeList.length === 0 ? (
                  <div className="placeholder-panel">
                    {maintView === 'inProgress' && 'Nothing in progress right now.'}
                    {maintView === 'upcoming' && 'No maintenance scheduled.'}
                    {maintView === 'completed' && 'No completed maintenance yet.'}
                    <span className="mono">planned work will appear here and on your status pages</span>
                    <div style={{ marginTop: 14 }}>
                      <button className="btn btn-primary" onClick={() => setShowNewMaintenanceModal(true)}>
                        <Plus size={14} strokeWidth={2.2} />
                        Schedule Maintenance
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
                    {visibleList.map((m, idx) => renderMaintRow(m, idx === visibleList.length - 1 && remaining === 0))}
                    {remaining > 0 && (
                      <button
                        className="btn btn-secondary"
                        style={{ width: '100%', border: 'none', borderRadius: 0, borderTop: '1px solid var(--border)' }}
                        onClick={() => setMaintVisibleCount((prev) => ({ ...prev, [maintView]: prev[maintView] + 10 }))}
                      >
                        Show {Math.min(remaining, 10)} more
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })()}

          {/* TAB 5: Domains */}
          {activeTab === 'domains' && (() => {
            const isFullyActive = (d: typeof domainRecords[number]) =>
              d.dnsStatus === 'Verified' && d.sslStatus === 'Active' && d.cdnStatus === 'Active'

            // A calm label/value row used inside the SSL & CDN detail cards
            const kvRow = (label: string, value: string, color?: string) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', fontSize: 12.5 }}>
                <span style={{ color: 'var(--muted)' }}>{label}</span>
                <span style={{ fontWeight: 600, color: color ?? 'var(--fg)' }}>{value}</span>
              </div>
            )

            // A single DNS record row with copy-to-clipboard, shared by both the
            // "already configured" list and the "add these records" step tables
            const dnsRow = (host: string, value: string, showActiveBadge: boolean) => (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', fontSize: 12.5 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--brand)', background: 'var(--brand-soft)', padding: '2px 7px', borderRadius: 5, flexShrink: 0 }}>
                  CNAME
                </span>
                <span className="mono" style={{ fontWeight: 600, flexShrink: 0 }}>{host}</span>
                <button
                  onClick={() => handleCopy(host)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--faint)', display: 'flex', flexShrink: 0 }}
                >
                  {copiedValue === host ? <Check size={12} style={{ color: 'var(--success)' }} /> : <Copy size={12} />}
                </button>
                <span className="mono" style={{ color: 'var(--faint)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</span>
                <button
                  onClick={() => handleCopy(value)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--faint)', display: 'flex', flexShrink: 0 }}
                >
                  {copiedValue === value ? <Check size={12} style={{ color: 'var(--success)' }} /> : <Copy size={12} />}
                </button>
                {showActiveBadge && <span className="badge sev-healthy" style={{ fontSize: 10, flexShrink: 0 }}>Active</span>}
              </div>
            )

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                {domainRecords.length === 0 ? (
                  <div className="placeholder-panel">
                    No custom domains connected yet.
                    <span className="mono">point a domain at your status page to get started</span>
                    <div style={{ marginTop: 14 }}>
                      <button className="btn btn-primary" onClick={() => setShowAddDomainModal(true)}>
                        <Plus size={14} strokeWidth={2.2} />
                        Add Domain
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {domainRecords.map((d) => {
                      const fullyActive = isFullyActive(d)
                      const isExpanded = expandedDomainId === d.id
                      const isVerifying = verifyingDomainId === d.id
                      const validationHost = `_verify.${d.domain}`
                      const validationTarget = `verify-${d.id.slice(-4)}.rtifact.io`

                      return (
                        <div key={d.id} className="panel" style={{ padding: 0, overflow: 'hidden' }}>
                          {/* Hero row — the only thing you see until you ask for more */}
                          <div
                            onClick={() => setExpandedDomainId(isExpanded ? null : d.id)}
                            style={{
                              padding: '18px 20px',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'start',
                              gap: 16,
                              cursor: 'pointer',
                            }}
                          >
                            <div style={{ display: 'flex', gap: 14, alignItems: 'start' }}>
                              <div style={{
                                width: 36,
                                height: 36,
                                borderRadius: 8,
                                display: 'grid',
                                placeItems: 'center',
                                flexShrink: 0,
                                background: fullyActive ? 'var(--success-soft)' : 'var(--warn-soft)',
                                color: fullyActive ? 'var(--success)' : 'var(--warn)',
                              }}>
                                {fullyActive ? <CheckCircle size={18} /> : <Clock size={18} />}
                              </div>
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                  <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: 'var(--fg)' }}>{d.domain}</h3>
                                  <span className={`badge ${fullyActive ? 'sev-healthy' : 'sev-warning'}`} style={{ fontSize: 10.5 }}>
                                    {fullyActive ? 'Domain Active' : 'Pending DNS Validation'}
                                  </span>
                                </div>
                                <p style={{ fontSize: 12.5, color: 'var(--muted)', margin: 0, maxWidth: 480, lineHeight: 1.5 }}>
                                  {fullyActive
                                    ? `Serving ${d.siteName}'s status page via CDN`
                                    : 'Add the DNS records below to complete domain verification. Changes may take up to 48 hours to propagate.'}
                                </p>
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                              {fullyActive ? (
                                <a
                                  href={`https://${d.domain}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="btn btn-secondary"
                                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}
                                >
                                  <ExternalLink size={13} /> Open
                                </a>
                              ) : (
                                <button
                                  className="btn btn-primary"
                                  disabled={isVerifying}
                                  onClick={() => handleVerifyDomain(d.id)}
                                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                                >
                                  {isVerifying ? <Loader2 size={13} className="spin" /> : <RefreshCw size={13} />}
                                  {isVerifying ? 'Checking…' : 'Check DNS'}
                                </button>
                              )}
                              <button
                                onClick={() => handleRemoveDomain(d.id)}
                                title="Remove Domain"
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: 4, display: 'flex' }}
                              >
                                <Trash2 size={14} />
                              </button>
                              <ChevronDown
                                size={16}
                                style={{ color: 'var(--muted)', transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }}
                              />
                            </div>
                          </div>

                          {/* Everything below is advanced detail — collapsed until asked for */}
                          {isExpanded && (
                            <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 22 }}>
                              {fullyActive ? (
                                <>
                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28 }}>
                                    <div>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <ShieldCheck size={14} style={{ color: 'var(--success)' }} />
                                        <span style={{ fontSize: 13.5, fontWeight: 700 }}>SSL Certificate</span>
                                      </div>
                                      <p style={{ fontSize: 11.5, color: 'var(--faint)', margin: '2px 0 8px 0' }}>Managed automatically</p>
                                      {kvRow('Status', 'Issued', 'var(--success)')}
                                      {kvRow('Expires', d.sslExpiry)}
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
                                      <div style={{ borderBottom: '1px solid var(--border)' }}>{dnsRow(d.domain, 'statuspage.rtifact.io', true)}</div>
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
                                      {dnsRow(d.domain, 'statuspage.rtifact.io', d.dnsStatus === 'Verified')}
                                    </div>
                                  </div>

                                  <div>
                                    <span style={{ fontSize: 13.5, fontWeight: 700, display: 'block' }}>Step 2 — SSL certificate validation</span>
                                    <p style={{ fontSize: 11.5, color: 'var(--faint)', margin: '2px 0 10px 0' }}>Add this record so we can issue your SSL certificate</p>
                                    <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                                      {dnsRow(validationHost, validationTarget, d.sslStatus === 'Active')}
                                    </div>
                                  </div>

                                  <div>
                                    <span style={{ fontSize: 13.5, fontWeight: 700, display: 'block', marginBottom: 14 }}>Validation progress</span>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                      {[
                                        { label: 'Domain submitted', sub: d.createdAt, state: 'done' as const },
                                        {
                                          label: 'CNAME record detected',
                                          sub: 'Waiting for DNS propagation',
                                          state: d.dnsStatus === 'Verified' ? 'done' as const : d.dnsStatus === 'Failed' ? 'failed' as const : 'current' as const,
                                        },
                                        {
                                          label: 'SSL certificate issued',
                                          sub: 'Waiting for CNAME verification',
                                          state: d.sslStatus === 'Active' ? 'done' as const : d.dnsStatus === 'Verified' ? 'current' as const : 'upcoming' as const,
                                        },
                                        {
                                          label: 'Domain active',
                                          sub: 'Final activation step',
                                          state: d.cdnStatus === 'Active' ? 'done' as const : 'upcoming' as const,
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
                                            <div style={{
                                              fontSize: 13,
                                              fontWeight: 700,
                                              color: step.state === 'upcoming' ? 'var(--faint)' : step.state === 'current' ? 'var(--warn)' : 'var(--fg)',
                                            }}>
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
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })()}

          {/* TAB 6: Subscribers */}
          {activeTab === 'subscribers' && (() => {
            const componentOptions = serviceGroups.flatMap((g) =>
              g.services.map((svc) => ({ value: svc.id, label: svc.name }))
            )
            const componentNameById = Object.fromEntries(componentOptions.map((o) => [o.value, o.label]))

            const baseList = isEmpty ? [] : subscribers
            const filtered = baseList.filter((sub) => {
              const q = subSearch.trim().toLowerCase()
              if (q && !sub.email.toLowerCase().includes(q)) return false
              if (subSiteFilter !== 'all' && sub.siteId !== subSiteFilter) return false
              if (subComponentFilter.length > 0 && !subComponentFilter.some((id) => sub.componentIds.includes(id))) return false
              return true
            })

            const sorted = [...filtered].sort((a, b) => {
              const dir = subsSortDir === 'asc' ? 1 : -1
              const cmpStr = (x: string, y: string) => x.localeCompare(y, undefined, { sensitivity: 'base' }) * dir
              const cmpNum = (x: number, y: number) => (x - y) * dir
              switch (subsSortKey) {
                case 'email': return cmpStr(a.email, b.email)
                case 'siteName': return cmpStr(siteNameById[a.siteId] ?? a.siteId, siteNameById[b.siteId] ?? b.siteId)
                case 'components': return cmpNum(a.componentIds.length, b.componentIds.length)
                case 'firstSubscribedAt': return cmpNum(a.firstSubscribedAt, b.firstSubscribedAt)
                case 'lastNotificationAt': return cmpNum(a.lastNotificationAt ?? 0, b.lastNotificationAt ?? 0)
                default: return 0
              }
            })

            const siteFilterOptions = [
              { value: 'all', label: 'All sites' },
              ...sites.map((s) => ({ value: s.id, label: s.name })),
            ]

            const hasFilters = subSearch.trim() !== '' || subSiteFilter !== 'all' || subComponentFilter.length > 0

            const sortCols: Array<{ key: SubscribersSortKey; label: string; align?: 'right' }> = [
              { key: 'email', label: 'Email' },
              { key: 'siteName', label: 'Status Site' },
              { key: 'components', label: 'Components' },
              { key: 'firstSubscribedAt', label: 'Subscribed' },
              { key: 'lastNotificationAt', label: 'Last Notification', align: 'right' },
            ]

            return (
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
                      <button
                        type="button"
                        className="rt-filter-facet-clear"
                        aria-label="Clear search"
                        onClick={() => setSubSearch('')}
                      >
                        <X size={12} strokeWidth={2.4} />
                      </button>
                    )}
                  </div>

                  <div className="rt-filter-divider" />

                  <div className="rt-filter-facets">
                    <Select
                      variant="filter"
                      label="Site"
                      value={subSiteFilter}
                      onValueChange={setSubSiteFilter}
                      options={siteFilterOptions}
                    />

                    <MultiSelect
                      variant="filter"
                      label="Components"
                      values={subComponentFilter}
                      onValuesChange={setSubComponentFilter}
                      options={componentOptions}
                      searchable
                      searchPlaceholder="Filter components…"
                    />
                  </div>

                  <div className="rt-filter-meta">
                    {hasFilters && (
                      <button
                        type="button"
                        className="rt-filter-clear-all"
                        onClick={() => {
                          setSubSearch('')
                          setSubSiteFilter('all')
                          setSubComponentFilter([])
                        }}
                      >
                        Clear
                      </button>
                    )}
                    <span>
                      {sorted.length} subscriber{sorted.length === 1 ? '' : 's'}
                    </span>
                  </div>
                </div>

                {sorted.length === 0 ? (
                  <div className="placeholder-panel">
                    {hasFilters ? 'No subscribers match your filters.' : 'No subscribers yet.'}
                    <span className="mono">
                      {hasFilters ? 'try clearing filters or searching a different email' : 'subscribers appear when people opt in on your public status pages'}
                    </span>
                  </div>
                ) : (
                  <div className="panel" style={{ overflow: 'hidden', padding: 0 }}>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1.4fr 1.1fr 110px 140px 140px',
                      gap: 12,
                      padding: '12px 20px',
                      borderBottom: '1px solid var(--border)',
                      background: 'var(--surface)',
                    }}>
                      {sortCols.map((col) => {
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
                      {sorted.map((sub) => {
                        const componentLabel = sub.componentIds
                          .map((id) => componentNameById[id] ?? id)
                          .join(', ')

                        return (
                          <div
                            key={sub.id}
                            className="row"
                            style={{
                              display: 'grid',
                              gridTemplateColumns: '1.4fr 1.1fr 110px 140px 140px',
                              gap: 12,
                              padding: '14px 20px',
                              borderBottom: '1px solid var(--border)',
                              alignItems: 'center',
                              fontSize: 13,
                            }}
                            title={componentLabel}
                          >
                            <div className="mono" style={{ fontSize: 12.5, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {sub.email}
                            </div>

                            <div>
                              <Link to={`/support/status-pages/${sub.siteId}`} style={{ fontWeight: 600, color: 'var(--fg)' }}>
                                {siteNameById[sub.siteId] ?? sub.siteId}
                              </Link>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--muted)', fontSize: 12.5 }}>
                              <Database size={13} style={{ color: 'var(--muted)' }} />
                              <span>{sub.componentIds.length}</span>
                            </div>

                            <div style={{ color: 'var(--faint)', fontSize: 12 }}>
                              <TimeAgo timestamp={sub.firstSubscribedAt} />
                            </div>

                            <div style={{ textAlign: 'right', color: 'var(--faint)', fontSize: 12 }}>
                              {sub.lastNotificationAt == null ? '—' : <TimeAgo timestamp={sub.lastNotificationAt} />}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          })()}
        </>
      )}

      {/* MODAL: Create Service Group */}
      {showCreateGroupModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'grid',
          placeItems: 'center',
          zIndex: 9999,
          padding: 20,
        }}>
          <div className="panel" style={{ width: '100%', maxWidth: 460, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>Create Service Group</h3>
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>Organize services into a public-facing group</span>
              </div>
              <button type="button" onClick={() => setShowCreateGroupModal(false)} aria-label="Close" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', display: 'flex' }}>
                <X size={14} strokeWidth={2.2} />
              </button>
            </div>

            <form onSubmit={handleCreateGroup} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="field" style={{ marginBottom: 0 }}>
                <label className="field-label">Group Name *</label>
                <input
                  required
                  placeholder="e.g. Customer Applications"
                  className="text-input"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                />
              </div>

              <div className="field" style={{ marginBottom: 0 }}>
                <label className="field-label">Description</label>
                <input
                  placeholder="Brief description shown on status page"
                  className="text-input"
                  value={newGroupDesc}
                  onChange={(e) => setNewGroupDesc(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateGroupModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Group</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 1b: Add/Edit Service */}
      {showServiceFormModal && (() => {
        const group = serviceGroups.find((g) => g.id === serviceFormGroupId)
        const canSubmit = serviceFormSource === 'asset' ? serviceFormAssetIds.length > 0 : serviceFormEndpointIds.length > 0

        return (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'grid',
            placeItems: 'center',
            zIndex: 9999,
            padding: 20,
          }}>
            <div className="panel" style={{ width: '100%', maxWidth: 520, padding: 24, maxHeight: '90vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>{serviceFormMode === 'add' ? 'Add Service' : 'Edit Service'}</h3>
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>{group?.name} — design a public-facing service for this group</span>
                </div>
                <button type="button" onClick={() => setShowServiceFormModal(false)} aria-label="Close" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', display: 'flex' }}>
                  <X size={14} strokeWidth={2.2} />
                </button>
              </div>

              <form onSubmit={handleSubmitServiceForm} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="field" style={{ marginBottom: 0 }}>
                  <label className="field-label">Source</label>
                  <div className="group-switcher-segment" style={{ width: '100%' }}>
                    <button
                      type="button"
                      className={`segment-btn ${serviceFormSource === 'asset' ? 'active' : ''}`}
                      style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                      onClick={() => setServiceFormSource('asset')}
                    >
                      <Boxes size={13} /> Asset Graph
                    </button>
                    <button
                      type="button"
                      className={`segment-btn ${serviceFormSource === 'endpoint' ? 'active' : ''}`}
                      style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                      onClick={() => setServiceFormSource('endpoint')}
                    >
                      <Activity size={13} /> Monitored Endpoints
                    </button>
                  </div>
                </div>

                {serviceFormSource === 'asset' ? (
                  <div className="field" style={{ marginBottom: 0 }}>
                    <label className="field-label">Assets *</label>
                    <MultiSelect
                      values={serviceFormAssetIds}
                      onValuesChange={(vals) => {
                        setServiceFormAssetIds(vals)
                        if (!serviceFormName && vals.length > 0) {
                          const first = allAssets.find((a) => a.id === vals[0])
                          if (first) setServiceFormName(first.name)
                        }
                      }}
                      placeholder="Select assets…"
                      options={allAssets.map((a) => ({ value: a.id, label: `${a.name} — ${a.category}` }))}
                    />
                    {serviceFormAssetIds.length > 1 && (
                      <span style={{ fontSize: 11, color: 'var(--faint)' }}>
                        Health reflects the worst of {serviceFormAssetIds.length} selected assets.
                      </span>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="field" style={{ marginBottom: 0 }}>
                      <label className="field-label">Endpoints *</label>
                      <MultiSelect
                        values={serviceFormEndpointIds}
                        onValuesChange={(vals) => {
                          setServiceFormEndpointIds(vals)
                          if (!serviceFormName && vals.length > 0) {
                            const first = allChecks.find((c) => c.id === vals[0])
                            if (first) setServiceFormName(first.name)
                          }
                        }}
                        placeholder="Select monitored endpoints…"
                        options={allChecks.map((c) => ({ value: c.id, label: `${c.name} (${c.method} ${c.path})` }))}
                      />
                    </div>

                    {serviceFormEndpointIds.length > 1 && (
                      <div className="field" style={{ marginBottom: 0 }}>
                        <label className="field-label">Health Strategy</label>
                        <div className="group-switcher-segment" style={{ width: '100%' }}>
                          <button
                            type="button"
                            className={`segment-btn ${serviceFormHealthStrategy === 'worst' ? 'active' : ''}`}
                            style={{ flex: 1 }}
                            onClick={() => setServiceFormHealthStrategy('worst')}
                          >
                            Worst Endpoint
                          </button>
                          <button
                            type="button"
                            className={`segment-btn ${serviceFormHealthStrategy === 'average' ? 'active' : ''}`}
                            style={{ flex: 1 }}
                            onClick={() => setServiceFormHealthStrategy('average')}
                          >
                            Average Availability
                          </button>
                        </div>
                        <span style={{ fontSize: 11, color: 'var(--faint)' }}>
                          {serviceFormHealthStrategy === 'worst'
                            ? 'Service is degraded if any single endpoint degrades.'
                            : 'Service health reflects the average availability across selected endpoints.'}
                        </span>
                      </div>
                    )}
                  </>
                )}

                {(() => {
                  const hasSelection = serviceFormSource === 'asset' ? serviceFormAssetIds.length > 0 : serviceFormEndpointIds.length > 0
                  return (
                    <div className="field" style={{ marginBottom: 0, opacity: hasSelection ? 1 : 0.5 }}>
                      <label className="field-label">Service Name *</label>
                      <input
                        required
                        disabled={!hasSelection}
                        className="text-input"
                        placeholder={hasSelection ? 'e.g. Checkout Service' : 'Select a source above first'}
                        value={serviceFormName}
                        onChange={(e) => setServiceFormName(e.target.value)}
                      />
                    </div>
                  )
                })()}

                {serviceFormSource === 'endpoint' && (
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                    <div
                      onClick={() => setServiceFormAdvancedOpen(!serviceFormAdvancedOpen)}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12.5, fontWeight: 600, color: 'var(--muted)' }}
                    >
                      <ChevronRight size={13} style={{ transform: serviceFormAdvancedOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s ease' }} />
                      Advanced settings
                    </div>
                    {serviceFormAdvancedOpen && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
                        <Switch checked={serviceFormMonitorLatency} onCheckedChange={setServiceFormMonitorLatency} label="Monitor latency" />
                        <Switch checked={serviceFormMonitorSsl} onCheckedChange={setServiceFormMonitorSsl} label="Monitor SSL certificate" />
                      </div>
                    )}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowServiceFormModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={!canSubmit}>
                    {serviceFormMode === 'add' ? 'Add Service' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )
      })()}

      {/* MODAL 2: Publish Incident Update Modal */}
      {showPublishModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'grid',
          placeItems: 'center',
          zIndex: 9999,
          padding: 20,
        }}>
          <div className="panel" style={{ width: '100%', maxWidth: 460, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>Publish Update</h3>
                {publishingIncidentId && (
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                    {incidentsList.find((i) => i.id === publishingIncidentId)?.title}
                  </span>
                )}
              </div>
              <button type="button" onClick={() => setShowPublishModal(false)} aria-label="Close" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', display: 'flex' }}>
                <X size={14} strokeWidth={2.2} />
              </button>
            </div>

            <form onSubmit={handlePublishUpdate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="field" style={{ marginBottom: 0 }}>
                <label className="field-label">Stage</label>
                <div className="group-switcher-segment" style={{ width: '100%' }}>
                  {(['Investigating', 'Identified', 'Monitoring', 'Resolved'] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      className={`segment-btn ${publishStage === s ? 'active' : ''}`}
                      style={{ flex: 1, padding: '5px 6px', fontSize: 11.5 }}
                      onClick={() => {
                        setPublishStage(s)
                        if (s === 'Resolved') {
                          setPublishComponentStatus((prev) => {
                            const allOperational: Record<string, string> = {}
                            Object.keys(prev).forEach((k) => { allOperational[k] = 'Operational' })
                            return allOperational
                          })
                        }
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="field" style={{ marginBottom: 0 }}>
                <label className="field-label">Customer Message *</label>
                <textarea
                  className="text-input"
                  rows={4}
                  placeholder="e.g. We have identified the cause of elevated errors and are deploying a fix..."
                  value={publishMessage}
                  onChange={(e) => setPublishMessage(e.target.value)}
                  required
                />
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                <div
                  onClick={() => setShowAdjustComponentHealth(!showAdjustComponentHealth)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12.5, fontWeight: 600, color: 'var(--muted)' }}
                >
                  <ChevronRight size={13} style={{ transform: showAdjustComponentHealth ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s ease' }} />
                  Adjust component health status
                </div>
                {showAdjustComponentHealth && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
                    {Object.keys(publishComponentStatus).map((compName) => (
                      <div key={compName} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 13, fontWeight: 500 }}>{compName}</span>
                        <Select
                          value={publishComponentStatus[compName]}
                          onValueChange={(val) => setPublishComponentStatus((prev) => ({ ...prev, [compName]: val }))}
                          triggerStyle={{ width: 180, padding: '5px 10px', fontSize: 12.5 }}
                          options={[
                            { value: 'Operational', label: 'Operational' },
                            { value: 'Degraded Performance', label: 'Degraded Performance' },
                            { value: 'Partial Outage', label: 'Partial Outage' },
                            { value: 'Major Outage', label: 'Major Outage' },
                          ]}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowPublishModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Publish Update</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Publish Incident to Status Page */}
      {showNewIncidentModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'grid',
          placeItems: 'center',
          zIndex: 9999,
          padding: 20,
        }}>
          <div className="panel" style={{ width: '100%', maxWidth: 480, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>Publish Incident to Status Page</h3>
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>Make an active platform incident customer-facing</span>
              </div>
              <button type="button" onClick={() => setShowNewIncidentModal(false)} aria-label="Close" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', display: 'flex' }}>
                <X size={14} strokeWidth={2.2} />
              </button>
            </div>

            <form onSubmit={handleCreateNewIncident} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="field" style={{ marginBottom: 0 }}>
                <label className="field-label">Select Incident *</label>
                {publishableIncidents.length === 0 ? (
                  <div style={{ fontSize: 12.5, color: 'var(--faint)', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 6 }}>
                    Every active platform incident is already published to a status page.
                  </div>
                ) : (
                  <Select
                    value={newIncSourceId ?? ''}
                    onValueChange={(id) => {
                      const inc = publishableIncidents.find((i) => i.id === id)
                      setNewIncSourceId(inc?.id ?? null)
                      setNewIncCustomTitle(inc?.title ?? '')
                    }}
                    placeholder="Choose an incident…"
                    options={publishableIncidents.map((inc) => ({
                      value: inc.id,
                      label: `${inc.id} — ${inc.title} (${inc.severity})`,
                    }))}
                  />
                )}
              </div>

              {selectedSourceIncident && (
                <div style={{ fontSize: 12, color: 'var(--muted)', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px' }}>
                  Will show as <strong style={{ color: 'var(--fg)' }}>{mapSeverity(selectedSourceIncident.severity)}</strong> severity, affecting{' '}
                  <strong style={{ color: 'var(--fg)' }}>{componentsForServices(selectedSourceIncident.services).join(', ') || 'no tracked components'}</strong>.
                  <br />
                  Will appear on: {sitesForServices(selectedSourceIncident.services).join(', ') || <em>no status page currently shows these services</em>}
                </div>
              )}

              <div className="field" style={{ marginBottom: 0 }}>
                <label className="field-label">Customer-Facing Title *</label>
                <input
                  required
                  className="text-input"
                  placeholder="e.g. Elevated errors on checkout"
                  value={newIncCustomTitle}
                  onChange={(e) => setNewIncCustomTitle(e.target.value)}
                  disabled={!selectedSourceIncident}
                />
              </div>

              <div className="field" style={{ marginBottom: 0 }}>
                <label className="field-label">Customer-Facing Description *</label>
                <textarea
                  required
                  className="text-input"
                  rows={3}
                  placeholder="e.g. We are investigating reports of elevated errors on checkout. We will post updates as available."
                  value={newIncPublicUpdate}
                  onChange={(e) => setNewIncPublicUpdate(e.target.value)}
                  disabled={!selectedSourceIncident}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowNewIncidentModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={!selectedSourceIncident}>Publish to Status Page</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Schedule Maintenance Modal */}
      {showNewMaintenanceModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'grid',
          placeItems: 'center',
          zIndex: 9999,
          padding: 20,
        }}>
          <div className="panel" style={{ width: '100%', maxWidth: 500, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800 }}>Schedule Maintenance</h3>
              <button type="button" onClick={() => setShowNewMaintenanceModal(false)} aria-label="Close" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', display: 'flex' }}>
                <X size={14} strokeWidth={2.2} />
              </button>
            </div>

            <form onSubmit={handleCreateMaintenance} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="field" style={{ marginBottom: 0 }}>
                <label className="field-label">Title *</label>
                <input
                  required
                  className="text-input"
                  placeholder="e.g. Database failover testing"
                  value={newMaintTitle}
                  onChange={(e) => setNewMaintTitle(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="field" style={{ marginBottom: 0 }}>
                  <label className="field-label">Scheduled Start *</label>
                  <DateTimePicker value={newMaintStart} onChange={setNewMaintStart} placeholder="Pick start" />
                </div>
                <div className="field" style={{ marginBottom: 0 }}>
                  <label className="field-label">Scheduled End *</label>
                  <DateTimePicker value={newMaintEnd} onChange={setNewMaintEnd} placeholder="Pick end" minDate={newMaintStart} />
                </div>
              </div>

              <div className="field" style={{ marginBottom: 0 }}>
                <label className="field-label">Affected Components</label>
                <MultiSelect
                  values={newMaintComponents}
                  onValuesChange={setNewMaintComponents}
                  placeholder="Select components…"
                  options={['Checkout API', 'Payment Service', 'Web App', 'PostgreSQL', 'Kafka'].map((c) => ({ value: c, label: c }))}
                />
              </div>

              <div className="field" style={{ marginBottom: 0 }}>
                <label className="field-label">Customer Message</label>
                <textarea
                  className="text-input"
                  rows={3}
                  placeholder="e.g. We will be performing scheduled maintenance on our database cluster..."
                  value={newMaintDesc}
                  onChange={(e) => setNewMaintDesc(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowNewMaintenanceModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Schedule Maintenance</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4b: Post Maintenance Update */}
      {showPostMaintModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'grid',
          placeItems: 'center',
          zIndex: 9999,
          padding: 20,
        }}>
          <div className="panel" style={{ width: '100%', maxWidth: 460, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>Post Update</h3>
                {postingMaintId && (
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                    {maintenanceList.find((m) => m.id === postingMaintId)?.title}
                  </span>
                )}
              </div>
              <button type="button" onClick={() => setShowPostMaintModal(false)} aria-label="Close" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', display: 'flex' }}>
                <X size={14} strokeWidth={2.2} />
              </button>
            </div>

            <form onSubmit={handlePostMaintenanceUpdate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="field" style={{ marginBottom: 0 }}>
                <label className="field-label">Status</label>
                <div className="group-switcher-segment" style={{ width: '100%' }}>
                  {(['Scheduled', 'In Progress', 'Completed'] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      className={`segment-btn ${postMaintStatus === s ? 'active' : ''}`}
                      style={{ flex: 1 }}
                      onClick={() => setPostMaintStatus(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="field" style={{ marginBottom: 0 }}>
                <label className="field-label">Customer Message *</label>
                <textarea
                  required
                  className="text-input"
                  rows={4}
                  placeholder="e.g. Maintenance is progressing as expected and will complete on schedule."
                  value={postMaintMessage}
                  onChange={(e) => setPostMaintMessage(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowPostMaintModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Post Update</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: Add Domain Modal */}
      {showAddDomainModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'grid',
          placeItems: 'center',
          zIndex: 9999,
          padding: 20,
        }}>
          <div className="panel" style={{ width: '100%', maxWidth: 460, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800 }}>Add Custom Domain</h3>
              <button type="button" onClick={() => setShowAddDomainModal(false)} aria-label="Close" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', display: 'flex' }}>
                <X size={14} strokeWidth={2.2} />
              </button>
            </div>

            <form onSubmit={handleAddDomain} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="field" style={{ marginBottom: 0 }}>
                <label className="field-label">Status Site *</label>
                <Select
                  value={newDomainSiteId}
                  onValueChange={setNewDomainSiteId}
                  placeholder="Choose a site…"
                  options={sites.map((s) => ({ value: s.id, label: s.name }))}
                />
              </div>

              <div className="field" style={{ marginBottom: 0 }}>
                <label className="field-label">Domain *</label>
                <input
                  required
                  className="text-input"
                  placeholder="status.example.com"
                  value={newDomainValue}
                  onChange={(e) => setNewDomainValue(e.target.value)}
                />
                <span style={{ fontSize: 11, color: 'var(--faint)' }}>You'll get a CNAME record to add once this is saved.</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddDomainModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add Domain</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DRAWER: Service Detail Deepdive ("click to view service as action") */}
      {showServiceDrawer && selectedService && (() => {
        const sourceHealthItems = selectedService.sourceRefs.map((refId) => {
          if (selectedService.source === 'endpoint') {
            const check = allChecks.find((c) => c.id === refId)
            const health =
              check?.status === 'failing'
                ? 'Partial Outage'
                : check?.status === 'degraded'
                  ? 'Degraded Performance'
                  : 'Operational'
            return {
              id: refId,
              name: check?.name ?? refId,
              health,
              uptimePct: check?.uptimePct,
              avgLatencyMs: check?.avgLatencyMs,
              checkId: refId,
            }
          }
          const asset = allAssets.find((a) => a.id === refId)
          const check = asset?.syntheticCheckId
            ? allChecks.find((c) => c.id === asset.syntheticCheckId)
            : undefined
          return {
            id: refId,
            name: asset?.name ?? refId,
            health: asset?.health ?? 'Operational',
            uptimePct: check?.uptimePct,
            avgLatencyMs: check?.avgLatencyMs,
            checkId: asset?.syntheticCheckId,
          }
        })

        const overallStatusClass =
          selectedService.health === 'Partial Outage'
            ? 'sev-critical'
            : selectedService.health === 'Degraded Performance'
              ? 'sev-warning'
              : 'sev-healthy'
        const overallDotClass =
          selectedService.health === 'Partial Outage'
            ? 'critical'
            : selectedService.health === 'Degraded Performance'
              ? 'degraded'
              : 'healthy'

        return (
          <>
            {/* Backdrop overlay */}
            <div
              onClick={closeServiceDetail}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: 'rgba(0, 0, 0, 0.5)',
                zIndex: 9999,
              }}
            />
            <div style={{
              position: 'fixed',
              top: 0,
              right: 0,
              width: '100%',
              maxWidth: 420,
              height: '100%',
              background: 'var(--card)',
              borderLeft: '1px solid var(--border)',
              boxShadow: 'var(--shadow)',
              zIndex: 10000,
              padding: 24,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              overflow: 'hidden',
            }}>
              <div style={{ overflowY: 'auto', flex: 1, paddingRight: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 24, height: 24, borderRadius: 4, background: 'var(--brand-soft)', color: 'var(--brand)', display: 'grid', placeItems: 'center' }}>
                      {selectedService.source === 'endpoint'
                        ? <Activity size={13} strokeWidth={2.2} />
                        : selectedService.type === 'Database'
                          ? <Database size={13} strokeWidth={2.2} />
                          : selectedService.type === 'Web App'
                            ? <Globe size={13} strokeWidth={2.2} />
                            : selectedService.type === 'Queue'
                              ? <Zap size={13} strokeWidth={2.2} />
                              : <Boxes size={13} strokeWidth={2.2} />}
                    </div>
                    <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>Service Settings</h3>
                  </div>
                  <button type="button" onClick={closeServiceDetail} aria-label="Close" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', display: 'flex' }}>
                    <X size={14} strokeWidth={2.2} />
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <div>
                    <span className="field-label">Service Name</span>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--fg)', marginTop: 4 }}>{selectedService.name}</div>
                  </div>

                  <div>
                    <span className="field-label">Path / URL Slug</span>
                    <div className="mono" style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 4 }}>{selectedService.path}</div>
                  </div>

                  <div>
                    <span className="field-label">Type & Environment</span>
                    <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                      <span style={{ fontSize: 11, background: 'var(--chip)', padding: '2px 6px', borderRadius: 4, color: 'var(--muted)', fontWeight: 600 }}>
                        {selectedService.type}
                      </span>
                      <span style={{ fontSize: 11, background: 'var(--surface)', border: '1px solid var(--border)', padding: '2px 6px', borderRadius: 4, color: 'var(--muted)', fontWeight: 600 }}>
                        {selectedService.env}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="field-label">Current Status</span>
                    <div style={{ marginTop: 6 }}>
                      <span className={`badge ${overallStatusClass}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                        <span className={`dot ${overallDotClass}`} style={{ width: 6, height: 6 }} />
                        {selectedService.health}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="field-label">Source</span>
                    <div style={{ fontSize: 12.5, color: 'var(--fg)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                      {selectedService.source === 'asset' ? <Boxes size={13} style={{ color: 'var(--muted)' }} /> : <Activity size={13} style={{ color: 'var(--muted)' }} />}
                      {selectedService.source === 'asset'
                        ? sourceHealthItems.length > 1
                          ? `Asset Graph · Worst of ${sourceHealthItems.length} assets`
                          : 'Asset Graph'
                        : sourceHealthItems.length > 1
                          ? `${sourceHealthItems.length} monitored endpoints · ${selectedService.healthStrategy === 'worst' ? 'Worst of' : 'Average of'}`
                          : '1 monitored endpoint'}
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                    <span className="field-label" style={{ display: 'block', marginBottom: 10 }}>
                      {selectedService.source === 'asset' ? 'Linked Assets' : 'Linked Endpoints'}
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {sourceHealthItems.map((item) => {
                        const isOutage = item.health === 'Partial Outage'
                        const isDegraded = item.health === 'Degraded Performance'
                        const statusClass = isOutage ? 'sev-critical' : isDegraded ? 'sev-warning' : 'sev-healthy'
                        const dotClass = isOutage ? 'critical' : isDegraded ? 'degraded' : 'healthy'
                        return (
                          <div
                            key={item.id}
                            style={{
                              background: 'var(--surface)',
                              padding: 12,
                              borderRadius: 6,
                              border: '1px solid var(--border)',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 8,
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg)' }}>{item.name}</span>
                              <span className={`badge ${statusClass}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10.5, flexShrink: 0 }}>
                                <span className={`dot ${dotClass}`} style={{ width: 5, height: 5 }} />
                                {item.health}
                              </span>
                            </div>
                            <div style={{ display: 'flex', gap: 14, fontSize: 12, color: 'var(--muted)' }}>
                              <span>
                                Availability{' '}
                                <span className="mono" style={{ fontWeight: 700, color: 'var(--fg)' }}>
                                  {item.uptimePct != null ? `${item.uptimePct}%` : '—'}
                                </span>
                              </span>
                              <span>
                                Latency{' '}
                                <span className="mono" style={{ fontWeight: 700, color: 'var(--fg)' }}>
                                  {item.avgLatencyMs != null ? `${item.avgLatencyMs}ms` : '—'}
                                </span>
                              </span>
                            </div>
                            {item.checkId ? (
                              <Link
                                to={`/command/telemetry/synthetic/${item.checkId}`}
                                style={{
                                  fontSize: 12,
                                  fontWeight: 600,
                                  color: 'var(--brand)',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 5,
                                  textDecoration: 'none',
                                }}
                              >
                                View health check
                                <ExternalLink size={11} />
                              </Link>
                            ) : null}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                <Popover.Root open={removeConfirmOpen} onOpenChange={setRemoveConfirmOpen}>
                  <Popover.Trigger asChild>
                    <button type="button" className="btn btn-secondary" style={{ color: 'var(--error)' }}>
                      Remove
                    </button>
                  </Popover.Trigger>
                  <Popover.Portal>
                    <Popover.Content className="rt-popover-content" side="top" align="end" sideOffset={8} style={{ width: 260 }}>
                      <p style={{ fontSize: 12.5, color: 'var(--fg)', margin: '0 0 10px 0', lineHeight: 1.4 }}>
                        Remove <strong>{selectedService.name}</strong> from this group? It will stop appearing on any status page that shows it.
                      </p>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                        <button type="button" className="btn btn-secondary" style={{ padding: '5px 10px', fontSize: 12 }} onClick={() => setRemoveConfirmOpen(false)}>Cancel</button>
                        <button
                          type="button"
                          className="btn btn-primary"
                          style={{ padding: '5px 10px', fontSize: 12, background: 'var(--error)', border: 'none' }}
                          onClick={() => selectedServiceGroupId && handleRemoveService(selectedServiceGroupId, selectedService.id)}
                        >
                          Remove
                        </button>
                      </div>
                    </Popover.Content>
                  </Popover.Portal>
                </Popover.Root>
                <button
                  type="button"
                  onClick={() => selectedServiceGroupId && openEditService(selectedServiceGroupId, selectedService)}
                  className="btn btn-primary"
                >
                  Edit Service
                </button>
              </div>
            </div>
          </>
        )
      })()}
    </>
  )
}
