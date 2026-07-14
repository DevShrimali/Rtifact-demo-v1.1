import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

/* Mini SVG icons — no lucide dep needed for two simple shapes */
function IconMonitor() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  )
}

function IconChevronRight() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}

export function ScreenStateWidget() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeState = searchParams.get('state') || 'default'

  /* ── minimised state — persisted ── */
  const [minimised, setMinimised] = useState(() =>
    localStorage.getItem('rtifact.screenstate.min') !== '0'
  )

  const toggleMinimise = () => {
    setMinimised((m) => {
      const next = !m
      localStorage.setItem('rtifact.screenstate.min', next ? '1' : '0')
      return next
    })
  }

  /* ── position — persisted ── */
  const [position, setPosition] = useState(() => {
    const saved = localStorage.getItem('rtifact.screenstate.pos')
    if (saved) {
      try { return JSON.parse(saved) } catch { /* ignore */ }
    }
    return { x: window.innerWidth / 2 - 180, y: window.innerHeight - 80 }
  })

  const isDragging = useRef(false)
  const dragStart = useRef({ x: 0, y: 0 })
  const widgetStart = useRef({ x: 0, y: 0 })
  const widgetRef = useRef<HTMLDivElement>(null)

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return
    if ((e.target as HTMLElement).closest('button')) return
    isDragging.current = true
    dragStart.current = { x: e.clientX, y: e.clientY }
    widgetStart.current = { ...position }
    document.body.style.userSelect = 'none'
    widgetRef.current?.classList.add('dragging')
  }

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!isDragging.current) return
      const dx = e.clientX - dragStart.current.x
      const dy = e.clientY - dragStart.current.y
      const newX = widgetStart.current.x + dx
      const newY = widgetStart.current.y + dy
      const maxX = window.innerWidth - (widgetRef.current?.offsetWidth || 360) - 20
      const maxY = window.innerHeight - (widgetRef.current?.offsetHeight || 50) - 20
      setPosition({
        x: Math.max(20, Math.min(maxX, newX)),
        y: Math.max(20, Math.min(maxY, newY)),
      })
    }

    const handlePointerUp = () => {
      if (isDragging.current) {
        isDragging.current = false
        document.body.style.userSelect = ''
        widgetRef.current?.classList.remove('dragging')
        localStorage.setItem('rtifact.screenstate.pos', JSON.stringify(position))
      }
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }
  }, [position])

  const handleStateChange = (state: string) => {
    const newParams = new URLSearchParams(searchParams)
    if (state === 'default') {
      newParams.delete('state')
    } else {
      newParams.set('state', state)
    }
    setSearchParams(newParams)
  }

  const getMappedState = () => {
    if (activeState === 'loading') return 'loading'
    if (activeState === 'empty') return 'empty'
    if (activeState === 'error' || activeState === 'unknown') return 'error'
    return 'default'
  }

  const mapped = getMappedState()

  /* ── Minimised pill — just the monitor icon with active-state dot ── */
  if (minimised) {
    return (
      <div
        ref={widgetRef}
        className="screen-state-widget screen-state-widget--min"
        style={{ position: 'fixed', left: `${position.x}px`, top: `${position.y}px`, zIndex: 9999 }}
        onPointerDown={handlePointerDown}
        title="Expand screen state widget"
      >
        <button
          className="ssw-min-btn"
          onClick={toggleMinimise}
          aria-label="Expand screen state widget"
        >
          <IconMonitor />
          {mapped !== 'default' && <span className={`ssw-dot ssw-dot--${mapped}`} />}
          <IconChevronRight />
        </button>
      </div>
    )
  }

  /* ── Full widget ── */
  return (
    <div
      ref={widgetRef}
      className="screen-state-widget"
      style={{ position: 'fixed', left: `${position.x}px`, top: `${position.y}px`, zIndex: 9999 }}
      onPointerDown={handlePointerDown}
    >
      <span className="widget-label">SCREEN STATE</span>
      <div className="widget-btns">
        <button className={mapped === 'default' ? 'active' : ''} onClick={() => handleStateChange('default')}>Default</button>
        <button className={mapped === 'loading' ? 'active' : ''} onClick={() => handleStateChange('loading')}>Loading</button>
        <button className={mapped === 'empty'   ? 'active' : ''} onClick={() => handleStateChange('empty')}>Empty</button>
        <button className={mapped === 'error'   ? 'active' : ''} onClick={() => handleStateChange('error')}>Unknown</button>
      </div>
      {/* Minimise button */}
      <button
        className="ssw-minimise"
        onClick={toggleMinimise}
        aria-label="Minimise screen state widget"
        title="Minimise"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
    </div>
  )
}
