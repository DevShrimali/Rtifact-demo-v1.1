import { createContext, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { defaultPersonaId, personas } from '../mock/personas'
import type { Persona } from '../mock/personas'

interface PersonaContextValue {
  persona: Persona
  personas: Persona[]
  setPersona: (id: string) => void
}

const PersonaContext = createContext<PersonaContextValue | null>(null)

const STORAGE_KEY = 'rtifact.persona'

export function PersonaProvider({ children }: { children: ReactNode }) {
  const [id, setId] = useState<string>(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    return personas.some((p) => p.id === stored) ? stored! : defaultPersonaId
  })

  const value = useMemo<PersonaContextValue>(() => {
    const persona = personas.find((p) => p.id === id) ?? personas[0]
    return {
      persona,
      personas,
      setPersona: (next: string) => {
        localStorage.setItem(STORAGE_KEY, next)
        setId(next)
      },
    }
  }, [id])

  return <PersonaContext.Provider value={value}>{children}</PersonaContext.Provider>
}

export function usePersona(): PersonaContextValue {
  const ctx = useContext(PersonaContext)
  if (!ctx) throw new Error('usePersona must be used inside <PersonaProvider>')
  return ctx
}
