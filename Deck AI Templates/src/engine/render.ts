import { compile, type Template } from "./compiler";
import { hash, planDeck } from "./planner";
import { getVisualLanguage, variants } from "./registry";
import { groundKind, groundStyle, resolvePalette, tokensToCss } from "./tokens";
import { FRAMES, type Deck, type PlannedSlide, type Variant, type VisualLanguage } from "./types";
import baseCss from "./base.css?raw";

const cache = new WeakMap<Variant, Template>();
const templateFor = (v: Variant) => {
  let t = cache.get(v);
  if (!t) cache.set(v, (t = compile(v.html)));
  return t;
};

export interface RenderedDeck {
  vl: VisualLanguage;
  css: string;
  scopeClass: string;
  plan: PlannedSlide[];
  slides: string[];
  frame: { w: number; h: number };
}

export function renderDeck(deck: Deck): RenderedDeck {
  const vl = getVisualLanguage(deck.design.visual_language);
  const plan = planDeck(deck, vl);
  const scopeClass = `vl-${vl.id}`;
  const slides: string[] = [];
  plan.forEach((p, i) => slides.push(renderSlide(deck, p, vl, plan[i - 1]?.decor)));
  return { vl, css: deckCss(deck, vl, scopeClass), scopeClass, plan, slides, frame: FRAMES[deck.design.aspect] };
}

export function deckCss(deck: Deck, vl: VisualLanguage, scopeClass: string): string {
  return [baseCss, tokensToCss(vl, deck, `.deck.${scopeClass}`), ...variants.map((v) => v.css), vl.skinCss].join("\n");
}

export function renderSlide(deck: Deck, p: PlannedSlide, vl: VisualLanguage, prevDecor?: Record<string, string>): string {
  const showOn = vl.composition.chrome?.show_on ?? "all-but-title";
  const html = templateFor(p.variant)({
    id: p.slide.id,
    ground: groundKind(p.ground),
    density: deck.design.theme.density ?? "regular",
    aspect: deck.design.aspect,
    page: String(p.index + 1).padStart(2, "0"),
    total: deck.slides.length,
    meta: deck.meta,
    content: viewModel(p.slide.content),
    show_chrome: showOn === "all" || (showOn === "all-but-title" && p.slide.archetype !== "title"),
  });
  const style = groundStyle(p.ground) + rotationStyle(vl, deck, p.index);
  const withGround = html.replace(/^(\s*<section\b)/, `$1 style="${style}"`);
  return decorate(withGround, p, vl, deck, prevDecor);
}

const PERCENT = /^[~≈]?\s*([\d.]+)\s*%$/;

/**
 * Render-time derived values (never stored in deck.json). List items whose `value` is a percentage get
 * `value_pct` (0–100) so gauges can draw it; templates only ever see sanitised numbers here.
 */
function viewModel(content: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...content };
  for (const [k, v] of Object.entries(content)) {
    if (!Array.isArray(v)) continue;
    out[k] = v.map((item) => {
      if (!item || typeof item !== "object" || typeof (item as { value?: unknown }).value !== "string") return item;
      const m = PERCENT.exec((item as { value: string }).value.trim());
      return m ? { ...item, value_pct: Math.max(0, Math.min(100, Number(m[1]))) } : item;
    });
  }
  return out;
}

/** Shift each rotating palette role by the slide index so hues differ slide to slide. */
function rotationStyle(vl: VisualLanguage, deck: Deck, index: number): string {
  const palette = resolvePalette(vl.tokens, deck.design.theme.palette);
  let css = "";
  for (const role of vl.composition.rotate_roles ?? []) {
    const ramp = palette[role];
    if (!Array.isArray(ramp) || !ramp.length) continue;
    const name = role.replace(/\./g, "-");
    const start = (index + (hash(`${deck.id}:${role}`) % ramp.length)) % ramp.length;
    ramp.forEach((_, k) => (css += ` --r-${name}-${k}: var(--color-${name}-${(start + k) % ramp.length});`));
  }
  return css;
}

/**
 * Inline SVGs share one document, and a gradient's CSS variables resolve where the gradient element lives.
 * Suffixing ids per slide keeps each slide's url(#…) pointing at its own (differently coloured) gradient.
 */
function scopeSvgIds(svg: string, scope: string): string {
  const s = scope.replace(/[^\w-]/g, "_");
  return svg
    .replace(/\bid="([\w-]+)"/g, `id="$1--${s}"`)
    .replace(/url\(#([\w-]+)\)/g, `url(#$1--${s})`)
    .replace(/href="#([\w-]+)"/g, `href="#$1--${s}"`);
}

/**
 * Fill empty decor anchors with VL ornaments per role/anchor/ground scoping.
 * The choice is deterministic, avoids repeating the previous slide's ornament on the same anchor, and is
 * remembered on the plan so a later variant swap keeps the same field.
 */
function decorate(html: string, p: PlannedSlide, vl: VisualLanguage, deck: Deck, prevDecor?: Record<string, string>): string {
  if (deck.design.theme.ornament === "none") return html;
  const used = new Map<string, number>();
  const seen = new Map<string, number>();
  const kind = groundKind(p.ground);
  p.decor ??= {};
  return html.replace(/<div([^>]*)\bdata-decor="([\w-]+)"([^>]*)><\/div>/g, (whole, pre: string, anchor: string, post: string) => {
    // repeated anchors (one per list item) get keys like "item-mark#2" so each item can differ
    const n = seen.get(anchor) ?? 0;
    seen.set(anchor, n + 1);
    const key = n ? `${anchor}#${n}` : anchor;
    const eligible = vl.ornaments.filter(
      (o) =>
        o.anchors.includes(anchor) &&
        (o.roles.includes("*") || o.roles.includes(p.slide.archetype)) &&
        (!o.grounds || o.grounds.includes(kind)) &&
        (!o.variants || o.variants.includes(p.variant.variant)) &&
        (used.get(o.id) ?? 0) < o.max_per_slide,
    );
    if (!eligible.length) return whole;
    let o = eligible.find((e) => e.id === p.decor![key]);
    if (!o) {
      const start = (hash(`${deck.id}:${p.slide.id}:${anchor}`) + n) % eligible.length;
      o = eligible[start]!;
      if (eligible.length > 1 && o.id === prevDecor?.[key]) o = eligible[(start + 1) % eligible.length]!;
    }
    p.decor![key] = o.id;
    used.set(o.id, (used.get(o.id) ?? 0) + 1);
    return `<div${pre}data-decor="${anchor}"${post} data-ornament="${o.id}" aria-hidden="true">${scopeSvgIds(o.svg, `${p.slide.id}-${key}`)}</div>`;
  });
}
