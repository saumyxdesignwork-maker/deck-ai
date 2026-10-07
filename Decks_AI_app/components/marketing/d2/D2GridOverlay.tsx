/** Fixed blueprint-grid + grain + vertical framing lines behind every
 * Direction 2 section — pure CSS (see d2.css), rendered once at the root. */
export function D2GridOverlay() {
  return (
    <>
      <div className="d2-grid-overlay" aria-hidden="true" />
      <div className="d2-frame-lines" aria-hidden="true" />
    </>
  )
}
