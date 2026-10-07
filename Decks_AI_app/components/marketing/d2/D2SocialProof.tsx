const ROLES = ['founders', 'product managers', 'marketers', 'consultants', 'designers']

export function D2SocialProof() {
  return (
    <section className="d2-social d2-wrap d2-block">
      <p className="d2-social-label" data-reveal>
        built for
      </p>
      <div className="d2-roles">
        {ROLES.map((r, i) => (
          <span className="d2-role-badge" key={r} data-reveal data-reveal-stagger={i}>
            {r}
          </span>
        ))}
      </div>
    </section>
  )
}
