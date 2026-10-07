export function D2MegaFooter() {
  return (
    <footer className="d2-footer">
      <div className="d2-wrap">
        <div className="d2-foot-grid" data-reveal>
          <div className="d2-foot-col">
            <span className="d2-brand" style={{ justifyContent: 'flex-start' }}>
              Deck AI
            </span>
          </div>
          <div className="d2-foot-col">
            <h4>product</h4>
            <a href="#d2-how">how it works</a>
            <a href="#d2-features">features</a>
            <a href="#d2-top">pricing</a>
          </div>
          <div className="d2-foot-col">
            <h4>resources</h4>
            <a href="#d2-top">docs</a>
            <a href="#d2-top">changelog</a>
          </div>
          <div className="d2-foot-col">
            <h4>community</h4>
            <a href="#d2-top">twitter</a>
            <a href="#d2-top">discord</a>
          </div>
          <div className="d2-foot-col">
            <h4>legal</h4>
            <a href="#d2-top">privacy</a>
            <a href="#d2-top">terms</a>
          </div>
        </div>
        <div className="d2-foot-bottom" data-reveal>
          <span>© {new Date().getFullYear()} Deck AI</span>
          <span>hello@deckai.app</span>
        </div>
      </div>
      <span className="d2-foot-watermark" aria-hidden="true" data-parallax="-0.15">
        Deck AI
      </span>
    </footer>
  )
}
