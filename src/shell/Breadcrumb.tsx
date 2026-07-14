import { Link, useMatches } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

export interface CrumbHandle {
  crumb: (data: unknown, params: Record<string, string | undefined>) => string
}

/* Breadcrumb is derived from the route tree (`handle.crumb` on each route),
   so every routed page gets one for free — deeplink-first by design. */
export function Breadcrumb() {
  const matches = useMatches()
  const crumbs = matches
    .filter((m) => (m.handle as CrumbHandle | undefined)?.crumb)
    .map((m) => ({
      id: m.id,
      path: m.pathname,
      label: (m.handle as CrumbHandle).crumb(m.data, m.params as Record<string, string | undefined>),
    }))

  return (
    <nav className="crumbs" aria-label="Breadcrumb">
      {crumbs.map((c, i) => {
        const isLast = i === crumbs.length - 1
        return (
          <span key={c.id} style={{ display: 'contents' }}>
            {isLast ? (
              <span className="crumb current" aria-current="page">
                {c.label}
              </span>
            ) : (
              <Link to={c.path} className="crumb">
                {c.label}
              </Link>
            )}
            {!isLast && <ChevronRight size={13} className="crumb-sep" strokeWidth={2} />}
          </span>
        )
      })}
    </nav>
  )
}
