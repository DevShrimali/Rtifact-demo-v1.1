import { ArrowDown, ArrowUp } from 'lucide-react'

export interface BeforeNowRow {
  service: string
  metric: string
  before: string
  now: string
  worse: boolean
}

/* Shared before/now comparison table — Incident detail (Screen 07) and the
   DAAV Assess state (DEV-10). */
export function BeforeNowTable({ rows }: { rows: BeforeNowRow[] }) {
  return (
    <table className="bn-table">
      <thead>
        <tr>
          <th>Service</th>
          <th>Metric</th>
          <th className="num">Before</th>
          <th className="num">Now</th>
          <th className="num">Delta</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={`${r.service}-${r.metric}`}>
            <td className="mono svc">{r.service}</td>
            <td>{r.metric}</td>
            <td className="num mono">{r.before}</td>
            <td className="num mono">{r.now}</td>
            <td className="num">
              <span className={`bn-delta ${r.worse ? 'worse' : 'better'}`}>
                {r.worse ? <ArrowUp size={11} strokeWidth={2.4} /> : <ArrowDown size={11} strokeWidth={2.4} />}
                {r.worse ? 'degraded' : 'stable'}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
