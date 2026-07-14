import { Check } from 'lucide-react'
import { DAAV_ORDER } from '../mock/daav'
import type { DaavState } from '../mock/daav'

const LABELS: Record<DaavState, { title: string; question: string }> = {
  detect: { title: 'Detect', question: 'What happened?' },
  assess: { title: 'Assess', question: 'Why?' },
  act: { title: 'Act', question: 'How to fix?' },
  validate: { title: 'Validate', question: 'Did it recover?' },
}

/* Shared component: DAAV progress indicator (Alert detail + Incident detail).
   4 states on ONE screen — this bar is the only state switcher; URL never
   changes (principle #5). */
export function DaavProgress({
  viewing,
  unlocked,
  onSelect,
}: {
  viewing: DaavState
  unlocked: DaavState
  onSelect: (s: DaavState) => void
}) {
  const unlockedIdx = DAAV_ORDER.indexOf(unlocked)

  return (
    <div className="daav" role="tablist" aria-label="Investigation state">
      {DAAV_ORDER.map((s, i) => {
        const reachable = i <= unlockedIdx
        const isViewing = s === viewing
        const isDone = i < unlockedIdx
        return (
          <button
            key={s}
            role="tab"
            aria-selected={isViewing}
            disabled={!reachable}
            className={`daav-step${isViewing ? ' viewing' : ''}${isDone ? ' done' : ''}${
              !reachable ? ' locked' : ''
            }`}
            onClick={() => reachable && onSelect(s)}
          >
            <span className="daav-dot">
              {isDone ? <Check size={11} strokeWidth={2.6} /> : <span className="daav-num mono">{i + 1}</span>}
            </span>
            <span className="daav-text">
              <span className="daav-title">{LABELS[s].title}</span>
              <span className="daav-q">{LABELS[s].question}</span>
            </span>
            {i < DAAV_ORDER.length - 1 && <span className="daav-connector" aria-hidden />}
          </button>
        )
      })}
    </div>
  )
}
