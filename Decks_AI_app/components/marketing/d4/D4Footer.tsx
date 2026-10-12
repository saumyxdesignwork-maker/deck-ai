export function D4Footer() {
  return (
    <footer className="d4-footer d4-wrap" data-theme="dark">
      <div className="d4-foot-row">
        <span>© {new Date().getFullYear()} Deck AI</span>
        <nav className="d4-foot-links" aria-label="Footer">
          <a href="#d4-prompt">Chapters</a>
          <a href="#d4-themes">Themes</a>
          <a href="#d4-top">Top</a>
        </nav>
        <span>hello@deckai.app</span>
      </div>
      <span className="d4-foot-mark" aria-hidden="true">
        Deck <i>ai</i>
      </span>
    </footer>
  )
}
