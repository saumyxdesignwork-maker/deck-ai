import type { Composition, OrnamentDef, Tokens, Variant, VariantDef, VisualLanguage } from "./types";

const variantDefs = import.meta.glob<VariantDef>("../../archetypes/*/variants/*.json", { eager: true, import: "default" });
const variantHtml = import.meta.glob<string>("../../archetypes/*/variants/*.html", { eager: true, query: "?raw", import: "default" });
const variantCss = import.meta.glob<string>("../../archetypes/*/variants/*.css", { eager: true, query: "?raw", import: "default" });
const archetypeSchemas = import.meta.glob<object>("../../archetypes/*/schema.json", { eager: true, import: "default" });

const vlTokens = import.meta.glob<Tokens & { id: string; version: string }>("../../vl/*/tokens.json", { eager: true, import: "default" });
const vlComposition = import.meta.glob<Composition>("../../vl/*/composition.json", { eager: true, import: "default" });
const vlOrnaments = import.meta.glob<(Omit<OrnamentDef, "svg"> & { file: string })[]>("../../vl/*/ornaments/ornaments.json", { eager: true, import: "default" });
const vlSvgs = import.meta.glob<string>("../../vl/*/ornaments/*.svg", { eager: true, query: "?raw", import: "default" });
const vlSkins = import.meta.glob<string>("../../vl/*/skin.css", { eager: true, query: "?raw", import: "default" });

// Each VL may ship fonts.css (e.g. @import of @fontsource packages); Vite bundles the font files locally.
import.meta.glob("../../vl/*/fonts.css", { eager: true });

const strip = (p: string) => p.replace(/\.(json|html|css)$/, "");

export const variants: Variant[] = Object.entries(variantDefs).map(([path, def]) => {
  const base = strip(path);
  const html = variantHtml[`${base}.html`];
  if (!html) throw new Error(`Variant ${path} has no .html`);
  return { ...def, html, css: variantCss[`${base}.css`] ?? "" };
});

export const schemas: Record<string, object> = Object.fromEntries(
  Object.entries(archetypeSchemas).map(([p, s]) => [p.split("/").at(-2)!, s]),
);

export function variantsFor(archetype: string): Variant[] {
  return variants.filter((v) => v.archetype === archetype);
}

export function getVariant(archetype: string, name: string): Variant | undefined {
  return variants.find((v) => v.archetype === archetype && v.variant === name);
}

export const visualLanguages: Record<string, VisualLanguage> = Object.fromEntries(
  Object.entries(vlTokens).map(([path, tokens]) => {
    const dir = path.replace(/tokens\.json$/, "");
    const id = dir.split("/").at(-2)!;
    const ornaments = (vlOrnaments[`${dir}ornaments/ornaments.json`] ?? []).map(({ file, ...o }) => {
      const svg = vlSvgs[`${dir}ornaments/${file}`];
      if (!svg) throw new Error(`Ornament ${o.id} in ${id} is missing ${file}`);
      return { ...o, svg };
    });
    const composition = vlComposition[`${dir}composition.json`];
    if (!composition) throw new Error(`Visual language ${id} has no composition.json`);
    return [id, { id, version: tokens.version, tokens, composition, ornaments, skinCss: vlSkins[`${dir}skin.css`] ?? "" }];
  }),
);

/** "draft@0.1.0" → "draft" */
export function getVisualLanguage(ref: string): VisualLanguage {
  const id = ref.split("@")[0]!;
  const vl = visualLanguages[id];
  if (!vl) throw new Error(`Unknown visual language "${id}". Available: ${Object.keys(visualLanguages).join(", ")}`);
  return vl;
}
