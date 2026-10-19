import { checkCapacity, type CapacityResult } from "./capacity";
import { getVariant, variantsFor } from "./registry";
import type { Deck, Ground, PlannedSlide, Variant, VisualLanguage } from "./types";

interface Ranked { v: Variant; cap: CapacityResult }

/** Deterministic: same deck → same plan. Implements deck-template-system.md §8.3. */
export function planDeck(deck: Deck, vl: VisualLanguage): PlannedSlide[] {
  const out: PlannedSlide[] = [];
  deck.slides.forEach((slide, index) => {
    const prev = out[index - 1]?.variant;
    const prev2 = out[index - 2]?.variant;
    const { fitting, rejected } = rankVariants(deck, vl, slide.archetype, slide.content, slide.id, prev, prev2);
    const pinned = slide.variant ? getVariant(slide.archetype, slide.variant) : undefined;
    const notes: string[] = [];
    if (slide.variant && !pinned) notes.push(`pinned layout "${slide.variant}" is not a ${slide.archetype} layout — chosen automatically instead`);
    let variant: Variant;
    if (pinned) {
      variant = pinned;
      const cap = checkCapacity(pinned, slide.content, deck.design.aspect);
      notes.push(...cap.hard.map((h) => `pinned ${pinned.variant}: ${h}`));
    } else if (fitting[0]) {
      variant = fitting[0].v;
      notes.push(...fitting[0].cap.soft);
    } else {
      // Nothing can show this content: take the closest structural match and say so (split comes later in the ladder).
      const closest = rejected.sort((a, b) => a.cap.hard.length - b.cap.hard.length)[0];
      variant = closest?.v ?? fallbackVariant(slide.archetype);
      notes.push(`no ${slide.archetype} layout fits this content — split the slide or cut items`, ...(closest?.cap.hard ?? []));
    }
    const sameRoleBefore = out.filter((p) => p.slide.archetype === slide.archetype).length;
    let ground = slide.ground ?? chooseGround(vl, slide.archetype, out.map((p) => p.ground), index, deck.slides.length, sameRoleBefore);
    if (!slide.ground && variant.grounds && !variant.grounds.includes(groundKindOf(ground))) {
      ground = variant.grounds[0] === "accent" ? "accent:0" : variant.grounds[0]!;
    }
    out.push({ slide, index, variant, ground, alternates: fitting.map((f) => f.v).filter((v) => v !== variant), notes });
  });
  return out;
}

export function rankVariants(
  deck: Deck, vl: VisualLanguage, archetype: string, content: Record<string, unknown>,
  slideId: string, prev?: Variant, prev2?: Variant,
): { fitting: Ranked[]; rejected: Ranked[] } {
  const allow = vl.composition.variant_allow[archetype];
  const pool = variantsFor(archetype).filter((v) => !allow || allow.includes(v.variant));
  const all = pool.map((v) => ({ v, cap: checkCapacity(v, content, deck.design.aspect) }));
  const scored = all
    .filter(({ cap }) => cap.fits)
    .map((r) => {
      let score = vl.composition.variant_weights?.[`${archetype}.${r.v.variant}`] ?? 1;
      if (prev && r.v === prev) score -= 3;
      if (prev2 && r.v === prev2) score -= 1;
      if (prev && Boolean(r.v.image_led) !== Boolean(prev.image_led)) score += 1;
      score -= 2 * r.cap.soft.length;
      score += r.cap.headroom;
      return { ...r, score, tie: hash(`${deck.id}:${slideId}:${r.v.variant}`) };
    });
  scored.sort((a, b) => b.score - a.score || a.tie - b.tie);
  return { fitting: scored, rejected: all.filter(({ cap }) => !cap.fits) };
}

function fallbackVariant(archetype: string): Variant {
  const any = variantsFor(archetype)[0] ?? getVariant("freeform", "block");
  if (!any) throw new Error(`No variants registered for archetype "${archetype}" and no freeform fallback`);
  return any;
}

function chooseGround(vl: VisualLanguage, archetype: string, previous: Ground[], index: number, total: number, sameRoleBefore: number): Ground {
  const g = vl.composition.grounds;
  const accents = (vl.tokens.palettes.default?.["ground.accent"] as string[] | undefined)?.length ?? 0;
  const byRole = g.by_role?.[archetype];
  const fallback: Ground = g.default ?? "base";
  const last = previous.at(-1);
  let pick: Ground;

  switch (g.rotation) {
    case "role-based":
      // several grounds for a role → cycle through them each time that role recurs
      pick = byRole?.length ? byRole[sameRoleBefore % byRole.length]! : fallback;
      break;
    case "cycle": {
      if (byRole?.length) { pick = byRole[0]!; break; }
      if (!accents) { pick = fallback; break; }
      const lastAccent = previous.filter((p) => p.startsWith("accent:")).at(-1);
      const next = lastAccent ? (Number(lastAccent.split(":")[1]) + 1) % accents : 0;
      pick = `accent:${next}`;
      break;
    }
    case "alternate":
      pick = byRole?.[0] ?? (last === "inverse" ? "base" : index === 0 ? fallback : "inverse");
      break;
    case "uniform":
      pick = index === total - 1 && byRole?.[0] ? byRole[0] : fallback;
      break;
  }

  const max = g.max_consecutive_same;
  if (max && previous.length >= max && previous.slice(-max).every((p) => p === pick)) {
    pick = pick === "base" ? "inverse" : "base";
  }
  return pick;
}

const groundKindOf = (g: Ground) => (g.startsWith("accent") ? "accent" : g) as "base" | "inverse" | "accent" | "image";

/** FNV-1a, 32-bit */
export function hash(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}
