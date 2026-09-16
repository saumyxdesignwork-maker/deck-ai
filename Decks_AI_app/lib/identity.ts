// Centralizes the user identity previously hardcoded separately in
// fixtures.ts (MOCK_DECK.author) and components/shell/Sidebar.tsx. No
// onboarding flow exists yet — this is a placeholder single-user constant,
// passed to Decks_AI_Service so the Orchestrator can track it as a user var
// and the generated deck's cover can attribute authorship correctly.
export interface CurrentUser {
  name: string
  email: string
  /** No onboarding UI collects this yet — always undefined for now. The
   * Orchestrator degrades gracefully when it's absent. */
  designation?: string
}

export const CURRENT_USER: CurrentUser = {
  name: 'Saumy Parihar',
  email: 'saumy@growthschool.io',
}
