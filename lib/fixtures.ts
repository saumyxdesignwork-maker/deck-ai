export type LayoutType = 'statement' | 'key-points' | 'heading-media' | 'media-text' | 'bento' | 'data'

export interface StorylineBullet {
  id: string
  text: string
}

export interface StorylineSection {
  id: string
  title: string
  bullets: StorylineBullet[]
  layout: LayoutType
}

export interface Block {
  id: string
  type: 'heading' | 'paragraph' | 'card-group' | 'image' | 'callout' | 'quote'
  content: string
  cards?: { icon: string; title: string; value: string }[]
}

export interface DeckSection {
  id: string
  title: string
  layout: LayoutType
  blocks: Block[]
  thumbnailColor: string
}

export interface DeckData {
  title: string
  subtitle: string
  author: string
  coverColor: string
  sections: DeckSection[]
}

// ─── Mock storyline (generated from prompt) ───
export const MOCK_STORYLINE: StorylineSection[] = [
  {
    id: 's1',
    title: 'The Problem We\'re Solving',
    layout: 'statement',
    bullets: [
      { id: 'b1', text: 'Professionals waste 2+ hours per deck on formatting, not thinking' },
      { id: 'b2', text: 'Blank slide syndrome kills momentum before ideas can flow' },
      { id: 'b3', text: 'Brand inconsistency across teams costs credibility' },
    ],
  },
  {
    id: 's2',
    title: 'Introducing DeckAI',
    layout: 'heading-media',
    bullets: [
      { id: 'b4', text: 'From idea to polished deck in under 3 minutes' },
      { id: 'b5', text: 'AI-first generation with storyline review before building' },
      { id: 'b6', text: 'Block-based editor for full creative control after generation' },
    ],
  },
  {
    id: 's3',
    title: 'Who It\'s Built For',
    layout: 'bento',
    bullets: [
      { id: 'b7', text: 'PMs turning PRDs into stakeholder decks in minutes' },
      { id: 'b8', text: 'Marketers creating on-brand campaign recaps without designers' },
      { id: 'b9', text: 'Engineers who hate slides but need to present at all-hands' },
    ],
  },
  {
    id: 's4',
    title: 'How It Works',
    layout: 'key-points',
    bullets: [
      { id: 'b10', text: 'Input: Paste text, write a prompt, or import a URL/file' },
      { id: 'b11', text: 'Review: Edit the AI-generated storyline before full generation' },
      { id: 'b12', text: 'Refine: Adjust blocks, themes, and layouts in the live editor' },
    ],
  },
  {
    id: 's5',
    title: 'Early Results',
    layout: 'data',
    bullets: [
      { id: 'b13', text: '3 min average time from prompt to finished deck' },
      { id: 'b14', text: '94% of users rated their first deck "share-ready" immediately' },
      { id: 'b15', text: '5× faster than building from scratch in PowerPoint or Figma' },
    ],
  },
  {
    id: 's6',
    title: 'What\'s Next',
    layout: 'statement',
    bullets: [
      { id: 'b16', text: 'Real-time collaboration with team workspaces and brand kits' },
      { id: 'b17', text: 'Analytics to see how prospects engage with your shared decks' },
      { id: 'b18', text: 'AI Agent: describe a change in plain language, watch it happen' },
    ],
  },
]

// ─── Mock generated deck ───
export const MOCK_DECK: DeckData = {
  title: 'DeckAI — From Idea to Deck in 3 Minutes',
  subtitle: 'A new way for professionals to create presentations',
  author: 'Saumy Parihar',
  coverColor: '#1E7BFF',
  sections: [
    {
      id: 'ds1',
      title: 'The Problem We\'re Solving',
      layout: 'statement',
      thumbnailColor: '#F3F4F6',
      blocks: [
        { id: 'bl1', type: 'heading', content: 'The Problem We\'re Solving' },
        { id: 'bl2', type: 'paragraph', content: 'Working professionals spend more time formatting slides than refining their ideas. The result? Decks that look templated, feel rushed, and never reflect the quality of the thinking behind them.' },
        { id: 'bl3', type: 'callout', content: '2+ hours per deck on average — just on formatting, not content.' },
      ],
    },
    {
      id: 'ds2',
      title: 'Introducing DeckAI',
      layout: 'heading-media',
      thumbnailColor: '#EAF2FF',
      blocks: [
        { id: 'bl4', type: 'heading', content: 'Introducing DeckAI' },
        { id: 'bl5', type: 'paragraph', content: 'DeckAI transforms how professionals create presentations. By combining AI-powered generation with a block-based editor and deep theming, we eliminate the blank-slide problem.' },
        { id: 'bl6', type: 'image', content: 'Product preview' },
      ],
    },
    {
      id: 'ds3',
      title: 'Who It\'s Built For',
      layout: 'bento',
      thumbnailColor: '#F0FDF4',
      blocks: [
        { id: 'bl7', type: 'heading', content: 'Who It\'s Built For' },
        {
          id: 'bl8',
          type: 'card-group',
          content: '',
          cards: [
            { icon: '📊', title: 'Product Managers', value: 'PRDs → decks in minutes' },
            { icon: '📣', title: 'Marketers', value: 'On-brand without a designer' },
            { icon: '⚡', title: 'Engineers', value: 'Tech talks without the pain' },
            { icon: '💼', title: 'Sales', value: 'Pitch decks with analytics' },
            { icon: '🎨', title: 'Designers', value: 'Beautiful blocks to compose' },
            { icon: '🏢', title: 'Leadership', value: 'Board decks without effort' },
          ],
        },
      ],
    },
    {
      id: 'ds4',
      title: 'How It Works',
      layout: 'key-points',
      thumbnailColor: '#FFF7ED',
      blocks: [
        { id: 'bl9', type: 'heading', content: 'How It Works' },
        {
          id: 'bl10',
          type: 'card-group',
          content: '',
          cards: [
            { icon: '1', title: 'Input', value: 'Prompt, paste text, or import a URL or file' },
            { icon: '2', title: 'Storyline', value: 'Review and edit the AI-generated outline' },
            { icon: '3', title: 'Generate', value: 'Full deck builds in under 90 seconds' },
            { icon: '4', title: 'Refine', value: 'Edit blocks, themes, and layouts' },
          ],
        },
      ],
    },
    {
      id: 'ds5',
      title: 'Early Results',
      layout: 'data',
      thumbnailColor: '#F5F3FF',
      blocks: [
        { id: 'bl11', type: 'heading', content: 'Early Results' },
        {
          id: 'bl12',
          type: 'card-group',
          content: '',
          cards: [
            { icon: '⏱', title: 'Avg. time to deck', value: '3 min' },
            { icon: '⭐', title: 'Share-ready rating', value: '94%' },
            { icon: '🚀', title: 'Faster than scratch', value: '5×' },
          ],
        },
      ],
    },
    {
      id: 'ds6',
      title: 'What\'s Next',
      layout: 'statement',
      thumbnailColor: '#FFF1F2',
      blocks: [
        { id: 'bl13', type: 'heading', content: 'What\'s Next' },
        { id: 'bl14', type: 'paragraph', content: 'We\'re building toward a future where every professional can present with confidence — no design skills required.' },
        { id: 'bl15', type: 'callout', content: 'Real-time collaboration · Shared deck analytics · AI Agent mode' },
      ],
    },
  ],
}

// ─── Suggested prompts ───
export const SUGGESTED_PROMPTS = [
  'Create a product launch deck for a new AI productivity tool',
  'Build a quarterly business review for our engineering team',
  'Make a pitch deck for a Series A fundraise',
  'Generate a project kickoff presentation for stakeholders',
  'Create a competitive analysis deck for our marketing team',
  'Build an onboarding deck for new team members',
  'Make a case study deck showcasing our top customer win',
  'Generate a roadmap presentation for the next two quarters',
]

// ─── Layout options for storyline selector ───
export const LAYOUT_OPTIONS: { id: LayoutType; label: string }[] = [
  { id: 'statement', label: 'Statement' },
  { id: 'key-points', label: 'Key Points' },
  { id: 'heading-media', label: 'Heading + Media' },
  { id: 'media-text', label: 'Media + Text' },
  { id: 'bento', label: 'Bento' },
  { id: 'data', label: 'Data' },
]
