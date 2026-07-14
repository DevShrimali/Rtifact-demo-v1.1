/* ---------- Screens 46–47: Agent Ontology ---------- */

export interface Agent {
  id: string
  name: string
  category: 'Runtime Intelligence' | 'Infrastructure Intelligence'
  active: boolean
  coveragePct: number
  confidencePct: number
  missingSources: number
  purpose: string
  sources: { name: string; connected: boolean }[]
  drives: string[]
}

export const agents: Agent[] = [
  { id: 'ag-1', name: 'Metrics Anomaly', category: 'Runtime Intelligence', active: true, coveragePct: 94, confidencePct: 91, missingSources: 0, purpose: 'Detects statistical anomalies across service metrics and seasonality.', sources: [{ name: 'Prometheus (prod)', connected: true }, { name: 'CloudWatch', connected: true }], drives: ['Alert detection', 'Anomaly callouts on Metrics dashboards'] },
  { id: 'ag-2', name: 'Log Pattern', category: 'Runtime Intelligence', active: true, coveragePct: 88, confidencePct: 89, missingSources: 0, purpose: 'Clusters raw log lines into recurring patterns and new-signature detection.', sources: [{ name: 'Loki (prod)', connected: true }, { name: 'S3 archive', connected: true }], drives: ['AI Detected Patterns banner', 'Noise classification'] },
  { id: 'ag-3', name: 'Trace Flow', category: 'Runtime Intelligence', active: true, coveragePct: 81, confidencePct: 86, missingSources: 0, purpose: 'Follows request flows across services to find latency contributors.', sources: [{ name: 'OTLP collector', connected: true }], drives: ['Flow anomalies', 'Causal chain latency evidence'] },
  { id: 'ag-4', name: 'Deployment Intelligence', category: 'Runtime Intelligence', active: true, coveragePct: 72, confidencePct: 87, missingSources: 1, purpose: 'Correlates deploys, config pushes, and rollouts with incident onset.', sources: [{ name: 'GitHub Actions (prod)', connected: true }, { name: 'CI events (staging)', connected: false }], drives: ['What-changed ranking in Assess', 'RCA confidence'] },
  { id: 'ag-5', name: 'Synthetic Coverage', category: 'Runtime Intelligence', active: true, coveragePct: 64, confidencePct: 83, missingSources: 1, purpose: 'Probes critical user flows and validates recovery from the outside.', sources: [{ name: 'Checks (us)', connected: true }, { name: 'Checks (eu)', connected: false }], drives: ['Synthetic check alerts', 'Recovery validation'] },
  { id: 'ag-6', name: 'SLO Guard', category: 'Runtime Intelligence', active: true, coveragePct: 90, confidencePct: 92, missingSources: 0, purpose: 'Tracks error budgets and burn rates against declared SLOs.', sources: [{ name: 'SLO definitions', connected: true }], drives: ['Error-budget views', 'Burn-rate escalations'] },
  { id: 'ag-7', name: 'K8s Workload', category: 'Infrastructure Intelligence', active: true, coveragePct: 92, confidencePct: 90, missingSources: 0, purpose: 'Understands pod lifecycle, restarts, scheduling, and resource pressure.', sources: [{ name: 'K8s API (4 clusters)', connected: true }], drives: ['Cluster/pod drill-down', 'OOM runbooks'] },
  { id: 'ag-8', name: 'Cloud Config', category: 'Infrastructure Intelligence', active: true, coveragePct: 86, confidencePct: 88, missingSources: 0, purpose: 'Scans cloud resource configuration for drift and exposure.', sources: [{ name: 'AWS (2 accounts)', connected: true }, { name: 'GCP', connected: true }], drives: ['Security findings', 'Review posture'] },
  { id: 'ag-9', name: 'Network Path', category: 'Infrastructure Intelligence', active: true, coveragePct: 78, confidencePct: 84, missingSources: 0, purpose: 'Maps LB, ingress, and cross-AZ paths; spots drain and routing faults.', sources: [{ name: 'VPC flow logs', connected: true }], drives: ['Ingress incident evidence', 'AZ rotation playbooks'] },
  { id: 'ag-10', name: 'Cost Signals', category: 'Infrastructure Intelligence', active: false, coveragePct: 41, confidencePct: 71, missingSources: 1, purpose: 'Finds idle spend, rightsizing, and tier optimizations.', sources: [{ name: 'Cost Explorer', connected: true }, { name: 'Billing export (GCP)', connected: false }], drives: ['Cost optimization line items'] },
  { id: 'ag-11', name: 'Security Posture', category: 'Infrastructure Intelligence', active: true, coveragePct: 89, confidencePct: 93, missingSources: 0, purpose: 'Prioritizes exposure findings by blast radius and exploitability.', sources: [{ name: 'Cloud Config agent', connected: true }, { name: 'IAM analyzer', connected: true }], drives: ['AI priority tags on findings'] },
  { id: 'ag-12', name: 'Capacity Forecast', category: 'Infrastructure Intelligence', active: false, coveragePct: 35, confidencePct: 68, missingSources: 2, purpose: 'Projects capacity exhaustion from growth trends.', sources: [{ name: 'Metrics history (90d)', connected: true }, { name: 'Business calendar', connected: false }, { name: 'Scaling events', connected: false }], drives: ['Capacity risk signals'] },
]

/* ---------- Screen 48: Investigation Policies ---------- */

export interface InvestigationPhase {
  key: string
  name: string
  description: string
  enabled: boolean
}

export const investigationPhases: InvestigationPhase[] = [
  { key: 'monitoring', name: 'Monitoring', description: 'Continuous signal ingestion and correlation', enabled: true },
  { key: 'dependency', name: 'Dependency', description: 'Map blast radius across the service graph', enabled: true },
  { key: 'change', name: 'Change Correlation', description: 'Rank deploys/config changes against onset', enabled: true },
  { key: 'rca', name: 'Root Cause', description: 'Converge on a cause with confidence scoring', enabled: true },
  { key: 'resolution', name: 'Resolution', description: 'Rank playbooks and prepare remediation', enabled: true },
  { key: 'validation', name: 'Validation', description: 'Observe recovery before closing', enabled: true },
]

/* ---------- Screen 49: Confidence Policies ---------- */

export interface ConfidencePolicy {
  key: string
  label: string
  defaultPct: number
  affects: string
}

export const confidencePolicies: ConfidencePolicy[] = [
  { key: 'promote', label: 'Auto-promote to Incident', defaultPct: 85, affects: 'Alert groups at or above this RCA confidence become incidents without human triage.' },
  { key: 'rollback', label: 'Suggest Rollback', defaultPct: 90, affects: 'The Act state ranks rollback #1 only at or above this change-correlation confidence.' },
  { key: 'critical', label: 'Escalate to Critical Priority', defaultPct: 92, affects: 'Impact-classification confidence needed to auto-raise severity to critical.' },
]

/* ---------- Screen 50: Automation Policies ---------- */

export interface AutomationAction {
  name: string
  risk: 'Low' | 'Medium' | 'High'
  approval: 'none' | 'required'
  permanentlyDisabled: boolean
  enabled: boolean
}

export const automationActions: AutomationAction[] = [
  { name: 'Restart pods / rollout bounce', risk: 'Low', approval: 'none', permanentlyDisabled: false, enabled: true },
  { name: 'Scale replicas or pools (bounded ±50%)', risk: 'Low', approval: 'none', permanentlyDisabled: false, enabled: true },
  { name: 'Apply log-rotation / cache-flush runbooks', risk: 'Low', approval: 'none', permanentlyDisabled: false, enabled: true },
  { name: 'Roll back service deploys', risk: 'Medium', approval: 'required', permanentlyDisabled: false, enabled: true },
  { name: 'Pause node rotations / raise drain delays', risk: 'Medium', approval: 'required', permanentlyDisabled: false, enabled: true },
  { name: 'Modify feature flags', risk: 'Medium', approval: 'required', permanentlyDisabled: false, enabled: false },
  { name: 'Force-drain availability zones', risk: 'High', approval: 'required', permanentlyDisabled: false, enabled: false },
  { name: 'Delete data volumes or snapshots', risk: 'High', approval: 'required', permanentlyDisabled: true, enabled: false },
  { name: 'Modify IAM roles or security groups', risk: 'High', approval: 'required', permanentlyDisabled: true, enabled: false },
]

/* ---------- Screen 51: Recovery Validation ---------- */

export interface RecoveryCheck {
  key: string
  label: string
  description: string
  enabled: boolean
}

export const recoveryChecks: RecoveryCheck[] = [
  { key: 'slo', label: 'SLO stabilization', description: 'Primary SLO back within target for the full window', enabled: true },
  { key: 'downstream', label: 'Downstream recovery', description: 'Dependent services back to baseline', enabled: true },
  { key: 'errors', label: 'Error rate normalization', description: 'Error rate within 1.2× of pre-incident baseline', enabled: true },
]

export const DEFAULT_HEALTHY_MINUTES = 30

/* ---------- Screen 52: Operational Knowledge ---------- */

export const knowledgeStats = [
  { label: 'Services', value: '68' },
  { label: 'Incidents learned', value: '1,242' },
  { label: 'Patterns', value: '87' },
  { label: 'Runbooks', value: '41' },
  { label: 'Dependencies', value: '1,850' },
]

export interface KnownPattern {
  id: string
  name: string
  seen: number
  lastSeen: string
  resolution: string
}

export const knownPatterns: KnownPattern[] = [
  { id: 'KP-31', name: 'Deploy-correlated retry storm', seen: 7, lastSeen: '1h ago', resolution: 'Rollback (RB-12) — 96% success' },
  { id: 'KP-24', name: 'Cache-key fragmentation after config push', seen: 4, lastSeen: '3d ago', resolution: 'Revert config (RB-14) — 97% success' },
  { id: 'KP-19', name: 'AZ rotation drain blackholing', seen: 3, lastSeen: '2w ago', resolution: 'Pause rotation (RB-21) — 94% success' },
  { id: 'KP-12', name: 'Index bloat slow-query cascade', seen: 5, lastSeen: '5w ago', resolution: 'Online index rebuild — 93% success' },
]

export const knowledgeBrowse = {
  Services: ['checkout-svc — 214 incidents · 9 patterns', 'payments-api — 187 incidents · 7 patterns', 'orders-db — 122 incidents · 6 patterns', 'edge-ingress — 98 incidents · 5 patterns'],
  Environments: ['Production — 812 incidents learned', 'Production EU — 214 incidents learned', 'Staging — 201 incidents learned', 'Development — 15 incidents learned'],
  Incidents: ['INC-311 — retry storm (learning in progress)', 'INC-305 — cache fragmentation → KP-24 reinforced', 'INC-301 — disk pressure → RB-09 confidence +2%', 'INC-201 — drain blackholing → KP-19 created'],
}
