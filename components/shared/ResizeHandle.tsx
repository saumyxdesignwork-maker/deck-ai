'use client'

import { useState } from 'react'

interface ResizeHandleProps {
  isResizing: boolean
  onPointerDown: (e: React.PointerEvent) => void
}

// A thin draggable divider between two flex panes — hairline at rest,
// thickens and turns accent-colored on hover/drag for affordance.
export function ResizeHandle({ isResizing, onPointerDown }: ResizeHandleProps) {
  const [hovered, setHovered] = useState(false)
  const active = isResizing || hovered

  return (
    <div
      onPointerDown={onPointerDown}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 5,
        flexShrink: 0,
        cursor: 'col-resize',
        position: 'relative',
        background: 'transparent',
      }}
      title="Drag to resize"
    >
      <div
        style={{
          position: 'absolute',
          left: 2,
          top: 0,
          bottom: 0,
          width: active ? 2 : 1,
          background: active ? 'var(--accent)' : 'var(--divider)',
          transition: isResizing ? 'none' : 'background 0.12s, width 0.12s',
        }}
      />
    </div>
  )
}
