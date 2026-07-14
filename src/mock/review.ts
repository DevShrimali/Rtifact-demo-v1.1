/* Review (Screens 09–12). Figures are COMPUTED from the contribution schema
   below — the same shape DAAV Validate states and workflow outcomes emit —
   so new incidents increment the rollup without manual input, and the
   exported snapshot reads from the identical source. */

export interface Contribution {
  sourceId: string
  source: 'daav' | 'workflow'
  envId: string
  costUsd: number
  engHours: number
  riskLine: string
}

export const contributions: Contribution[] = [
  { sourceId: 'ALT-4819', source: 'daav', envId: 'prod-us', costUsd: 2400, engHours: 1.8, riskLine: 'Checkout SLA breach avoided' },
  { sourceId: 'ALT-4802', source: 'daav', envId: 'prod-us', costUsd: 610, engHours: 0.4, riskLine: 'Origin overload prevented' },
  { sourceId: 'ALT-4810', source: 'daav', envId: 'prod-us', costUsd: 800, engHours: 0.7, riskLine: 'AZ-wide degradation contained' },
  { sourceId: 'INC-301', source: 'daav', envId: 'prod-us', costUsd: 1100, engHours: 0.9, riskLine: 'Disk-pressure outage avoided' },
  { sourceId: 'WF-auto-ack', source: 'workflow', envId: 'prod-us', costUsd: 0, engHours: 2.2, riskLine: '22 manual acknowledgements avoided' },
  { sourceId: 'WF-silence-night', source: 'workflow', envId: 'prod-us', costUsd: 0, engHours: 1.1, riskLine: 'Night-shift pages reduced 40%' },
  { sourceId: 'ALT-3098', source: 'daav', envId: 'prod-eu', costUsd: 380, engHours: 0.3, riskLine: 'Search freshness restored' },
  { sourceId: 'INC-398', source: 'daav', envId: 'staging', costUsd: 450, engHours: 0.9, riskLine: 'Release pipelines unblocked' },
]

export function weeklyRollup(envId: string) {
  const rows = contributions.filter((c) => c.envId === (envId === 'dev' ? 'prod-us' : envId))
  return {
    costUsd: rows.reduce((s, c) => s + c.costUsd, 0),
    engHours: Math.round(rows.reduce((s, c) => s + c.engHours, 0) * 10) / 10,
    incidents: rows.filter((c) => c.source === 'daav').length,
    workflows: rows.filter((c) => c.source === 'workflow').length,
    riskLines: rows.map((c) => c.riskLine),
  }
}

/* ---------- Screen 10: Security exposure ---------- */

export interface SecurityFinding {
  id: string
  title: string
  resource: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  aiPriority: 'Fix now' | 'Schedule' | 'Monitor'
  confidence: number
}

export interface SecurityData {
  findingTypes: number
  resourcesAtRisk: number
  criticalCount: number
  deltaWk: number
  topFindings: SecurityFinding[]
}

const securityByEnv: Record<string, SecurityData> = {
  'prod-us': {
    findingTypes: 24,
    resourcesAtRisk: 769,
    criticalCount: 9,
    deltaWk: -2,
    topFindings: [
      { id: 'SEC-101', title: 'S3 bucket public-read on billing exports', resource: 's3://rt-billing-exports', severity: 'critical', aiPriority: 'Fix now', confidence: 97 },
      { id: 'SEC-102', title: 'IAM role over-privileged: deploy-bot has iam:*', resource: 'role/deploy-bot', severity: 'critical', aiPriority: 'Fix now', confidence: 94 },
      { id: 'SEC-103', title: 'RDS snapshot shared outside org', resource: 'orders-db-snap-0412', severity: 'high', aiPriority: 'Schedule', confidence: 91 },
      { id: 'SEC-104', title: 'Security group open 0.0.0.0/0 on 5432', resource: 'sg-0a81f (staging-db)', severity: 'high', aiPriority: 'Schedule', confidence: 89 },
      { id: 'SEC-105', title: 'K8s service account tokens auto-mounted', resource: 'k8s-prod-2/default', severity: 'medium', aiPriority: 'Monitor', confidence: 82 },
    ],
  },
  'prod-eu': {
    findingTypes: 11,
    resourcesAtRisk: 214,
    criticalCount: 2,
    deltaWk: 0,
    topFindings: [
      { id: 'SEC-201', title: 'TLS cert expires in 6 days on eu-gateway', resource: 'eu-gateway', severity: 'high', aiPriority: 'Fix now', confidence: 99 },
      { id: 'SEC-202', title: 'GDPR data residency tag missing on 3 buckets', resource: 's3://rt-eu-*', severity: 'medium', aiPriority: 'Schedule', confidence: 87 },
    ],
  },
  staging: {
    findingTypes: 7,
    resourcesAtRisk: 88,
    criticalCount: 1,
    deltaWk: 1,
    topFindings: [
      { id: 'SEC-301', title: 'Staging DB reachable from office VPN CIDR', resource: 'sg-staging-db', severity: 'high', aiPriority: 'Schedule', confidence: 90 },
    ],
  },
  dev: { findingTypes: 0, resourcesAtRisk: 0, criticalCount: 0, deltaWk: 0, topFindings: [] },
}

export function getSecurity(envId: string): SecurityData {
  const data = securityByEnv[envId] ?? securityByEnv['dev']
  if (envId === 'dev' || data.findingTypes === 0) {
    return securityByEnv['prod-us']
  }
  return data
}

/* ---------- Screen 11: Cost optimization ---------- */

export interface CostItem {
  id: string
  title: string
  rootCause: string
  savingMoUsd: number
  effort: 'Low' | 'Medium' | 'High'
}

const costByEnv: Record<string, CostItem[]> = {
  'prod-us': [
    { id: 'COST-11', title: 'Rightsize over-provisioned compute', rootCause: '38 nodes under 25% CPU for 30 days', savingMoUsd: 3100, effort: 'Low' },
    { id: 'COST-12', title: 'Delete unattached EBS volumes', rootCause: '214 volumes orphaned by autoscaling churn', savingMoUsd: 840, effort: 'Low' },
    { id: 'COST-13', title: 'Move cold logs to infrequent-access tier', rootCause: '9 TB of logs untouched for 90+ days', savingMoUsd: 520, effort: 'Medium' },
    { id: 'COST-14', title: 'Consolidate NAT gateways', rootCause: '3 AZs each running duplicate NAT pairs', savingMoUsd: 360, effort: 'Medium' },
  ],
  'prod-eu': [
    { id: 'COST-21', title: 'Reserved instances for steady-state fleet', rootCause: '96 nodes on on-demand pricing', savingMoUsd: 1900, effort: 'Low' },
  ],
  staging: [
    { id: 'COST-31', title: 'Auto-stop staging overnight', rootCause: 'Full cluster runs 24/7 for a 10h workday', savingMoUsd: 1400, effort: 'Low' },
  ],
  dev: [],
}

export function getCostItems(envId: string): CostItem[] {
  const items = costByEnv[envId] ?? []
  if (envId === 'dev' || items.length === 0) {
    return costByEnv['prod-us']
  }
  return items
}

/* ---------- Screen 12: Reliability risk ---------- */

export interface ReliabilityData {
  signals: { workload: string; signal: string; level: 'critical' | 'high' | 'medium' }[]
  deploys: { total: number; rolledBack: number; failPct: number }
  obsGaps: { area: string; gap: string; telemetryPath: string }[]
}

const reliabilityByEnv: Record<string, ReliabilityData> = {
  'prod-us': {
    signals: [
      { workload: 'checkout-svc', signal: 'Crash-loop + error budget 31% and burning 6×', level: 'critical' },
      { workload: 'orders-db', signal: 'Single-AZ primary; failover untested 9 months', level: 'high' },
      { workload: 'events-pipe', signal: 'Consumer lag spikes at daily peak', level: 'medium' },
    ],
    deploys: { total: 42, rolledBack: 3, failPct: 7.1 },
    obsGaps: [
      { area: 'orders-db', gap: 'No slow-query telemetry — blocked one RCA this week', telemetryPath: '/command/telemetry/metrics' },
      { area: 'CI/CD events (staging)', gap: 'Deploy events not ingested — capped RCA confidence at 74%', telemetryPath: '/command/telemetry/intelligence' },
      { area: 'EU synthetic coverage', gap: 'No browser checks on EU checkout flow', telemetryPath: '/command/telemetry/synthetic' },
    ],
  },
  'prod-eu': {
    signals: [{ workload: 'search-indexer', signal: 'Lag recurrence 3× this month', level: 'medium' }],
    deploys: { total: 18, rolledBack: 1, failPct: 5.6 },
    obsGaps: [{ area: 'EU synthetic coverage', gap: 'No browser checks on EU checkout flow', telemetryPath: '/command/telemetry/synthetic' }],
  },
  staging: {
    signals: [{ workload: 'k8s-staging-1', signal: 'Capacity at 91% — load tests evict workloads', level: 'high' }],
    deploys: { total: 61, rolledBack: 2, failPct: 3.3 },
    obsGaps: [{ area: 'CI/CD events', gap: 'Perf-suite runs invisible to correlation engine', telemetryPath: '/command/telemetry/intelligence' }],
  },
  dev: { signals: [], deploys: { total: 4, rolledBack: 0, failPct: 0 }, obsGaps: [] },
}

export function getReliability(envId: string): ReliabilityData {
  const data = reliabilityByEnv[envId] ?? reliabilityByEnv['dev']
  if (envId === 'dev' || data.signals.length === 0) {
    return reliabilityByEnv['prod-us']
  }
  return data
}

/* ---------- Screen 09: Executive summary ---------- */

export function getExecParagraph(envId: string, envName: string): { text: string; confidence: number } {
  const r = weeklyRollup(envId)
  const s = getSecurity(envId)
  const cost = getCostItems(envId).reduce((sum, i) => sum + i.savingMoUsd, 0)
  return {
    text:
      r.incidents === 0 && s.findingTypes === 0
        ? `${envName} had a quiet week: no incidents required intervention and no security findings are open. Connect more sources to deepen coverage.`
        : `This week in ${envName}, the platform handled ${r.incidents} incidents automatically, protecting ~$${(r.costUsd / 1000).toFixed(1)}k in revenue and saving ${r.engHours} engineer-hours. Security posture ${s.deltaWk <= 0 ? 'improved' : 'slipped'} — ${s.criticalCount} critical findings remain across ${s.resourcesAtRisk} resources. A further $${(cost / 1000).toFixed(1)}k/month of infrastructure savings is ready to capture, most of it low-effort.`,
    confidence: 92,
  }
}

export function formatUsd(n: number): string {
  return n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n}`
}

/* ---------- Multi-environment aggregation (DEV-27 multi-select / DEV-29) ----------
   Review figures reflect the aggregate when several environments are selected.
   Each helper reduces the per-env functions above across the id list. */

export function aggregateRollup(ids: string[]) {
  return ids
    .map(weeklyRollup)
    .reduce(
      (acc, r) => ({
        costUsd: acc.costUsd + r.costUsd,
        engHours: Math.round((acc.engHours + r.engHours) * 10) / 10,
        incidents: acc.incidents + r.incidents,
        workflows: acc.workflows + r.workflows,
        riskLines: [...acc.riskLines, ...r.riskLines],
      }),
      { costUsd: 0, engHours: 0, incidents: 0, workflows: 0, riskLines: [] as string[] },
    )
}

export function aggregateSecurity(ids: string[]) {
  const each = ids.map(getSecurity)
  return {
    findingTypes: each.reduce((s, x) => s + x.findingTypes, 0),
    resourcesAtRisk: each.reduce((s, x) => s + x.resourcesAtRisk, 0),
    criticalCount: each.reduce((s, x) => s + x.criticalCount, 0),
    deltaWk: each.reduce((s, x) => s + x.deltaWk, 0),
    topFindings: each.flatMap((x) => x.topFindings).sort((a, b) => b.confidence - a.confidence),
  }
}

export function aggregateCostTotal(ids: string[]): number {
  return ids.reduce((s, id) => s + getCostItems(id).reduce((a, i) => a + i.savingMoUsd, 0), 0)
}

export function aggregateCostItems(ids: string[]) {
  return ids.flatMap(getCostItems).sort((a, b) => b.savingMoUsd - a.savingMoUsd)
}

export function aggregateReliability(ids: string[]) {
  const each = ids.map(getReliability)
  return {
    signals: each.flatMap((x) => x.signals),
    deploys: each.reduce(
      (acc, x) => {
        const total = acc.total + x.deploys.total
        const rolledBack = acc.rolledBack + x.deploys.rolledBack
        return { total, rolledBack, failPct: total ? Math.round((rolledBack / total) * 1000) / 10 : 0 }
      },
      { total: 0, rolledBack: 0, failPct: 0 },
    ),
    obsGaps: each.flatMap((x) => x.obsGaps),
  }
}
