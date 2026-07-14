import { Outlet } from 'react-router-dom'
import { useEnv } from '../../state/env'

export function ReviewLayout() {
  const { selectedEnvs, aggregating } = useEnv()

  const scope = aggregating ? `${selectedEnvs.length} environments` : selectedEnvs[0]?.name || 'default'

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">Review</div>
          <h1 className="page-title">Report</h1>
          <p className="page-sub">
            {scope} · <span className="time-ref">updated 1h ago</span>
          </p>
        </div>
      </div>

      <Outlet />
    </>
  )
}
