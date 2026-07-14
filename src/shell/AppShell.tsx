import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { AskAIPanel, AskAIProvider } from '../components/AskAI'
import { ScreenStateWidget } from '../components/ScreenStateWidget'

export function AppShell() {
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem('rtifact.sidebar.collapsed') === '1',
  )

  const toggleSidebar = () =>
    setCollapsed((c) => {
      localStorage.setItem('rtifact.sidebar.collapsed', c ? '0' : '1')
      return !c
    })

  return (
    <AskAIProvider>
      <div className={`shell${collapsed ? ' sb-collapsed' : ''}`}>
        <Sidebar collapsed={collapsed} />
        <div className="main">
          <Topbar collapsed={collapsed} onToggle={toggleSidebar} />
          {/* keyed by pathname → rt-fade plays on every route change (no silent jumps) */}
          <main className="canvas" key={location.pathname}>
            <Outlet />
          </main>
        </div>
        <AskAIPanel />
        <ScreenStateWidget />
      </div>
    </AskAIProvider>
  )
}
