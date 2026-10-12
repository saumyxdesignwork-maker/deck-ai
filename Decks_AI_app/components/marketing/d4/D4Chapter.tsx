import type { D4ChapterMeta } from './chapters'

/** One chapter of the edition: a numeral kicker, a drop-capped lead, a
 * lede, then whatever plates the chapter composes. `data-theme` /
 * `data-chapter` are what useThemeSwitch observes — they're the entire
 * contract for the page-wide inversion and the index highlight. */
export function D4Chapter({
  meta,
  lead,
  lede,
  children,
}: {
  meta: D4ChapterMeta
  lead: React.ReactNode
  lede: string
  children: React.ReactNode
}) {
  return (
    <section
      id={meta.id}
      className="d4-chapter d4-wrap"
      data-theme={meta.theme}
      data-chapter={meta.numeral}
      aria-labelledby={`${meta.id}-h`}
    >
      <div className="d4-chapter-head">
        <p className="d4-kicker">
          <i>{meta.numeral}</i>
          <span aria-hidden="true" />
          {meta.name}
        </p>
        <h2 id={`${meta.id}-h`} className="d4-display" data-cap data-reveal>
          {lead}
        </h2>
        <p className="d4-lede" data-reveal>
          {lede}
        </p>
      </div>
      {children}
    </section>
  )
}
