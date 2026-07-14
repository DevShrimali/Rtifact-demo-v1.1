import { useEffect, useState } from 'react'
import { Breadcrumb } from './Breadcrumb'
import { EnvSelector } from './EnvSelector'
import { PersonaSwitcher } from './PersonaSwitcher'
import { AskAIButton } from '../components/AskAI'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'

function useUtcClock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  return now.toISOString().slice(11, 19) + ' UTC'
}

export function Topbar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const clock = useUtcClock()

  return (
    <header className="topbar">
      <button
        className="sb-toggle"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        aria-expanded={!collapsed}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        onClick={onToggle}
      >
        {collapsed ? (
          <PanelLeftOpen size={15} strokeWidth={2} />
        ) : (
          <PanelLeftClose size={15} strokeWidth={2} />
        )}
      </button>
      <Breadcrumb />
      <div className="topbar-right">
        {/* Global multi-select environment selector (DEV-27) */}
        <EnvSelector />
        <span className="clock">{clock}</span>
        {/* Theme control moved to Settings › Appearance (DEV-27) */}
        <AskAIButton />
        <PersonaSwitcher />
      </div>
    </header>
  )
}
