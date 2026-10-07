export function MarketingFooter() {
  return (
    <footer className="m-footer">
      <div className="m-wrap">
        <div className="m-foot">
          <div>
            <a className="m-brand" href="#top" style={{ justifyContent: 'flex-start' }}>
              <svg viewBox="0 0 26 26" width="22" height="22" aria-hidden="true">
                <rect x="1" y="1" width="24" height="24" rx="7" fill="var(--accent)" />
                <rect x="6" y="7" width="14" height="3" rx="1.5" fill="#fff" />
                <rect x="6" y="12" width="9" height="3" rx="1.5" fill="#fff" opacity="0.8" />
                <rect x="6" y="17" width="12" height="3" rx="1.5" fill="#fff" opacity="0.6" />
              </svg>
              Deck AI
            </a>
          </div>
          <div>
            <h4>Product</h4>
            <a href="#how">How it works</a>
            <a href="#templates">Templates</a>
            <a href="#trust">Trust</a>
          </div>
          <div>
            <h4>Legal</h4>
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
          </div>
          <div>
            <h4>Contact</h4>
            <a href="#">Get in touch</a>
            <a href="#faq">FAQ</a>
          </div>
        </div>
        <p className="m-copy">© {new Date().getFullYear()} Deck AI</p>
      </div>
    </footer>
  )
}
