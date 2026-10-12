/** A single plate: framed media (usually a real SlideMock) with four "+"
 * registration marks at its corners, and an optional caption beneath.
 * `data-reveal` opts it into the shared scroll-entrance pass. */
export function D4Plate({
  title,
  body,
  stagger,
  children,
}: {
  title?: string
  body?: string
  stagger?: number
  children: React.ReactNode
}) {
  return (
    <figure className="d4-plate" data-reveal data-reveal-stagger={stagger}>
      <div className="d4-plate-media">{children}</div>
      {(title || body) && (
        <figcaption className="d4-plate-cap">
          {title && <h3>{title}</h3>}
          {body && <p>{body}</p>}
        </figcaption>
      )}
    </figure>
  )
}
