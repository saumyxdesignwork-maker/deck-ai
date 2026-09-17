'use client'

import { ReactNode, useEffect } from 'react'
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
  const { flow, setFlow } = useTheme()

  // Every Classic-flow page (/create, /create/input, /create/storyline,
  // /create/generating) renders through this layout, so this is the one
  // place that needs to keep the Controls "Create Flow" pill in sync —
  // mirrors app/create/studio/page.tsx's equivalent self-correction.
  // Without this, visiting Studio once (which sets flow to 'studio' and
  // persists it) left the pill stuck on "Studio" forever after, even
  // while looking at the Classic flow.
  //
  // Depends on `flow` (not an empty array): ThemeProvider hydrates `flow`
  // from localStorage in its own mount effect, which — since effects fire
  // children-first — runs AFTER this one. An empty-deps version here would
  // fire first, see the still-default 'classic', no-op, and then get
  // silently overwritten by the hydration effect restoring a stale
  // 'studio' value with nothing left to correct it.
  useEffect(() => {
    if (flow !== 'classic') setFlow('classic')
  }, [flow, setFlow])

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
