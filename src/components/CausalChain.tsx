import { ArrowRight } from 'lucide-react'
import type { ChainNode } from '../mock/daav'
import { ConfidencePill } from './Confidence'

/* Shared component: Causal Chain visualization (Alert detail Assess +
   Incident detail). Cause → Effect → Impact node primitive. */
export function CausalChain({ nodes }: { nodes: ChainNode[] }) {
  return (
    <div className="chain" role="list" aria-label="Causal chain">
      {nodes.map((n, i) => (
        <div key={n.title} style={{ display: 'contents' }}>
          <div className={`chain-node ${n.kind}`} role="listitem">
            <span className="chain-kind">{n.kind}</span>
            <span className="chain-title">{n.title}</span>
            <span className="chain-sub">{n.sub}</span>
            <ConfidencePill value={n.confidence} />
          </div>
          {i < nodes.length - 1 && (
            <ArrowRight size={15} strokeWidth={2} className="chain-arrow" aria-hidden />
          )}
        </div>
      ))}
    </div>
  )
}
