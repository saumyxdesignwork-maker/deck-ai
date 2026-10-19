// GENERATED from "Deck AI Templates/src/engine" — do not edit here.
// Change the engine there, then run `npm run export:app` in that folder.
import type { Composition, OrnamentDef, Tokens, Variant, VariantDef, VisualLanguage } from "./types";

/**
 * Everything the engine needs, as plain data. The Vite preview builds it from files (registry-vite.ts);
 * other hosts (the Deck AI app) load a JSON bundle produced by scripts/export-to-app.mjs.
 */
export interface RegistryData {
  baseCss: string;
  variants: (VariantDef & { html: string; css: string })[];
  schemas: Record<string, object>;
  visualLanguages: {
    id: string;
    name?: string;
    tokens: Tokens & { id: string; version: string };
    composition: Composition;
    ornaments: OrnamentDef[];
    skinCss: string;
  }[];
}

export let baseCss = "";
export let variants: Variant[] = [];
export let schemas: Record<string, object> = {};
export let visualLanguages: Record<string, VisualLanguage> = {};

export function loadRegistry(data: RegistryData): void {
  baseCss = data.baseCss;
  variants = data.variants;
  schemas = data.schemas;
  visualLanguages = Object.fromEntries(
    data.visualLanguages.map((v) => [v.id, { id: v.id, version: v.tokens.version, tokens: v.tokens, composition: v.composition, ornaments: v.ornaments, skinCss: v.skinCss }]),
  );
}

export function variantsFor(archetype: string): Variant[] {
  return variants.filter((v) => v.archetype === archetype);
}

export function getVariant(archetype: string, name: string): Variant | undefined {
  return variants.find((v) => v.archetype === archetype && v.variant === name);
}

/** "draft@0.1.0" → "draft" */
export function getVisualLanguage(ref: string): VisualLanguage {
  const id = ref.split("@")[0]!;
  const vl = visualLanguages[id];
  if (!vl) throw new Error(`Unknown visual language "${id}". Available: ${Object.keys(visualLanguages).join(", ")}`);
  return vl;
}
