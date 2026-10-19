import type { Deck, Density, Ground, Tokens, TypeStep, VisualLanguage } from "./types";

const DENSITY: Record<Density, number> = { airy: 1.2, regular: 1, compact: 0.8 };
const SPACE_SCALED = new Set(["frame-x", "frame-y", "section", "gutter"]);

const cssName = (role: string) => role.replace(/\./g, "-");

/** Resolve palette (falling back to default for missing roles). */
export function resolvePalette(tokens: Tokens, name = "default"): Record<string, string | string[]> {
  return { ...tokens.palettes.default, ...(tokens.palettes[name] ?? {}) };
}

/** Deck-root CSS: custom properties + generated type-step classes. Only the deck root is targeted. */
export function tokensToCss(vl: VisualLanguage, deck: Deck, scope: string): string {
  const t = vl.tokens;
  const palette = resolvePalette(t, deck.design.theme.palette);
  const fonts = t.font_pairs.default!;
  const density = DENSITY[deck.design.theme.density ?? "regular"];
  const vars: string[] = [];

  for (const [role, value] of Object.entries(palette)) {
    if (Array.isArray(value)) value.forEach((v, i) => vars.push(`--color-${cssName(role)}-${i}: ${v};`));
    else vars.push(`--color-${cssName(role)}: ${value};`);
  }
  vars.push(`--font-display: ${fontStack(fonts.display)};`, `--font-text: ${fontStack(fonts.text)};`, `--font-label: ${fontStack(fonts.label)};`);
  for (const [k, v] of Object.entries(t.space)) vars.push(`--space-${k}: ${SPACE_SCALED.has(k) ? Math.round(v * density) : v}px;`);
  for (const [k, v] of Object.entries(t.radius)) vars.push(`--radius-${k}: ${v}px;`);
  for (const [k, v] of Object.entries(t.line)) vars.push(`--line-${k}: ${v}px;`);
  for (const [k, v] of Object.entries(t.effects ?? {})) vars.push(`--fx-${k}: ${v};`);
  for (const [step, s] of Object.entries(t.type)) {
    vars.push(`--t-${step}-size: ${s.size}px;`);
    if (s.fit_min && t.type[s.fit_min]) vars.push(`--t-${step}-min: ${t.type[s.fit_min]!.size}px;`);
  }

  const typeRules = Object.entries(t.type).map(([step, s]) => `${scope} .t-${step} { ${typeDecl(step, s)} }`);
  return `${scope} { ${vars.join(" ")} }\n${typeRules.join("\n")}`;
}

function typeDecl(step: string, s: TypeStep): string {
  const d = [
    `font-family: var(--font-${s.font ?? "display"});`,
    `font-size: var(--t-${step}-size);`,
    `font-weight: ${s.weight ?? 400};`,
    `line-height: ${s.leading ?? 1.2};`,
    `letter-spacing: ${s.tracking ?? 0}em;`,
  ];
  if (s.case === "upper") d.push("text-transform: uppercase;");
  if (s.case === "small-caps") d.push("font-variant-caps: all-small-caps;");
  if (s.features) d.push(`font-feature-settings: ${s.features.split(/,\s*/).map((f) => `"${f}"`).join(", ")};`);
  return d.join(" ");
}

function fontStack(family: string): string {
  return `"${family}", ui-sans-serif, system-ui, sans-serif`;
}

/** Inline style for a slide's ground: sets --slide-bg / --slide-ink from colour roles. */
export function groundStyle(ground: Ground): string {
  if (ground === "inverse") return "--slide-bg: var(--color-ground-inverse); --slide-ink: var(--color-ink-on-inverse);";
  const accent = /^accent:(\d{1,2})$/.exec(ground);
  if (accent) {
    const i = accent[1];
    return `--slide-bg: var(--color-ground-accent-${i}); --slide-ink: var(--color-ink-on-accent-${i}, var(--color-ink-primary));`;
  }
  return "--slide-bg: var(--color-ground-base); --slide-ink: var(--color-ink-primary);";
}

export const groundKind = (g: Ground) => (g.startsWith("accent") ? "accent" : g) as "base" | "inverse" | "accent" | "image";
