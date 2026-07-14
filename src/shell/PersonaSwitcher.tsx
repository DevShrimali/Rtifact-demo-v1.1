import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, ChevronDown, LogOut, Settings, UserCog } from 'lucide-react'
import { usePersona } from '../state/persona'

/* Persona switcher + profile menu (DEV-28). Lets a stakeholder view the app
   as any persona without a rebuild, and carries the profile / logout entry.
   Switching swaps the identity context and lands on that persona's home —
   no full reload. */
export function PersonaSwitcher() {
  const { persona, personas, setPersona } = usePersona()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const pick = (id: string, home: string) => {
    setPersona(id)
    setOpen(false)
    navigate(home) // client-side route change — no reload
  }

  return (
    <div className="persona" ref={rootRef}>
      <button
        className="persona-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Viewing as ${persona.name}. Switch persona or open profile.`}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="avatar">{persona.initials}</span>
        <ChevronDown size={13} className="env-caret" strokeWidth={2.2} />
      </button>

      {open && (
        <div className="persona-pop" role="menu" aria-label="Persona and profile">
          <div className="persona-current">
            <span className="avatar" style={{ width: 34, height: 34, fontSize: 12 }}>
              {persona.initials}
            </span>
            <span className="persona-cur-meta">
              <span className="persona-cur-name">{persona.name}</span>
              <span className="persona-cur-role">{persona.role}</span>
            </span>
          </div>

          <div className="persona-section-label">View as persona</div>
          {personas.map((p) => {
            const active = p.id === persona.id
            return (
              <button
                key={p.id}
                className={`persona-opt${active ? ' active' : ''}`}
                role="menuitemradio"
                aria-checked={active}
                onClick={() => pick(p.id, p.home)}
              >
                <span className="avatar" style={{ width: 26, height: 26, fontSize: 10 }}>
                  {p.initials}
                </span>
                <span className="persona-opt-meta">
                  <span className="persona-opt-name">{p.name}</span>
                  <span className="persona-opt-role">{p.role}</span>
                </span>
                {active && <Check size={14} strokeWidth={2.4} className="persona-check" />}
              </button>
            )
          })}

          <div className="persona-divider" />

          <button
            className="persona-action"
            role="menuitem"
            onClick={() => {
              setOpen(false)
              navigate('/settings/profile')
            }}
          >
            <UserCog size={15} strokeWidth={2} />
            Personal profile
          </button>
          <button
            className="persona-action"
            role="menuitem"
            onClick={() => {
              setOpen(false)
              navigate('/settings')
            }}
          >
            <Settings size={15} strokeWidth={2} />
            Settings
          </button>
          <button
            className="persona-action danger"
            role="menuitem"
            onClick={() => {
              setOpen(false)
              navigate('/login')
            }}
          >
            <LogOut size={15} strokeWidth={2} />
            Log out
          </button>
        </div>
      )}
    </div>
  )
}
