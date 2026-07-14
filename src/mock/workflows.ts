import { minutesAgo } from '../lib/time'

export interface Workflow {
  id: string
  name: string
  status: 'active' | 'disabled' | 'draft'
  trigger: string
  scopeTags: string[]
  lastRun: number | null
  successRate: number | null
  executions: number
}

export const workflows: Workflow[] = [
  {
    id: 'WF-101',
    name: 'Auto-restart pod on OOM',
    status: 'active',
    trigger: 'alert.created',
    scopeTags: ['k8s-prod-2', 'k8s-prod-1'],
    lastRun: minutesAgo(12),
    successRate: 98,
    executions: 412,
  },
  {
    id: 'WF-102',
    name: 'Silence noisy staging alerts overnight',
    status: 'active',
    trigger: 'alert.created',
    scopeTags: ['staging'],
    lastRun: minutesAgo(340),
    successRate: 100,
    executions: 186,
  },
  {
    id: 'WF-103',
    name: 'Escalate stale critical alerts',
    status: 'active',
    trigger: 'alert.updated',
    scopeTags: [],
    lastRun: minutesAgo(55),
    successRate: 91,
    executions: 233,
  },
  {
    id: 'WF-104',
    name: 'Auto-acknowledge recovered alerts',
    status: 'active',
    trigger: 'alert.resolved',
    scopeTags: [],
    lastRun: minutesAgo(4),
    successRate: 99,
    executions: 388,
  },
  {
    id: 'WF-105',
    name: 'Notify #eng-leads on new incident',
    status: 'disabled',
    trigger: 'incident.created',
    scopeTags: ['prod-us', 'prod-eu'],
    lastRun: minutesAgo(2880),
    successRate: 96,
    executions: 61,
  },
  {
    id: 'WF-106',
    name: 'Weekly cost digest to leadership',
    status: 'draft',
    trigger: 'case.created',
    scopeTags: [],
    lastRun: null,
    successRate: null,
    executions: 0,
  },
]

/* ONE trigger per workflow — hard constraint enforced by the builder UI. */
export const TRIGGER_EVENTS = [
  { group: 'Alert', events: ['alert.created', 'alert.updated', 'alert.resolved', 'alert.acknowledged'] },
  { group: 'Case', events: ['case.created', 'case.updated', 'case.closed'] },
  { group: 'Incident', events: ['incident.created', 'incident.updated', 'incident.resolved'] },
]

export const SCOPE_OPTIONS: Record<string, string[]> = {
  Environments: ['prod-us', 'prod-eu', 'staging', 'dev'],
  Clusters: ['k8s-prod-1', 'k8s-prod-2', 'k8s-eu-1', 'k8s-staging-1'],
  Namespaces: ['payments', 'checkout', 'search', 'platform'],
  Services: ['checkout-svc', 'payments-api', 'orders-db', 'edge-ingress', 'search-api'],
}

export const CONDITION_FIELDS = ['severity', 'service', 'environment', 'title', 'label'] as const
export const CONDITION_OPERATORS = ['equals', 'not equals', 'contains', 'starts with'] as const

export interface ActionDef {
  key: string
  name: string
  hint: string
}

export const ACTION_TYPES: ActionDef[] = [
  { key: 'assign', name: 'Assign', hint: 'Route to a user or on-call rotation' },
  { key: 'notify', name: 'Notify', hint: 'Slack / email / PagerDuty — supports {{alert.title}}' },
  { key: 'create_incident', name: 'Create Incident', hint: 'Promote to incident with severity mapping' },
  { key: 'suppress', name: 'Suppress Alert', hint: 'Silence matching alerts for a window' },
  { key: 'note', name: 'Add Note / Label', hint: 'Annotate with {{workflow.name}} context' },
  { key: 'webhook', name: 'Call Webhook', hint: 'POST payload to an external endpoint' },
  { key: 'approval', name: 'Request Approval', hint: 'Gate downstream actions on human sign-off' },
]
