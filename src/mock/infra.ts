import { minutesAgo } from '../lib/time'
import type { EnvHealth } from './environments'

export interface Pod {
  id: string
  service: string
  status: 'running' | 'pending' | 'crashloop'
  restarts: number
  cpuPct: number
  memPct: number
  node: string
  startedAt: number
  events: { label: string; at: number; level: 'info' | 'warn' | 'error' }[]
}

export interface Cluster {
  id: string
  envId: string
  health: EnvHealth
  nodes: number
  utilization: number
  version: string
  pods: Pod[]
}

function pod(
  id: string,
  service: string,
  status: Pod['status'],
  restarts: number,
  cpuPct: number,
  memPct: number,
  node: string,
  ageMin: number,
  events: Pod['events'] = [],
): Pod {
  return {
    id,
    service,
    status,
    restarts,
    cpuPct,
    memPct,
    node,
    startedAt: minutesAgo(ageMin),
    events:
      events.length > 0
        ? events
        : [
            { label: 'Scheduled onto node', at: minutesAgo(ageMin), level: 'info' },
            { label: 'Readiness probe passing', at: minutesAgo(ageMin - 1), level: 'info' },
          ],
  }
}

const CLUSTERS_LIST_KEY = 'rtifact.clusters_list'

const initialClusters: Cluster[] = [
  {
    id: 'k8s-prod-1',
    envId: 'prod-us',
    health: 'healthy',
    nodes: 86,
    utilization: 58,
    version: 'v1.31.2',
    pods: [
      pod('cart-svc-6d9f01', 'cart-svc', 'running', 0, 41, 52, 'node-a12', 2880),
      pod('search-api-88ac21', 'search-api', 'running', 1, 37, 44, 'node-a17', 1440),
      pod('notify-svc-1b2c33', 'notify-svc', 'running', 0, 22, 31, 'node-a03', 4320),
      pod('events-pipe-9e0d47', 'events-pipe', 'running', 0, 55, 61, 'node-a22', 720),
    ],
  },
  {
    id: 'k8s-prod-2',
    envId: 'prod-us',
    health: 'degraded',
    nodes: 56,
    utilization: 71,
    version: 'v1.31.2',
    pods: [
      pod(
        'checkout-svc-7f9c42',
        'checkout-svc',
        'crashloop',
        7,
        94,
        88,
        'node-c05',
        26,
        [
          { label: 'Back-off restarting failed container', at: minutesAgo(3), level: 'error' },
          { label: 'Liveness probe failed: HTTP 500', at: minutesAgo(6), level: 'error' },
          { label: 'OOMKilled — memory limit 512Mi hit', at: minutesAgo(11), level: 'warn' },
          { label: 'Started after deploy v2.14.3', at: minutesAgo(26), level: 'info' },
        ],
      ),
      pod('checkout-svc-2ab811', 'checkout-svc', 'running', 2, 78, 74, 'node-c11', 26),
      pod('payments-api-55fe09', 'payments-api', 'running', 1, 69, 58, 'node-c02', 3200),
      pod('orders-db-proxy-3c1d78', 'orders-db-proxy', 'running', 0, 84, 79, 'node-c07', 8100),
      pod('cdn-sync-4e5f66', 'cdn-sync', 'pending', 0, 0, 0, '—', 4, [
        { label: 'Waiting for node with free GPU', at: minutesAgo(4), level: 'warn' },
      ]),
    ],
  },
  {
    id: 'k8s-eu-1',
    envId: 'prod-eu',
    health: 'healthy',
    nodes: 96,
    utilization: 54,
    version: 'v1.31.2',
    pods: [
      pod('eu-gateway-11aa02', 'eu-gateway', 'running', 0, 33, 40, 'node-e01', 5760),
      pod('search-indexer-77bb31', 'search-indexer', 'running', 3, 61, 66, 'node-e14', 190),
      pod('notify-svc-90cc12', 'notify-svc', 'running', 0, 19, 27, 'node-e09', 7200),
    ],
  },
  {
    id: 'k8s-staging-1',
    envId: 'staging',
    health: 'critical',
    nodes: 24,
    utilization: 91,
    version: 'v1.32.0-rc1',
    pods: [
      pod(
        'edge-ingress-0d1e55',
        'edge-ingress',
        'crashloop',
        12,
        99,
        97,
        'node-s02',
        14,
        [
          { label: 'Back-off restarting failed container', at: minutesAgo(2), level: 'error' },
          { label: 'Connection queue overflow — 12k rps', at: minutesAgo(9), level: 'error' },
        ],
      ),
      pod('feature-flags-8f2a19', 'feature-flags', 'running', 4, 72, 63, 'node-s05', 44),
      pod('ci-runners-6b3c88', 'ci-runners', 'running', 0, 48, 39, 'node-s01', 360),
    ],
  },
  {
    id: 'k8s-dev-1',
    envId: 'dev',
    health: 'healthy',
    nodes: 8,
    utilization: 22,
    version: 'v1.32.0',
    pods: [
      pod('sandbox-api-2211aa', 'sandbox-api', 'running', 0, 12, 18, 'node-d01', 10080),
      pod('sandbox-web-33bb44', 'sandbox-web', 'running', 0, 9, 14, 'node-d02', 10080),
    ],
  },
]

function loadInitialClusters(): Cluster[] {
  const stored = localStorage.getItem(CLUSTERS_LIST_KEY)
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      // ignore
    }
  }
  return initialClusters
}

export let clusters: Cluster[] = loadInitialClusters()

export function addClusterToMock(cluster: Cluster) {
  clusters.push(cluster)
  localStorage.setItem(CLUSTERS_LIST_KEY, JSON.stringify(clusters))
}

export function getClusters(envId: string): Cluster[] {
  return clusters.filter((c) => c.envId === envId)
}

export function findCluster(id: string): Cluster | undefined {
  return clusters.find((c) => c.id === id)
}

export function findPod(clusterId: string, podId: string): Pod | undefined {
  return findCluster(clusterId)?.pods.find((p) => p.id === podId)
}

/* The cluster a Command health tile drills into for a given env. */
export function primaryCluster(envId: string): Cluster | undefined {
  const list = getClusters(envId)
  return list.find((c) => c.health !== 'healthy') ?? list[0]
}
