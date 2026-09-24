// Mirrors Decks_AI_Service/src/contract/data.ts — keep these two files in
// sync by hand (the two repos aren't an npm workspace).
//
// A provider-agnostic shape for user-supplied data grounding a deck. Every
// connector (paste/upload today, Google Sheets/Docs/Notion/etc. later) is
// just an adapter that produces this same shape.

export interface DeckDatasetColumn {
  name: string
  role: 'label' | 'value' | 'ignore'
}

export type DeckDatasetRow = Record<string, string>

export interface DeckDataset {
  source: string
  capturedAt: string
  columns: DeckDatasetColumn[]
  rows: DeckDatasetRow[]
}

export const MAX_DATASET_ROWS = 50

/** Splits one line of delimited text into fields, honoring simple
 * double-quote escaping ("a ""quoted"" value" → a "quoted" value) — covers
 * the common paste-from-Sheets/Excel case without pulling in a CSV library. */
function splitDelimitedLine(line: string, delimiter: string): string[] {
  const fields: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        current += char
      }
    } else if (char === '"') {
      inQuotes = true
    } else if (char === delimiter) {
      fields.push(current)
      current = ''
    } else {
      current += char
    }
  }
  fields.push(current)
  return fields.map(f => f.trim())
}

/** Parses pasted or uploaded CSV/TSV text into columns + rows. Returns null
 * (with a message) on anything that doesn't look like a real table —
 * fewer than 2 lines, or a header with no columns. */
export function parseDelimitedTable(text: string): { columns: string[]; rows: DeckDatasetRow[] } | { error: string } {
  const lines = text
    .split(/\r\n|\r|\n/)
    .map(l => l.trimEnd())
    .filter(l => l.trim().length > 0)

  if (lines.length < 2) return { error: 'Paste at least a header row and one data row.' }

  // Pick whichever delimiter appears more consistently in the header —
  // handles both comma-separated and tab-separated (spreadsheet-paste) input.
  const delimiter = (lines[0].match(/\t/g)?.length ?? 0) >= (lines[0].match(/,/g)?.length ?? 0) ? '\t' : ','

  const header = splitDelimitedLine(lines[0], delimiter)
  if (header.length < 2 || header.some(h => !h)) return { error: 'Could not find a clean header row — make sure the first line has column names.' }

  const rows: DeckDatasetRow[] = []
  for (const line of lines.slice(1)) {
    const fields = splitDelimitedLine(line, delimiter)
    if (fields.length !== header.length) return { error: `Row ${rows.length + 2} has ${fields.length} columns but the header has ${header.length} — check for a stray comma or tab.` }
    rows.push(Object.fromEntries(header.map((name, i) => [name, fields[i] ?? ''])))
  }

  return { columns: header, rows }
}
