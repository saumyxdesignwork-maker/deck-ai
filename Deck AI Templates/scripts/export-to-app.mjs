import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Syncs the template engine into the Deck AI app (Decks_AI_app/lib/template-engine/):
 *  - the runtime engine sources (registry, compiler, planner, renderer, fit engine, tokens, charts)
 *  - bundle.json: every archetype variant and visual language as plain data
 *  - fonts.css: the @fontsource imports every visual language needs
 * The app imports these instead of the Vite-only file globs used by this prototype.
 */
const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const appDir = resolve(root, "../Decks_AI_app");
const out = join(appDir, "lib/template-engine");
if (!existsSync(appDir)) throw new Error(`App not found at ${appDir}`);
mkdirSync(out, { recursive: true });

const read = (p) => readFileSync(p, "utf8");
const json = (p) => JSON.parse(read(p));
const dirs = (p) => readdirSync(p, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort();
const HEADER = "// GENERATED from \"Deck AI Templates/src/engine\" — do not edit here.\n// Change the engine there, then run `npm run export:app` in that folder.\n";

// ---------- registry data ----------
const variants = [];
const schemas = {};
for (const a of dirs(join(root, "archetypes"))) {
  schemas[a] = json(join(root, "archetypes", a, "schema.json"));
  const vdir = join(root, "archetypes", a, "variants");
  for (const f of readdirSync(vdir).filter((f) => f.endsWith(".json")).sort()) {
    const base = f.replace(/\.json$/, "");
    const css = join(vdir, `${base}.css`);
    variants.push({ ...json(join(vdir, f)), html: read(join(vdir, `${base}.html`)), css: existsSync(css) ? read(css) : "" });
  }
}

const visualLanguages = [];
const fontImports = new Set();
for (const id of dirs(join(root, "vl"))) {
  const d = join(root, "vl", id);
  const ornDefs = existsSync(join(d, "ornaments/ornaments.json")) ? json(join(d, "ornaments/ornaments.json")) : [];
  const ornaments = ornDefs.map(({ file, ...o }) => ({ ...o, svg: read(join(d, "ornaments", file)) }));
  const manifest = existsSync(join(d, "manifest.json")) ? json(join(d, "manifest.json")) : {};
  visualLanguages.push({
    id,
    name: manifest.name ?? id,
    tags: manifest.tags ?? [],
    bestFor: manifest.best_for ?? [],
    tokens: json(join(d, "tokens.json")),
    composition: json(join(d, "composition.json")),
    ornaments,
    skinCss: existsSync(join(d, "skin.css")) ? read(join(d, "skin.css")) : "",
  });
  if (existsSync(join(d, "fonts.css"))) for (const line of read(join(d, "fonts.css")).split("\n")) if (line.trim().startsWith("@import")) fontImports.add(line.trim());
}

const bundle = { baseCss: read(join(root, "src/engine/base.css")), variants, schemas, visualLanguages };
writeFileSync(join(out, "bundle.json"), JSON.stringify(bundle));
const fontModules = [...fontImports].map((l) => l.replace(/^@import\s+"(.+)";$/, "$1")).sort();
writeFileSync(join(out, "fonts.ts"), `${HEADER}// Fonts for every template visual language (open licence, @fontsource). Imported only by the template renderer chunk.\n${fontModules.map((m) => `import "${m}";`).join("\n")}\n`);
writeFileSync(join(out, "font-packages.json"), JSON.stringify([...new Set(fontModules.map((m) => m.split("/").slice(0, 2).join("/")))].sort(), null, 2));

// ---------- engine sources ----------
const engineFiles = ["types.ts", "compiler.ts", "capacity.ts", "planner.ts", "render.ts", "tokens.ts", "chart.ts", "fit.ts", "registry.ts"];
for (const f of engineFiles) writeFileSync(join(out, f), HEADER + read(join(root, "src/engine", f)));

writeFileSync(join(out, "index.ts"), `${HEADER}import bundle from "./bundle.json";
import { loadRegistry, type RegistryData } from "./registry";

loadRegistry(bundle as unknown as RegistryData);

export { renderDeck, renderSlide, type RenderedDeck } from "./render";
export { fitSlide, type FitIssue } from "./fit";
export { visualLanguages } from "./registry";
export type { Deck, Slide, Aspect } from "./types";
`);

// ---------- light catalogue for pickers (no layouts, so it can sit in any page bundle) ----------
const CORPORATE = new Set(["professional", "data", "research", "saas", "tech"]);
const catalogue = visualLanguages
  .filter((v) => v.id !== "draft")
  .map((v) => {
    const dna = existsSync(join(root, "vl", v.id, "style-dna.md")) ? read(join(root, "vl", v.id, "style-dna.md")) : "";
    const firstPara = dna.split("\n").find((l) => l.trim() && !l.startsWith("#")) ?? "";
    return {
      id: v.id,
      name: v.name,
      category: v.tags.some((t) => CORPORATE.has(t)) ? "corporate" : "creative",
      blurb: (firstPara.match(/^[^.]+\./)?.[0] ?? firstPara).trim(),
      bestFor: v.bestFor,
      palette: v.tokens.palettes.default ?? {},
      fonts: v.tokens.font_pairs.default,
      defaultGround: v.composition.grounds?.default ?? "base",
    };
  });
writeFileSync(join(out, "catalogue.json"), JSON.stringify(catalogue, null, 2));

console.log(`exported ${variants.length} variants, ${visualLanguages.length} visual languages, ${fontImports.size} font imports → ${out}`);

// ---------- server copy (Decks_AI_Service/src/template-engine/) ----------
// The backend compiles each generated slide into its template's HTML right
// after generation, so it needs the same engine — minus everything that
// needs a browser: the fit pass (fit.ts, measures rendered text) and the
// inline-edit DOM reader (compiler.ts's richFromDom). The service runs
// NodeNext ESM, so relative imports get explicit `.js` suffixes and the
// bundle is read from disk rather than imported as JSON.
const serviceDir = resolve(root, "../Decks_AI_Service");
if (existsSync(serviceDir)) {
  const sout = join(serviceDir, "src/template-engine");
  mkdirSync(sout, { recursive: true });
  const nodeImports = (src) => src.replace(/(from\s+["'])(\.\/[^"']+?)(["'])/g, (m, a, p, b) => (p.endsWith(".js") ? m : `${a}${p}.js${b}`));
  const stripDom = (src) => src.replace(/\/\*\* Inverse of richHtml[\s\S]*?\nexport function richFromDom[\s\S]*?\n}\n/, "");
  for (const f of engineFiles.filter((f) => f !== "fit.ts")) {
    let src = read(join(root, "src/engine", f));
    if (f === "compiler.ts") src = stripDom(src);
    if (src.includes("richFromDom") || src.includes("getComputedStyle")) throw new Error(`${f}: browser-only code left in the server copy`);
    writeFileSync(join(sout, f), HEADER + nodeImports(src));
  }
  writeFileSync(join(sout, "bundle.json"), JSON.stringify(bundle));
  writeFileSync(join(sout, "index.ts"), `${HEADER}import { readFileSync } from "node:fs";
import { loadRegistry, type RegistryData } from "./registry.js";

loadRegistry(JSON.parse(readFileSync(new URL("./bundle.json", import.meta.url), "utf8")) as RegistryData);

export { renderDeck, type RenderedDeck } from "./render.js";
export { getVisualLanguage, visualLanguages } from "./registry.js";
export type { Deck, Slide, Aspect } from "./types.js";
`);
  console.log(`exported server engine (no fit pass) → ${sout}`);
}
