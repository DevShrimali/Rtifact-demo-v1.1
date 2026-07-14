import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useEnv } from '../state/env'

/* Shared loading affordance — every list surface skeletons briefly on
   entry and on env switch, so no screen pops in without a loading state. */
export function useEnvLoad(): boolean {
  const { env } = useEnv()
  const [searchParams] = useSearchParams()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const t = setTimeout(() => setLoading(false), 550)
    return () => clearTimeout(t)
  }, [env.id])

  if (searchParams.get('state') === 'loading') {
    return true
  }
  return loading
}

export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="row-list" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="row" style={{ pointerEvents: 'none' }}>
          <span className="skeleton skeleton-text" style={{ width: `${58 + ((i * 13) % 30)}%` }} />
        </div>
      ))}
    </div>
  )
}
