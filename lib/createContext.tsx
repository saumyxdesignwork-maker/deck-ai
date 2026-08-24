'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import { StorylineSection, MOCK_STORYLINE } from './fixtures'

export type CreationMethod = 'prompt' | 'paste' | 'import'

export interface Preferences {
  sections: number
  density: 'minimal' | 'balanced' | 'rich' | 'dense'
  rewrite: 'subtle' | 'standard' | 'creative'
  language: string
  imageStyle: 'photo' | 'illustration' | 'none'
}

interface CreateContextValue {
  method: CreationMethod
  setMethod: (m: CreationMethod) => void
  input: string
  setInput: (v: string) => void
  preferences: Preferences
  setPreferences: (p: Preferences) => void
  storyline: StorylineSection[]
  setStoryline: (s: StorylineSection[]) => void
  deckTitle: string
  setDeckTitle: (t: string) => void
}

const CreateContext = createContext<CreateContextValue | null>(null)

export function CreateProvider({ children }: { children: ReactNode }) {
  const [method, setMethod] = useState<CreationMethod>('prompt')
  const [input, setInput] = useState('')
  const [preferences, setPreferences] = useState<Preferences>({
    sections: 6,
    density: 'balanced',
    rewrite: 'standard',
    language: 'English',
    imageStyle: 'photo',
  })
  const [storyline, setStoryline] = useState<StorylineSection[]>(MOCK_STORYLINE)
  const [deckTitle, setDeckTitle] = useState('DeckAI — From Idea to Deck in 3 Minutes')

  return (
    <CreateContext.Provider value={{
      method, setMethod,
      input, setInput,
      preferences, setPreferences,
      storyline, setStoryline,
      deckTitle, setDeckTitle,
    }}>
      {children}
    </CreateContext.Provider>
  )
}

export function useCreate() {
  const ctx = useContext(CreateContext)
  if (!ctx) throw new Error('useCreate must be used within CreateProvider')
  return ctx
}
