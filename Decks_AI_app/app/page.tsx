'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Studio is the default Create Flow (see ThemeProvider); a visitor who
// switched to Classic via the Style controller keeps landing there instead,
// since that choice is only known client-side (localStorage).
export default function RootPage() {
  const router = useRouter()
  useEffect(() => {
    const savedFlow = localStorage.getItem('deckai-flow')
    router.replace(savedFlow === 'classic' ? '/create' : '/create/studio')
  }, [router])
  return null
}
