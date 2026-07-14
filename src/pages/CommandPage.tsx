import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { RefreshCw, WifiOff, Sparkles, LayoutGrid, List, Search } from 'lucide-react'
import { useEnv } from '../state/env'
import { getBoard } from '../mock/alerts'
import { primaryCluster } from '../mock/infra'
import type { Alert } from '../mock/alerts'
import { SeverityBadge } from '../components/SeverityBadge'
import { TimeAgo } from '../components/TimeAgo'
import { OptimizationGoals } from '../components/OptimizationGoals'

type ViewState = 'loading' | 'default' | 'empty' | 'error'

/* Screen 01 — Alerts board, Command's entry surface (no separate Overview).
   `?state=loading|empty|error` pins a designed state for review; a cold
   entry plays the real loading → data sequence. */
export function CommandPage() {
  const { env } = useEnv()
  const [searchParams] = useSearchParams()
  const forced = searchParams.get('state')
  const [loaded, setLoaded] = useState(false)
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  
  // Grouping state: Status vs Actionables
  const [groupBy, setGroupBy] = useState<'status' | 'actionables'>('status')
  
  // Active Tab state for List view (initialized to 'new' or 'actionable')
  const [activeTab, setActiveTab] = useState<string>('new')

  useEffect(() => {
    setLoaded(false)
    const t = setTimeout(() => setLoaded(true), 550)
    return () => clearTimeout(t)
  }, [env.id])

  const board = getBoard(env.id)
  const state: ViewState =
    forced === 'loading' || forced === 'empty' || forced === 'error'
      ? forced
      : !loaded
        ? 'loading'
        : board.alerts.length === 0
          ? 'empty'
          : 'default'

  const rawAlerts = state === 'default' ? board.alerts : []
  const active = rawAlerts.filter((a) => a.column !== 'resolved')
  const criticalCount = active.filter((a) => a.severity === 'critical').length

  // Filter alerts by Priority Selector
  const priorityFiltered = priorityFilter === 'all'
    ? rawAlerts
    : rawAlerts.filter((a) => a.severity === priorityFilter)

  // Filter alerts by Search Input Query (filters by id, title, service)
  const searchedAlerts = priorityFiltered.filter((a) => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return true
    return (
      a.id.toLowerCase().includes(q) ||
      a.title.toLowerCase().includes(q) ||
      a.service.toLowerCase().includes(q)
    )
  })

  const SEVERITY_RANK = {
    critical: 1,
    high: 2,
    medium: 3,
    low: 4,
  }

  // Sorted by severity rank
  const sortedAlerts = [...searchedAlerts].sort((a, b) => {
    return SEVERITY_RANK[a.severity as keyof typeof SEVERITY_RANK] - SEVERITY_RANK[b.severity as keyof typeof SEVERITY_RANK]
  })

  // Switcher mapping handler to ensure activeTab remains valid
  const handleGroupByChange = (groupMode: 'status' | 'actionables') => {
    setGroupBy(groupMode)
    if (groupMode === 'status') {
      if (activeTab === 'actionable') {
        setActiveTab('new')
      } else if (activeTab === 'automated_resolved') {
        setActiveTab('resolved')
      } else {
        setActiveTab('new')
      }
    } else {
      if (activeTab === 'new' || activeTab === 'in_progress') {
        setActiveTab('actionable')
      } else if (activeTab === 'resolved') {
        setActiveTab('automated_resolved')
      } else {
        setActiveTab('actionable')
      }
    }
  }

  // Compute Kanban Board Columns dynamically
  const columns = groupBy === 'status'
    ? [
        { key: 'new', title: 'New', items: sortedAlerts.filter((a) => a.column === 'new') },
        { key: 'in_progress', title: 'In Progress', items: sortedAlerts.filter((a) => a.column === 'in_progress') },
        { key: 'resolved', title: 'Resolved', items: sortedAlerts.filter((a) => a.column === 'resolved') },
      ]
    : [
        { key: 'actionable', title: 'Actionable', items: sortedAlerts.filter((a) => a.column === 'new' || a.column === 'in_progress') },
        { key: 'automated_resolved', title: 'Automated / Resolved', items: sortedAlerts.filter((a) => a.column === 'resolved') },
      ]

  // Compute List Tabs dynamically
  const listTabs = groupBy === 'status'
    ? [
        { key: 'new', label: 'New', count: sortedAlerts.filter((a) => a.column === 'new').length },
        { key: 'in_progress', label: 'In Progress', count: sortedAlerts.filter((a) => a.column === 'in_progress').length },
        { key: 'resolved', label: 'Resolved', count: sortedAlerts.filter((a) => a.column === 'resolved').length },
      ]
    : [
        { key: 'actionable', label: 'Actionable', count: sortedAlerts.filter((a) => a.column === 'new' || a.column === 'in_progress').length },
        { key: 'automated_resolved', label: 'Automated / Resolved', count: sortedAlerts.filter((a) => a.column === 'resolved').length },
      ]

  // Filter list rows by active tab filter
  const filteredListAlerts = sortedAlerts.filter((a) => {
    if (activeTab === 'new') return a.column === 'new'
    if (activeTab === 'in_progress') return a.column === 'in_progress'
    if (activeTab === 'resolved') return a.column === 'resolved'
    if (activeTab === 'actionable') return a.column === 'new' || a.column === 'in_progress'
    if (activeTab === 'automated_resolved') return a.column === 'resolved'
    return true
  })

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">Command</div>
          <h1 className="page-title">Alerts</h1>
          <p className="page-sub">
            {state === 'default'
              ? `${active.length} active in ${env.name} — ${criticalCount} critical`
              : state === 'loading'
                ? `Loading alerts for ${env.name}…`
                : state === 'error'
                  ? `Alert stream unavailable for ${env.name}`
                  : `No active alerts in ${env.name}`}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Search Box */}
          <div className="search-input-container">
            <Search size={14} className="search-icon-svg" />
            <input
              type="text"
              placeholder="Search alerts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-input"
              style={{ fontSize: '12.5px', padding: '6px 10px 6px 30px', width: '160px' }}
            />
          </div>

          {/* Grouping switcher */}
          <div className="group-switcher-segment">
            <button
              className={`segment-btn ${groupBy === 'status' ? 'active' : ''}`}
              onClick={() => handleGroupByChange('status')}
            >
              Status
            </button>
            <button
              className={`segment-btn ${groupBy === 'actionables' ? 'active' : ''}`}
              onClick={() => handleGroupByChange('actionables')}
            >
              Actionables
            </button>
          </div>

          {/* Priority Filter */}
          <select
            className="text-input select"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            style={{ fontSize: '12.5px', fontWeight: 500, padding: '6px 28px 6px 10px' }}
          >
            <option value="all">All Priorities</option>
            <option value="critical">Critical Only</option>
            <option value="high">High Only</option>
            <option value="medium">Medium Only</option>
            <option value="low">Low Only</option>
          </select>

          {/* View mode toggle */}
          <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: '6px', overflow: 'hidden', background: 'var(--surface)' }}>
            <button
              onClick={() => setViewMode('board')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '6px 10px',
                border: 'none',
                background: viewMode === 'board' ? 'var(--chip)' : 'transparent',
                color: viewMode === 'board' ? 'var(--fg)' : 'var(--muted)',
                cursor: 'pointer',
                transition: 'all 0.1s ease',
              }}
              title="Board View"
            >
              <LayoutGrid size={14} strokeWidth={2.2} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '6px 10px',
                border: 'none',
                background: viewMode === 'list' ? 'var(--chip)' : 'transparent',
                color: viewMode === 'list' ? 'var(--fg)' : 'var(--muted)',
                cursor: 'pointer',
                transition: 'all 0.1s ease',
              }}
              title="List View"
            >
              <List size={14} strokeWidth={2.2} />
            </button>
          </div>
        </div>
      </div>

      {state === 'error' ? (
        <ErrorPanel envName={env.name} />
      ) : (
        <>
          {/* Combined Unified Telemetry & Health Status Banner */}
          <UnifiedTelemetryBanner board={board} loading={state === 'loading'} />

          <div className="section-label">Optimization goals</div>
          {state === 'loading' ? <GoalsSkeleton /> : <OptimizationGoals goals={board.goals} />}

          <div className="section-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{viewMode === 'board' ? 'Board' : 'List'}</span>
            {viewMode === 'list' && (
              <span className="mono" style={{ fontSize: 10, color: 'var(--faint)' }}>
                Priority View (Critical › High › Medium › Low)
              </span>
            )}
          </div>

          {state === 'loading' ? (
            viewMode === 'board' ? <BoardSkeleton /> : <ListSkeleton />
          ) : state === 'empty' || sortedAlerts.length === 0 ? (
            <EmptyBoard envName={env.name} />
          ) : viewMode === 'board' ? (
            <div className="kanban">
              {columns.map((col) => {
                return (
                  <section key={col.key} className="kanban-col" aria-label={col.title}>
                    <header className="kanban-head">
                      <span className="kanban-title">{col.title}</span>
                      <span className="kanban-count mono">{col.items.length}</span>
                    </header>
                    {col.items.map((a) => (
                      <AlertCard key={a.id} alert={a} />
                    ))}
                    {col.items.length === 0 && <div className="kanban-empty">None</div>}
                  </section>
                )
              })}
            </div>
          ) : (
            <>
              {/* Grouped tabs similar to incidents list view */}
              <div className="pipeline-tabs" role="tablist" aria-label="Alerts tabs pipeline" style={{ marginBottom: 14 }}>
                {listTabs.map((p) => {
                  return (
                    <button
                      key={p.key}
                      role="tab"
                      aria-selected={activeTab === p.key}
                      className={`pipeline-tab${activeTab === p.key ? ' active' : ''}`}
                      onClick={() => setActiveTab(p.key)}
                    >
                      {p.label}
                      {p.count > 0 && <span className="tab-count mono">{p.count}</span>}
                    </button>
                  )
                })}
              </div>

              {filteredListAlerts.length === 0 ? (
                <div className="placeholder-panel">
                  Nothing in “{listTabs.find((p) => p.key === activeTab)?.label}” right now.
                </div>
              ) : (
                <div className="row-list">
                  {filteredListAlerts.map((a) => (
                    <Link key={a.id} to={`/command/alerts/${a.id}`} className="row incident-row">
                      <span className="row-id">{a.id}</span>
                      <SeverityBadge severity={a.severity} />
                      <span className="row-title" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                        {a.title}
                      </span>
                      <span className="mono service">{a.service}</span>
                      
                      {/* Seamless Integrated RCA/AI Outcome */}
                      {a.activity && (
                        <span className="alert-ai-inline in-progress">
                          <Sparkles size={11} strokeWidth={2.2} className="ai-icon" />
                          {a.activity}
                        </span>
                      )}
                      {a.aiOutcome && (
                        <span className="alert-ai-inline resolved">
                          <Sparkles size={11} strokeWidth={2.2} className="ai-icon" />
                          {a.aiOutcome}
                        </span>
                      )}

                      <TimeAgo timestamp={a.startedAt} />
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}
    </>
  )
}

function AlertCard({ alert }: { alert: Alert }) {
  return (
    <Link to={`/command/alerts/${alert.id}`} className="alert-card">
      <div className="alert-card-top">
        <span className="row-id">{alert.id}</span>
        <SeverityBadge severity={alert.severity} />
        <TimeAgo timestamp={alert.startedAt} />
      </div>
      <div className="alert-card-title">{alert.title}</div>
      <div className="alert-card-meta">
        <span className="mono service">{alert.service}</span>
      </div>

      {/* Seamless Integrated RCA/AI Insight Row */}
      {alert.activity && (
        <div className="alert-card-ai-row in-progress">
          <Sparkles size={11} strokeWidth={2.2} className="ai-icon" />
          <span>{alert.activity}</span>
        </div>
      )}
      {alert.aiOutcome && (
        <div className="alert-card-ai-row resolved">
          <Sparkles size={11} strokeWidth={2.2} className="ai-icon" />
          <span>{alert.aiOutcome}</span>
        </div>
      )}
    </Link>
  )
}

/* Unified high-density horizontal telemetry and health status banner */
function UnifiedTelemetryBanner({ board, loading }: { board: ReturnType<typeof getBoard>; loading: boolean }) {
  const m = board.metrics
  const { env } = useEnv()
  const cluster = primaryCluster(env.id)

  if (loading) {
    return (
      <div className="unified-telemetry-banner loading">
        <div className="banner-stats-section">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className="skeleton" style={{ width: 90, height: 16, borderRadius: 4 }} />
          ))}
        </div>
        <div className="banner-right-wrapper">
          <div className="banner-separator" />
          <div className="banner-health-section">
            {[0, 1, 2, 3, 4].map((i) => (
              <span key={i} className="skeleton" style={{ width: 70, height: 16, borderRadius: 4 }} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  const items = [
    {
      label: 'MTTD',
      value: m.mttd,
      delta: m.mttdDelta,
      status: m.mttdDelta.good ? 'good' : 'bad',
      desc: 'Mean Time To Detect anomalies in incoming server metrics.',
    },
    {
      label: 'MTTR',
      value: m.mttr,
      delta: m.mttrDelta,
      status: m.mttrDelta.good ? 'good' : 'bad',
      desc: 'Mean Time To Resolve triggered alerts back to a healthy state.',
    },
    {
      label: 'Noise ratio',
      value: m.noiseRatio,
      delta: m.noiseDelta,
      status: m.noiseDelta.good ? 'good' : 'bad',
      desc: 'Percentage of non-actionable alert notifications silenced.',
    },
    {
      label: 'Auto-resolved (30d)',
      value: '64%',
      delta: { value: '↑11%', good: true },
      status: 'good',
      desc: 'Proportion of alerts automatically verified & resolved by playbooks.',
    },
  ]

  return (
    <div className="unified-telemetry-banner">
      <div className="banner-stats-section">
        {items.map((it) => {
          const formattedDelta = it.delta.value
            .replace(' wk', '')
            .replace('−', '↓')
            .replace('+', '↑')
            .replace('↑', '↑')
            .replace('↓', '↓')
            .trim()

          return (
            <div key={it.label} className="banner-stat-item">
              <span className="banner-stat-label">{it.label}</span>
              <span className="banner-stat-value mono">{it.value}</span>
              <span className={`banner-stat-delta ${it.status}`}>
                {formattedDelta.startsWith('↑') || formattedDelta.startsWith('↓') ? '' : (it.status === 'good' ? '↓ ' : '↑ ')}
                {formattedDelta}
              </span>
              
              {/* Rich CSS Tooltip */}
              <div className="stat-tooltip">
                <div className="stat-tooltip-header">{it.desc.split(' ')[0]} telemetry</div>
                <div className="stat-tooltip-body">
                  <span className="stat-tooltip-value">{it.value}</span>
                  <span className={`stat-tooltip-delta ${it.status === 'good' ? 'good' : 'bad'}`}>
                    {it.delta.value}
                  </span>
                </div>
                <div className="stat-tooltip-desc">{it.desc}</div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="banner-right-wrapper">
        <div className="banner-separator" />
        <div className="banner-health-section">
          {board.tiles.map((t) => {
            const isCompute = t.id === 'compute' && cluster
            const content = (
              <>
                <span className={`unified-health-dot ${t.health}`} />
                <span>{t.name}</span>
              </>
            )
            
            if (isCompute) {
              return (
                <Link key={t.id} to={`/command/clusters/${cluster.id}`} className="health-dot-item interactive">
                  {content}
                </Link>
              )
            }
            return (
              <span key={t.id} className="health-dot-item">
                {content}
              </span>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function EmptyBoard({ envName }: { envName: string }) {
  return (
    <div className="placeholder-panel">
      <div className="empty-dot-wrap">
        <span className="dot healthy" />
      </div>
      All clear — no active alerts in {envName}.
      <span className="mono">Rtifact AI is watching 5 infra domains · last sweep 1m ago</span>
      <div style={{ marginTop: 14, display: 'flex', gap: 8, justifyContent: 'center' }}>
        <Link to="/automate/silences" className="btn btn-secondary">
          Review active silences
        </Link>
        <Link to="/command/telemetry/intelligence" className="btn btn-secondary">
          Watch live telemetry
        </Link>
      </div>
    </div>
  )
}

function ErrorPanel({ envName }: { envName: string }) {
  return (
    <div className="error-panel" role="alert">
      <WifiOff size={22} strokeWidth={2} className="error-icon" />
      <div className="error-title">Alert stream unavailable</div>
      <div className="error-sub">
        Lost connection to the {envName} alert stream. Data shown elsewhere may be stale.
      </div>
      <button className="btn btn-secondary" onClick={() => window.location.reload()}>
        <RefreshCw size={14} strokeWidth={2.2} />
        Retry connection
      </button>
    </div>
  )
}

function GoalsSkeleton() {
  return (
    <div className="goals">
      {[0, 1, 2].map((i) => (
        <div key={i} className="goal">
          <span className="skeleton skeleton-text" style={{ width: '60%' }} />
          <span className="skeleton skeleton-text" style={{ width: '40%' }} />
          <div className="goal-bar">
            <div className="skeleton" style={{ height: '100%', width: '100%' }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function BoardSkeleton() {
  const cols = [
    { key: 'new', title: 'New' },
    { key: 'in_progress', title: 'In Progress' },
    { key: 'resolved', title: 'Resolved' },
  ]
  return (
    <div className="kanban" aria-busy="true" aria-label="Loading alerts">
      {cols.map((c) => (
        <section key={c.key} className="kanban-col">
          <header className="kanban-head">
            <span className="kanban-title">{c.title}</span>
          </header>
          {[0, 1].map((i) => (
            <div key={i} className="alert-card skeleton-card">
              <span className="skeleton skeleton-text" style={{ width: '50%' }} />
              <span className="skeleton skeleton-text" style={{ width: '90%' }} />
              <span className="skeleton skeleton-text" style={{ width: '35%' }} />
            </div>
          ))}
        </section>
      ))}
    </div>
  )
}

function ListSkeleton() {
  return (
    <div className="row-list">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="row" style={{ pointerEvents: 'none', height: 44 }}>
          <span className="skeleton skeleton-text" style={{ width: '60%' }} />
        </div>
      ))}
    </div>
  )
}
