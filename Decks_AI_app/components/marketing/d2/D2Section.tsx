import { D2CornerMarkers } from './D2CornerMarkers'

/** The primary Direction 2 layout primitive: a hairline-bordered container
 * with corner markers, wrapping a feature section's content. Mirrors the
 * Paper.design "bordered section" pattern — sharp corners, transparent
 * background (the grid/grain shows through from the fixed overlay below). */
export function D2Section({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="d2-section d2-wrap">
      <div className="d2-section-inner">
        <D2CornerMarkers />
        {children}
      </div>
    </section>
  )
}
