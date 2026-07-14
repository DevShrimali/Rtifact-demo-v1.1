import { createContext, useContext, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { Boxes, Box, Bell, Flame, LineChart, FileText, Layers, Send, Sparkles, X, Plus } from 'lucide-react'
import { useEnv } from '../state/env'
import { getAskAIContext } from '../mock/askai'
import type { AskAIContext } from '../mock/askai'
import { ConfidencePill } from './Confidence'

/* ---------- open/close state, shared via context ---------- */

const AskAIStateContext = createContext<{ open: boolean; setOpen: (o: boolean) => void } | null>(null)

export function AskAIProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <AskAIStateContext.Provider value={{ open, setOpen }}>{children}</AskAIStateContext.Provider>
  )
}

export function useAskAI() {
  const ctx = useContext(AskAIStateContext)
  if (!ctx) throw new Error('useAskAI must be used inside <AskAIProvider>')
  return ctx
}

/* ---------- topbar trigger — present on every surface ---------- */

export function AskAIButton() {
  const { open, setOpen } = useAskAI()
  return (
    <button
      className={`askai-btn${open ? ' active' : ''}`}
      onClick={() => setOpen(!open)}
      aria-expanded={open}
      aria-controls="askai-panel"
    >
      {/* Flat, monochrome — no gradient tile (DEV-27). Sparkle icon at 16px,
         Lucide outline per iconography spec. */}
      <Sparkles size={16} strokeWidth={2.1} className="askai-btn-icon" />
      Ask AI
    </button>
  )
}

/* ---------- the panel (Screen 66) ---------- */

const REF_ICONS = {
  env: Layers,
  alert: Bell,
  incident: Flame,
  cluster: Boxes,
  pod: Box,
  metric: LineChart,
  logs: FileText,
  view: Layers,
} as const

interface Message {
  role: 'user' | 'ai'
  text: string
  confidence?: number
  sources?: string[]
}

/* Fixed 360px side panel (DEV-16 resolution); full-width bottom sheet under
   900px. No backdrop, no focus trap — the page stays interactive (not a
   modal). One component, every surface; only context differs. */
const MIN_W = 320
const MAX_W = 620

export function AskAIPanel() {
  const { open, setOpen } = useAskAI()
  const location = useLocation()
  const { env } = useEnv()
  const [messages, setMessages] = useState<Message[]>([])
  const [thinking, setThinking] = useState(false)
  const [draft, setDraft] = useState('')
  const bodyRef = useRef<HTMLDivElement>(null)
  const ctx: AskAIContext = getAskAIContext(location.pathname, env.name)

  const [references, setReferences] = useState<AskAIContext['references']>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [newKind, setNewKind] = useState<'env' | 'alert' | 'incident' | 'cluster' | 'pod' | 'metric' | 'logs' | 'view'>('env')
  const [newLabel, setNewLabel] = useState('')

  /* DEV-16: panel is resizable on desktop (clamped + persisted); the mobile
     bottom sheet ignores this via the media query. */
  const [width, setWidth] = useState<number>(() => {
    const stored = Number(localStorage.getItem('rtifact.askai.w'))
    return stored >= MIN_W && stored <= MAX_W ? stored : 360
  })
  const dragging = useRef(false)

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!dragging.current) return
      setWidth(Math.min(MAX_W, Math.max(MIN_W, window.innerWidth - e.clientX)))
    }
    const onUp = () => {
      if (!dragging.current) return
      dragging.current = false
      document.body.style.userSelect = ''
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('rtifact.askai.w', String(width))
  }, [width])

  /* context switch (new surface) resets the conversation and references */
  useEffect(() => {
    setMessages([])
    setThinking(false)
    setReferences(ctx.references)
    setShowAddForm(false)
  }, [ctx.surface, env.name])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, setOpen])

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight })
  }, [messages, thinking])

  const ask = (q: string) => {
    if (!q.trim() || thinking) return
    setMessages((m) => [...m, { role: 'user', text: q }])
    setDraft('')
    setThinking(true)
    setTimeout(() => {
      setThinking(false)
      
      // Adapt response contextually
      const currentSources = references.map(r => `${r.kind.toUpperCase()} · ${r.label}`)
      let answerText = ctx.answer.text
      if (references.length === 0) {
        answerText = "I don't have any active context references. Please add context using the controls above to analyze specific telemetry, incidents, or resource metrics."
      } else {
        const refNames = references.map(r => r.label).join(', ')
        answerText = `${ctx.answer.text} (Correlated dynamically using: ${refNames}).`
      }

      setMessages((m) => [
        ...m,
        { 
          role: 'ai', 
          text: answerText, 
          confidence: references.length > 0 ? Math.min(99, ctx.answer.confidence + (references.length - ctx.references.length) * 2) : 45, 
          sources: currentSources 
        },
      ])
    }, 1100)
  }

  const handleAddReference = () => {
    if (!newLabel.trim()) return
    if (!references.some(r => r.kind === newKind && r.label.toLowerCase() === newLabel.trim().toLowerCase())) {
      setReferences(prev => [...prev, { kind: newKind, label: newLabel.trim() }])
    }
    setNewLabel('')
    setShowAddForm(false)
  }

  if (!open) return null

  return (
    <aside
      id="askai-panel"
      className="askai-panel"
      aria-label="Ask Rtifact AI"
      style={{ ['--askai-w' as string]: `${width}px` }}
    >
      <div
        className="askai-resize"
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize panel"
        title="Drag to resize"
        onPointerDown={(e) => {
          e.preventDefault()
          dragging.current = true
          document.body.style.userSelect = 'none'
        }}
      />
      <header className="askai-head">
        <span className="ai-tile">
          <Sparkles size={15} strokeWidth={2} />
        </span>
        <span className="askai-title">
          Ask Rtifact AI
          <span className="askai-surface">{ctx.surface}</span>
        </span>
        <button className="askai-close" onClick={() => setOpen(false)} aria-label="Close Ask AI">
          <X size={16} strokeWidth={2.2} />
        </button>
      </header>

      {/* reference-attaching mechanism with remove and add options */}
      <div className="askai-refs" aria-label="In context">
        <span className="askai-refs-label">In context</span>
        {references.map((r) => {
          const Icon = REF_ICONS[r.kind]
          return (
            <span key={`${r.kind}-${r.label}`} className="askai-ref mono">
              <Icon size={11} strokeWidth={2.2} />
              {r.label}
              <button
                type="button"
                className="askai-ref-remove"
                onClick={() => setReferences(prev => prev.filter(item => item.label !== r.label || item.kind !== r.kind))}
                aria-label={`Remove ${r.label}`}
              >
                <X size={10} strokeWidth={2.5} />
              </button>
            </span>
          )
        })}

        {showAddForm ? (
          <div className="askai-add-ref-form">
            <select
              value={newKind}
              onChange={(e) => setNewKind(e.target.value as any)}
              className="askai-add-ref-select"
            >
              <option value="env">Env</option>
              <option value="alert">Alert</option>
              <option value="incident">Incident</option>
              <option value="cluster">Cluster</option>
              <option value="pod">Pod</option>
              <option value="metric">Metric</option>
              <option value="logs">Logs</option>
              <option value="view">View</option>
            </select>
            <input
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="Context label..."
              className="askai-add-ref-input"
              list="askai-ref-suggestions"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddReference()
                } else if (e.key === 'Escape') {
                  setShowAddForm(false)
                }
              }}
            />
            <datalist id="askai-ref-suggestions">
              <option value="cpu-utilization-series" />
              <option value="memory-leak-check" />
              <option value="p99-latency-metrics" />
              <option value="postgres-active-conns" />
              <option value="last-500-error-logs" />
              <option value="correlated-traces" />
              <option value="k8s-pod-events" />
              <option value="network-ingress-egress" />
              <option value="load-balancer-spikes" />
            </datalist>
            <button
              type="button"
              className="askai-add-ref-submit"
              onClick={handleAddReference}
              disabled={!newLabel.trim()}
            >
              Add
            </button>
            <button
              type="button"
              className="askai-add-ref-cancel"
              onClick={() => setShowAddForm(false)}
              aria-label="Cancel adding context"
            >
              <X size={10} strokeWidth={2.5} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="askai-add-ref-btn"
            onClick={() => {
              setShowAddForm(true)
              setNewLabel('')
            }}
          >
            <Plus size={11} strokeWidth={2.2} />
            Add context
          </button>
        )}
      </div>

      <div className="askai-body" ref={bodyRef}>
        {messages.length === 0 && !thinking && (
          <>
            <div className="askai-hint">Suggested for this surface</div>
            {ctx.suggestions.map((s) => (
              <button key={s} className="askai-suggestion" onClick={() => ask(s)}>
                {s}
              </button>
            ))}
          </>
        )}

        {messages.map((m, i) =>
          m.role === 'user' ? (
            <div key={i} className="askai-msg user">
              {m.text}
            </div>
          ) : (
            <div key={i} className="askai-msg ai">
              <p>{m.text}</p>
              {m.confidence !== undefined && <ConfidencePill value={m.confidence} />}
              {m.sources && m.sources.length > 0 && (
                <div className="askai-sources">
                  {m.sources.map((s) => (
                    <span key={s} className="askai-source mono">
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ),
        )}

        {thinking && (
          <div className="askai-msg ai thinking" aria-label="Rtifact AI is thinking">
            <span className="think-dot" />
            <span className="think-dot" />
            <span className="think-dot" />
          </div>
        )}
      </div>

      <form
        className="askai-input"
        onSubmit={(e) => {
          e.preventDefault()
          ask(draft)
        }}
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={`Ask about ${ctx.surface.toLowerCase()}…`}
          aria-label="Ask Rtifact AI"
        />
        <button type="submit" className="askai-send" disabled={!draft.trim() || thinking} aria-label="Send">
          <Send size={14} strokeWidth={2.2} />
        </button>
      </form>
    </aside>
  )
}
