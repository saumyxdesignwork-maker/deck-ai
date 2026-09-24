// Mirrors Decks_AI_app/lib/dataset.ts — keep these two files in sync by hand.
//
// A provider-agnostic shape for user-supplied data grounding a deck. Every
// connector (paste/upload today, Google Sheets/Docs/Notion/etc. later) is
// just an adapter that produces this same shape — the pipeline never needs
// to know where a dataset came from, only its columns/rows/provenance.

export interface DeckDatasetColumn {
  name: string
  role: 'label' | 'value' | 'ignore'
}

export type DeckDatasetRow = Record<string, string>

export interface DeckDataset {
  /** Human-readable origin, e.g. "Pasted table", "orders.csv", "Q3 Sales (Google Sheet)". */
  source: string
  /** ISO timestamp of when this data was captured — surfaced in the deck for freshness. */
  capturedAt: string
  columns: DeckDatasetColumn[]
  rows: DeckDatasetRow[]
}
