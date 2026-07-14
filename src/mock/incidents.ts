import { minutesAgo } from '../lib/time'
import type { Severity } from './alerts'
import type { ChainNode } from './daav'

export type IncidentStatus =
  | 'investigating'
  | 'waiting_rca'
  | 'waiting_approval'
  | 'mitigating'
  | 'monitoring'
  | 'resolved'

export const INCIDENT_PIPELINE: { key: IncidentStatus; label: string }[] = [
  { key: 'investigating', label: 'Investigating' },
  { key: 'waiting_rca', label: 'Waiting on RCA' },
  { key: 'waiting_approval', label: 'Waiting on Approval' },
  { key: 'mitigating', label: 'Mitigating' },
  { key: 'monitoring', label: 'Monitoring' },
  { key: 'resolved', label: 'Resolved' },
]

export interface BeforeNowRow {
  service: string
  metric: string
  before: string
  now: string
  worse: boolean
}

export interface EvidenceItem {
  kind: 'logs' | 'metric' | 'deploy' | 'trace'
  label: string
  source: string
  at: number
}

export interface IncidentDetail {
  summary: string
  confidence: number
  recommendation: string
  chain: ChainNode[]
  beforeNow: BeforeNowRow[]
  evidence: EvidenceItem[]
}

export interface Incident {
  id: string
  title: string
  severity: Severity
  status: IncidentStatus
  aiCreated: boolean
  services: string[]
  startedAt: number
  /* minutes until SLA breach at page load; negative = breached; null = no SLA */
  slaMinutesLeft: number | null
  owner: string
  detail: IncidentDetail
}

function makeDetail(overrides: Partial<IncidentDetail> = {}): IncidentDetail {
  return {
    summary:
      'Rtifact AI correlated this incident from grouped alerts and change events. Investigation is progressing automatically; evidence updates in real time.',
    confidence: 82,
    recommendation: 'Continue automated investigation; escalate if blast radius grows.',
    chain: [
      { kind: 'cause', title: 'Change event detected', sub: 'correlated deploy/config', confidence: 82 },
      { kind: 'effect', title: 'Service degradation', sub: 'error/latency anomaly', confidence: 85 },
      { kind: 'impact', title: 'User-facing impact', sub: 'scoped to 1 surface', confidence: 80 },
    ],
    beforeNow: [
      { service: 'primary-svc', metric: 'error rate', before: '0.2%', now: '1.8%', worse: true },
      { service: 'downstream-svc', metric: 'p99 latency', before: '240ms', now: '410ms', worse: true },
    ],
    evidence: [
      { kind: 'metric', label: 'Error-rate anomaly window', source: 'Telemetry · Metrics', at: minutesAgo(18) },
      { kind: 'logs', label: 'Recurring exception signature', source: 'Telemetry · Logs', at: minutesAgo(16) },
      { kind: 'deploy', label: 'Correlated change event', source: 'Change timeline', at: minutesAgo(21) },
    ],
    ...overrides,
  }
}

const incidentsByEnv: Record<string, Incident[]> = {
  'prod-us': [
    {
      id: 'INC-311',
      title: 'Checkout degradation — deploy-correlated retry storm',
      severity: 'critical',
      status: 'investigating',
      aiCreated: true,
      services: ['checkout-svc', 'payments-api', 'orders-db'],
      startedAt: minutesAgo(23),
      slaMinutesLeft: 17,
      owner: 'A. Rivera',
      detail: makeDetail({
        summary:
          'Checkout error rate is 14× baseline. Rtifact AI created this incident from 3 correlated alerts, tied the onset to deploy v2.14.3, and is completing root-cause verification now.',
        confidence: 87,
        recommendation: 'Approve the prepared rollback (Act state of ALT-4819) — projected recovery in ~6m.',
        chain: [
          { kind: 'cause', title: 'Deploy v2.14.3', sub: 'checkout-svc · 04:38 UTC', confidence: 92 },
          { kind: 'effect', title: 'Retry storm on payments client', sub: '8× request amplification', confidence: 89 },
          { kind: 'effect', title: 'orders-db pool saturation', sub: '87% → timeouts', confidence: 85 },
          { kind: 'impact', title: 'Checkout failures 4.2%', sub: '~$310/min revenue at risk', confidence: 87 },
        ],
        beforeNow: [
          { service: 'checkout-svc', metric: 'error rate', before: '0.3%', now: '4.2%', worse: true },
          { service: 'payments-api', metric: 'p99 latency', before: '220ms', now: '890ms', worse: true },
          { service: 'orders-db', metric: 'pool usage', before: '52%', now: '87%', worse: true },
          { service: 'cart-svc', metric: 'error rate', before: '0.1%', now: '0.1%', worse: false },
        ],
        evidence: [
          { kind: 'deploy', label: 'checkout-svc v2.14.3 rollout completed', source: 'Change timeline', at: minutesAgo(26) },
          { kind: 'metric', label: '5xx spike on POST /checkout/complete', source: 'Telemetry · Metrics', at: minutesAgo(23) },
          { kind: 'logs', label: 'PaymentRetryExhausted ×2,140', source: 'Telemetry · Logs', at: minutesAgo(22) },
          { kind: 'trace', label: 'Exemplar trace: 8 retries per request', source: 'Telemetry · Traces', at: minutesAgo(20) },
        ],
      }),
    },
    {
      id: 'INC-308',
      title: 'Search results stale — indexer pipeline stalled',
      severity: 'medium',
      status: 'investigating',
      aiCreated: false,
      services: ['search-indexer', 'search-api'],
      startedAt: minutesAgo(51),
      slaMinutesLeft: -4,
      owner: 'M. Chen',
      detail: makeDetail({
        confidence: 71,
        summary:
          'Search index lag exceeds 30m. Manual incident — reported via Slack before signal correlation completed. RCA confidence is limited by missing pipeline metrics.',
        recommendation: 'Attach indexer pipeline metrics source to raise RCA confidence above threshold.',
      }),
    },
    {
      id: 'INC-310',
      title: 'Notification delays — queue backlog growing',
      severity: 'high',
      status: 'waiting_rca',
      aiCreated: true,
      services: ['notify-svc', 'events-pipe'],
      startedAt: minutesAgo(38),
      slaMinutesLeft: 42,
      owner: 'J. Okafor',
      detail: makeDetail({
        confidence: 76,
        summary:
          'Notification queue depth growing 4%/min. Rtifact AI is evaluating two candidate causes: consumer scaling lag vs. poison message loop.',
        recommendation: 'RCA completing — two hypotheses under test, ETA ~4m.',
      }),
    },
    {
      id: 'INC-309',
      title: 'Ingress 5xx — rollback prepared, approval pending',
      severity: 'critical',
      status: 'waiting_approval',
      aiCreated: true,
      services: ['edge-ingress', 'router-tier'],
      startedAt: minutesAgo(47),
      slaMinutesLeft: 8,
      owner: 'J. Okafor',
      detail: makeDetail({
        confidence: 89,
        summary:
          'Node-rotation drain blackholing requests in us-east-1c. Remediation is prepared and gated on approval: pause rotation + raise deregistration delay.',
        recommendation: 'Approve prepared remediation — Medium risk, 94% past success, ETA ~4m.',
        chain: [
          { kind: 'cause', title: 'Node rotation us-east-1c', sub: 'batch 4 · delay 30s', confidence: 89 },
          { kind: 'effect', title: 'LB routes to draining pods', sub: 'deregistration lag 45s', confidence: 86 },
          { kind: 'impact', title: '5xx on 0.9% of requests', sub: 'retry-able', confidence: 91 },
        ],
        beforeNow: [
          { service: 'edge-ingress', metric: '5xx rate', before: '0.02%', now: '0.9%', worse: true },
          { service: 'router-tier', metric: 'p99 latency', before: '180ms', now: '310ms', worse: true },
        ],
      }),
    },
    {
      id: 'INC-306',
      title: 'Payment latency — index rebuild in progress',
      severity: 'high',
      status: 'mitigating',
      aiCreated: true,
      services: ['payments-api', 'orders-db'],
      startedAt: minutesAgo(74),
      slaMinutesLeft: 55,
      owner: 'A. Rivera',
      detail: makeDetail({
        confidence: 84,
        summary:
          'Covering index build is 60% complete on orders-db. Query latency already improving; full recovery projected within the SLA window.',
        recommendation: 'Remediation executing — no action needed unless build stalls.',
      }),
    },
    {
      id: 'INC-305',
      title: 'CDN cache recovery — observation window',
      severity: 'medium',
      status: 'monitoring',
      aiCreated: true,
      services: ['cdn-edge', 'origin-fleet'],
      startedAt: minutesAgo(96),
      slaMinutesLeft: null,
      owner: 'M. Chen',
      detail: makeDetail({
        confidence: 94,
        summary:
          'Cache-key config reverted; hit ratio back above 90%. Observing for 30m before auto-resolution.',
        recommendation: 'No action — auto-resolves when observation window closes clean.',
        beforeNow: [
          { service: 'cdn-edge', metric: 'hit ratio', before: '71%', now: '94%', worse: false },
          { service: 'origin-fleet', metric: 'load factor', before: '3.1×', now: '1.1×', worse: false },
        ],
      }),
    },
    {
      id: 'INC-301',
      title: 'Disk pressure on node group c5 — auto-resolved',
      severity: 'low',
      status: 'resolved',
      aiCreated: true,
      services: ['k8s-prod-2'],
      startedAt: minutesAgo(240),
      slaMinutesLeft: null,
      owner: 'Rtifact AI',
      detail: makeDetail({
        confidence: 96,
        summary:
          'Log rotation runbook applied automatically; disk pressure cleared in 7m. Saved ~$1.1k and 0.9 eng-hours.',
        recommendation: 'Resolved — pattern added to operational knowledge.',
        beforeNow: [
          { service: 'k8s-prod-2', metric: 'disk usage', before: '92%', now: '61%', worse: false },
        ],
      }),
    },
  ],
  'prod-eu': [
    {
      id: 'INC-355',
      title: 'Indexer lag recovered — observing',
      severity: 'medium',
      status: 'monitoring',
      aiCreated: true,
      services: ['search-indexer'],
      startedAt: minutesAgo(130),
      slaMinutesLeft: null,
      owner: 'Rtifact AI',
      detail: makeDetail({ confidence: 91 }),
    },
  ],
  staging: [
    {
      id: 'INC-402',
      title: 'Staging cluster capacity — node group down',
      severity: 'critical',
      status: 'investigating',
      aiCreated: true,
      services: ['k8s-staging-1', 'edge-ingress'],
      startedAt: minutesAgo(6),
      slaMinutesLeft: 39,
      owner: 'J. Okafor',
      detail: makeDetail({ confidence: 78 }),
    },
    {
      id: 'INC-398',
      title: 'CI runner starvation — auto-resolved',
      severity: 'low',
      status: 'resolved',
      aiCreated: true,
      services: ['ci-runners'],
      startedAt: minutesAgo(420),
      slaMinutesLeft: null,
      owner: 'Rtifact AI',
      detail: makeDetail({ confidence: 95 }),
    },
  ],
  dev: [],
}

export function getIncidents(envId: string): Incident[] {
  const list = incidentsByEnv[envId] ?? []
  if (envId === 'dev' || list.length === 0) {
    return incidentsByEnv['prod-us']
  }
  return list
}

export function findIncident(id: string): Incident | undefined {
  return Object.values(incidentsByEnv)
    .flat()
    .find((i) => i.id === id)
}

export function getAllIncidents(): Incident[] {
  return Object.values(incidentsByEnv).flat()
}
