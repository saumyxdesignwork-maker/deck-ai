# Photo briefs: Editorial sample deck (`fixtures/editorial.md`)

Editorial renders every photo in black and white, so **tonal contrast matters more than colour**. Generate these in ChatGPT and save them into `assets/inbox/` with the exact file names below. Then add the Markdown line shown for each slide, directly under that slide's title.

All prompts share this style line; append it to each prompt:

> Editorial fashion photography, natural daylight, soft shadows, muted neutral styling, shot on medium format film, fine grain, no text, no logos.

| # | Slide | Slot / ratio | File | Prompt (subject) | Markdown to add |
|---|---|---|---|---|---|
| 1 | Proposal (title) | wide band, ~4:1, subject centred | `ed-01-cover.jpg` | Three-quarter view of a model in an oversized wool coat walking past a pale concrete wall, lots of wall space either side | `![Model walking past a concrete wall](assets/inbox/ed-01-cover.jpg)` |
| 2 | About (grid) | 4 tiles, ~1:1 each | `ed-02a.jpg` … `ed-02d.jpg` | a) close portrait, hand at collar; b) folded linen fabric on a stool; c) studio corner with one chair; d) model seated on the floor, legs crossed | one line per tile, in order |
| 3 | Brand mission (section) | block, ~3:4 portrait | `ed-03-mission.jpg` | Crouching model in tailored black trousers against a light background, strong diagonal pose | `![Crouching model in black tailoring](assets/inbox/ed-03-mission.jpg)` |
| 4 | Elevating ideas | portrait half, ~3:4 | `ed-04-portrait.jpg` | Tight beauty portrait, platinum hair with blunt fringe, looking directly into the camera, plain backdrop | `![Portrait with platinum hair](assets/inbox/ed-04-portrait.jpg)` |
| 5 | Estimate | landscape, ~4:3 | `ed-05-estimate.jpg` | Model in a cap and long coat sitting sideways on a tubular steel chair, reading papers | `![Model reading on a steel chair](assets/inbox/ed-05-estimate.jpg)` |
| 6 | Schedule | portrait half, ~2:3 | `ed-06-schedule.jpg` | Model seated on a low bench in a black blazer, leaning forward, calm expression | `![Model seated in a black blazer](assets/inbox/ed-06-schedule.jpg)` |
| 7 | Testimonial | portrait half, ~3:4 | `ed-07-client.jpg` | Full-length figure in wide-leg trousers and a draped coat against a stone wall, face turned away | `![Full-length figure against a stone wall](assets/inbox/ed-07-client.jpg)` |
| 8 | Moodboard (strip) | 5 tiles, ~3:4 each | `ed-08a.jpg` … `ed-08e.jpg` | a) lips and a hand; b) white architecture with a sharp shadow; c) hand with an earring; d) a figure walking on a dune; e) close-up of draped linen | one line per tile, in order |
| 9 | Thanks (closing) | portrait half, ~2:3 | `ed-09-thanks.jpg` | Standing figure in an oversized jacket and wide trousers, hands in pockets, plain studio wall | `![Standing figure in an oversized jacket](assets/inbox/ed-09-thanks.jpg)` |

## What I will check when you drop them in
- **Ratio and crop:** each image is cropped with `object-fit: cover`. If the subject sits off-centre, I will set a focal point.
- **Tone:** enough contrast to survive grayscale; avoid flat, low-contrast light.
- **Text-safe areas:** the cover band and the closing photo carry no text, so composition can be full; the title photo needs calm space where the title sits.
- **Nothing to remove:** no logos, watermarks, text or recognisable real people.
