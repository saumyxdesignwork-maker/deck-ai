import { Suspense } from 'react'
import { ReturningUserRedirect } from '@/components/marketing/ReturningUserRedirect'
import { DirectionSwitcher } from '@/components/marketing/DirectionSwitcher'

// The marketing page is the front door at "/". Returning users (anyone with
// a saved deck already) are forwarded straight to their flow by
// ReturningUserRedirect — see components/marketing/ReturningUserRedirect.tsx
// for why that's a client-side check rather than a server redirect.
//
// DirectionSwitcher renders whichever of the two landing-page directions is
// active (see components/marketing/Direction1.tsx / Direction2.tsx) behind a
// floating stakeholder toggle; each direction owns its own CSS token scope
// and section tree, so this page itself stays a thin shell. Wrapped in
// Suspense because DirectionSwitcher reads the `?dir=` search param.
export default function HomePage() {
  return (
    <>
      <ReturningUserRedirect />
      <Suspense fallback={null}>
        <DirectionSwitcher />
      </Suspense>
    </>
  )
}
