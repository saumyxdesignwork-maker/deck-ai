'use client'

import { RefObject, useEffect, useState } from 'react'

interface Line { x1: number; y1: number; x2: number; y2: number }

/** Thin dashed rules struck between neighbouring plates, the way Shopify's
 * Editions page wires its skill cards together. Endpoints are measured from
 * the live DOM (not hard-coded), so they stay correct through reflow — a
 * ResizeObserver on the row re-measures on any layout change.
 *
 * Renders nothing until it has measured, and the stylesheet hides the layer
 * under 900px where the grid collapses to one column and the lines would be
 * meaningless. */
export function D4Connections({ rowRef }: { rowRef: RefObject<HTMLElement | null> }) {
  const [box, setBox] = useState<{ w: number; h: number } | null>(null)
  const [lines, setLines] = useState<Line[]>([])

  useEffect(() => {
    const row = rowRef.current
    if (!row) return

    const measure = () => {
      const rowRect = row.getBoundingClientRect()
      if (!rowRect.width) return
      const plates = Array.from(row.querySelectorAll<HTMLElement>('.d4-plate-media'))
      const next: Line[] = []

      for (let i = 0; i < plates.length - 1; i++) {
        const a = plates[i].getBoundingClientRect()
        const b = plates[i + 1].getBoundingClientRect()
        // Only connect plates that sit on the same visual row; once the grid
        // wraps, a line between them would cut across unrelated content.
        if (Math.abs(a.top - b.top) > 8) continue
        next.push({
          x1: a.right - rowRect.left,
          y1: a.top + a.height / 2 - rowRect.top,
          x2: b.left - rowRect.left,
          y2: b.top + b.height / 2 - rowRect.top,
        })
      }

      setBox({ w: rowRect.width, h: rowRect.height })
      setLines(next)
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(row)
    return () => observer.disconnect()
  }, [rowRef])

  if (!box || !lines.length) return null

  return (
    <svg
      className="d4-connections"
      width={box.w}
      height={box.h}
      viewBox={`0 0 ${box.w} ${box.h}`}
      aria-hidden="true"
    >
      {lines.map((l, i) => (
        <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} />
      ))}
    </svg>
  )
}
