import { NavLink, Outlet } from 'react-router-dom'
import { executions } from '../../mock/automateExtras'

interface GroupItem {
  to: string
  label: string
  end?: boolean
  badge?: boolean
}

interface Group {
  label: string
  items: GroupItem[]
}

const GROUPS: Group[] = [
  {
    label: 'Configure',
    items: [
      { to: '/automate', label: 'Workflows', end: true },
      { to: '/automate/playbooks', label: 'Playbooks' },
      { to: '/automate/silences', label: 'Silences' },
      { to: '/automate/templates', label: 'Templates' },
    ],
  },
  {
    label: 'Activity',
    items: [
      { to: '/automate/executions', label: 'Executions', badge: true },
      { to: '/automate/audit', label: 'Audit Log' },
    ],
  },
]

export function AutomateLayout() {
  const badgeCount = executions.length

  return (
    <div className="settings-shell">
      <aside className="settings-rail" aria-label="Automate sections">
        {GROUPS.map((g) => (
          <div key={g.label} className="settings-group">
            <div className="settings-group-label">{g.label}</div>
            {g.items.map((it) => (
              <NavLink
                key={it.to}
                to={it.to}
                end={it.end}
                className={({ isActive }) => `settings-rail-item${isActive ? ' active' : ''}`}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}
              >
                <span>{it.label}</span>
                {it.badge && badgeCount > 0 && (
                  <span className="nav-badge mono" style={{ fontSize: 10, padding: '1px 6px', background: 'var(--border-strong)', borderRadius: 4, color: 'var(--text-secondary)' }}>
                    {badgeCount}
                  </span>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </aside>
      <div className="settings-content">
        <Outlet />
      </div>
    </div>
  )
}
