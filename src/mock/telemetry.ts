import { minutesAgo } from '../lib/time'

/* ---------- Screen 13: Intelligence — service dependency graph ---------- */

export interface GraphNode {
  id: string
  label: string
  x: number
  y: number
  /** request rate → node radius */
  rps: number
  /** error % → ring color */
  errorPct: number
  /** high P99 → outer dashed ring */
  highP99: boolean
  /** p99 latency in ms */
  p99Ms: number
  /** short one-liner for the tooltip */
  desc: string
}

export interface GraphEdge {
  from: string
  to: string
}

export const graphNodes: GraphNode[] = [
  { id: 'edge-ingress', label: 'edge-ingress', x: 90,  y: 140, rps: 4200, errorPct: 0.9, highP99: false, p99Ms: 210,  desc: 'Public-facing ingress; draining pods in us-east-1c' },
  { id: 'router',       label: 'router-tier',  x: 235, y: 140, rps: 4100, errorPct: 0.2, highP99: false, p99Ms: 48,   desc: 'Internal service mesh router — healthy' },
  { id: 'checkout',     label: 'checkout-svc', x: 400, y: 70,  rps: 820,  errorPct: 4.2, highP99: true,  p99Ms: 2400, desc: 'v2.14.3 deploy introduced retry storm' },
  { id: 'search',       label: 'search-api',   x: 400, y: 210, rps: 1900, errorPct: 0.1, highP99: false, p99Ms: 95,   desc: 'Cache hit 96% — stable' },
  { id: 'payments',     label: 'payments-api', x: 565, y: 70,  rps: 640,  errorPct: 1.1, highP99: true,  p99Ms: 2400, desc: 'p99 exceeding SLO 800 ms; upstream retries' },
  { id: 'cart',         label: 'cart-svc',     x: 565, y: 210, rps: 1100, errorPct: 0.1, highP99: false, p99Ms: 74,   desc: 'Healthy; cache hit 94%' },
  { id: 'orders-db',    label: 'orders-db',    x: 720, y: 70,  rps: 950,  errorPct: 2.3, highP99: true,  p99Ms: 580,  desc: 'Connection pool at 87% — 3 waiters queued' },
  { id: 'cache',        label: 'redis-cache',  x: 720, y: 210, rps: 3800, errorPct: 0.0, highP99: false, p99Ms: 2,    desc: 'Fully healthy — 0 errors' },
]

export const graphEdges: GraphEdge[] = [
  { from: 'edge-ingress', to: 'router' },
  { from: 'router', to: 'checkout' },
  { from: 'router', to: 'search' },
  { from: 'checkout', to: 'payments' },
  { from: 'checkout', to: 'cart' },
  { from: 'search', to: 'cache' },
  { from: 'payments', to: 'orders-db' },
  { from: 'cart', to: 'cache' },
  { from: 'cart', to: 'orders-db' },
]

export const intelligenceStats = [
  { label: 'Services', value: '24' },
  { label: 'Requests/s', value: '12.4k' },
  { label: 'Error rate', value: '0.8%' },
  { label: 'p99', value: '740ms' },
  { label: 'Active anomalies', value: '3' },
]

/* ---------- Screen 14: Metrics — dashboard browser ---------- */

export const METRIC_CATEGORIES = [
  'Kubernetes',
  'Databases',
  'Infrastructure',
  'Services',
  'Reliability',
  'Cost',
] as const

export type MetricCategory = (typeof METRIC_CATEGORIES)[number]

export interface MetricChart {
  id: string
  title: string
  unit: string
  series: number[]
  current: string
  anomaly?: { text: string; confidence: number }
}

export const dashboards: Record<MetricCategory, MetricChart[]> = {
  Kubernetes: [
    {
      id: 'k8s-cpu',
      title: 'Cluster CPU utilization',
      unit: '%',
      series: [48, 51, 50, 54, 58, 56, 61, 66, 71, 69, 72, 71],
      current: '71%',
      anomaly: {
        text: 'CPU climbed 23% in 2h on k8s-prod-2 — correlated with checkout-svc restart loop.',
        confidence: 86,
      },
    },
    {
      id: 'k8s-pods',
      title: 'Pod restarts (15m buckets)',
      unit: '',
      series: [0, 1, 0, 0, 2, 1, 4, 7, 9, 8, 7, 7],
      current: '7',
    },
    {
      id: 'k8s-mem',
      title: 'Memory pressure',
      unit: '%',
      series: [55, 54, 57, 58, 60, 59, 62, 64, 66, 65, 67, 68],
      current: '68%',
    },
    {
      id: 'k8s-net',
      title: 'Network in/out',
      unit: 'GB/s',
      series: [21, 22, 24, 22, 25, 27, 26, 28, 30, 29, 31, 30],
      current: '3.0 GB/s',
    },
  ],
  Databases: [
    {
      id: 'db-pool',
      title: 'orders-db connection pool',
      unit: '%',
      series: [50, 52, 51, 55, 58, 63, 70, 78, 84, 87, 86, 87],
      current: '87%',
      anomaly: {
        text: 'Pool saturation tracks the payments retry storm — expected to normalize after rollback.',
        confidence: 89,
      },
    },
    {
      id: 'db-qps',
      title: 'Queries per second',
      unit: 'qps',
      series: [880, 900, 920, 910, 980, 1200, 1900, 2600, 3100, 3300, 3200, 3150],
      current: '3.1k qps',
    },
    {
      id: 'db-lat',
      title: 'Query latency p95',
      unit: 'ms',
      series: [14, 14, 15, 14, 16, 22, 38, 61, 84, 90, 88, 86],
      current: '86ms',
    },
  ],
  Infrastructure: [
    {
      id: 'inf-nodes',
      title: 'Node availability',
      unit: '%',
      series: [100, 100, 100, 100, 99, 100, 100, 100, 100, 99, 100, 100],
      current: '100%',
    },
    {
      id: 'inf-disk',
      title: 'Storage capacity used',
      unit: '%',
      series: [66, 66, 67, 67, 68, 68, 69, 69, 70, 70, 71, 71],
      current: '71%',
    },
  ],
  Services: [
    {
      id: 'svc-err',
      title: 'checkout-svc error rate',
      unit: '%',
      series: [0.3, 0.3, 0.2, 0.3, 0.4, 0.9, 2.1, 3.5, 4.2, 4.1, 4.2, 4.2],
      current: '4.2%',
      anomaly: {
        text: 'Error step-change at 04:41 UTC, 3m after deploy v2.14.3 — root cause confirmed at 87%.',
        confidence: 87,
      },
    },
    {
      id: 'svc-p99',
      title: 'payments-api p99',
      unit: 'ms',
      series: [220, 230, 225, 240, 260, 420, 780, 1400, 2100, 2400, 2350, 2400],
      current: '2.4s',
    },
    {
      id: 'svc-rps',
      title: 'Gateway requests/s',
      unit: 'rps',
      series: [10800, 11000, 11400, 11200, 11800, 12100, 12000, 12300, 12500, 12400, 12300, 12400],
      current: '12.4k',
    },
  ],
  Reliability: [
    {
      id: 'rel-budget',
      title: 'Error budget remaining (checkout SLO)',
      unit: '%',
      series: [58, 57, 56, 56, 55, 52, 47, 41, 35, 33, 32, 31],
      current: '31%',
      anomaly: {
        text: 'Budget burn rate 6× normal during the active incident — projected exhaustion in 9 days if unresolved.',
        confidence: 82,
      },
    },
    {
      id: 'rel-mttr',
      title: 'MTTR trailing 7d',
      unit: 'm',
      series: [31, 30, 29, 28, 27, 27, 26, 25, 25, 24, 24, 24],
      current: '24m',
    },
  ],
  Cost: [],
}

/* ---------- Screen 15: Logs — live stream + AI patterns ---------- */

export type LogLevel = 'error' | 'warn' | 'info' | 'debug'

export interface LogLine {
  level: LogLevel
  service: string
  message: string
}

export interface LogPattern {
  id: string
  title: string
  occurrences: number
  windowMin: number
  likelyCause: string
  confidence: number
}

export const logPatterns: LogPattern[] = [
  {
    id: 'LP-114',
    title: 'PaymentRetryExhausted',
    occurrences: 2140,
    windowMin: 30,
    likelyCause: 'Unbounded retry loop introduced by checkout-svc v2.14.3',
    confidence: 89,
  },
  {
    id: 'LP-115',
    title: 'ConnectionPoolTimeout — orders-db',
    occurrences: 486,
    windowMin: 30,
    likelyCause: 'Pool saturation downstream of the retry storm',
    confidence: 84,
  },
]

export const logStream: LogLine[] = [
  { level: 'error', service: 'checkout-svc', message: 'PaymentRetryExhausted: giving up after 8 attempts (order 88412)' },
  { level: 'warn', service: 'orders-db', message: 'connection pool at 87% capacity — 3 waiters queued' },
  { level: 'info', service: 'router-tier', message: 'route table refreshed: 24 services, 0 drift' },
  { level: 'error', service: 'checkout-svc', message: 'HTTP 502 from payments-api after 5.0s (attempt 6/8)' },
  { level: 'debug', service: 'cart-svc', message: 'cache hit ratio 96.2% over last 60s window' },
  { level: 'warn', service: 'payments-api', message: 'p99 latency 2.4s exceeds SLO 800ms' },
  { level: 'info', service: 'cdn-edge', message: 'cache revalidation sweep completed across 40 PoPs' },
  { level: 'error', service: 'orders-db', message: 'ConnectionPoolTimeout: acquire exceeded 2000ms (payments client)' },
  { level: 'info', service: 'search-api', message: 'index generation 8841 activated (lag 42s)' },
  { level: 'warn', service: 'edge-ingress', message: 'deregistration delay 45s exceeds drain window in us-east-1c' },
  { level: 'debug', service: 'events-pipe', message: 'consumer lag 120ms across 12 partitions' },
  { level: 'error', service: 'checkout-svc', message: 'PaymentRetryExhausted: giving up after 8 attempts (order 88437)' },
]

/* ---------- Screen 16: Traces ---------- */

export const traceStats = [
  { label: 'Traces (1h)', value: '1.9M' },
  { label: 'Error traces', value: '4.1k' },
  { label: 'Avg duration', value: '184ms' },
  { label: 'Services in map', value: '24' },
]

export const traceLayers: { name: string; nodes: { id: string; health: 'healthy' | 'degraded' | 'critical' }[] }[] = [
  {
    name: 'Ingress',
    nodes: [
      { id: 'edge-ingress', health: 'degraded' },
      { id: 'cdn-edge', health: 'healthy' },
    ],
  },
  {
    name: 'Core',
    nodes: [
      { id: 'router-tier', health: 'healthy' },
      { id: 'auth-svc', health: 'healthy' },
    ],
  },
  {
    name: 'App',
    nodes: [
      { id: 'checkout-svc', health: 'critical' },
      { id: 'search-api', health: 'healthy' },
      { id: 'cart-svc', health: 'healthy' },
      { id: 'payments-api', health: 'degraded' },
    ],
  },
  {
    name: 'Dependencies',
    nodes: [
      { id: 'orders-db', health: 'degraded' },
      { id: 'redis-cache', health: 'healthy' },
      { id: 'events-pipe', health: 'healthy' },
    ],
  },
]

export interface FlowAnomaly {
  id: string
  path: string
  finding: string
  latencyShare: string
  confidence: number
}

export const flowAnomalies: FlowAnomaly[] = [
  {
    id: 'FA-31',
    path: 'checkout-svc → payments-api → orders-db',
    finding: '8 sequential retries per request; 92% of trace time spent waiting on payments',
    latencyShare: '+1.9s p99',
    confidence: 91,
  },
  {
    id: 'FA-32',
    path: 'edge-ingress → router-tier',
    finding: 'Draining pods still receiving traffic for ~45s in us-east-1c',
    latencyShare: '+120ms p99',
    confidence: 86,
  },
  {
    id: 'FA-33',
    path: 'search-api → redis-cache',
    finding: 'Cache key fan-out doubled after index rotation — benign, monitoring',
    latencyShare: '+18ms p99',
    confidence: 74,
  },
]

/* ---------- Screen 17: Synthetic checks ---------- */

export interface SyntheticCheck {
  id: string
  name: string
  trend: number[]
  uptimePct: number
  status: 'passing' | 'degraded' | 'failing'
  alerts: number
  lastRun: number
  intervalMin: number
  /* Added for the Service Registry "Add Service from Monitored Endpoints" flow */
  method: string
  path: string
  team: string
  avgLatencyMs: number
  sslExpiryDays: number | null
}

const checks: SyntheticCheck[] = [
  {
    id: 'chk-1',
    name: 'Checkout flow (browser)',
    trend: [99.9, 100, 100, 99.8, 99.2, 97.1, 94.4, 93.8],
    uptimePct: 98.1,
    status: 'failing',
    alerts: 2,
    lastRun: minutesAgo(2),
    intervalMin: 5,
    method: 'GET',
    path: '/checkout',
    team: 'Payments Team',
    avgLatencyMs: 245,
    sslExpiryDays: 87,
  },
  {
    id: 'chk-2',
    name: 'Login + session refresh',
    trend: [100, 100, 99.9, 100, 100, 100, 99.9, 100],
    uptimePct: 99.98,
    status: 'passing',
    alerts: 0,
    lastRun: minutesAgo(1),
    intervalMin: 5,
    method: 'POST',
    path: '/auth/login',
    team: 'Platform Team',
    avgLatencyMs: 88,
    sslExpiryDays: 221,
  },
  {
    id: 'chk-3',
    name: 'Search API latency probe',
    trend: [100, 99.8, 99.9, 100, 99.9, 99.7, 99.8, 99.9],
    uptimePct: 99.87,
    status: 'passing',
    alerts: 0,
    lastRun: minutesAgo(3),
    intervalMin: 10,
    method: 'GET',
    path: '/search',
    team: 'Search Team',
    avgLatencyMs: 62,
    sslExpiryDays: 156,
  },
  {
    id: 'chk-4',
    name: 'Payments webhook roundtrip',
    trend: [100, 100, 99.6, 99.1, 98.8, 98.2, 97.9, 98.4],
    uptimePct: 99.2,
    status: 'degraded',
    alerts: 1,
    lastRun: minutesAgo(4),
    intervalMin: 15,
    method: 'POST',
    path: '/payments/charge',
    team: 'Payments Team',
    avgLatencyMs: 2100,
    sslExpiryDays: 87,
  },
  {
    id: 'chk-5',
    name: 'Status page reachability',
    trend: [100, 100, 100, 100, 100, 100, 100, 100],
    uptimePct: 100,
    status: 'passing',
    alerts: 0,
    lastRun: minutesAgo(1),
    intervalMin: 1,
    method: 'GET',
    path: '/status',
    team: 'SRE',
    avgLatencyMs: 44,
    sslExpiryDays: 300,
  },
  {
    id: 'chk-6',
    name: 'Admin dashboard smoke',
    trend: [100, 100, 100, 99.9, 100, 100, 100, 100],
    uptimePct: 99.95,
    status: 'passing',
    alerts: 0,
    lastRun: minutesAgo(2),
    intervalMin: 10,
    method: 'GET',
    path: '/admin',
    team: 'Internal Tools',
    avgLatencyMs: 120,
    sslExpiryDays: 221,
  },
  {
    id: 'chk-7',
    name: 'Orders DB connectivity',
    trend: [100, 100, 99.9, 100, 100, 99.8, 100, 100],
    uptimePct: 99.91,
    status: 'passing',
    alerts: 0,
    lastRun: minutesAgo(3),
    intervalMin: 5,
    method: 'GET',
    path: '/health/db',
    team: 'Platform Team',
    avgLatencyMs: 18,
    sslExpiryDays: null,
  },
  {
    id: 'chk-8',
    name: 'Kafka producer heartbeat',
    trend: [100, 100, 100, 100, 99.9, 100, 100, 100],
    uptimePct: 99.97,
    status: 'passing',
    alerts: 0,
    lastRun: minutesAgo(1),
    intervalMin: 5,
    method: 'GET',
    path: '/health/kafka',
    team: 'Platform Team',
    avgLatencyMs: 32,
    sslExpiryDays: null,
  },
  {
    id: 'chk-9',
    name: 'Stripe API reachability',
    trend: [100, 100, 100, 100, 100, 99.9, 100, 100],
    uptimePct: 99.99,
    status: 'passing',
    alerts: 0,
    lastRun: minutesAgo(5),
    intervalMin: 15,
    method: 'GET',
    path: '/v1/balance',
    team: 'Payments Team',
    avgLatencyMs: 180,
    sslExpiryDays: 140,
  },
]

export function getSyntheticChecks(_envId: string): SyntheticCheck[] {
  return checks
}

/* ---------- Screen 25: Logs explorer ---------- */

export interface ExplorerLog {
  minutesAgo: number
  level: LogLevel
  service: string
  message: string
  traceId: string
}

export const explorerLogs: ExplorerLog[] = [
  { minutesAgo: 2, level: 'error', service: 'checkout-svc', message: 'PaymentRetryExhausted: giving up after 8 attempts', traceId: 't-88ac21' },
  { minutesAgo: 3, level: 'error', service: 'checkout-svc', message: 'HTTP 502 from payments-api after 5.0s', traceId: 't-88ac21' },
  { minutesAgo: 4, level: 'warn', service: 'orders-db', message: 'connection pool at 87% capacity', traceId: 't-91bd44' },
  { minutesAgo: 6, level: 'error', service: 'orders-db', message: 'ConnectionPoolTimeout: acquire exceeded 2000ms', traceId: 't-91bd44' },
  { minutesAgo: 8, level: 'info', service: 'router-tier', message: 'route table refreshed: 24 services', traceId: 't-11cc09' },
  { minutesAgo: 11, level: 'warn', service: 'payments-api', message: 'p99 latency 2.4s exceeds SLO 800ms', traceId: 't-72de13' },
  { minutesAgo: 13, level: 'error', service: 'checkout-svc', message: 'PaymentRetryExhausted: giving up after 8 attempts', traceId: 't-72de13' },
  { minutesAgo: 15, level: 'debug', service: 'cart-svc', message: 'cache hit ratio 96.2% over last 60s', traceId: 't-33ef77' },
  { minutesAgo: 18, level: 'info', service: 'search-api', message: 'index generation 8841 activated', traceId: 't-55aa02' },
  { minutesAgo: 22, level: 'warn', service: 'edge-ingress', message: 'deregistration delay 45s exceeds drain window', traceId: 't-44bb18' },
  { minutesAgo: 25, level: 'info', service: 'cdn-edge', message: 'cache revalidation sweep completed', traceId: 't-66cc31' },
  { minutesAgo: 31, level: 'error', service: 'edge-ingress', message: '5xx returned to client: upstream connect timeout', traceId: 't-44bb18' },
]

export interface SavedSearch {
  id: string
  name: string
  query: string
  starred: boolean
}

export const savedSearches: SavedSearch[] = [
  { id: 'ss-1', name: 'Checkout errors', query: 'service=checkout-svc level=error', starred: true },
  { id: 'ss-2', name: 'DB pool pressure', query: 'service=orders-db message~pool', starred: true },
  { id: 'ss-3', name: 'Ingress drain issues', query: 'service=edge-ingress message~drain', starred: false },
  { id: 'ss-4', name: 'Slow payment traces', query: 'trace=t-72de13', starred: false },
]

/* ---------- Screen 26: Synthetic detail ---------- */

export interface CheckRun {
  minutesAgo: number
  ok: boolean
  durationMs: number
  note?: string
}

export interface CheckAlertEvent {
  id: string
  minutesAgo: number
  message: string
}

export interface CheckDetail {
  runs: CheckRun[]
  alertHistory: CheckAlertEvent[]
  config: { severity: string; environment: string; routing: string; regions: string[] }
}

export const checkDetails: Record<string, CheckDetail> = {
  'chk-1': {
    runs: [
      { minutesAgo: 2, ok: false, durationMs: 8400, note: 'step 4/6 payment submit timed out' },
      { minutesAgo: 7, ok: false, durationMs: 8100, note: 'step 4/6 payment submit timed out' },
      { minutesAgo: 12, ok: true, durationMs: 3200 },
      { minutesAgo: 17, ok: false, durationMs: 8600, note: 'step 4/6 payment submit timed out' },
      { minutesAgo: 22, ok: true, durationMs: 3100 },
      { minutesAgo: 27, ok: true, durationMs: 2900 },
      { minutesAgo: 32, ok: true, durationMs: 3050 },
      { minutesAgo: 37, ok: true, durationMs: 2980 },
      { minutesAgo: 42, ok: true, durationMs: 3120 },
      { minutesAgo: 47, ok: true, durationMs: 3010 },
    ],
    alertHistory: [
      { id: 'ALT-4823', minutesAgo: 2, message: 'Checkout flow failing 2 of last 4 runs' },
      { id: 'ALT-4819', minutesAgo: 12, message: 'Linked: checkout-svc error rate 4.2%' },
    ],
    config: { severity: 'Critical', environment: 'prod-us', routing: 'payments-team on-call', regions: ['us-east-1', 'us-west-2', 'eu-west-1'] },
  },
}

export function getCheckDetail(checkId: string): CheckDetail {
  return (
    checkDetails[checkId] ?? {
      runs: Array.from({ length: 10 }, (_, i) => ({ minutesAgo: (i + 1) * 5, ok: true, durationMs: 900 + i * 12 })),
      alertHistory: [],
      config: { severity: 'Medium', environment: 'prod-us', routing: 'platform-team', regions: ['us-east-1'] },
    }
  )
}

/* ---------- Screen 27: Saved Views ---------- */

export type ViewType = 'Combined' | 'Metrics' | 'Logs' | 'Traces'

export interface SavedView {
  id: string
  name: string
  type: ViewType
  owner: string
  updatedAt: number
}

export const savedViews: SavedView[] = [
  { id: 'sv-1', name: 'Checkout incident war-room', type: 'Combined', owner: 'P. Sharma', updatedAt: minutesAgo(35) },
  { id: 'sv-2', name: 'orders-db saturation', type: 'Metrics', owner: 'A. Rivera', updatedAt: minutesAgo(120) },
  { id: 'sv-3', name: 'Payment retry signatures', type: 'Logs', owner: 'P. Sharma', updatedAt: minutesAgo(300) },
  { id: 'sv-4', name: 'Ingress hot paths', type: 'Traces', owner: 'J. Okafor', updatedAt: minutesAgo(2900) },
  { id: 'sv-5', name: 'Error budget weekly', type: 'Metrics', owner: 'M. Chen', updatedAt: minutesAgo(4300) },
]

/* ---------- DEV-30: dashboards, Explore, trace latency overlay ---------- */

export interface NamedDashboard {
  id: string
  name: string
  aiGenerated?: boolean
}

export const namedDashboards: NamedDashboard[] = [
  { id: 'dash-golden', name: 'Golden signals — checkout' },
  { id: 'dash-k8s', name: 'Kubernetes fleet health' },
  { id: 'dash-db', name: 'Database saturation' },
  { id: 'dash-incident', name: 'INC-311 war room', aiGenerated: true },
]

/* Explore: a PromQL-ish query resolves to a series + a per-label breakdown */
export interface ExploreSeries {
  query: string
  current: number[]
  previous: number[]
  unit: string
  breakdown: { label: string; value: string; pct: number }[]
}

export const exploreSample: ExploreSeries = {
  query: 'sum by (service) (rate(http_requests_total{status=~"5.."}[5m]))',
  current: [0.3, 0.3, 0.4, 0.6, 1.1, 2.2, 3.6, 4.2, 4.1, 4.2, 4.0, 4.2],
  previous: [0.3, 0.3, 0.3, 0.4, 0.3, 0.4, 0.3, 0.4, 0.3, 0.4, 0.3, 0.3],
  unit: 'errors/s',
  breakdown: [
    { label: 'checkout-svc', value: '3.1/s', pct: 74 },
    { label: 'payments-api', value: '0.7/s', pct: 17 },
    { label: 'orders-db-proxy', value: '0.4/s', pct: 9 },
  ],
}

export const PROMQL_SUGGESTIONS = [
  'rate(http_requests_total[5m])',
  'histogram_quantile(0.99, sum by (le) (rate(http_request_duration_seconds_bucket[5m])))',
  'sum by (service) (rate(http_requests_total{status=~"5.."}[5m]))',
  'kube_pod_container_status_restarts_total',
]

/* Traces latency overlay — p99 series with deploy/config markers to render
   visually on the graph (Karan's spec) */
export interface DeployMarker {
  at: number // index into the series
  label: string
  kind: 'deploy' | 'config'
}

export const traceLatency = {
  unit: 'ms p99',
  series: [220, 230, 225, 240, 260, 420, 780, 1400, 2100, 2400, 2350, 2400],
  markers: [
    { at: 4, label: 'config: payments timeout 2s→5s', kind: 'config' as const },
    { at: 5, label: 'deploy v2.14.3 checkout-svc', kind: 'deploy' as const },
  ] as DeployMarker[],
}

export const TRACE_FILTER_FIELDS = ['service', 'operation', 'status', 'min-duration'] as const
