/**
 * Fit engine (deck-template-system.md §11.1, steps 1–3 + 6). Runs in the browser after fonts load.
 * Steps 4 (variant swap) and 5 (split) are driven by the caller using the returned issues.
 */

export interface FitIssue {
  slideId: string;
  slot: string;
  kind: "region-overflow" | "nowrap-overflow" | "out-of-frame";
}

const SHRINK = 0.95;
const MAX_STEPS = 24;

export function fitSlide(section: HTMLElement): FitIssue[] {
  const slideId = section.dataset.slideId ?? "?";
  const issues: FitIssue[] = [];
  const rootStyle = getComputedStyle(section);

  const minFor = (el: HTMLElement, start: number) => {
    const step = el.dataset.minStep;
    const v = step ? parseFloat(rootStyle.getPropertyValue(`--t-${step}-size`)) : NaN;
    return Number.isFinite(v) ? Math.min(v, start) : start * 0.7;
  };

  // 1. nowrap slots (numerals, pills, badges): shrink until they fit their own box.
  for (const el of section.querySelectorAll<HTMLElement>("[data-nowrap][data-fit='shrink']")) {
    shrinkUntil(el, minFor, () => el.scrollWidth > el.clientWidth + 1);
    if (el.scrollWidth > el.clientWidth + 1) {
      el.dataset.overflow = "nowrap";
      issues.push({ slideId, slot: el.dataset.slot ?? "?", kind: "nowrap-overflow" });
    }
  }

  // 2–3. regions: shrink all fit-able slots inside together, then tighten display leading.
  for (const region of section.querySelectorAll<HTMLElement>("[data-region]")) {
    if (!overflows(region)) continue;
    const fitters = [...region.querySelectorAll<HTMLElement>("[data-fit='shrink']")];
    const starts = fitters.map((el) => parseFloat(getComputedStyle(el).fontSize));
    const mins = fitters.map((el, i) => minFor(el, starts[i]!));
    for (let s = 0; s < MAX_STEPS && overflows(region); s++) {
      let changed = false;
      fitters.forEach((el, i) => {
        const cur = parseFloat(el.style.fontSize || String(starts[i]));
        const next = Math.max(mins[i]!, cur * SHRINK);
        if (next < cur - 0.1) { el.style.fontSize = `${next}px`; changed = true; }
      });
      if (!changed) break;
    }
    if (overflows(region)) {
      for (const el of fitters) {
        const lh = parseFloat(getComputedStyle(el).lineHeight) / parseFloat(getComputedStyle(el).fontSize);
        if (Number.isFinite(lh) && lh > 0.95) el.style.lineHeight = String(Math.max(0.9, lh - 0.05));
      }
    }
    if (overflows(region)) {
      const box = region.getBoundingClientRect();
      const slots = [...region.querySelectorAll<HTMLElement>("[data-slot]")].filter((el) => {
        const r = el.getBoundingClientRect();
        return r.bottom > box.bottom + 1 || r.right > box.right + 1;
      });
      (slots.length ? slots : [region]).forEach((el) => {
        el.dataset.overflow = "region";
        issues.push({ slideId, slot: el.dataset.slot ?? region.dataset.region ?? "?", kind: "region-overflow" });
      });
    }
  }

  // Frame-bounds check catches absolutely positioned display text clipped by the slide edge.
  const frame = section.getBoundingClientRect();
  for (const el of section.querySelectorAll<HTMLElement>("[data-slot]")) {
    // data-bleed marks display type designed to run off the frame (e.g. ghost numerals)
    if (el.dataset.overflow || el.closest("[data-bleed]")) continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;
    if (r.left < frame.left - 1 || r.top < frame.top - 1 || r.right > frame.right + 1 || r.bottom > frame.bottom + 1) {
      el.dataset.overflow = "frame";
      issues.push({ slideId, slot: el.dataset.slot ?? "?", kind: "out-of-frame" });
    }
  }
  return issues;
}

function shrinkUntil(el: HTMLElement, minFor: (el: HTMLElement, start: number) => number, bad: () => boolean) {
  const start = parseFloat(getComputedStyle(el).fontSize);
  const min = minFor(el, start);
  let size = start;
  for (let s = 0; s < MAX_STEPS && bad() && size > min; s++) {
    size = Math.max(min, size * SHRINK);
    el.style.fontSize = `${size}px`;
  }
}

/**
 * Compares children's layout boxes with the region's box. Unlike scrollHeight, this ignores
 * glyph spill from tight display leading (line-height < 1), which is intentional, not overflow.
 */
function overflows(region: HTMLElement): boolean {
  const box = region.getBoundingClientRect();
  const tol = box.height / region.offsetHeight || 1; // 1 layout px in (possibly scaled) screen px
  for (const child of region.children) {
    const r = child.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;
    if (r.bottom > box.bottom + tol || r.right > box.right + tol || r.top < box.top - tol || r.left < box.left - tol) return true;
  }
  return false;
}
