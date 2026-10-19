# Blues — reference analysis

Three boards supplied by the user (19 Oct 2026): (A) an invoicing-SaaS deck in electric cobalt with vertical light streaks, (B) a blockchain deck with periwinkle chapter slides and ghost numerals, and (C) a creative-tools investor deck in violet-black with horizon glows. Sources and licences are not recorded, so we extract principles only. No text, figures, logos, icons, people or brand names are reproduced.

| Dimension | Observed | Interpretation (what we build) |
|---|---|---|
| Grounds | Midnight navy/violet-black (C, B), saturated cobalt gradients (A), flat periwinkle chapter grounds (B), one ice-white closing with blue streaks (A); split navy/light panels (A, B) | `inverse` midnight #070A1F; `accent:0` electric cobalt, `accent:1` periwinkle; `base` ice white for closing/breath |
| Light | Vertical motion-blur streaks (A); horizon glows and diagonal light wedges in violet (C); gradients that fade glyphs into the ground (B) | SVG fields: `streaks`, `horizon`, `beam`, `corner-glow`; ghost numerals filled with a fading gradient |
| Display type | Light/regular grotesk, sentence case, tight; some titles two-tone (white + lavender) (B); white-to-grey gradient fill on headlines (C) | Geist 300 for display; `*muted*` renders lavender; headings get a soft top-to-bottom gradient fill on dark grounds |
| Labels | Small regular sans; "(01)" numbered tags at card corners; tiny mono-ish footer chrome (brand · year · page) | Geist Mono for labels and chrome; footer chrome bottom-left/bottom-right |
| Surfaces | Frosted glass cards with hairline borders; **one inverted white card** marks the hero item; pill rows; small black or blue icon squares | Glass cards via backdrop blur; `emphasis: true` flips a card to white; icon squares from an SVG glyph set |
| Data | Value cards with label chips; bar chart with one highlighted gradient bar (C) or capped bars (B); a big pair of figures split by a diagonal beam (C); line chart with annotations (C) | `metric/glass-cards`, `metric/duo` (with beam); chart bars skinned as dark glass with a single gradient bar |
| Chapter slides | Periwinkle ground, giant "01/03" numerals bleeding off the right edge, fading into the ground; title bottom-left | `section/ghost-number` (number allowed to bleed past the frame) |
| Composition | Left-anchored titles top-left; content right; split panels; generous empty dark space for light to fill | Asymmetric-left; split layouts (`bullets/split-rows`, `chart/split-panel`) |
| Signature | "Cool electric light falling on dark glass" | See style-dna.md |
