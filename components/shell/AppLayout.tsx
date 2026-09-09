'use client'

import { ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { ControlsPanel } from '../controls/ControlsPanel'

interface AppLayoutProps {
  children: ReactNode
  topBarTitle?: string
  showTopBarSearch?: boolean
}

export function AppLayout({ children, topBarTitle, showTopBarSearch = true }: AppLayoutProps) {
  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        overflow: 'hidden',
        background: 'var(--bg-canvas)',
      }}
    >
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <TopBar title={topBarTitle} showSearch={showTopBarSearch} />
        <main
          style={{
            flex: 1,
            overflow: 'auto',
            background: 'var(--bg-canvas)',
          }}
        >
          {children}
        </main>
      </div>
      <ControlsPanel />
    </div>
  )
}
