import { NavLink } from 'react-router-dom'

/* Module-level sub-nav for Command surfaces. NOT part of the 5-item global
   nav — it lives in the canvas, below the module header. */
const ITEMS = [
  { to: '/command', label: 'Alerts', end: true },
  { to: '/command/incidents', label: 'Incidents', end: false },
  { to: '/command/telemetry', label: 'Telemetry', end: false },
]

export function CommandSubnav() {
  return (
    <nav className="subnav" aria-label="Command sections">
      {ITEMS.map((i) => (
        <NavLink
          key={i.to}
          to={i.to}
          end={i.end}
          className={({ isActive }) => `subnav-item${isActive ? ' active' : ''}`}
        >
          {i.label}
        </NavLink>
      ))}
    </nav>
  )
}
