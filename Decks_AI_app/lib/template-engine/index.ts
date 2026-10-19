// GENERATED from "Deck AI Templates/src/engine" — do not edit here.
// Change the engine there, then run `npm run export:app` in that folder.
import bundle from "./bundle.json";
import { loadRegistry, type RegistryData } from "./registry";

loadRegistry(bundle as unknown as RegistryData);

export { renderDeck, renderSlide, type RenderedDeck } from "./render";
export { fitSlide, type FitIssue } from "./fit";
export { visualLanguages } from "./registry";
export type { Deck, Slide, Aspect } from "./types";
