/** Four 6×6px corner ticks for a bordered section container — the
 * design-tool "selected object" cue from the Paper.design reference. Parent
 * must be `position: relative`. */
export function D2CornerMarkers() {
  return (
    <div className="d2-corners" aria-hidden="true">
      <i />
      <i />
      <i />
      <i />
    </div>
  )
}
