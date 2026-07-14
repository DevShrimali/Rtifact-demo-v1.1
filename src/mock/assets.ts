export type AssetCategory = 'Applications' | 'APIs' | 'Databases' | 'Queues' | 'Infrastructure' | 'Third-party'

export interface Asset {
  id: string
  name: string
  category: AssetCategory
  type: string
  env: string
  team: string
  health: 'Operational' | 'Degraded Performance' | 'Partial Outage'
  /* Links this asset to the real service slugs used by platform incidents (mock/incidents.ts) */
  platformServiceIds: string[]
  /* Optional synthetic check used for status-page health deep-links */
  syntheticCheckId?: string
}

export const assets: Asset[] = [
  { id: 'asset-user-portal', name: 'User Portal', category: 'Applications', type: 'Web App', env: 'Production', team: 'Frontend Team', health: 'Operational', platformServiceIds: [], syntheticCheckId: 'chk-2' },
  { id: 'asset-admin-dashboard', name: 'Admin Dashboard', category: 'Applications', type: 'Web App', env: 'Production', team: 'Internal Tools', health: 'Operational', platformServiceIds: [], syntheticCheckId: 'chk-6' },
  { id: 'asset-checkout-api', name: 'Checkout API', category: 'APIs', type: 'API', env: 'Production', team: 'Payments Team', health: 'Degraded Performance', platformServiceIds: ['checkout-svc'], syntheticCheckId: 'chk-1' },
  { id: 'asset-payment-api', name: 'Payment API', category: 'APIs', type: 'API', env: 'Production', team: 'Payments Team', health: 'Partial Outage', platformServiceIds: ['payments-api'], syntheticCheckId: 'chk-4' },
  { id: 'asset-search-api', name: 'Search API', category: 'APIs', type: 'API', env: 'Production', team: 'Search Team', health: 'Operational', platformServiceIds: ['search-api'], syntheticCheckId: 'chk-3' },
  { id: 'asset-orders-db', name: 'Orders PostgreSQL', category: 'Databases', type: 'Database', env: 'Production', team: 'Platform Team', health: 'Operational', platformServiceIds: ['orders-db'], syntheticCheckId: 'chk-7' },
  { id: 'asset-kafka-cluster', name: 'Kafka Cluster', category: 'Queues', type: 'Queue', env: 'Production', team: 'Platform Team', health: 'Operational', platformServiceIds: [], syntheticCheckId: 'chk-8' },
  { id: 'asset-notify-svc', name: 'Notification Service', category: 'Queues', type: 'Queue', env: 'Production', team: 'Platform Team', health: 'Operational', platformServiceIds: ['notify-svc'], syntheticCheckId: 'chk-8' },
  { id: 'asset-edge-ingress', name: 'Edge Ingress', category: 'Infrastructure', type: 'Infrastructure', env: 'Production', team: 'SRE', health: 'Operational', platformServiceIds: ['edge-ingress'], syntheticCheckId: 'chk-5' },
  { id: 'asset-cdn-edge', name: 'CDN Edge', category: 'Infrastructure', type: 'Infrastructure', env: 'Production', team: 'SRE', health: 'Operational', platformServiceIds: ['cdn-edge'], syntheticCheckId: 'chk-5' },
  { id: 'asset-stripe', name: 'Stripe', category: 'Third-party', type: 'Third-party', env: 'Production', team: '—', health: 'Operational', platformServiceIds: [], syntheticCheckId: 'chk-9' },
]

export function getAssets(): Asset[] {
  return assets
}
