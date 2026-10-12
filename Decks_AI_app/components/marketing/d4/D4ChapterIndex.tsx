'use client'

import { CHAPTERS } from './chapters'

/** The book-contents rail pinned to the bottom-left. It owns no scroll
 * logic of its own — useThemeSwitch already tracks which chapter holds the
 * viewport, and hands the numeral down as `active`. */
export function D4ChapterIndex({ active }: { active: string | null }) {
  return (
    <nav className="d4-index" aria-label="Chapters">
      <ol>
        {CHAPTERS.map(ch => (
          <li key={ch.id} data-active={active === ch.numeral}>
            <button
              type="button"
              onClick={() => document.getElementById(ch.id)?.scrollIntoView({ behavior: 'smooth' })}
            >
              <span className="d4-ix-name">{ch.name}</span>
              <span className="d4-ix-dots" aria-hidden="true" />
              <span className="d4-ix-num">{ch.numeral}</span>
            </button>
          </li>
        ))}
      </ol>
    </nav>
  )
}
