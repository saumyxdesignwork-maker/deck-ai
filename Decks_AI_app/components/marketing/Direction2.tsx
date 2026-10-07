'use client'

import { useRef } from 'react'
import './d2.css'
import { SmoothScroll } from './motion/SmoothScroll'
import { useScrollReveals } from './motion/useScrollReveals'
import { D2GridOverlay } from './d2/D2GridOverlay'
import { D2Nav } from './d2/D2Nav'
import { D2Hero } from './d2/D2Hero'
import { D2SocialProof } from './d2/D2SocialProof'
import { D2CircularReveal } from './d2/D2CircularReveal'
import { D2HowItWorks } from './d2/D2HowItWorks'
import { D2FeatureA } from './d2/D2FeatureA'
import { D2FeatureB } from './d2/D2FeatureB'
import { D2FeatureC } from './d2/D2FeatureC'
import { D2ClosingStatement } from './d2/D2ClosingStatement'
import { D2BottomCards } from './d2/D2BottomCards'
import { D2MegaFooter } from './d2/D2MegaFooter'

export function Direction2() {
  const ref = useRef<HTMLDivElement>(null)
  useScrollReveals(ref)

  return (
    <div className="d2-page" ref={ref}>
      <D2GridOverlay />
      <SmoothScroll>
        <D2Nav />
        <D2Hero />
        <D2SocialProof />
        <D2CircularReveal>
          <D2HowItWorks />
        </D2CircularReveal>
        <D2FeatureA />
        <D2FeatureB />
        <D2FeatureC />
        <D2ClosingStatement />
        <D2BottomCards />
        <D2MegaFooter />
      </SmoothScroll>
    </div>
  )
}
