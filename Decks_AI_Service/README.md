# Decks AI Service

Backend service for DeckAI — will house the API, agent orchestration, and
any data/storage layer that [`Decks_AI_app`](../Decks_AI_app) talks to.

## Environment variables

Secrets live in `.env` in this folder (copy `.env.example` and fill in real
values). Required:

- `OPENROUTER_API_KEY` — used to access LLMs (via OpenRouter) for
  storyline/slide generation.

**`.env` is gitignored and must never be committed, deployed, or shared.**
It's local-only. Only `.env.example` (no real values) is tracked in git.

Nothing else lives here yet.
