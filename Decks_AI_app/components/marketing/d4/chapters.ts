/** The edition's table of contents — shared by the chapter index rail and
 * the chapter sections themselves so the numerals, anchors and order can
 * never drift apart. `theme` drives the page's parchment/near-black
 * inversion as each chapter crosses the viewport. */
export interface D4ChapterMeta {
  numeral: string
  id: string
  name: string
  theme: 'light' | 'dark'
}

export const CHAPTERS: D4ChapterMeta[] = [
  { numeral: 'I', id: 'd4-prompt', name: 'Prompt', theme: 'light' },
  { numeral: 'II', id: 'd4-structure', name: 'Structure', theme: 'dark' },
  { numeral: 'III', id: 'd4-themes', name: 'Themes', theme: 'light' },
  { numeral: 'IV', id: 'd4-edit', name: 'Edit', theme: 'dark' },
  { numeral: 'V', id: 'd4-present', name: 'Present', theme: 'light' },
  { numeral: 'VI', id: 'd4-export', name: 'Export', theme: 'dark' },
]
