import { NavLink } from 'react-router-dom'
import { executions } from '../../mock/automateExtras'

const ITEMS = [
  { to: '/automate', label: 'Workflows', end: true },
  { to: '/automate/playbooks', label: 'Playbooks', end: false },
  { to: '/automate/silences', label: 'Silences', end: false },
  { to: '/automate/templates', label: 'Templates', end: false },
  { to: '/automate/executions', label: 'Executions', end: false, badge: executions.length },
  { to: '/automate/audit', label: 'Audit Log', end: false },
]

export function AutomateSubnav() {
  return (
    <nav className="subnav" aria-label="Automate sections">
      {ITEMS.map((i) => (
        <NavLink
          key={i.to}
          to={i.to}
          end={i.end}
          className={({ isActive }) => `subnav-item${isActive ? ' active' : ''}`}
        >
          {i.label}
          {i.badge !== undefined && (
            <span className="nav-badge mono" style={{ marginLeft: 6 }}>
              {i.badge}
            </span>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
