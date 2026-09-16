'use client'

import { useRouter } from 'next/navigation'
import { Sparkles, ClipboardType, Link, FileText, PenLine } from 'lucide-react'
import { AppLayout } from '@/components/shell/AppLayout'
import { MethodCard } from '@/components/creation/MethodCard'
import { useCreate, CreationMethod } from '@/lib/createContext'

const METHODS: {
  method: CreationMethod
  icon: typeof Sparkles
  title: string
  description: string
  badge?: string
}[] = [
  {
    method: 'prompt',
    icon: Sparkles,
    title: 'Generate from Prompt',
    description: 'Describe your deck in a sentence and let AI build it',
    badge: 'Recommended',
  },
  {
    method: 'paste',
    icon: ClipboardType,
    title: 'Paste Text / Notes',
    description: 'Transform existing notes, PRDs, or articles into a deck',
  },
  {
    method: 'import',
    icon: Link,
    title: 'Import URL or File',
    description: 'Fetch any webpage or upload PDF, DOCX, MD, TXT, PPTX',
  },
]

const COMING_SOON = [
  { icon: FileText, title: 'Start from Template', description: 'Browse curated templates by use case' },
  { icon: PenLine, title: 'Start from Scratch', description: 'Build with blank sections and full control' },
]

export default function CreatePage() {
  const router = useRouter()
  const { setMethod } = useCreate()

  const handleSelect = (method: CreationMethod) => {
    setMethod(method)
    router.push('/create/input')
  }

  return (
    <AppLayout>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100%',
          padding: '48px 24px',
          gap: 40,
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', maxWidth: 480 }}>
          <h1
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 28,
              fontWeight: 700,
              color: 'var(--text)',
              marginBottom: 10,
              lineHeight: 1.2,
            }}
          >
            How do you want to start?
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.55 }}>
            DeckAI turns any input into a polished, structured deck in under 3 minutes.
          </p>
        </div>

        {/* Primary method cards */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          {METHODS.map(({ method, icon, title, description, badge }) => (
            <MethodCard
              key={method}
              icon={icon}
              title={title}
              description={description}
              badge={badge}
              onClick={() => handleSelect(method)}
            />
          ))}
        </div>

        {/* Coming soon */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
          {COMING_SOON.map(({ icon, title, description }) => (
            <MethodCard
              key={title}
              icon={icon}
              title={title}
              description={description}
              disabled
            />
          ))}
        </div>
      </div>
    </AppLayout>
  )
}
