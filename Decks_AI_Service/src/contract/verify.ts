// Mirrors Decks_AI_app/lib/verify.ts — keep these two files in sync by hand.

export interface VerifyFlag {
  sectionId: string
  issue: string
  severity: 'warning' | 'info'
}
