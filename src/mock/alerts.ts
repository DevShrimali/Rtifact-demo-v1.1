import { minutesAgo } from '../lib/time'

export type Severity = 'critical' | 'high' | 'medium' | 'low'
export type AlertColumn = 'new' | 'in_progress' | 'resolved'

export interface Alert {
  id: string
  title: string
  service: string
  severity: Severity
  column: AlertColumn
  startedAt: number
  /* in-progress alerts: what the platform is doing right now */
  activity?: string
  /* resolved alerts: quantified AI contribution (AI contribution rule) */
  aiOutcome?: string
}

export interface HealthTile {
  id: string
  name: string
  health: 'healthy' | 'degraded' | 'critical'
  metric: string
  checkedAt: number
}

export interface OptimizationGoal {
  id: string
  label: string
  current: string
  target: string
  /* 0–100 progress toward target */
  pct: number
  onTrack: boolean
}

export interface BoardMetrics {
  mttd: string
  mttdDelta: { value: string; good: boolean }
  mttr: string
  mttrDelta: { value: string; good: boolean }
  noiseRatio: string
  noiseDelta: { value: string; good: boolean }
  aiContribution: string
}

export interface AlertsBoard {
  alerts: Alert[]
  tiles: HealthTile[]
  goals: OptimizationGoal[]
  metrics: BoardMetrics
}

const GOALS_DEFAULT: OptimizationGoal[] = [
  { id: 'mttr', label: 'MTTR under 30m', current: '24m', target: '30m', pct: 80, onTrack: true },
  { id: 'noise', label: 'Noise ratio under 20%', current: '14%', target: '20%', pct: 70, onTrack: true },
  { id: 'auto', label: 'Auto-resolution above 40%', current: '38%', target: '40%', pct: 95, onTrack: false },
]

const boards: Record<string, AlertsBoard> = {
  'prod-us': {
    alerts: [
      { id: 'ALT-4821', title: 'p99 latency breach — 2.4s vs 800ms SLO', service: 'payments-api', severity: 'critical', column: 'new', startedAt: minutesAgo(5) },
      { id: 'ALT-4816', title: 'Connection pool at 87% saturation', service: 'orders-db', severity: 'medium', column: 'new', startedAt: minutesAgo(28) },
      { id: 'ALT-4819', title: 'Error rate 4.2% — deploy correlated', service: 'checkout-svc', severity: 'critical', column: 'in_progress', startedAt: minutesAgo(12), activity: 'RCA running · 87% confidence' },
      { id: 'ALT-4810', title: '5xx spike on ingress — 0.9% of requests', service: 'edge-ingress', severity: 'high', column: 'in_progress', startedAt: minutesAgo(44), activity: 'Rollback awaiting approval' },
      { id: 'ALT-4802', title: 'Cache hit ratio recovered to 94%', service: 'cdn-edge', severity: 'low', column: 'resolved', startedAt: minutesAgo(64), aiOutcome: 'Auto-resolved · saved ~$610, 0.4 eng-hrs' },
      { id: 'ALT-4788', title: 'Disk pressure cleared on node group c5', service: 'k8s-prod-2', severity: 'medium', column: 'resolved', startedAt: minutesAgo(180), aiOutcome: 'Auto-resolved · saved ~$1.1k, 0.9 eng-hrs' },
      { id: 'ALT-4771', title: 'Lambda throttling normalized', service: 'events-pipe', severity: 'low', column: 'resolved', startedAt: minutesAgo(300), aiOutcome: 'Runbook applied · saved 0.6 eng-hrs' },
    ],
    tiles: [
      { id: 'compute', name: 'Compute', health: 'healthy', metric: '142 nodes · 61% util', checkedAt: minutesAgo(1) },
      { id: 'db', name: 'Databases', health: 'degraded', metric: 'orders-db pool 87%', checkedAt: minutesAgo(2) },
      { id: 'network', name: 'Network', health: 'healthy', metric: '18ms cross-AZ p50', checkedAt: minutesAgo(1) },
      { id: 'ingress', name: 'Ingress', health: 'degraded', metric: '5xx at 0.9%', checkedAt: minutesAgo(3) },
      { id: 'storage', name: 'Storage', health: 'healthy', metric: '71% capacity', checkedAt: minutesAgo(6) },
    ],
    goals: GOALS_DEFAULT,
    metrics: {
      mttd: '3.2m',
      mttdDelta: { value: '−18% wk', good: true },
      mttr: '24m',
      mttrDelta: { value: '−9% wk', good: true },
      noiseRatio: '14%',
      noiseDelta: { value: '+2% wk', good: false },
      aiContribution: 'Saved ~$12.4k · 38 eng-hrs this month',
    },
  },
  'prod-eu': {
    alerts: [
      { id: 'ALT-3102', title: 'TLS certificate expires in 6 days', service: 'eu-gateway', severity: 'medium', column: 'new', startedAt: minutesAgo(22) },
      { id: 'ALT-3099', title: 'Indexer lag 14m behind head', service: 'search-indexer', severity: 'high', column: 'in_progress', startedAt: minutesAgo(50), activity: 'Scale-up in progress · 2 of 4 nodes' },
      { id: 'ALT-3098', title: 'Indexer lag normalized after scale-up', service: 'search-indexer', severity: 'low', column: 'resolved', startedAt: minutesAgo(190), aiOutcome: 'Auto-resolved · saved ~$380, 0.3 eng-hrs' },
    ],
    tiles: [
      { id: 'compute', name: 'Compute', health: 'healthy', metric: '96 nodes · 54% util', checkedAt: minutesAgo(1) },
      { id: 'db', name: 'Databases', health: 'healthy', metric: 'all pools under 60%', checkedAt: minutesAgo(2) },
      { id: 'network', name: 'Network', health: 'healthy', metric: '21ms cross-AZ p50', checkedAt: minutesAgo(2) },
      { id: 'ingress', name: 'Ingress', health: 'healthy', metric: '5xx at 0.02%', checkedAt: minutesAgo(1) },
      { id: 'storage', name: 'Storage', health: 'healthy', metric: '58% capacity', checkedAt: minutesAgo(9) },
    ],
    goals: [
      { id: 'mttr', label: 'MTTR under 30m', current: '19m', target: '30m', pct: 100, onTrack: true },
      { id: 'noise', label: 'Noise ratio under 20%', current: '9%', target: '20%', pct: 100, onTrack: true },
      { id: 'auto', label: 'Auto-resolution above 40%', current: '44%', target: '40%', pct: 100, onTrack: true },
    ],
    metrics: {
      mttd: '2.8m',
      mttdDelta: { value: '−6% wk', good: true },
      mttr: '19m',
      mttrDelta: { value: '−12% wk', good: true },
      noiseRatio: '9%',
      noiseDelta: { value: '−1% wk', good: true },
      aiContribution: 'Saved ~$4.1k · 12 eng-hrs this month',
    },
  },
  staging: {
    alerts: [
      { id: 'ALT-9017', title: 'Node group unreachable — 4 nodes down', service: 'k8s-staging-1', severity: 'critical', column: 'new', startedAt: minutesAgo(3) },
      { id: 'ALT-9008', title: 'Intermittent 503s — 6% of requests', service: 'feature-flags', severity: 'medium', column: 'new', startedAt: minutesAgo(31) },
      { id: 'ALT-9012', title: 'Load-test saturating ingress — 12k rps', service: 'edge-ingress', severity: 'critical', column: 'in_progress', startedAt: minutesAgo(9), activity: 'Assessing blast radius · 74% confidence' },
      { id: 'ALT-9001', title: 'CI runner queue drained', service: 'ci-runners', severity: 'low', column: 'resolved', startedAt: minutesAgo(360), aiOutcome: 'Auto-resolved · saved 0.2 eng-hrs' },
    ],
    tiles: [
      { id: 'compute', name: 'Compute', health: 'critical', metric: '4 nodes unreachable', checkedAt: minutesAgo(1) },
      { id: 'db', name: 'Databases', health: 'healthy', metric: 'all pools under 40%', checkedAt: minutesAgo(4) },
      { id: 'network', name: 'Network', health: 'healthy', metric: '12ms cross-AZ p50', checkedAt: minutesAgo(2) },
      { id: 'ingress', name: 'Ingress', health: 'critical', metric: 'saturated · 12k rps', checkedAt: minutesAgo(1) },
      { id: 'storage', name: 'Storage', health: 'healthy', metric: '44% capacity', checkedAt: minutesAgo(11) },
    ],
    goals: [
      { id: 'mttr', label: 'MTTR under 45m', current: '38m', target: '45m', pct: 84, onTrack: true },
      { id: 'noise', label: 'Noise ratio under 30%', current: '26%', target: '30%', pct: 87, onTrack: true },
      { id: 'auto', label: 'Auto-resolution above 30%', current: '21%', target: '30%', pct: 70, onTrack: false },
    ],
    metrics: {
      mttd: '4.1m',
      mttdDelta: { value: '+3% wk', good: false },
      mttr: '38m',
      mttrDelta: { value: '−4% wk', good: true },
      noiseRatio: '26%',
      noiseDelta: { value: '+5% wk', good: false },
      aiContribution: 'Saved ~$1.9k · 6 eng-hrs this month',
    },
  },
  dev: {
    alerts: [],
    tiles: [
      { id: 'compute', name: 'Compute', health: 'healthy', metric: '8 nodes · 22% util', checkedAt: minutesAgo(2) },
      { id: 'db', name: 'Databases', health: 'healthy', metric: 'all pools under 20%', checkedAt: minutesAgo(3) },
      { id: 'network', name: 'Network', health: 'healthy', metric: '4ms on-prem p50', checkedAt: minutesAgo(2) },
      { id: 'ingress', name: 'Ingress', health: 'healthy', metric: '5xx at 0%', checkedAt: minutesAgo(2) },
      { id: 'storage', name: 'Storage', health: 'healthy', metric: '31% capacity', checkedAt: minutesAgo(14) },
    ],
    goals: [
      { id: 'mttr', label: 'MTTR under 60m', current: '—', target: '60m', pct: 100, onTrack: true },
      { id: 'noise', label: 'Noise ratio under 30%', current: '4%', target: '30%', pct: 100, onTrack: true },
      { id: 'auto', label: 'Auto-resolution above 20%', current: '52%', target: '20%', pct: 100, onTrack: true },
    ],
    metrics: {
      mttd: '—',
      mttdDelta: { value: '0% wk', good: true },
      mttr: '—',
      mttrDelta: { value: '0% wk', good: true },
      noiseRatio: '4%',
      noiseDelta: { value: '0% wk', good: true },
      aiContribution: 'Saved ~$120 · 0.5 eng-hrs this month',
    },
  },
}

export function getBoard(envId: string): AlertsBoard {
  const board = boards[envId] ?? boards['dev']
  const prodBoard = boards['prod-us']

  // Fall back alerts to prod-us if the current env has none
  const alerts =
    !board.alerts || board.alerts.length === 0 ? prodBoard.alerts : board.alerts

  // Fall back metrics to prod-us if MTTD is a placeholder dash
  const metrics =
    board.metrics.mttd === '—' ? prodBoard.metrics : board.metrics

  // Fall back goals similarly if MTTR goal has a placeholder
  const goals =
    board.goals.find((g) => g.id === 'mttr' && g.current === '—')
      ? prodBoard.goals
      : board.goals

  return { ...board, alerts, metrics, goals }
}
