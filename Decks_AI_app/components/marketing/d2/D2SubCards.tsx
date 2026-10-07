interface D2SubCard {
  title: string
  body: string
}

/** The 2-column sub-feature card pair that sits below a D2Section's main
 * content, separated by a hairline border — bleeds out to the section's own
 * edges via negative margin so the divider lines up with the outer frame. */
export function D2SubCards({ cards }: { cards: [D2SubCard, D2SubCard] }) {
  return (
    <div className="d2-subcards">
      {cards.map((c, i) => (
        <div className="d2-subcard" key={i} data-reveal>
          <h3>{c.title}</h3>
          <p>{c.body}</p>
        </div>
      ))}
    </div>
  )
}
