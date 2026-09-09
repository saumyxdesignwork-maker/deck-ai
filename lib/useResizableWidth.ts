'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Drag-to-resize width state for a flex pane sitting next to a divider handle.
 * Pass `invert: true` when the pane is to the RIGHT of its handle (dragging
 * the handle left should grow the pane, not shrink it).
 */
export function useResizableWidth(defaultWidth: number, min: number, max: number, invert = false) {
  const [width, setWidth] = useState(defaultWidth)
  const [isResizing, setIsResizing] = useState(false)
  const dragState = useRef<{ startX: number; startWidth: number } | null>(null)

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault()
    dragState.current = { startX: e.clientX, startWidth: width }
    setIsResizing(true)
  }, [width])

  useEffect(() => {
    if (!isResizing) return

    const handlePointerMove = (e: PointerEvent) => {
      if (!dragState.current) return
      const rawDelta = e.clientX - dragState.current.startX
      const delta = invert ? -rawDelta : rawDelta
      const next = Math.min(max, Math.max(min, dragState.current.startWidth + delta))
      setWidth(next)
    }
    const handlePointerUp = () => {
      dragState.current = null
      setIsResizing(false)
    }

    document.addEventListener('pointermove', handlePointerMove)
    document.addEventListener('pointerup', handlePointerUp)
    const prevCursor = document.body.style.cursor
    const prevUserSelect = document.body.style.userSelect
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    return () => {
      document.removeEventListener('pointermove', handlePointerMove)
      document.removeEventListener('pointerup', handlePointerUp)
      document.body.style.cursor = prevCursor
      document.body.style.userSelect = prevUserSelect
    }
  }, [isResizing, invert, min, max])

  return { width, isResizing, handlePointerDown }
}
