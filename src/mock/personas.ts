/* Personas for the stakeholder demo switcher (DEV-28). Switching swaps the
   app's identity context and default landing surface. Data differences start
   minimal — identity + a contextual default — and can deepen later. */

export interface Persona {
  id: string
  name: string
  role: string
  initials: string
  email: string
  /* where this persona lands / what they care about most */
  home: string
  focus: string
}

export const personas: Persona[] = [
  {
    id: 'priya',
    name: 'Priya Sharma',
    role: 'SRE Lead',
    initials: 'PS',
    email: 'priya@acme.com',
    home: '/command',
    focus: 'Detect → Assess → Act → Validate. Command is her all-day surface.',
  },
  {
    id: 'raj',
    name: 'Raj Patel',
    role: 'VP Engineering',
    initials: 'RP',
    email: 'raj@acme.com',
    home: '/review',
    focus: 'Cost / Time / Risk. Enters via the weekly Review digest.',
  },
  {
    id: 'arjun',
    name: 'Arjun Mehta',
    role: 'Junior Engineer',
    initials: 'AM',
    email: 'arjun@acme.com',
    home: '/command/incidents',
    focus: 'On-call learner — leans on ranked playbooks and runbooks.',
  },
  {
    id: 'sarah',
    name: 'Sarah Lin',
    role: 'Support Liaison',
    initials: 'SL',
    email: 'sarah@acme.com',
    home: '/support',
    focus: 'Customer-facing — cases queue and public status pages.',
  },
]

export const defaultPersonaId = 'priya'
