'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

type VL = '1' | '2' | '3'
type FontPreset = 'a' | 'b' | 'c' | 'd'
type Flow = 'classic' | 'studio'

interface ThemeContextValue {
  vl: VL
  font: FontPreset
  bgImg: string
  flow: Flow
  setVL: (v: VL) => void
  setFont: (f: FontPreset) => void
  setBgImg: (img: string) => void
  setFlow: (f: Flow) => void
}

const ThemeContext = createContext<ThemeContextValue>({
  vl: '2',
  font: 'a',
  bgImg: 'Bg-image.webp',
  flow: 'studio',
  setVL: () => {},
  setFont: () => {},
  setBgImg: () => {},
  setFlow: () => {},
})

const DEFAULT_BG = 'Bg-image.webp'

function applyBgVar(img: string) {
  // Quoted URL so filenames with spaces work fine
  document.documentElement.style.setProperty('--vl2-bg', `url('/${img}')`)
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Defaults: Studio flow, Night (dark) visual language, Hedvig font — a
  // first-time visitor sees that combination without touching the Style
  // controller; every value here is still overridable there, and persists.
  const [vl, setVLState] = useState<VL>('2')
  const [font, setFontState] = useState<FontPreset>('a')
  const [bgImg, setBgImgState] = useState<string>(DEFAULT_BG)
  const [flow, setFlowState] = useState<Flow>('studio')

  // Hydrate from localStorage on mount
  useEffect(() => {
    const savedVL   = (localStorage.getItem('deckai-vl')   as VL)         || '2'
    const savedFont = (localStorage.getItem('deckai-font') as FontPreset)  || 'a'
    const savedBg   = localStorage.getItem('deckai-bg')                    || DEFAULT_BG
    const savedFlow = (localStorage.getItem('deckai-flow') as Flow)        || 'studio'

    setVLState(savedVL)
    setFontState(savedFont)
    setBgImgState(savedBg)
    setFlowState(savedFlow)

    document.documentElement.setAttribute('data-vl',   savedVL)
    document.documentElement.setAttribute('data-font', savedFont)
    document.documentElement.setAttribute('data-flow', savedFlow)
    applyBgVar(savedBg)

    if (savedVL === '2') document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
  }, [])

  const setVL = (v: VL) => {
    setVLState(v)
    localStorage.setItem('deckai-vl', v)
    document.documentElement.setAttribute('data-vl', v)
    // glasscn liquid variant uses dark: Tailwind prefix — sync .dark with VL2
    if (v === '2') document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
  }

  const setFont = (f: FontPreset) => {
    setFontState(f)
    localStorage.setItem('deckai-font', f)
    document.documentElement.setAttribute('data-font', f)
  }

  const setBgImg = (img: string) => {
    setBgImgState(img)
    localStorage.setItem('deckai-bg', img)
    applyBgVar(img)
  }

  const setFlow = (f: Flow) => {
    setFlowState(f)
    localStorage.setItem('deckai-flow', f)
    document.documentElement.setAttribute('data-flow', f)
  }

  return (
    <ThemeContext.Provider value={{ vl, font, bgImg, flow, setVL, setFont, setBgImg, setFlow }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
