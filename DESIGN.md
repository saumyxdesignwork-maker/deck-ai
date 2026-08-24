# DeckAI — V0 Design Specification

> Design spec for DeckAI V0. It integrates: the confirmed information architecture, the Phase 1
> creation-loop flow, the font system (2 switchable presets), and **Visual Language 1** (surfaces +
> color + layout ideas drawn from the provided Craft/Chronicle-style reference screenshots —
> reference is used for *look & feel only*, not content). No app code is written until explicitly
> approved.

---

## 1. Context

DeckAI is an AI-powered deck generator for working tech professionals (PM, Marketer, Designer,
Engineer, Sales), synthesizing Gamma (AI-first generation, multi-format output) and Chronicle
(storyline-first, widget composition, granular rewrite). V0 covers only the **core creation loop**
and is built as a runnable **Next.js + React + TypeScript** app so decisions are made against
something interactive.

### Experiment model
There is **one shared IA and one Phase 1 flow**. Each **Visual Language** provided is a "direction":
**VL1** = the Craft-style reference screenshots (this doc); **VL2** = to be provided next. **Visual
Language** and **Font preset** are both **live-toggleable in an on-screen controls panel** so we can
experiment across combinations against the same screens.

| Axis | Options in V0 |
|------|---------------|
| Visual Language | **VL1** (this doc) · VL2 (next) |
| Font preset | **A — Hedvig** · **B — Geist** |
| Flow / IA | single shared flow (fixed) |

---

## 2. Scope (V0 — core creation loop only)

In scope (PRD use cases):
- **UC-P0.1** Generate a deck from a text prompt
- **UC-P0.2** Generate a deck from pasted content
- **UC-P0.3** Generate a deck from URL / file import
- **Storyline review & edit** — numbered sections: title + bullets + layout selector; add / delete /
  duplicate / reorder
- **Generation progress** — Storyline → Content → Imagery → Finalizing
- **Editor first-look** (UC-P0.4) — block-based canvas + section navigator, enough to show the loop
  landing somewhere real

Out of scope for V0 (deferred): theming/brand kit (UC-P0.5), present mode (UC-P0.6), share/export
(UC-P0.7), dashboard management (UC-P0.8), auth, collaboration, analytics. The app shell references
these (nav items, top-bar buttons) but they are non-functional placeholders.

No backend/AI — storyline generation and deck content use **static mock data**.

---

## 3. Design foundations

### 3.1 Fonts — 2 switchable presets

| Preset | Headings / Titles | Body / Copy | Notes |
|--------|-------------------|-------------|-------|
| **A — Hedvig** (default) | Hedvig Letters Serif | Hedvig Letters Sans | serif-display + humanist sans |
| **B — Geist** | Geist | Geist | one geometric sans throughout |

- Loaded via `next/font`: Hedvig Letters Serif & Hedvig Letters Sans from `next/font/google`; Geist
  from the `geist` package (or `next/font/google`).
- Exposed as CSS variables `--font-heading` / `--font-body`; the preset toggle swaps which family
  each variable points to (via a `data-font="a|b"` attribute on `<html>`). Everything types off
  those two variables, so switching is instant and global.
- Fallback stack: `ui-serif, Georgia, serif` for serif; `ui-sans-serif, system-ui, sans-serif` for
  sans.

### 3.2 Icons — Lucide only

- **`lucide-react`**, default (regular) stroke style only. Other weights/styles deferred.
- Size scale: 16px (inline/controls), 20px (nav/toolbar), 24px (feature/method cards).
- Icon mapping is listed per component in §6.

### 3.3 Visual Language 1 — tokens (from reference screenshots)

Light, airy, generous whitespace; soft rounded corners; subtle low-contrast borders/dividers;
floating panels with soft shadows; blue as the accent/selection color; black pills for primary CTAs.
These are **starting tokens** (tune in-browser), defined as CSS variables and swappable when VL2
arrives (via `data-vl="1|2"` on `<html>`).

**Color**
| Token | Value (VL1) | Use |
|-------|-------------|-----|
| `--bg-canvas` | `#F6F6F4` | app background (warm off-white) |
| `--surface` | `#FFFFFF` | cards, panels, modals |
| `--surface-muted` | `#F2F2F0` | inset/secondary surfaces |
| `--border` | `#E8E8E6` | card borders |
| `--divider` | `#ECECEC` | hairline separators |
| `--text` | `#1C1C1A` | primary text |
| `--text-muted` | `#6B6B68` | secondary text, captions |
| `--accent` | `#1E7BFF` | selection, active states, links, progress |
| `--accent-soft` | `#EAF2FF` | active row / selected tint |
| `--primary` | `#141414` | primary CTA pill fill |
| `--primary-fg` | `#FFFFFF` | primary CTA text |
| `--success` | `#2FA36B` | completion / done states |

**Radius**: `--r-sm 8px` · `--r-md 12px` · `--r-lg 16px` · `--r-pill 999px`
**Elevation**: `--sh-1 0 1px 2px rgba(0,0,0,.04)` · `--sh-2 0 4px 16px rgba(0,0,0,.06)` (floating
panels/modals) · `--sh-3 0 12px 40px rgba(0,0,0,.10)` (dialogs)
**Spacing**: 4px base scale (4/8/12/16/24/32/48/64)
**Buttons**: primary = black pill (`--primary`); secondary = white pill with `--border`; tertiary =
ghost. Accent pill (blue) for status/"Recommended" badges.
**App shell**: three-column pattern — left sidebar ~240px, center content, right contextual panel
~280px; top bar with centered title/breadcrumb + right-aligned actions; floating pill controls
bottom-left. (Directly mirrors the reference layout.)

### 3.4 On-screen controls panel (the experiment harness)

A floating control (bottom-left pill that expands, matching the reference's floating controls) with:
- **Visual Language** switch: VL1 (active) · VL2 (placeholder until provided) → sets `data-vl`.
- **Font preset** switch: A — Hedvig · B — Geist → sets `data-font`.
Both write to `<html>` data-attributes and persist to `localStorage`; all theming reads from CSS
variables so toggles re-skin the whole app instantly with no reload.

---

## 4. Information Architecture (V0 slice)

Full PRD IA retained for reference; **bold** = built/interactive in V0, rest = placeholder chrome.

```
DeckAI (Web App)
├── App Shell
│   ├── Top Bar: Workspace switcher · Search (⌘K) · Notifications · Credits · Avatar
│   ├── Left Sidebar: All Decks · Recent · Shared · Favorites · Archived · Folders · Templates
│   └── Floating controls (bottom-left): Visual Language · Font preset   ← V0 experiment harness
│
├── **Creation Flow ("Create New")**            ← V0 CORE
│   ├── **Method Selection** — Prompt (Recommended) · Paste · Import · [Template · Scratch = later]
│   ├── **Input Step** (varies by method)
│   │     ├── Prompt → free-text + suggested prompts
│   │     ├── Paste → textarea + content-type detection
│   │     └── Import → URL field / file drag-and-drop
│   ├── **Preferences Bar** (persistent) — Section count (3–25) · Density (4) · Rewrite (3) ·
│   │     Language · Image style
│   ├── **Storyline Review**
│   │     ├── Numbered sections: Title + Bullets + Layout selector
│   │     ├── Layouts: Statement · Key points · Heading+media · Media+text · Bento · Data
│   │     ├── Actions: Add · Delete · Duplicate · Reorder · Counter
│   │     └── CTAs: Generate Deck · Retry Storyline
│   └── **Generation Progress** — Storyline → Content → Imagery → Finalizing → completion
│
├── **Editor (Deck Workspace) — first-look**    ← V0 CORE (landing state)
│   ├── Top Bar: ← Back · Title · Breadcrumb · [Theme · Share · Present · More · Avatars = later]
│   ├── **Left Panel — Section Navigator**: thumbnail list · drag reorder · + Add section
│   ├── **Canvas**: Cover section + content sections, block-based composition
│   │     └── Block palette groups: Text · Cards · Media · Data · Utility
│   └── **Right Panel — Insert/Format/Style/Info** (Insert tab live; mirrors reference Insert panel)
│
└── [Presentation · Sharing · Account · Credits/Plans = out of scope for V0]
```

---

## 5. Phase 1 flow — screen by screen (VL1)

Single stateful wizard; each step is a route so it's linkable and reviewable.
Routes: `/create` → `/create/input` → `/create/storyline` → `/create/generating` → `/editor`.
Controls panel + app-shell chrome present throughout.

**S1 · Method Selection** (`/create`)
Centered on canvas: 3 method cards in a row — **Generate from Prompt** (blue "Recommended" badge),
**Paste Text / Notes**, **Import (URL / File)**. Each card = Lucide icon + title + one-line
description, hover lift (`--sh-2`), rounded `--r-lg`. (Template / Scratch shown greyed "coming
later".) Selecting a card advances to its input.

**S2 · Input Step** (`/create/input`) — content swaps by method:
- *Prompt*: large auto-grow textarea, placeholder guidance, **suggested-prompt chips** below.
- *Paste*: large textarea + a "detected: PRD / article / notes" content-type indicator chip.
- *Import*: URL input with validate state + **drag-and-drop file zone** (PDF/DOCX/MD/TXT/PPTX badges).
- **Preferences Bar** pinned bottom (persistent across methods): Section count stepper (3–25),
  Density segmented (4 levels), Rewrite intensity segmented (3 levels), Language dropdown, Image
  style dropdown. Primary CTA **Generate Storyline** (black pill), secondary Back.

**S3 · Storyline Review** (`/create/storyline`)
Two-pane: left = compact section outline/thumbnails (jump + reorder); center = editable storyline as
a numbered **section card** list. Each card: number badge · editable **Title** · editable **bullets**
· **Layout selector** (row of 6 mini layout thumbnails: Statement / Key points / Heading+media /
Media+text / Bento / Data) · card actions (drag handle, Duplicate, Delete, Add-below). Header shows
storyline title + **section counter**. Footer CTAs: **Generate Deck** (primary) · **Retry Storyline**
(secondary). Drag-to-reorder cards.

**S4 · Generation Progress** (`/create/generating`)
Centered progress card: four ordered steps **Storyline → Content → Imagery → Finalizing** with
per-step status (pending / active spinner / done check in `--success`), overall progress line in
`--accent`, then a **completion toast + subtle celebration**, auto-advancing to the editor.

**S5 · Editor first-look** (`/editor`)
Three-column deck workspace (the VL1 app-shell pattern):
- **Left — Section Navigator**: vertical thumbnail list of generated sections, active highlighted
  (`--accent-soft`), drag-reorder, **+ Add section**.
- **Center — Canvas**: **Cover section** (title / subtitle / author / cover image) then generated
  **content sections** rendered from the storyline as block compositions; between-section add
  control; bottom toolbar (**+ Insert · AI Remix · Media · Layout · More**).
- **Right — Insert panel** (Insert / Format / Style / Info tabs; Insert live): draggable block list
  grouped **Text · Cards · Media · Data · Utility**, each row = Lucide icon + label + drag handle —
  mirroring the reference Insert panel.
This is a *landing/first-look* state (renders mock generated content, basic inline edit); full
editor interactions belong to a later phase.

---

## 6. Component inventory + Lucide icon mapping

| Component | Lucide icon(s) |
|-----------|----------------|
| App shell: Search / Notifications / Credits / Avatar | `Search` · `Bell` · `Coins` · (avatar) |
| Sidebar nav: All Decks / Recent / Shared / Favorites / Archived / Folders / Templates | `LayoutGrid` · `Clock` · `Share2` · `Star` · `Archive` · `Folder` · `LayoutTemplate` |
| Method cards: Prompt / Paste / Import | `Sparkles` · `ClipboardType` · `Link` (+ `Upload`) |
| Preferences bar: sections / density / rewrite / language / image | `ListOrdered` · `AlignJustify` · `Wand2` · `Languages` · `Image` |
| Storyline card actions: reorder / duplicate / delete / add | `GripVertical` · `Copy` · `Trash2` · `Plus` |
| Layout selector thumbnails (6) | small custom SVG glyphs (Lucide where it maps) |
| Generation steps / done / celebrate | `Loader2` · `CheckCircle2` · `PartyPopper` |
| Editor top bar: back / theme / share / present / more | `ArrowLeft` · `Palette` · `Share2` · `Play` · `MoreHorizontal` |
| Section navigator: add | `Plus` |
| Bottom toolbar: insert / remix / media / layout / more | `Plus` · `Shuffle` · `Image` · `LayoutPanelTop` · `MoreHorizontal` |
| Block palette: Text / Cards / Media / Data / Utility | `Type` · `SquareStack` · `Image` · `BarChart3` · `StickyNote` |
| Controls panel: visual language / font | `SwatchBook` · `Type` |

---

## 7. Tech scaffolding (executed only after "build")

- **Next.js (App Router) + TypeScript**, runnable locally (`npm run dev`).
- **Tailwind CSS v4** with `@theme` + CSS custom properties; VL and font tokens as CSS variables
  keyed off `data-vl` / `data-font` on `<html>` for instant toggling.
- Fonts via `next/font` (Hedvig Letters Serif/Sans from Google; Geist from `geist`).
- Icons via `lucide-react`.
- Wizard state via React context / URL step routes; **all data mocked** (fixtures for storyline
  sections and generated deck content) — no backend, no AI calls.
- Project location: `/Users/saumyparihar/Desktop/Decks AI/` (greenfield). This `DESIGN.md` at root.
- Directory sketch:
  ```
  app/ (create/, create/input/, create/storyline/, create/generating/, editor/, layout.tsx)
  components/ (shell/, creation/, storyline/, editor/, controls/, ui/)
  lib/ (theme tokens, font config, mock fixtures)
  styles/ (globals.css with VL/font variable sets)
  ```

---

## 8. Verification

- Run locally (`npm run dev`); click the full loop S1 → S5 in the browser.
- Toggle **Font preset A/B** and confirm all headings/body reflow instantly with no layout break.
- Toggle **Visual Language** (VL1 active; VL2 placeholder) and confirm surfaces/colors re-skin from
  CSS variables with no reload.
- Confirm Lucide icons render at the mapped sizes; storyline reorder/add/delete/duplicate work on
  mock data; generation progress animates and lands on the editor first-look.
- No automated tests at this exploratory stage; user sign-off gates each phase.

---

## 9. Build sequence (after "build" is given)

1. This `DESIGN.md` is the first deliverable (done). Await explicit go-ahead before app code.
2. Scaffold Next.js + TS + Tailwind v4; wire fonts, Lucide, VL/font token system + controls panel.
3. Build the app shell (VL1) with the controls harness working end-to-end.
4. Build S1 → S5 against mock data.
5. Verify per §8; hand back for review before VL2 / later phases.
