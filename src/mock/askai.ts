export interface AskAIContext {
  /* where the user is — shown as the panel's context label */
  surface: string
  /* reference-attaching mechanism: exactly which items are in context */
  references: { kind: 'env' | 'alert' | 'incident' | 'cluster' | 'pod' | 'metric' | 'logs' | 'view'; label: string }[]
  suggestions: string[]
  /* canned response for the showcase */
  answer: { text: string; confidence: number; sources: string[] }
}

/* Context is derived from the current route — same component everywhere,
   only the attached references + suggested questions differ. */
export function getAskAIContext(pathname: string, envName: string): AskAIContext {
  const seg = pathname.split('/').filter(Boolean)

  if (seg[0] === 'command' && seg[1] === 'alerts' && seg[2]) {
    return {
      surface: `Alert ${seg[2]}`,
      references: [
        { kind: 'alert', label: seg[2] },
        { kind: 'env', label: envName },
        { kind: 'metric', label: 'error-rate window ±30m' },
        { kind: 'logs', label: 'correlated log group' },
      ],
      suggestions: [
        'What changed right before onset?',
        'Summarize blast radius in one paragraph',
        'Draft a Slack update for the on-call channel',
      ],
      answer: {
        text: 'Onset at 04:41 UTC follows deploy v2.14.3 by 3 minutes. Error rate is 14× baseline, concentrated on POST /checkout/complete. Two similar past incidents both resolved via rollback — recommended playbook is already ranked #1 in the Act state.',
        confidence: 87,
        sources: ['Change timeline · deploy v2.14.3', 'Metrics · checkout-svc error rate', 'INC-208 resolution notes'],
      },
    }
  }

  if (seg[0] === 'command' && seg[1] === 'incidents' && seg[2]) {
    return {
      surface: `Incident ${seg[2]}`,
      references: [
        { kind: 'incident', label: seg[2] },
        { kind: 'env', label: envName },
        { kind: 'metric', label: 'before/now service deltas' },
      ],
      suggestions: [
        'Who should be paged if this escalates?',
        'Summarize current status for leadership',
        'What is blocking resolution right now?',
      ],
      answer: {
        text: 'Status: remediation prepared and awaiting approval. The RCA is deploy-correlated with 87% confidence, blast radius is contained to checkout flows. If the SLA window is at risk, the prepared rollback recovers in ~6 minutes with 96% past success.',
        confidence: 85,
        sources: ['Incident causal chain', 'SLA policy · Sev-critical 40m', 'Playbook history'],
      },
    }
  }

  if (seg[0] === 'command' && seg[1] === 'clusters' && seg[3] === 'pods') {
    return {
      surface: `Pod ${seg[4]}`,
      references: [
        { kind: 'pod', label: seg[4] ?? 'pod' },
        { kind: 'cluster', label: seg[2] ?? 'cluster' },
        { kind: 'logs', label: 'last 200 events' },
      ],
      suggestions: [
        'Why is this pod crash-looping?',
        'Is the memory limit too low?',
        'Which deploy introduced this behavior?',
      ],
      answer: {
        text: 'The container is OOMKilled: memory peaks at 88% of the 512Mi limit right after deploy v2.14.3, then the retry loop amplifies allocation. Raising the limit masks the symptom — the retry regression is the cause; rollback is the recommended fix.',
        confidence: 84,
        sources: ['Pod events · OOMKilled', 'Metrics · container memory', 'Change timeline · v2.14.3'],
      },
    }
  }

  if (seg[0] === 'command' && seg[1] === 'clusters') {
    return {
      surface: `Cluster ${seg[2]}`,
      references: [
        { kind: 'cluster', label: seg[2] ?? 'cluster' },
        { kind: 'env', label: envName },
      ],
      suggestions: [
        'Which pods are unhealthy and why?',
        'Is utilization trending toward capacity?',
        'Summarize node pressure by AZ',
      ],
      answer: {
        text: '2 of 5 pods are unhealthy: one CrashLoop (checkout-svc, deploy-correlated OOM) and one Pending (cdn-sync, waiting on GPU capacity). Utilization is 71% and stable — no node pressure outside us-east-1c.',
        confidence: 88,
        sources: ['Pod status snapshot', 'Node utilization series'],
      },
    }
  }

  if (seg[0] === 'command' && seg[1] === 'telemetry') {
    const lens = seg[2] ?? 'intelligence'
    return {
      surface: `Telemetry · ${lens[0].toUpperCase()}${lens.slice(1)}`,
      references: [
        { kind: 'env', label: envName },
        { kind: 'view', label: `${lens} lens` },
        { kind: 'metric', label: 'AI-correlated window 1h' },
      ],
      suggestions: [
        'What anomalies correlate across metrics, logs, and traces?',
        'Which service is the likely root of current latency?',
        'Create an alert from the pattern you found',
      ],
      answer: {
        text: 'Three signals correlate in the last hour: checkout-svc error spike (metrics), PaymentRetryExhausted pattern ×2,140 (logs), and 8-retry exemplar traces. All point at the payments client retry loop introduced by v2.14.3.',
        confidence: 89,
        sources: ['Metrics · checkout error rate', 'Logs · pattern LP-114', 'Traces · exemplar t-88ac'],
      },
    }
  }

  if (seg[0] === 'command' && seg[1] === 'incidents') {
    return {
      surface: 'Incidents',
      references: [
        { kind: 'env', label: envName },
        { kind: 'view', label: 'pipeline snapshot' },
      ],
      suggestions: [
        'Which incident is most at risk of SLA breach?',
        'What resolved incidents this week were AI-handled?',
        'Summarize incident load vs last week',
      ],
      answer: {
        text: 'INC-309 is the SLA risk: 8 minutes left, remediation prepared and waiting on approval. This week: 6 incidents, 4 AI-created, 2 auto-resolved — load is down 18% vs last week.',
        confidence: 90,
        sources: ['Incident pipeline', 'SLA tracker', 'Weekly rollup'],
      },
    }
  }

  if (seg[0] === 'review') {
    return {
      surface: 'Review',
      references: [
        { kind: 'env', label: envName },
        { kind: 'view', label: 'Security · Cost · Reliability' },
      ],
      suggestions: [
        'Explain the top cost saving in plain language',
        'What changed in security posture this week?',
        'Which reliability risk should we fund first?',
      ],
      answer: {
        text: 'Biggest lever: rightsizing over-provisioned compute (~$3.1k/mo, low risk). Security posture improved — critical findings down 2 with no new exposure. Fund the orders-db observability gap first: it blocked one RCA this week.',
        confidence: 86,
        sources: ['Cost optimization findings', 'Security scan delta', 'Reliability signals'],
      },
    }
  }

  if (seg[0] === 'automate') {
    return {
      surface: 'Automate',
      references: [
        { kind: 'env', label: envName },
        { kind: 'view', label: 'workflow inventory' },
      ],
      suggestions: [
        'Which workflows failed recently and why?',
        'Draft a workflow: silence noisy staging alerts at night',
        'What automation would cut the most toil?',
      ],
      answer: {
        text: 'One workflow degraded: "Escalate stale criticals" hit a webhook timeout twice this week (endpoint p99 rose 4×). Highest-toil candidate: auto-acknowledging recovered-then-resolved alerts — ~22 manual acks/week.',
        confidence: 82,
        sources: ['Execution history', 'Alert action audit'],
      },
    }
  }

  if (seg[0] === 'support') {
    return {
      surface: 'Support',
      references: [{ kind: 'env', label: envName }, { kind: 'view', label: 'cases queue' }],
      suggestions: [
        'Which open case is aging worst?',
        'Draft a status-page update for the checkout incident',
        'Summarize case volume by severity',
      ],
      answer: {
        text: 'Oldest active case is 3 days in “Investigating” (payment webhook retries). Suggested status-page copy is drafted from INC-311’s public-safe summary — review before publishing.',
        confidence: 81,
        sources: ['Cases queue', 'INC-311 summary'],
      },
    }
  }

  if (seg[0] === 'settings') {
    return {
      surface: 'Settings',
      references: [{ kind: 'view', label: 'AI ontology & policies' }],
      suggestions: [
        'Which agents lack a connected source?',
        'Are any confidence thresholds set unusually low?',
        'What knowledge gaps block better RCA?',
      ],
      answer: {
        text: 'Two agents run without a primary source: CI/CD events (staging) and synthetic coverage for EU. The staging gap directly capped RCA confidence at 74% on ALT-9012 — connecting the CI provider fixes it.',
        confidence: 88,
        sources: ['Agent ontology', 'ALT-9012 RCA trace'],
      },
    }
  }

  /* Alerts board + fallback */
  return {
    surface: 'Alerts board',
    references: [
      { kind: 'env', label: envName },
      { kind: 'view', label: 'active alerts snapshot' },
    ],
    suggestions: [
      'Summarize the critical alerts in one paragraph',
      'Which alerts can be safely auto-silenced?',
      'Why did the noise ratio move this week?',
    ],
    answer: {
      text: 'Two criticals, one root cause: deploy v2.14.3 drives both the checkout error spike and the payments latency breach. Noise ratio rose 2% because staging load-test alerts are not yet classified as synthetic.',
      confidence: 88,
      sources: ['Alert correlation group', 'Noise classifier report'],
    },
  }
}
