import { loadRegistry, type RegistryData } from "./registry";
import type { Composition, OrnamentDef, Tokens, VariantDef } from "./types";
import baseCss from "./base.css?raw";

// Vite host: read archetypes and visual languages straight from the folders, then hand them to the registry.
const variantDefs = import.meta.glob<VariantDef>("../../archetypes/*/variants/*.json", { eager: true, import: "default" });
const variantHtml = import.meta.glob<string>("../../archetypes/*/variants/*.html", { eager: true, query: "?raw", import: "default" });
const variantCss = import.meta.glob<string>("../../archetypes/*/variants/*.css", { eager: true, query: "?raw", import: "default" });
const archetypeSchemas = import.meta.glob<object>("../../archetypes/*/schema.json", { eager: true, import: "default" });
const vlTokens = import.meta.glob<Tokens & { id: string; version: string }>("../../vl/*/tokens.json", { eager: true, import: "default" });
const vlComposition = import.meta.glob<Composition>("../../vl/*/composition.json", { eager: true, import: "default" });
const vlOrnaments = import.meta.glob<(Omit<OrnamentDef, "svg"> & { file: string })[]>("../../vl/*/ornaments/ornaments.json", { eager: true, import: "default" });
const vlSvgs = import.meta.glob<string>("../../vl/*/ornaments/*.svg", { eager: true, query: "?raw", import: "default" });
const vlSkins = import.meta.glob<string>("../../vl/*/skin.css", { eager: true, query: "?raw", import: "default" });
// Each VL may ship fonts.css (@import of @fontsource packages); Vite bundles the font files locally.
import.meta.glob("../../vl/*/fonts.css", { eager: true });

const strip = (p: string) => p.replace(/\.(json|html|css)$/, "");

const data: RegistryData = {
  baseCss,
  variants: Object.entries(variantDefs).map(([path, def]) => {
    const base = strip(path);
    const html = variantHtml[`${base}.html`];
    if (!html) throw new Error(`Variant ${path} has no .html`);
    return { ...def, html, css: variantCss[`${base}.css`] ?? "" };
  }),
  schemas: Object.fromEntries(Object.entries(archetypeSchemas).map(([p, s]) => [p.split("/").at(-2)!, s])),
  visualLanguages: Object.entries(vlTokens).map(([path, tokens]) => {
    const dir = path.replace(/tokens\.json$/, "");
    const id = dir.split("/").at(-2)!;
    const composition = vlComposition[`${dir}composition.json`];
    if (!composition) throw new Error(`Visual language ${id} has no composition.json`);
    const ornaments = (vlOrnaments[`${dir}ornaments/ornaments.json`] ?? []).map(({ file, ...o }) => {
      const svg = vlSvgs[`${dir}ornaments/${file}`];
      if (!svg) throw new Error(`Ornament ${o.id} in ${id} is missing ${file}`);
      return { ...o, svg };
    });
    return { id, tokens, composition, ornaments, skinCss: vlSkins[`${dir}skin.css`] ?? "" };
  }),
};

loadRegistry(data);
