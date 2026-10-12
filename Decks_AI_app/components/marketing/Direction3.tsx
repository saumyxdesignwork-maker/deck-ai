import './marketing.css'
import './d3.css'
import { SmoothScroll } from './motion/SmoothScroll'
import { MarketingNav } from './MarketingNav'
import { Hero } from './Hero'
import { VisionInterstitial } from './VisionInterstitial'
import { ProblemScene } from './ProblemScene'
import { TheTurn } from './TheTurn'
import { HowItWorks } from './HowItWorks'
import { TemplateSwitcher } from './TemplateSwitcher'
import { EditLikeYouTalk } from './EditLikeYouTalk'
import { TrustContent } from './TrustContent'
import { ShipIt } from './ShipIt'
import { BuiltFor } from './BuiltFor'
import { Gallery } from './Gallery'
import { Pricing } from './Pricing'
import { Faq } from './Faq'
import { FinalCta } from './FinalCta'
import { MarketingFooter } from './MarketingFooter'

/** Direction 3 — Direction 1's exact content/structure/copy, reusing its
 * component tree completely unmodified, re-skinned with Direction 2's
 * outline-stroke panel language (sharp corners, hairline borders,
 * corner-marker ticks) via d3.css. Carries `.marketing-page` (for D1's
 * tokens/base styles) AND `.d3-page` (the scope hook d3.css's overrides key
 * off of) — see d3.css for why this is collision-safe against Direction 1. */
export function Direction3() {
  return (
    <div className="marketing-page d3-page">
      <SmoothScroll>
        <MarketingNav />
        <Hero />
        <VisionInterstitial />
        <ProblemScene />
        <TheTurn />
        <HowItWorks />
        <TemplateSwitcher />
        <EditLikeYouTalk />
        <TrustContent />
        <ShipIt />
        <BuiltFor />
        <Gallery />
        <Pricing />
        <Faq />
        <FinalCta />
        <MarketingFooter />
      </SmoothScroll>
    </div>
  )
}
