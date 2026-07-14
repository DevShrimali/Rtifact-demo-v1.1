import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LifeBuoy,
  LineChart,
  Radar,
  Settings,
  Workflow,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import { useEnv } from '../state/env'
import { usePersona } from '../state/persona'
import { RtifactLogo } from '../components/RtifactLogo'


interface SubItem {
  to: string
  label: string
  end?: boolean
  badge?: number
  badgeType?: 'red' | 'gray' | 'yellow'
}

interface GroupItem {
  label: string
  Icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>
  to?: string
  subItems?: SubItem[]
}

export function Sidebar({ collapsed }: { collapsed: boolean }) {
  const { env } = useEnv()
  const { persona } = usePersona()
  const location = useLocation()

  // State to manage group expansion, reading/saving to localStorage
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const stored = localStorage.getItem('rtifact.sidebar.expandedGroups')
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch (e) {}
    }
    return { Command: true, Review: true, Support: true }
  })

  const toggleGroup = (groupLabel: string) => {
    setExpanded((prev) => {
      const next = { ...prev, [groupLabel]: !prev[groupLabel] }
      localStorage.setItem('rtifact.sidebar.expandedGroups', JSON.stringify(next))
      return next
    })
  }

  const [modulesExpanded, setModulesExpanded] = useState(true)

  // Groups and items structure
  const groups: GroupItem[] = [
    {
      label: 'Command',
      Icon: Radar,
      to: '/command',
      subItems: [
        { to: '/command', label: 'Alerts', end: true, badge: env.criticalAlerts || 3, badgeType: 'red' },
        { to: '/command/incidents', label: 'Incidents', badge: 9, badgeType: 'gray' },
        { to: '/command/telemetry', label: 'Telemetry', badge: 3, badgeType: 'yellow' },
      ],
    },
    {
      label: 'Review',
      Icon: LineChart,
      to: '/review',
      subItems: [
        { to: '/review', label: 'Overview', end: true },
        { to: '/review/metrics', label: 'Reports' },
        { to: '/review/inventory', label: 'Inventory' },
      ],
    },
    {
      label: 'Automate',
      Icon: Workflow,
      to: '/automate',
    },
    {
      label: 'Support',
      Icon: LifeBuoy,
      to: '/support',
      subItems: [
        { to: '/support', label: 'Cases', end: true, badge: 5, badgeType: 'gray' },
        { to: '/support/status-pages', label: 'Status Pages' },
      ],
    },
  ]

  // Helper to check if a group is currently active
  const isGroupActive = (group: GroupItem) => {
    if (group.subItems) {
      return group.subItems.some((sub) => {
        if (sub.end) {
          return location.pathname === sub.to
        }
        return location.pathname.startsWith(sub.to)
      })
    }
    return group.to ? location.pathname.startsWith(group.to) : false
  }

  // Automatically expand active groups on route change
  useEffect(() => {
    const activeGroups: Record<string, boolean> = {}
    groups.forEach((group) => {
      if (isGroupActive(group)) {
        activeGroups[group.label] = true
      }
    })
    if (Object.keys(activeGroups).length > 0) {
      setExpanded((prev) => {
        const needsUpdate = Object.keys(activeGroups).some((key) => !prev[key])
        if (!needsUpdate) return prev
        const next = { ...prev, ...activeGroups }
        localStorage.setItem('rtifact.sidebar.expandedGroups', JSON.stringify(next))
        return next
      })
    }
  }, [location.pathname])

  return (
    <aside className="sidebar">
      <div className="wordmark">
        <RtifactLogo showText={!collapsed} height={20} />
      </div>

      <nav className="nav-section" aria-label="Modules">
        <div
          className="nav-label nav-text modules-header-toggle"
          onClick={() => setModulesExpanded(!modulesExpanded)}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', userSelect: 'none' }}
        >
          <span>Modules</span>
          <span className="modules-caret" style={{ fontSize: '8px', opacity: 0.6 }}>
            {modulesExpanded ? '▼' : '▶'}
          </span>
        </div>
        {modulesExpanded && groups.map((group) => {
          const hasSubs = !!group.subItems
          const isExpanded = expanded[group.label]

          return (
            <div key={group.label} className="sidebar-group-container" style={{ display: 'flex', flexDirection: 'column' }}>
              {hasSubs ? (
                <>
                  <NavLink
                    to={group.to!}
                    onClick={() => {
                      // Always expand the group when clicking the header link
                      setExpanded((prev) => {
                        const next = { ...prev, [group.label]: true }
                        localStorage.setItem('rtifact.sidebar.expandedGroups', JSON.stringify(next))
                        return next
                      })
                    }}
                    className={() => "nav-item nav-group-header"}
                    end={true}
                  >
                    <group.Icon size={17} className="nav-icon" strokeWidth={2} />
                    <span className="nav-text">{group.label}</span>
                    <span
                      className="nav-chevron nav-text"
                      style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        toggleGroup(group.label)
                      }}
                    >
                      {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </span>
                  </NavLink>
                  {!collapsed && (
                    <div className={`sidebar-sub-items${isExpanded ? ' expanded' : ''}`}>
                      {group.subItems!.map((sub) => (
                        <NavLink
                          key={sub.to}
                          to={sub.to}
                          end={sub.end}
                          className={({ isActive }) => `nav-item sub-item${isActive ? ' active' : ''}`}
                          tabIndex={isExpanded ? 0 : -1}
                        >
                          <span className="nav-text">{sub.label}</span>
                          {sub.badge !== undefined && (
                            <span className={`sub-badge ${sub.badgeType}`}>{sub.badge}</span>
                          )}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <NavLink
                  to={group.to!}
                  className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
                >
                  <group.Icon size={17} className="nav-icon" strokeWidth={2} />
                  <span className="nav-text">{group.label}</span>
                </NavLink>
              )}

              {/* Custom tooltip/popover when sidebar is collapsed */}
              {collapsed && (
                <div className={`sidebar-tooltip${!hasSubs ? ' simple' : ''}`}>
                  {!hasSubs ? (
                    <span>{group.label}</span>
                  ) : (
                    <>
                      <div className="tooltip-header">{group.label}</div>
                      <div className="tooltip-links">
                        {group.subItems!.map((sub) => (
                          <NavLink
                            key={sub.to}
                            to={sub.to}
                            end={sub.end}
                            className={({ isActive }) => `tooltip-link${isActive ? ' active' : ''}`}
                          >
                            <span>{sub.label}</span>
                            {sub.badge !== undefined && (
                              <span className={`sub-badge ${sub.badgeType}`}>{sub.badge}</span>
                            )}
                          </NavLink>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* Standalone Settings above profile */}
      <div className="sidebar-footer-actions">
        <div className="sidebar-group-container" style={{ display: 'flex', flexDirection: 'column' }}>
          <NavLink
            to="/settings"
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <Settings size={17} className="nav-icon" strokeWidth={2} />
            <span className="nav-text">Settings</span>
          </NavLink>
          {collapsed && (
            <div className="sidebar-tooltip simple">
              <span>Settings</span>
            </div>
          )}
        </div>
      </div>

      <NavLink
        to="/settings/profile"
        className="user-block"
        aria-label="Personal profile"
        title={collapsed ? `${persona.name} — profile` : undefined}
      >
        <span className="avatar">{persona.initials}</span>
        <span className="nav-text">
          <span className="user-name" style={{ display: 'block' }}>
            {persona.name}
          </span>
          <span className="user-role">{persona.role}</span>
        </span>
      </NavLink>
    </aside>
  )
}
