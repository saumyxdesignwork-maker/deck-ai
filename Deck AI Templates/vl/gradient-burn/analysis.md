# Gradient Burn — reference analysis

Five boards supplied by the user (19 Oct 2026): an AI-energy keynote ("module" dividers), a pastel affirmation-card set, a grainy-gradient brand moodboard, and a dark legal-lecture deck (board 5 duplicates board 4). Sources and licences are not recorded, so we extract principles only. No text, layouts, logos or imagery are reproduced.

| Dimension | Observed | Interpretation (what we build) |
|---|---|---|
| Grounds | Near-black with warm undertone; dusk washes (mauve→lilac, slate→olive grey); pale cream/off-white; saturated orange/pink cards | `inverse` = ember-black (default). Accents are gradient *washes* (dusk, slate, sunrise). `base` = warm off-white for "breath" slides |
| Colour | Heat palette: ember red-orange, flame orange, hot pink; cool counterweights: violet, cobalt, lilac. Heat sits low/at edges, cool sits high | 6-colour `field` ramp. Each slide rotates which three it uses, so hue changes slide to slide while the ramp stays fixed |
| Surface | Soft radial glows, horizons, edge flares, a burning line, a sphere with a hot rim, a dot-matrix heat map, diagonal light beams; visible film grain | Full-bleed SVG "fields" (radial gradients and blur, coloured by CSS variables) + a grain overlay on every slide |
| Display type | Squarish, slightly condensed geometric caps (techno-grotesk), medium weight, tight leading (~0.95), centred stacks of 2–4 lines | Saira Semi Condensed 500, uppercase, leading 0.92 |
| Reading type | Clean geometric sans, regular weight, mostly white on dark | Manrope 400/600 |
| Labels | Tiny tracked caps eyebrow above titles ("module" + numeral); small captions in corners | Saira Semi Condensed 500, upper, +0.14em tracking |
| Lines & ornament | Almost none: one hairline timeline with ticks; numbered circle badges on cards | Ornament = the field itself. Badge pills only on statement slides |
| Imagery | Photos are rare and abstract (planet, figure silhouette) and read as part of the glow | SVG fields stand in for imagery; photo slots get a "burn" treatment later (darken + warm tint + grain) |
| Composition | Symmetric, centred, lots of empty field; text sits in the calm centre while energy lives at the edges. Content slides go top-left with orbs behind | Centred variants for title/section/quote; left-anchored variants for content. Fields never peak under text |
| Typographic moment | Pale slide with a giant word *filled* with gradient/image; dark-on-light small words above and below | `title/word-fill`: gradient-clipped giant word on the pale ground |
| Signature | "Text floating on a burning field" | See style-dna.md |
