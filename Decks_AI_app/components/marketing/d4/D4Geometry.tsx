/** The fixed construction-geometry backdrop: golden-ratio circles, a centre
 * rule, diagonal sight-lines and four crosshair registration marks — the
 * da-Vinci-sketch cue, drawn entirely in SVG so Direction 4 ships no
 * external art. Strokes inherit `currentColor` from `.d4-geometry`, which
 * is a theme token, so the whole drawing recolors when the page inverts. */
function Crosshair({ x, y, r = 14 }: { x: number; y: number; r?: number }) {
  return (
    <>
      <line x1={x - r} y1={y} x2={x + r} y2={y} />
      <line x1={x} y1={y - r} x2={x} y2={y + r} />
    </>
  )
}

export function D4Geometry() {
  return (
    <div className="d4-geometry" aria-hidden="true">
      <svg viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice" fill="none">
        <g stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke">
          {/* centre rule + horizon */}
          <line x1="500" y1="0" x2="500" y2="1000" />
          <line x1="0" y1="500" x2="1000" y2="500" opacity="0.5" />

          {/* golden-ratio circles sharing the centre */}
          <circle cx="500" cy="500" r="382" />
          <circle cx="500" cy="500" r="236" opacity="0.7" />
          <circle cx="500" cy="500" r="146" opacity="0.45" />

          {/* sight-lines struck corner to corner */}
          <line x1="0" y1="0" x2="1000" y2="1000" opacity="0.35" />
          <line x1="1000" y1="0" x2="0" y2="1000" opacity="0.35" />

          {/* the square inscribed in the outer circle */}
          <rect x="230" y="230" width="540" height="540" opacity="0.5" />

          <Crosshair x={230} y={230} />
          <Crosshair x={770} y={230} />
          <Crosshair x={230} y={770} />
          <Crosshair x={770} y={770} />
        </g>
      </svg>
    </div>
  )
}
