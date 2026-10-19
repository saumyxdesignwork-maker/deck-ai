// GENERATED from "Deck AI Templates/src/engine" — do not edit here.
// Change the engine there, then run `npm run export:app` in that folder.
import { readFileSync } from "node:fs";
import { loadRegistry, type RegistryData } from "./registry.js";

loadRegistry(JSON.parse(readFileSync(new URL("./bundle.json", import.meta.url), "utf8")) as RegistryData);

export { renderDeck, type RenderedDeck } from "./render.js";
export { getVisualLanguage, visualLanguages } from "./registry.js";
export type { Deck, Slide, Aspect } from "./types.js";
