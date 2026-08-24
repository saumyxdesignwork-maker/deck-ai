'use client'

import { ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { ControlsPanel } from '../controls/ControlsPanel'
import { useTheme } from '../controls/ThemeProvider'

interface AppLayoutProps {
  children: ReactNode
  topBarTitle?: string
  showTopBarSearch?: boolean
}

export function AppLayout({ children, topBarTitle, showTopBarSearch = true }: AppLayoutProps) {
  const { vl } = useTheme()
  const isVL3 = vl === '3'

  if (isVL3) {
    return (
      <div
        style={{
          padding: 'var(--window-inset)',
          height: '100vh',
          boxSizing: 'border-box',
          background: 'transparent', // ambient body::before shows through
        }}
      >
        {/* Floating rounded window */}
        <div
          data-glass
          style={{
            display: 'flex',
            height: '100%',
            borderRadius: 'var(--r-window)',
            overflow: 'hidden',
            boxShadow: 'var(--sh-3)',
            border: '1px solid var(--border)',
            background: 'var(--surface-panel, var(--surface))',
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
        </div>
        <ControlsPanel />
      </div>
    )
  }

  // VL1 / VL2 — flat full-bleed layout (unchanged)
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
