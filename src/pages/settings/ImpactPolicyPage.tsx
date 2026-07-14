import { useState } from 'react'
import { ArrowDown, ArrowUp, Clock, DollarSign, ShieldAlert } from 'lucide-react'

interface EnvConfig {
  key: string
  name: string
  badge: string
  desc: string
  dotClass: string
}

const CONFIGS: EnvConfig[] = [
  {
    key: 'production',
    name: 'Production',
    badge: 'STRICTEST',
    desc: 'Reliability weighted highest. Cost increases are tolerated to protect SLOs and customer-facing availability.',
    dotClass: 'production',
  },
  {
    key: 'staging',
    name: 'Staging',
    badge: 'BALANCED',
    desc: 'Cost weighted highest. Slower recovery and mild risk are acceptable in exchange for spend control.',
    dotClass: 'staging',
  },
  {
    key: 'development',
    name: 'Development',
    badge: 'COST-FIRST',
    desc: 'Cost-dominant. Minimal risk weighting — outages here have no customer impact.',
    dotClass: 'development',
  },
]

const DIMENSIONS = {
  risk: {
    label: 'Risk',
    Icon: ShieldAlert,
    descriptions: {
      production: 'Reliability weighted highest. Minimize customer-facing and reliability risk first.',
      staging: 'Mild risk is acceptable for pre-production and release candidate testing.',
      development: 'Minimal risk weighting — outages here have no customer impact.',
    },
  },
  time: {
    label: 'Time',
    Icon: Clock,
    descriptions: {
      production: 'Favor the fastest path back to healthy to protect availability SLOs.',
      staging: 'Moderate recovery times acceptable in exchange for cost controls.',
      development: 'Resolution speed is secondary; recovery validation can run slowly.',
    },
  },
  cost: {
    label: 'Cost',
    Icon: DollarSign,
    descriptions: {
      production: 'Weight the dollar cost of remediation. Cost increases tolerated.',
      staging: 'Cost weighted highest. Spend controls prioritized during recovery.',
      development: 'Cost-dominant. Maximize budget savings and auto-scale aggressively.',
    },
  },
} as const

export function ImpactPolicyPage() {
  const [activeTab, setActiveTab] = useState<string>('production')
  const [envOrders, setEnvOrders] = useState<Record<string, ('cost' | 'time' | 'risk')[]>>({
    production: ['risk', 'time', 'cost'],
    staging: ['cost', 'risk', 'time'],
    development: ['cost', 'risk', 'time'],
  })

  const moveItem = (envKey: string, index: number, direction: -1 | 1) => {
    setEnvOrders((prev) => {
      const list = [...prev[envKey]]
      const target = index + direction
      if (target < 0 || target >= list.length) return prev
      ;[list[index], list[target]] = [list[target], list[index]]
      return { ...prev, [envKey]: list }
    })
  }

  const activeCfg = CONFIGS.find((c) => c.key === activeTab) || CONFIGS[0]
  const currentOrder = envOrders[activeCfg.key]

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">Settings · AI &amp; Automation</div>
          <h1 className="page-title">Impact Policies</h1>
          <p className="page-sub" style={{ maxWidth: 720 }}>
            Cost, Time, and Risk are never weighted equally. Rank how the AI should prioritize trade-offs
            when it chooses between remediations per environment. Production and Staging should not be judged the same way.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 680 }}>
        {/* Priority-wise tab selection */}
        <div className="policy-tabs">
          {CONFIGS.map((cfg) => (
            <button
              key={cfg.key}
              onClick={() => setActiveTab(cfg.key)}
              className={`policy-tab-btn ${activeTab === cfg.key ? 'active' : ''}`}
            >
              <span className={`env-dot ${cfg.dotClass}`} />
              <span className="tab-name">{cfg.name}</span>
              <span className="tab-badge">{cfg.badge}</span>
            </button>
          ))}
        </div>

        {/* Active tab contents: Priority Ranking list */}
        <div className="env-card" style={{ marginTop: 12 }}>
          <div className="env-desc" style={{ marginBottom: 20, fontSize: 13.5, color: 'var(--muted)', minHeight: 40 }}>
            {activeCfg.desc}
          </div>

          <div className="priority-list">
            {currentOrder.map((dimKey, i) => {
              const dim = DIMENSIONS[dimKey]
              const { Icon } = dim
              const descText = dim.descriptions[activeCfg.key as 'production' | 'staging' | 'development']

              return (
                <div key={dimKey} className="priority-row">
                  <span className="priority-rank mono">{i + 1}</span>
                  <span className="priority-icon">
                    <Icon size={16} strokeWidth={2} />
                  </span>
                  <span className="priority-meta">
                    <span className="priority-label">{dim.label}</span>
                    <span className="priority-desc">{descText}</span>
                  </span>
                  <span className="priority-actions">
                    <button
                      className="askai-close"
                      aria-label={`Move ${dim.label} up`}
                      disabled={i === 0}
                      onClick={() => moveItem(activeCfg.key, i, -1)}
                    >
                      <ArrowUp size={14} strokeWidth={2.2} />
                    </button>
                    <button
                      className="askai-close"
                      aria-label={`Move ${dim.label} down`}
                      disabled={i === currentOrder.length - 1}
                      onClick={() => moveItem(activeCfg.key, i, 1)}
                    >
                      <ArrowDown size={14} strokeWidth={2.2} />
                    </button>
                  </span>
                </div>
              )
            })}
          </div>

          <div className="env-card-foot" style={{ borderTop: 'none', marginTop: 16 }}>
            <span className="foot-left mono" style={{ fontSize: 11, fontWeight: 600, color: 'var(--faint)' }}>
              Weighting rank: {currentOrder.map((k) => DIMENSIONS[k].label).join(' › ')}
            </span>
            <span className="foot-right valid">Priority saved ✓</span>
          </div>
        </div>

        <section className="panel" style={{ marginTop: 24, padding: 20 }}>
          <div className="panel-title" style={{ fontSize: 11, fontWeight: 700, color: 'var(--faint)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 6 }}>
            Decision Categories
          </div>
          <p className="panel-body-text" style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>
            Every action is classified into one category. Categories tune how the weights above are applied —
            a Recovery action tolerates more cost than an Optimization one.
          </p>

          <div className="categories-container">
            <div className="category-pill">
              <span className="category-dot recovery" />
              <span className="category-name">Recovery</span>
              <span className="category-desc">Restore a degraded or failing service</span>
            </div>
            <div className="category-pill">
              <span className="category-dot protection" />
              <span className="category-name">Protection</span>
              <span className="category-desc">Prevent imminent customer-facing failure</span>
            </div>
            <div className="category-pill">
              <span className="category-dot optimization" />
              <span className="category-name">Optimization</span>
              <span className="category-desc">Reduce cost or resource waste</span>
            </div>
            <div className="category-pill">
              <span className="category-dot prevention" />
              <span className="category-name">Prevention</span>
              <span className="category-desc">Close a risk before it triggers</span>
            </div>
            <div className="category-pill">
              <span className="category-dot acceleration" />
              <span className="category-name">Acceleration</span>
              <span className="category-desc">Shorten time-to-resolution</span>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
