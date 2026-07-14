import type { OptimizationGoal } from '../mock/alerts'

/* Shared scorecard (inventory component list): current value + target +
   progress bar. Used on the Alerts board; reused by Review (DEV-11). */
export function OptimizationGoals({ goals }: { goals: OptimizationGoal[] }) {
  return (
    <div className="goals">
      {goals.map((g) => (
        <div key={g.id} className="goal">
          <div className="goal-top">
            <span className="goal-label">{g.label}</span>
            <span className={`goal-status ${g.onTrack ? 'ok' : 'behind'}`}>
              {g.onTrack ? 'On track' : 'Behind'}
            </span>
          </div>
          <div className="goal-nums mono">
            <span className="goal-current">{g.current}</span>
            <span className="goal-target">target {g.target}</span>
          </div>
          <div
            className="goal-bar"
            role="progressbar"
            aria-valuenow={g.pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={g.label}
          >
            <div
              className={`goal-fill ${g.onTrack ? 'ok' : 'behind'}`}
              style={{ width: `${g.pct}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
