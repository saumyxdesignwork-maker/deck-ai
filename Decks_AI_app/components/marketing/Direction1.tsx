import './marketing.css'
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

/** Direction 1 — the Henry Labs cinematic language (flat dark tokens,
 * Instrument Serif + Geist, coral eyebrows, sharp white CTAs). Extracted
 * unchanged from the original app/page.tsx tree so it keeps behaving
 * identically behind the DirectionSwitcher. */
export function Direction1() {
  return (
    <div className="marketing-page">
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
