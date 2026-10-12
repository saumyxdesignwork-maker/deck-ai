'use client'

import { useRef } from 'react'
import { D4Connections } from './D4Connections'

/** A row of plates plus the dashed connection layer measured across them.
 * `cols` drives the grid; it collapses to a single column under 900px (and
 * the connection lines hide with it). */
export function D4FeatureRow({ cols = 3, children }: { cols?: number; children: React.ReactNode }) {
  const rowRef = useRef<HTMLDivElement>(null)

  return (
    <div className="d4-row" ref={rowRef}>
      <D4Connections rowRef={rowRef} />
      <div className="d4-plates" style={{ ['--d4-cols' as string]: cols }}>
        {children}
      </div>
    </div>
  )
}
