# Photo briefs: Playful sample deck (`fixtures/playful.md`)

Playful renders every photo in black and white. Shoot for **contrast and candid energy**: street, skate and studio moments, never posed corporate. Save into `assets/inbox/` with these names, then add the Markdown line under the slide's title. People photos for the team slide go on the person: add ` ![alt](path)` inside the people list is not supported yet, so those stay as placeholders for now.

Shared style line (append to every prompt):

> Candid black-and-white street photography, natural light, high contrast, 35mm film grain, no text, no logos, no recognisable real people.

| # | Slide | Slot / ratio | File | Prompt (subject) |
|---|---|---|---|---|
| 1 | project proposal (cover) | ~4:3 landscape | `pl-01-cover.jpg` | Young person in headphones with eyes closed, leaning against a wall, head tilted |
| 2 | about us | 2 tiles, ~3:4 | `pl-02a.jpg`, `pl-02b.jpg` | a) artist with shaved head painting on a wall; b) skater sitting on a board against a corrugated shutter |
| 3 | project name | ~3:2 landscape | `pl-04-name.jpg` | Painter seated on the floor among paint pots, sketching on a large sheet |
| 4 | collage | 1 tall + 2 small | `pl-05a.jpg` … `pl-05c.jpg` | a) close-up hand with a spray can on a mural; b) figure in front of a large abstract mural; c) painter on a ladder at a wall |
| 5 | project stages | ~3:2 landscape | `pl-06-stages.jpg` | Two young people facing each other, foreheads close, headphones on |
| 6 | progress | 2 tiles, ~3:2 | `pl-08a.jpg`, `pl-08b.jpg` | a) person walking on a beach carrying a board; b) person holding a board overhead against the sky |
| 7 | outcomes | ~16:9 landscape | `pl-09-outcomes.jpg` | Young woman sitting on a kerb, laughing, looking at her phone |
| 8 | thank you | ~4:3 landscape | `pl-11-thanks.jpg` | Same mood as the cover: person in headphones, looking down, soft side light |

Markdown to add, for example: `![Young person in headphones against a wall](assets/inbox/pl-01-cover.jpg)`. For the 2-tile and 3-tile slides, add one image line per tile, in order.

## What I will check
- Ratio and crop per slot (cover-crop with a focal point if the subject is off-centre)
- Enough contrast to read in grayscale
- No logos, text, watermarks or identifiable real people
