import { minutesAgo } from '../lib/time'
import type { EnvHealth } from './environments'

/* ---------- Screen 28: Cloud insights ---------- */

export interface CloudService {
  name: string
  health: EnvHealth
  metric: string
  findings: number
  resources: number
}

export const cloudServices: CloudService[] = [
  { name: 'EC2', health: 'healthy', metric: '142 instances · 61% avg util', findings: 3, resources: 142 },
  { name: 'RDS', health: 'degraded', metric: 'orders-db pool 87% · 1 slow-query hotspot', findings: 4, resources: 12 },
  { name: 'Lambda', health: 'healthy', metric: '96 functions · p95 240ms', findings: 1, resources: 96 },
  { name: 'CloudFront', health: 'healthy', metric: '40 PoPs · 94% hit ratio', findings: 0, resources: 6 },
  { name: 'ALB', health: 'degraded', metric: '5xx at 0.9% in us-east-1c', findings: 2, resources: 9 },
]

/* ---------- Screen 30: Environments ---------- */

export interface ConnectedEnv {
  id: string
  name: string
  provider: string
  region: string
  health: EnvHealth
  clusters: number
  scanStatus: 'complete' | 'scanning'
  scanPct?: number
  lastScan: number
}

export const connectedEnvironments: ConnectedEnv[] = [
  { id: 'prod-us', name: 'Production', provider: 'AWS', region: 'us-east-1', health: 'degraded', clusters: 6, scanStatus: 'complete', lastScan: minutesAgo(41) },
  { id: 'prod-eu', name: 'Production EU', provider: 'AWS', region: 'eu-west-1', health: 'healthy', clusters: 4, scanStatus: 'complete', lastScan: minutesAgo(95) },
  { id: 'staging', name: 'Staging', provider: 'GCP', region: 'us-central1', health: 'critical', clusters: 2, scanStatus: 'scanning', scanPct: 62, lastScan: minutesAgo(1440) },
  { id: 'dev', name: 'Development', provider: 'Private Cloud', region: 'k8s-onprem', health: 'healthy', clusters: 1, scanStatus: 'complete', lastScan: minutesAgo(2880) },
]

export interface DetectedEnv {
  id: string
  name: string
  hint: string
}

export const detectedEnvironments: DetectedEnv[] = [
  { id: 'edge-2', name: 'k8s-edge-2', hint: 'detected via VPC peering with prod-us' },
  { id: 'analytics', name: 'analytics-gcp', hint: 'detected via shared service account' },
]

/* ---------- Screen 31: Data & Access ---------- */

export interface Permission {
  scope: string
  purpose: string
  status: 'granted' | 'missing'
  lastVerified: number | null
}

export const permissions: Permission[] = [
  { scope: 'AWS ReadOnlyAccess', purpose: 'Resource inventory + configuration scan', status: 'granted', lastVerified: minutesAgo(41) },
  { scope: 'CloudTrail read', purpose: 'Change timeline correlation', status: 'granted', lastVerified: minutesAgo(41) },
  { scope: 'K8s RBAC view (cluster-wide)', purpose: 'Workload + pod intelligence', status: 'granted', lastVerified: minutesAgo(55) },
  { scope: 'Cost Explorer read', purpose: 'FinOps savings analysis', status: 'granted', lastVerified: minutesAgo(1440) },
  { scope: 'CI/CD events (staging)', purpose: 'Deploy correlation for staging RCA', status: 'missing', lastVerified: null },
]

export const accessScope = [
  { label: 'Cloud accounts', value: '4 (2 AWS, 1 GCP, 1 on-prem)' },
  { label: 'Regions', value: 'us-east-1 · eu-west-1 · us-central1' },
  { label: 'Access level', value: 'Read-only everywhere — no write scopes' },
  { label: 'Excluded', value: '2 buckets tagged data-residency:strict' },
]
