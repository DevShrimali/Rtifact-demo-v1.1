export type EnvHealth = 'healthy' | 'degraded' | 'critical'

export interface Environment {
  id: string
  name: string
  provider: string
  region: string
  health: EnvHealth
  clusters: number
  activeAlerts: number
  criticalAlerts: number
}

export const environments: Environment[] = [
  {
    id: 'prod-us',
    name: 'Production',
    provider: 'AWS',
    region: 'us-east-1',
    health: 'degraded',
    clusters: 6,
    activeAlerts: 4,
    criticalAlerts: 2,
  },
  {
    id: 'prod-eu',
    name: 'Production EU',
    provider: 'AWS',
    region: 'eu-west-1',
    health: 'healthy',
    clusters: 4,
    activeAlerts: 2,
    criticalAlerts: 0,
  },
  {
    id: 'staging',
    name: 'Staging',
    provider: 'GCP',
    region: 'us-central1',
    health: 'critical',
    clusters: 2,
    activeAlerts: 3,
    criticalAlerts: 2,
  },
  {
    id: 'dev',
    name: 'Development',
    provider: 'Private Cloud',
    region: 'k8s-onprem',
    health: 'healthy',
    clusters: 1,
    activeAlerts: 0,
    criticalAlerts: 0,
  },
]

export const defaultEnvironmentId = 'prod-us'
