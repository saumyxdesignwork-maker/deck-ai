# Illustration — reference analysis

One report board supplied by the user (19 Oct 2026, six slides of a 40+ slide creative-industry report). Source and licence are not recorded, so we extract principles only. The illustrations, characters, text and logos are **not** reproduced; we draw our own character set from scratch in SVG.

| Dimension | Observed | Interpretation (what we build) |
|---|---|---|
| Grounds | Warm cream cover and contents; full flat colour chapters (sky blue, burnt orange, peach); a white stat slide paired with a mustard illustration panel | `base` cream; `accent` set: sky, orange, peach, mustard, white; role-based rotation so chapters cycle colours |
| Display type | Heavy, tight neo-grotesk caps at poster scale, broken across lines ("INTRO / DUC / TION"), overlapping the illustration on the cover | Archivo (variable) 600, caps, very tight leading and tracking |
| Reading type | Condensed text serif for body; large centred serif for stat quotes ("Nearly half (49%) of…") | Newsreader (variable) for body and stat statements |
| Structure | Thin black vertical hairlines splitting the slide into columns; a small black tab with a chapter number; contents as columns with black rounded number tiles alternating with spot illustrations; page numbers above hairlines | Hairline column dividers; black rounded-square numeral tiles (CSS counter); chapter tab |
| Illustration | Flat characters with bold black outlines, polka-dot and stripe clothing, pink/brown skin, black hair; **full colour** on cream/white, **black line art** on saturated grounds; spot illustrations in squares and circles; a hand-drawn scribble underline | An SVG character rig (head, hair, torso, outlined limbs, shoes, props) with dot/stripe patterns, drawn by us; colours come from palette roles and turn to line art on colour grounds; a scribble ornament |
| Composition | Big type + big character, interlocking; generous empty colour fields; text in a narrow serif column | `title/illo-cover`, `text/split-intro`, `bullets/contents-tiles`, `section/illo-chapter`, `section/illo-half`, `quote/stat-illo`, `closing/illo-center` |
