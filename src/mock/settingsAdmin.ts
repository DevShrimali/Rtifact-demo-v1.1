import { minutesAgo } from '../lib/time'

/* ---------- Screen 53: Cloud connections ---------- */

export const cloudConnections = [
  { name: 'AWS — prod account', detail: '2 regions · 148 resources scanned', status: 'connected' as const },
  { name: 'AWS — shared services', detail: '1 region · 61 resources scanned', status: 'connected' as const },
  { name: 'GCP — staging project', detail: 'us-central1 · 44 resources scanned', status: 'connected' as const },
  { name: 'Private Cloud — on-prem K8s', detail: '1 cluster · agent-based', status: 'connected' as const },
]

export const detectedClusters = [
  { name: 'k8s-edge-2', hint: 'detected via VPC peering with prod-us' },
  { name: 'analytics-gcp', hint: 'detected via shared service account' },
]

/* ---------- Screen 54: Monitoring + notifications ---------- */

export const monitoringIntegrations = [
  { name: 'Datadog', detail: 'metrics + monitors import', connected: true },
  { name: 'New Relic', detail: 'APM traces', connected: false },
  { name: 'OTLP', detail: 'native OpenTelemetry ingest', connected: true },
]

export const notificationChannels = [
  { name: 'Slack', detail: '#incidents, #eng-leads · deeplinks into DAAV states', connected: true, recommended: true },
  { name: 'Email', detail: 'digests + case replies', connected: true, recommended: false },
  { name: 'PagerDuty', detail: 'sev-critical paging', connected: true, recommended: false },
  { name: 'Phone', detail: 'voice escalation chain', connected: false, recommended: false },
]

/* ---------- Screen 55: Users & Roles ---------- */

export const ROLES = ['Admin', 'Responder', 'Viewer'] as const

export interface Member {
  name: string
  email: string
  role: (typeof ROLES)[number]
  lastActive: number
}

export const members: Member[] = [
  { name: 'Priya Sharma', email: 'priya@acme.com', role: 'Admin', lastActive: minutesAgo(2) },
  { name: 'Raj Patel', email: 'raj@acme.com', role: 'Viewer', lastActive: minutesAgo(2600) },
  { name: 'A. Rivera', email: 'arivera@acme.com', role: 'Responder', lastActive: minutesAgo(35) },
  { name: 'J. Okafor', email: 'jokafor@acme.com', role: 'Responder', lastActive: minutesAgo(120) },
  { name: 'M. Chen', email: 'mchen@acme.com', role: 'Responder', lastActive: minutesAgo(400) },
]

/* ---------- Screen 56: Custom Fields ---------- */

export interface CustomField {
  name: string
  appliesTo: ('alert' | 'incident' | 'case')[]
  type: 'text' | 'select' | 'number'
}

export const customFields: CustomField[] = [
  { name: 'Business unit', appliesTo: ['incident', 'case'], type: 'select' },
  { name: 'Customer impact tier', appliesTo: ['incident'], type: 'select' },
  { name: 'Jira key', appliesTo: ['alert', 'incident'], type: 'text' },
]

/* ---------- Screen 58: Theming ---------- */

export const ACCENT_SWATCHES = ['#5076ee', '#8a63ee', '#0f8f6b', '#c2410c', '#334155']
export const FONT_OPTIONS = ['Inter', 'IBM Plex Sans', 'Söhne', 'System UI']
