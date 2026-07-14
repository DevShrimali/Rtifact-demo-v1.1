import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, ChevronDown, ChevronRight, Search } from 'lucide-react'
import { useEnv } from '../state/env'
import { getClusters } from '../mock/infra'
import { useNavigate } from 'react-router-dom'

/* Global environment selector (DEV-27). Lives in the topbar as the
   "Production · us-east-1" chip; opens a multi-select dropdown with a
   search filter and an expandable env → cluster tree. Selecting more than
   one environment puts the app into an aggregating state. Pattern adopted
   from the Karan build. */
export function EnvSelector() {
  const {
    selectedEnvs,
    environments,
    toggleEnv,
    aggregating,
    selectedClusters,
    toggleCluster,
    selectAllClusters,
    clearAllClusters,
  } = useEnv()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      // Don't close if click is inside the root selector
      if (rootRef.current?.contains(e.target as Node)) {
        return
      }
      setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return environments
    return environments.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.region.toLowerCase().includes(q) ||
        e.provider.toLowerCase().includes(q) ||
        getClusters(e.id).some((c) => c.id.toLowerCase().includes(q)),
    )
  }, [query, environments])

  const primary = selectedEnvs[0]
  const label = aggregating
    ? `Aggregating ${selectedEnvs.length} environments`
    : `${primary.name.toLowerCase().replace(/\s+/g, '-')} · ${primary.region}`

  /* worst health across the selection drives the trigger dot */
  const rank = { critical: 3, degraded: 2, healthy: 1 } as const
  const worst = selectedEnvs.reduce(
    (acc, e) => (rank[e.health] > rank[acc] ? e.health : acc),
    'healthy' as 'healthy' | 'degraded' | 'critical',
  )

  return (
    <div className="env-select-top" ref={rootRef}>
      <button
        className={`env-chip env-chip-btn${aggregating ? ' aggregating' : ''}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`Environment: ${label}`}
        onClick={() => setOpen((o) => !o)}
      >
        <span className={`dot ${worst}`} />
        <span className="env-chip-label">{label}</span>
        <ChevronDown size={13} className="env-caret" strokeWidth={2.2} />
      </button>

      {open && (
        <div className="env-pop env-pop-multi" role="dialog" aria-label="Select environments" style={{ width: '280px' }}>
          {/* Header Scope Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px 8px', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--faint)', letterSpacing: '0.07em' }}>
              SCOPE · {selectedClusters.length} CLUSTER{selectedClusters.length === 1 ? '' : 'S'}
            </span>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                style={{ fontSize: '11px', color: 'var(--brand)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                onClick={() => selectAllClusters()}
              >
                All
              </button>
              <button
                style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                onClick={() => clearAllClusters()}
              >
                Clear
              </button>
            </div>
          </div>

          <div className="env-search">
            <Search size={13} strokeWidth={2.2} />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter environments or clusters…"
              aria-label="Filter environments"
            />
          </div>

          <div className="env-pop-scroll" style={{ padding: '4px 0', maxHeight: '340px' }}>
            {filtered.length === 0 && <div className="env-pop-empty">No matches</div>}
            {filtered.map((e) => {
              const envClusters = getClusters(e.id)
              const selectedEnvClusters = envClusters.filter(c => selectedClusters.includes(c.id))
              const isAllChecked = envClusters.length > 0 && selectedEnvClusters.length === envClusters.length
              const isSomeChecked = selectedEnvClusters.length > 0 && selectedEnvClusters.length < envClusters.length
              const isOpen = expanded === e.id

              return (
                <div key={e.id} className="env-tree-node">
                  {/* Environment Row */}
                  <div className={`env-tree-row${isAllChecked || isSomeChecked ? ' selected' : ''}`} style={{ padding: '6px 12px 6px 6px', gap: '6px' }}>
                    <button
                      className="env-expand"
                      style={{ width: '18px', height: '18px' }}
                      aria-label={isOpen ? `Collapse ${e.name}` : `Expand ${e.name}`}
                      aria-expanded={isOpen}
                      onClick={() => setExpanded(isOpen ? null : e.id)}
                    >
                      {isOpen ? (
                        <ChevronDown size={12} strokeWidth={2.5} />
                      ) : (
                        <ChevronRight size={12} strokeWidth={2.5} />
                      )}
                    </button>
                    
                    <button
                      className="env-check-row"
                      role="checkbox"
                      aria-checked={isAllChecked}
                      style={{ padding: 0, gap: '8px' }}
                      onClick={() => toggleEnv(e.id)}
                    >
                      <span className={`env-checkbox${isAllChecked ? ' on' : ''}`} style={{ width: '14px', height: '14px', borderRadius: '4px', border: isSomeChecked ? '1.5px solid var(--brand)' : undefined, background: isSomeChecked ? 'var(--brand-soft)' : undefined }}>
                        {isAllChecked && <Check size={10} strokeWidth={3} />}
                        {isSomeChecked && <div style={{ width: '6px', height: '6px', background: 'var(--brand)', borderRadius: '1px' }} />}
                      </span>
                      <span className={`dot ${e.health}`} style={{ width: '6px', height: '6px' }} />
                      <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--fg)', lineHeight: 1.2 }}>
                          {e.name}
                        </span>
                        <span style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'capitalize' }}>
                          {e.health}
                        </span>
                      </div>
                    </button>

                    <span style={{ fontSize: '10.5px', color: 'var(--muted)', background: 'var(--chip)', padding: '1px 5px', borderRadius: '10px', marginLeft: 'auto', fontFamily: 'var(--mono)' }}>
                      {selectedEnvClusters.length}/{envClusters.length}
                    </span>
                  </div>

                  {/* Expanded Clusters List */}
                  {isOpen && (
                    <div style={{ borderLeft: '1px solid var(--border)', marginLeft: '15px', paddingLeft: '8px', display: 'flex', flexDirection: 'column', gap: '4px', margin: '4px 0 8px 15px' }}>
                      {envClusters.length === 0 ? (
                        <div className="env-cluster-empty mono" style={{ fontSize: '10px', paddingLeft: '8px' }}>no clusters</div>
                      ) : (
                        envClusters.map((c) => {
                          const isClusterChecked = selectedClusters.includes(c.id)
                          return (
                            <div
                              key={c.id}
                              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer' }}
                              onClick={() => toggleCluster(c.id)}
                            >
                              <span className={`env-checkbox${isClusterChecked ? ' on' : ''}`} style={{ width: '14px', height: '14px', borderRadius: '4px' }}>
                                {isClusterChecked && <Check size={10} strokeWidth={3} />}
                              </span>
                              <span className={`dot ${c.health}`} style={{ width: '6px', height: '6px' }} />
                              <span className="mono" style={{ fontSize: '11px', color: isClusterChecked ? 'var(--fg)' : 'var(--muted)' }}>
                                {c.id}
                              </span>
                              <span style={{ fontSize: '10px', color: 'var(--faint)', marginLeft: 'auto' }}>
                                {c.nodes} nodes
                              </span>
                            </div>
                          )
                        })
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Plus Footer Button */}
          <button
            className="env-opt"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 14px',
              borderTop: '1px solid var(--border)',
              width: '100%',
              color: 'var(--muted)',
              fontSize: '12px',
              fontWeight: 500,
              textAlign: 'left',
              background: 'transparent',
              cursor: 'pointer',
              borderRadius: 0,
            }}
            onClick={() => {
              setOpen(false)
              navigate('/settings/connections?connect=true')
            }}
          >
            <span style={{ fontSize: '14px', fontWeight: 600 }}>+</span>
            <span>Connect new environment</span>
          </button>
        </div>
      )}
    </div>
  )
}
