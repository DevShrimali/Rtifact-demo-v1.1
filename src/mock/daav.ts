import { minutesAgo } from '../lib/time'
import type { Severity } from './alerts'
import type { BeforeNowRow } from '../components/BeforeNow'

export type DaavState = 'detect' | 'assess' | 'act' | 'validate'

export const DAAV_ORDER: DaavState[] = ['detect', 'assess', 'act', 'validate']

export interface SignalStep {
  label: string
  status: 'done' | 'running' | 'pending'
}

export interface SimilarIncident {
  id: string
  title: string
  resolvedAgo: string
  similarity: number
}

export interface ChainNode {
  kind: 'cause' | 'effect' | 'impact'
  title: string
  sub: string
  confidence: number
}

export interface CorrelatedChange {
  label: string
  when: string
  pct: number
}

export interface Playbook {
  rank: number
  name: string
  description: string
  risk: 'Low' | 'Medium' | 'High'
  eta: string
  successRate: number
  requiresApproval: boolean
}

export interface DaavScenario {
  alertId: string
  title: string
  service: string
  severity: Severity
  startedAt: number
  currentState: DaavState
  detect: {
    summary: string
    detectionConfidence: number
    signals: SignalStep[]
    impactedServices: string[]
    similarIncidents: SimilarIncident[]
  }
  assess: {
    rcaConfidence: number
    rootCause: string
    lowConfidence?: { why: string[]; improve: string[] }
    chain: ChainNode[]
    correlatedChanges: CorrelatedChange[]
    serviceIntel: { label: string; value: string }[]
    /* DEV-10: side-by-side baseline vs degraded */
    beforeNow: BeforeNowRow[]
    /* DEV-10: SLO error budget — depletion + burn rate */
    errorBudget: { remainingPct: number; burnRateX: number; note: string }
  }
  act: {
    playbooks: Playbook[]
  }
  validate: {
    checklist: { label: string; status: 'done' | 'pending' }[]
    slos: { label: string; current: string; target: string; pct: number }[]
    windowTotalMin: number
    windowLeftMin: number
    contribution: { cost: string; time: string; risk: string }
  }
}

const scenarios: Record<string, DaavScenario> = {
  /* Full-progression hero scenario — high-confidence RCA, approval-gated fix */
  'ALT-4819': {
    alertId: 'ALT-4819',
    title: 'Error rate 4.2% — deploy correlated',
    service: 'checkout-svc',
    severity: 'critical',
    startedAt: minutesAgo(12),
    currentState: 'assess',
    detect: {
      summary:
        'checkout-svc error rate jumped 0.3% → 4.2% at 04:41 UTC. 5xx concentrated on POST /checkout/complete. Blast radius: 3 downstream services.',
      detectionConfidence: 96,
      signals: [
        { label: 'Ingest 214 raw signals across 3 sources', status: 'done' },
        { label: 'Correlate into 1 alert group (noise −92%)', status: 'done' },
        { label: 'Enrich with deploy + topology context', status: 'done' },
      ],
      impactedServices: ['checkout-svc', 'payments-api', 'orders-db'],
      similarIncidents: [
        { id: 'INC-208', title: 'checkout 5xx after config push', resolvedAgo: '3w ago', similarity: 91 },
        { id: 'INC-183', title: 'payments retry storm', resolvedAgo: '2mo ago', similarity: 74 },
      ],
    },
    assess: {
      rcaConfidence: 87,
      rootCause: 'Deploy v2.14.3 introduced an unbounded retry on the payments client, saturating orders-db connections.',
      chain: [
        { kind: 'cause', title: 'Deploy v2.14.3', sub: 'checkout-svc · 04:38 UTC', confidence: 92 },
        { kind: 'effect', title: 'Retry storm on payments client', sub: '8× request amplification', confidence: 89 },
        { kind: 'effect', title: 'orders-db pool saturation', sub: '87% → connection timeouts', confidence: 85 },
        { kind: 'impact', title: 'Checkout failures 4.2%', sub: '~$310/min revenue at risk', confidence: 87 },
      ],
      correlatedChanges: [
        { label: 'Deploy checkout-svc v2.14.3', when: '3m before onset', pct: 92 },
        { label: 'Config change: payments timeout 2s → 5s', when: '41m before onset', pct: 34 },
        { label: 'K8s node rotation us-east-1c', when: '2h before onset', pct: 8 },
      ],
      serviceIntel: [
        { label: 'Owner', value: 'payments-team (on-call: A. Rivera)' },
        { label: 'Deploys this week', value: '9 (2 rolled back)' },
        { label: 'Dependencies', value: '4 upstream · 3 downstream' },
        { label: 'Error budget left', value: '31% of monthly SLO' },
      ],
      beforeNow: [
        { service: 'checkout-svc', metric: 'error rate', before: '0.3%', now: '4.2%', worse: true },
        { service: 'payments-api', metric: 'p99 latency', before: '220ms', now: '890ms', worse: true },
        { service: 'orders-db', metric: 'pool usage', before: '52%', now: '87%', worse: true },
      ],
      errorBudget: { remainingPct: 31, burnRateX: 6, note: 'projected exhaustion in 9 days if unresolved' },
    },
    act: {
      playbooks: [
        {
          rank: 1,
          name: 'Roll back checkout-svc to v2.14.2',
          description: 'Reverts the retry regression. Matches INC-208 resolution path.',
          risk: 'Medium',
          eta: '~6m',
          successRate: 96,
          requiresApproval: true,
        },
        {
          rank: 2,
          name: 'Scale orders-db connection pool +50%',
          description: 'Relieves saturation without touching the deploy. Symptom-level fix.',
          risk: 'Low',
          eta: '~2m',
          successRate: 71,
          requiresApproval: false,
        },
        {
          rank: 3,
          name: 'Disable checkout retries via feature flag',
          description: 'Stops amplification; degrades UX for transient failures.',
          risk: 'Low',
          eta: '~1m',
          successRate: 64,
          requiresApproval: false,
        },
      ],
    },
    validate: {
      checklist: [
        { label: 'Rollback deployed to all 12 pods', status: 'done' },
        { label: 'Error rate back under 0.5% SLO', status: 'done' },
        { label: 'orders-db pool below 60% for 10m', status: 'done' },
        { label: 'Downstream services recovered', status: 'pending' },
      ],
      slos: [
        { label: 'Error rate', current: '0.4%', target: '< 0.5%', pct: 100 },
        { label: 'p99 latency', current: '780ms', target: '< 800ms', pct: 100 },
        { label: 'orders-db pool', current: '58%', target: '< 60%', pct: 96 },
      ],
      windowTotalMin: 30,
      windowLeftMin: 12,
      contribution: {
        cost: '~$2.4k revenue protected',
        time: '1.8 eng-hours saved',
        risk: 'Checkout SLA breach avoided',
      },
    },
  },

  /* Low-confidence scenario — Assess must explain why + how to improve */
  'ALT-9012': {
    alertId: 'ALT-9012',
    title: 'Load-test saturating ingress — 12k rps',
    service: 'edge-ingress',
    severity: 'critical',
    startedAt: minutesAgo(9),
    currentState: 'assess',
    detect: {
      summary:
        'Staging ingress request rate spiked 40× at 05:12 UTC. Latency p99 degraded cluster-wide. Source concentrated on 3 synthetic client IPs.',
      detectionConfidence: 88,
      signals: [
        { label: 'Ingest 96 raw signals across 2 sources', status: 'done' },
        { label: 'Correlate into 1 alert group', status: 'done' },
        { label: 'Enrich with deploy + topology context', status: 'running' },
      ],
      impactedServices: ['edge-ingress', 'k8s-staging-1', 'feature-flags'],
      similarIncidents: [
        { id: 'INC-171', title: 'load-test left running overnight', resolvedAgo: '6w ago', similarity: 68 },
      ],
    },
    assess: {
      rcaConfidence: 74,
      rootCause: 'Probable unthrottled load-test job from the CI perf suite; cannot confirm owner — CI events not connected for staging.',
      lowConfidence: {
        why: [
          'CI/CD deploy events are not connected for the staging environment — the correlation engine cannot see the perf-suite trigger.',
          'Only 1 similar past incident (68% match) — thin pattern history for this signature.',
        ],
        improve: [
          'Connect the CI provider (Settings → Connections) so perf-suite runs land in the change timeline.',
          'Label load-test client IPs in the ontology so synthetic traffic is classified automatically.',
        ],
      },
      chain: [
        { kind: 'cause', title: 'Unthrottled load-test job', sub: 'suspected CI perf suite', confidence: 74 },
        { kind: 'effect', title: 'Ingress saturation 12k rps', sub: 'conn queue at limit', confidence: 90 },
        { kind: 'impact', title: 'Staging unusable for QA', sub: '2 release pipelines blocked', confidence: 82 },
      ],
      correlatedChanges: [
        { label: 'CI pipeline perf-nightly triggered', when: '4m before onset', pct: 74 },
        { label: 'feature-flags deploy', when: '52m before onset', pct: 12 },
      ],
      serviceIntel: [
        { label: 'Owner', value: 'platform-team (on-call: J. Okafor)' },
        { label: 'Deploys this week', value: '23 (staging cadence)' },
        { label: 'Dependencies', value: '1 upstream · 6 downstream' },
        { label: 'Error budget left', value: 'n/a — no SLO on staging' },
      ],
      beforeNow: [
        { service: 'edge-ingress', metric: 'request rate', before: '0.3k rps', now: '12k rps', worse: true },
        { service: 'k8s-staging-1', metric: 'p99 latency', before: '120ms', now: '2.1s', worse: true },
      ],
      errorBudget: { remainingPct: 74, burnRateX: 2, note: 'staging convenience SLO — informational' },
    },
    act: {
      playbooks: [
        {
          rank: 1,
          name: 'Rate-limit the 3 synthetic client IPs',
          description: 'Caps load-test traffic at ingress without killing the job.',
          risk: 'Low',
          eta: '~1m',
          successRate: 88,
          requiresApproval: false,
        },
        {
          rank: 2,
          name: 'Kill suspected perf-suite CI job',
          description: 'Stops the source. Owner unconfirmed — may interrupt a legitimate run.',
          risk: 'Medium',
          eta: '~2m',
          successRate: 79,
          requiresApproval: true,
        },
      ],
    },
    validate: {
      checklist: [
        { label: 'Ingress rps back under 1k', status: 'done' },
        { label: 'p99 latency recovered cluster-wide', status: 'pending' },
        { label: 'QA pipelines unblocked', status: 'pending' },
      ],
      slos: [
        { label: 'Request rate', current: '0.8k rps', target: '< 1k rps', pct: 100 },
        { label: 'p99 latency', current: '410ms', target: '< 300ms', pct: 73 },
      ],
      windowTotalMin: 20,
      windowLeftMin: 16,
      contribution: {
        cost: '~$450 compute burn stopped',
        time: '0.9 eng-hours saved',
        risk: '2 release pipelines unblocked',
      },
    },
  },

  /* Early-stage scenario — lands on Detect with the pipeline still running */
  'ALT-4821': {
    alertId: 'ALT-4821',
    title: 'p99 latency breach — 2.4s vs 800ms SLO',
    service: 'payments-api',
    severity: 'critical',
    startedAt: minutesAgo(5),
    currentState: 'detect',
    detect: {
      summary:
        'payments-api p99 latency crossed the 800ms SLO at 05:28 UTC, now at 2.4s and climbing. Correlated slow queries visible on orders-db.',
      detectionConfidence: 93,
      signals: [
        { label: 'Ingest 158 raw signals across 3 sources', status: 'done' },
        { label: 'Correlate into 1 alert group (noise −89%)', status: 'done' },
        { label: 'Enrich with deploy + topology context', status: 'running' },
      ],
      impactedServices: ['payments-api', 'orders-db'],
      similarIncidents: [
        { id: 'INC-197', title: 'orders-db slow-query cascade', resolvedAgo: '5w ago', similarity: 83 },
        { id: 'INC-164', title: 'payments p99 breach on index bloat', resolvedAgo: '3mo ago', similarity: 71 },
      ],
    },
    assess: {
      rcaConfidence: 84,
      rootCause: 'Missing index after last night’s orders-db schema migration causes full-table scans on payment lookups.',
      chain: [
        { kind: 'cause', title: 'Schema migration 0041', sub: 'orders-db · 23:10 UTC', confidence: 84 },
        { kind: 'effect', title: 'Full-table scans on lookups', sub: 'query time 14ms → 900ms', confidence: 88 },
        { kind: 'impact', title: 'p99 SLO breach 2.4s', sub: 'payments UX degraded', confidence: 90 },
      ],
      correlatedChanges: [
        { label: 'orders-db schema migration 0041', when: '6h before onset', pct: 84 },
        { label: 'Traffic ramp: morning peak', when: 'coincident', pct: 42 },
      ],
      serviceIntel: [
        { label: 'Owner', value: 'payments-team (on-call: A. Rivera)' },
        { label: 'Deploys this week', value: '4 (0 rolled back)' },
        { label: 'Dependencies', value: '2 upstream · 5 downstream' },
        { label: 'Error budget left', value: '58% of monthly SLO' },
      ],
      beforeNow: [
        { service: 'payments-api', metric: 'p99 latency', before: '640ms', now: '2.4s', worse: true },
        { service: 'orders-db', metric: 'query time', before: '14ms', now: '900ms', worse: true },
      ],
      errorBudget: { remainingPct: 58, burnRateX: 3, note: 'burn elevated since morning peak' },
    },
    act: {
      playbooks: [
        {
          rank: 1,
          name: 'Create covering index on payments lookup',
          description: 'Restores query plan. Online index build, no downtime.',
          risk: 'Medium',
          eta: '~8m',
          successRate: 93,
          requiresApproval: true,
        },
        {
          rank: 2,
          name: 'Enable query result cache for lookups',
          description: 'Masks the scan cost; staleness window 60s.',
          risk: 'Low',
          eta: '~2m',
          successRate: 66,
          requiresApproval: false,
        },
      ],
    },
    validate: {
      checklist: [
        { label: 'Index build completed', status: 'done' },
        { label: 'p99 back under 800ms for 10m', status: 'pending' },
        { label: 'orders-db CPU normalized', status: 'pending' },
      ],
      slos: [
        { label: 'p99 latency', current: '1.1s', target: '< 800ms', pct: 72 },
        { label: 'Query time', current: '38ms', target: '< 20ms', pct: 53 },
      ],
      windowTotalMin: 30,
      windowLeftMin: 27,
      contribution: {
        cost: '~$1.2k revenue protected',
        time: '1.1 eng-hours saved',
        risk: 'Payments SLO breach contained',
      },
    },
  },

  /* Approval-gate scenario — lands directly on Act with a pending approval */
  'ALT-4810': {
    alertId: 'ALT-4810',
    title: '5xx spike on ingress — 0.9% of requests',
    service: 'edge-ingress',
    severity: 'high',
    startedAt: minutesAgo(44),
    currentState: 'act',
    detect: {
      summary:
        'edge-ingress 5xx crossed 0.5% at 04:52 UTC, peaking at 0.9%. Concentrated on the us-east-1c AZ after a node rotation.',
      detectionConfidence: 91,
      signals: [
        { label: 'Ingest 187 raw signals across 3 sources', status: 'done' },
        { label: 'Correlate into 1 alert group (noise −90%)', status: 'done' },
        { label: 'Enrich with deploy + topology context', status: 'done' },
      ],
      impactedServices: ['edge-ingress', 'router-tier'],
      similarIncidents: [
        { id: 'INC-201', title: 'AZ rotation drained too fast', resolvedAgo: '4w ago', similarity: 87 },
      ],
    },
    assess: {
      rcaConfidence: 89,
      rootCause: 'Node rotation in us-east-1c drained ingress pods faster than the LB deregistration delay, blackholing in-flight requests.',
      chain: [
        { kind: 'cause', title: 'Node rotation us-east-1c', sub: 'batch size 4, delay 30s', confidence: 89 },
        { kind: 'effect', title: 'LB routing to draining pods', sub: 'deregistration lag 45s', confidence: 86 },
        { kind: 'impact', title: '5xx on 0.9% of requests', sub: 'retry-able, UX mostly intact', confidence: 91 },
      ],
      correlatedChanges: [
        { label: 'K8s node rotation us-east-1c', when: '2m before onset', pct: 89 },
        { label: 'edge-ingress config sync', when: '1h before onset', pct: 18 },
      ],
      serviceIntel: [
        { label: 'Owner', value: 'platform-team (on-call: J. Okafor)' },
        { label: 'Deploys this week', value: '6 (0 rolled back)' },
        { label: 'Dependencies', value: '0 upstream · 9 downstream' },
        { label: 'Error budget left', value: '44% of monthly SLO' },
      ],
      beforeNow: [
        { service: 'edge-ingress', metric: '5xx rate', before: '0.02%', now: '0.9%', worse: true },
        { service: 'router-tier', metric: 'p99 latency', before: '180ms', now: '310ms', worse: true },
      ],
      errorBudget: { remainingPct: 44, burnRateX: 2, note: 'within tolerance if resolved this hour' },
    },
    act: {
      playbooks: [
        {
          rank: 1,
          name: 'Pause rotation & raise deregistration delay to 90s',
          description: 'Stops the blackholing immediately; rotation resumes safely after.',
          risk: 'Medium',
          eta: '~4m',
          successRate: 94,
          requiresApproval: true,
        },
        {
          rank: 2,
          name: 'Force-drain remaining 1c ingress pods',
          description: 'Clears the AZ at once; brief capacity dip during rebalance.',
          risk: 'High',
          eta: '~3m',
          successRate: 81,
          requiresApproval: true,
        },
        {
          rank: 3,
          name: 'Shift 1c traffic to 1a/1b via weighted routing',
          description: 'Routes around the problem; leaves rotation issue unfixed.',
          risk: 'Low',
          eta: '~2m',
          successRate: 72,
          requiresApproval: false,
        },
      ],
    },
    validate: {
      checklist: [
        { label: 'Rotation paused, delay raised', status: 'done' },
        { label: '5xx back under 0.1% for 10m', status: 'pending' },
        { label: 'AZ capacity rebalanced', status: 'pending' },
      ],
      slos: [
        { label: '5xx rate', current: '0.2%', target: '< 0.1%', pct: 64 },
        { label: 'p99 latency', current: '620ms', target: '< 800ms', pct: 100 },
      ],
      windowTotalMin: 25,
      windowLeftMin: 21,
      contribution: {
        cost: '~$800 revenue protected',
        time: '0.7 eng-hours saved',
        risk: 'AZ-wide degradation contained',
      },
    },
  },

  /* Recovered scenario — lands on Validate with the observation window live */
  'ALT-4802': {
    alertId: 'ALT-4802',
    title: 'Cache hit ratio recovered to 94%',
    service: 'cdn-edge',
    severity: 'low',
    startedAt: minutesAgo(64),
    currentState: 'validate',
    detect: {
      summary:
        'cdn-edge cache hit ratio dropped 96% → 71% at 04:12 UTC after a cache-key config push, tripling origin load.',
      detectionConfidence: 95,
      signals: [
        { label: 'Ingest 133 raw signals across 2 sources', status: 'done' },
        { label: 'Correlate into 1 alert group (noise −94%)', status: 'done' },
        { label: 'Enrich with deploy + topology context', status: 'done' },
      ],
      impactedServices: ['cdn-edge', 'origin-fleet'],
      similarIncidents: [
        { id: 'INC-176', title: 'cache-key regression on asset push', resolvedAgo: '7w ago', similarity: 94 },
      ],
    },
    assess: {
      rcaConfidence: 94,
      rootCause: 'Cache-key config push added a per-session query param to the key, fragmenting the cache.',
      chain: [
        { kind: 'cause', title: 'Cache-key config push', sub: 'cdn-edge · 04:09 UTC', confidence: 94 },
        { kind: 'effect', title: 'Cache fragmentation', sub: 'hit ratio 96% → 71%', confidence: 96 },
        { kind: 'impact', title: 'Origin load 3.1×', sub: 'no user-facing impact yet', confidence: 90 },
      ],
      correlatedChanges: [
        { label: 'cdn-edge cache-key config push', when: '3m before onset', pct: 94 },
      ],
      serviceIntel: [
        { label: 'Owner', value: 'edge-team (on-call: M. Chen)' },
        { label: 'Deploys this week', value: '3 (1 rolled back)' },
        { label: 'Dependencies', value: '0 upstream · 2 downstream' },
        { label: 'Error budget left', value: '76% of monthly SLO' },
      ],
      beforeNow: [
        { service: 'cdn-edge', metric: 'hit ratio', before: '96%', now: '94%', worse: false },
        { service: 'origin-fleet', metric: 'load factor', before: '3.1\u00d7', now: '1.1\u00d7', worse: false },
      ],
      errorBudget: { remainingPct: 76, burnRateX: 1, note: 'burn back to baseline' },
    },
    act: {
      playbooks: [
        {
          rank: 1,
          name: 'Revert cache-key config',
          description: 'Restores the previous key shape; cache re-warms in ~10m.',
          risk: 'Low',
          eta: '~10m',
          successRate: 97,
          requiresApproval: false,
        },
      ],
    },
    validate: {
      checklist: [
        { label: 'Config reverted across 40 PoPs', status: 'done' },
        { label: 'Hit ratio above 90% for 15m', status: 'done' },
        { label: 'Origin load back to baseline', status: 'done' },
        { label: 'No downstream regressions', status: 'pending' },
      ],
      slos: [
        { label: 'Cache hit ratio', current: '94%', target: '> 90%', pct: 100 },
        { label: 'Origin load', current: '1.1×', target: '< 1.2×', pct: 100 },
      ],
      windowTotalMin: 30,
      windowLeftMin: 7,
      contribution: {
        cost: '~$610 origin egress saved',
        time: '0.4 eng-hours saved',
        risk: 'Origin overload prevented',
      },
    },
  },
}

/* Deeplink-first: any alert id must render. Unknown ids get a generic
   early-stage scenario so cold links never dead-end. */
function fallbackScenario(alertId: string): DaavScenario {
  return {
    ...scenarios['ALT-4821'],
    alertId,
    title: 'Signal group under investigation',
    service: 'unknown-service',
    severity: 'medium',
    startedAt: minutesAgo(2),
    currentState: 'detect',
  }
}

export function getScenario(alertId: string): DaavScenario {
  return scenarios[alertId] ?? fallbackScenario(alertId)
}

export const LOW_CONFIDENCE_THRESHOLD = 80
