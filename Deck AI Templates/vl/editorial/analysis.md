# Editorial — reference analysis

Four boards supplied by the user (19 Oct 2026): a fashion brand-guidelines deck in paper, black and red; a brand proposal with giant single-word titles; a minimal light-grey pitch deck with thin caps and photo strips; and a Swiss-style social-template grid with red accents and italic serif inserts. Sources and licences are not recorded, so we extract principles only. No text, names, logos or photographs are reproduced.

| Dimension | Observed | Interpretation (what we build) |
|---|---|---|
| Grounds | Warm off-white paper dominates; near-black slides for contrast; full-bleed signal-red panels for chapter moments; a light-grey variant | `base` paper #EDEBE6, `inverse` ink #121212, `accent:0` signal red. Paper-led rhythm with occasional black and one red chapter |
| Colour | Black and white plus **one** red (#E3001B-ish / red-orange); photos mostly monochrome | Single `emphasis` red; images rendered grayscale by default |
| Display type | Swiss grotesk at extreme scale: giant bold words ("Objectives", "PROPOSAL"), condensed bold caps ("BRAND MISSION"), thin light caps statements ("THIS IDEA TRANSFORMS…") | Archivo variable (width + weight axes): bold for giant words, condensed bold caps for chapters, light caps for statements |
| Accent type | Single words set in italic serif inside grotesk headlines ("Templates", "Google Docs") | `*word*` renders in Instrument Serif italic |
| Labels | Tiny caps meta rows (brand · document · year), mono notes, numbered paragraphs "01/", section marks "2.2 Our Ethos", vertical running text and dates on the right edge | IBM Plex Mono label/caption; header meta row; vertical page/date marker; numbered notes layout |
| Lines & marks | Hairline rules separating notes; a hand-drawn red circle around one word; a red asterisk; arrow pills | `==word==` draws a hand-drawn red ring; hairline note dividers |
| Imagery | B&W fashion/architecture photography as structural blocks: full-bleed covers, half panels, 3–5 photo strips, 2×2 grids, small chips | Image slots on most layouts + new `image` archetype (`strip`, `grid`); grayscale treatment; designed grey placeholders until photos arrive |
| Composition | Asymmetric Swiss grid; giant word anchored top-left or bottom-left; meta in corners; generous empty paper | Asymmetric-left, top/bottom anchoring, wide margins |
| Data | Rare: a giant red percentage, a price list with right-aligned figures, phase schedule with thumbnails | `metric/poster-figure`, `bullets/ledger-photo`, `timeline/schedule-photo` |
