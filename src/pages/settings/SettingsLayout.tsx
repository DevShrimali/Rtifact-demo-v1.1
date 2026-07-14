import { NavLink, Outlet } from 'react-router-dom'

/* Settings regrouped into category groups (DEV-31) — replaces the flat 11-tab
   list Karan flagged as friction. Root → group → screen keeps the 3-tier rule:
   groups are Secondary (visible in the rail), screens are Tertiary. */
const GROUPS = [
  {
    label: 'AI & Automation',
    items: [
      { to: '/settings', label: 'Agent Ontology', end: true },
      { to: '/settings/investigation', label: 'Investigation Policies' },
      { to: '/settings/confidence', label: 'Confidence Policies' },
      { to: '/settings/automation', label: 'Automation Policies' },
      { to: '/settings/impact', label: 'Impact Policy' },
      { to: '/settings/recovery', label: 'Recovery Validation' },
      { to: '/settings/knowledge', label: 'Operational Knowledge' },
    ],
  },
  {
    label: 'Access',
    items: [
      { to: '/settings/users', label: 'Users & Roles' },
      { to: '/settings/fields', label: 'Custom Fields' },
    ],
  },
  {
    label: 'Connections',
    items: [{ to: '/settings/connections', label: 'Cloud & Monitoring' }],
  },
  {
    label: 'Organization',
    items: [
      { to: '/settings/organization', label: 'Organization' },
      { to: '/settings/theming', label: 'Theming' },
      { to: '/settings/profile', label: 'Personal Profile' },
    ],
  },
]

export function SettingsLayout() {
  return (
    <div className="settings-shell">
      <aside className="settings-rail" aria-label="Settings sections">
        {GROUPS.map((g) => (
          <div key={g.label} className="settings-group">
            <div className="settings-group-label">{g.label}</div>
            {g.items.map((it) => (
              <NavLink
                key={it.to}
                to={it.to}
                end={it.end}
                className={({ isActive }) => `settings-rail-item${isActive ? ' active' : ''}`}
              >
                {it.label}
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
