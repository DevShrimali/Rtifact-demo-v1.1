import { minutesAgo } from '../lib/time'

/* ---------- Screens 40–41: Playbooks / Runbooks ---------- */

export const RUNBOOK_TOTAL = 41

export interface Runbook {
  id: string
  name: string
  confidence: number
  services: string[]
  lastUsed: number | null
  purpose: string
  steps: string[]
  recommendedFix: string
  outcomes: { when: number; incident: string; result: 'success' | 'partial' | 'failed'; note: string }[]
}

export const runbooks: Runbook[] = [
  {
    id: 'RB-12',
    name: 'Roll back bad deploy',
    confidence: 96,
    services: ['checkout-svc', 'payments-api'],
    lastUsed: minutesAgo(60),
    purpose: 'Revert a service to its previous release when a deploy correlates with degradation.',
    steps: [
      'Freeze the pipeline for the affected service',
      'Roll back to previous tagged release',
      'Verify error rate recovery over 10m window',
      'Unfreeze pipeline and annotate the release',
    ],
    recommendedFix: 'Best match when RCA points at a deploy with ≥85% correlation.',
    outcomes: [
      { when: minutesAgo(60), incident: 'INC-311', result: 'success', note: 'recovered in 6m, saved ~$2.4k' },
      { when: minutesAgo(30000), incident: 'INC-208', result: 'success', note: 'recovered in 8m' },
      { when: minutesAgo(88000), incident: 'INC-183', result: 'partial', note: 'needed pool scale-up too' },
    ],
  },
  {
    id: 'RB-09',
    name: 'Clear disk pressure via log rotation',
    confidence: 94,
    services: ['k8s-prod-2', 'k8s-prod-1'],
    lastUsed: minutesAgo(240),
    purpose: 'Free node disk when log volumes breach 90% by forcing rotation + compression.',
    steps: ['Identify offending pods by volume growth', 'Force logrotate + compress', 'Verify pressure clears'],
    recommendedFix: 'Auto-approved (low risk) — runs without human gate.',
    outcomes: [
      { when: minutesAgo(240), incident: 'INC-301', result: 'success', note: 'cleared in 7m, saved 0.9 eng-hrs' },
      { when: minutesAgo(46000), incident: 'INC-176', result: 'success', note: 'cleared in 5m' },
    ],
  },
  {
    id: 'RB-17',
    name: 'Scale connection pool under saturation',
    confidence: 71,
    services: ['orders-db'],
    lastUsed: minutesAgo(1400),
    purpose: 'Raise DB connection pool ceiling when saturation is the symptom, not the cause.',
    steps: ['Snapshot current pool stats', 'Raise ceiling +50%', 'Watch for downstream memory pressure'],
    recommendedFix: 'Symptom-level fix — pair with root-cause playbook when correlation is strong.',
    outcomes: [
      { when: minutesAgo(1400), incident: 'INC-297', result: 'partial', note: 'bought time; root cause was a deploy' },
      { when: minutesAgo(70000), incident: 'INC-141', result: 'failed', note: 'masked a leak, rolled back' },
    ],
  },
  {
    id: 'RB-21',
    name: 'Pause node rotation + raise drain delay',
    confidence: 92,
    services: ['edge-ingress', 'router-tier'],
    lastUsed: minutesAgo(2800),
    purpose: 'Stop LB blackholing when rotations drain pods faster than deregistration.',
    steps: ['Pause rotation batch', 'Raise deregistration delay to 90s', 'Resume rotation one AZ at a time'],
    recommendedFix: 'Matches INC-201 signature — 94% past success.',
    outcomes: [{ when: minutesAgo(2800), incident: 'INC-201', result: 'success', note: '5xx recovered in 4m' }],
  },
  {
    id: 'RB-05',
    name: 'Rate-limit synthetic traffic sources',
    confidence: 88,
    services: ['edge-ingress'],
    lastUsed: null,
    purpose: 'Cap identified load-test or bot IPs at ingress without killing the source job.',
    steps: ['Classify source IPs', 'Apply rate-limit rule', 'Notify owning team'],
    recommendedFix: 'Preferred over killing CI jobs when the owner is unconfirmed.',
    outcomes: [],
  },
]

/* ---------- Screen 42: Silences ---------- */

export interface Silence {
  id: string
  pattern: string
  reason: string
  createdBy: string
  expiresInMin: number
  matchedAlerts: string[]
}

export const seedSilences: Silence[] = [
  {
    id: 'SIL-31',
    pattern: 'service=ci-runners severity<=medium',
    reason: 'CI runner flakiness during pipeline migration',
    createdBy: 'J. Okafor',
    expiresInMin: 145,
    matchedAlerts: [],
  },
  {
    id: 'SIL-30',
    pattern: 'env=staging title~load-test',
    reason: 'Perf suite runs nightly — expected saturation',
    createdBy: 'P. Sharma',
    expiresInMin: 512,
    matchedAlerts: ['ALT-9012'],
  },
]

/* patterns offered by the create form, with the alerts they'd suppress */
export const SILENCE_PATTERNS: { pattern: string; matches: string[] }[] = [
  { pattern: 'service=checkout-svc severity=critical', matches: ['ALT-4819'] },
  { pattern: 'service=orders-db', matches: ['ALT-4816'] },
  { pattern: 'service=edge-ingress', matches: ['ALT-4810', 'ALT-9012'] },
  { pattern: 'env=dev', matches: [] },
]

/* ---------- Screen 43: Templates ---------- */

export interface WorkflowTemplate {
  id: string
  name: string
  description: string
  trigger: string
  actions: string[]
  usedCount: number
}

export const templates: WorkflowTemplate[] = [
  { id: 'TPL-1', name: 'Auto-ack recovered alerts', description: 'Acknowledge alerts that resolve themselves within 10m.', trigger: 'alert.resolved', actions: ['Add Note / Label'], usedCount: 12 },
  { id: 'TPL-2', name: 'Escalate stale criticals', description: 'Page on-call when a critical sits unacknowledged for 15m.', trigger: 'alert.updated', actions: ['Notify', 'Assign'], usedCount: 9 },
  { id: 'TPL-3', name: 'Night silence for staging', description: 'Suppress staging noise 22:00–06:00.', trigger: 'alert.created', actions: ['Suppress Alert'], usedCount: 7 },
  { id: 'TPL-4', name: 'Incident on repeated pattern', description: 'Open an incident when the same pattern fires 3× in 30m.', trigger: 'alert.created', actions: ['Create Incident', 'Notify'], usedCount: 5 },
]

/* ---------- Screen 44: Executions ---------- */

export interface Execution {
  id: string
  workflowId: string
  workflowName: string
  trigger: string
  outcome: 'success' | 'failed' | 'skipped'
  at: number
  note: string
}

export const executions: Execution[] = [
  { id: 'EX-9101', workflowId: 'WF-104', workflowName: 'Auto-acknowledge recovered alerts', trigger: 'alert.resolved · ALT-4802', outcome: 'success', at: minutesAgo(4), note: 'acknowledged + labeled' },
  { id: 'EX-9100', workflowId: 'WF-101', workflowName: 'Auto-restart pod on OOM', trigger: 'alert.created · ALT-4821', outcome: 'success', at: minutesAgo(12), note: 'restart deferred — rollback in flight' },
  { id: 'EX-9099', workflowId: 'WF-103', workflowName: 'Escalate stale critical alerts', trigger: 'alert.updated · ALT-4819', outcome: 'success', at: minutesAgo(55), note: 'paged payments on-call' },
  { id: 'EX-9098', workflowId: 'WF-103', workflowName: 'Escalate stale critical alerts', trigger: 'alert.updated · ALT-9017', outcome: 'failed', at: minutesAgo(140), note: 'webhook timeout after 3 retries' },
  { id: 'EX-9097', workflowId: 'WF-102', workflowName: 'Silence noisy staging alerts overnight', trigger: 'alert.created · ALT-9008', outcome: 'success', at: minutesAgo(340), note: 'suppressed for 8h window' },
  { id: 'EX-9096', workflowId: 'WF-104', workflowName: 'Auto-acknowledge recovered alerts', trigger: 'alert.resolved · ALT-4788', outcome: 'success', at: minutesAgo(400), note: 'acknowledged + labeled' },
  { id: 'EX-9095', workflowId: 'WF-101', workflowName: 'Auto-restart pod on OOM', trigger: 'alert.created · ALT-4771', outcome: 'skipped', at: minutesAgo(700), note: 'condition not met — severity low' },
  { id: 'EX-9094', workflowId: 'WF-103', workflowName: 'Escalate stale critical alerts', trigger: 'alert.updated · ALT-4810', outcome: 'success', at: minutesAgo(900), note: 'paged platform on-call' },
]

/* ---------- Screen 45: Audit log ---------- */

export interface AuditEntry {
  id: string
  actor: string
  action: string
  at: number
}

export const auditLog: AuditEntry[] = [
  { id: 'AUD-771', actor: 'P. Sharma', action: 'Approved remediation "Roll back checkout-svc to v2.14.2" on ALT-4819', at: minutesAgo(58) },
  { id: 'AUD-770', actor: 'Rtifact AI', action: 'Created incident INC-311 from correlated alert group', at: minutesAgo(1400) },
  { id: 'AUD-769', actor: 'J. Okafor', action: 'Created silence SIL-31 (service=ci-runners severity<=medium)', at: minutesAgo(2100) },
  { id: 'AUD-768', actor: 'A. Rivera', action: 'Enabled workflow WF-104 "Auto-acknowledge recovered alerts"', at: minutesAgo(4400) },
  { id: 'AUD-767', actor: 'M. Chen', action: 'Edited workflow WF-103 — raised stale threshold 10m → 15m', at: minutesAgo(8100) },
  { id: 'AUD-766', actor: 'Rtifact AI', action: 'Auto-resolved INC-301 via runbook RB-09 (log rotation)', at: minutesAgo(14000) },
]
