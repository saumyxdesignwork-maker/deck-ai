// GENERATED from "Deck AI Templates/src/engine" — do not edit here.
// Change the engine there, then run `npm run export:app` in that folder.
import { escapeHtml } from "./compiler";

export interface ChartData {
  kind: "area" | "bar" | "hbar";
  categories: string[];
  series: { name?: string; values: number[]; labels?: string[] }[];
  /** index into categories of the hero datum */
  highlight?: number;
}

const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0);

/**
 * Data → markup. Only computed numbers and escaped labels are emitted; colours come from CSS classes the
 * visual language styles (.ch-bar, .ch-line, .is-hl …). Uses the first series.
 */
export function chartHtml(raw: unknown): string {
  const c = raw as ChartData | undefined;
  if (!c || !Array.isArray(c.categories) || !c.series?.[0]?.values?.length) return `<div class="ch ch--empty"><span class="t-caption">No data</span></div>`;
  const s = c.series[0];
  const values = c.categories.map((_, i) => num(s.values[i]));
  const labels = c.categories.map((_, i) => escapeHtml(s.labels?.[i] ?? String(values[i])));
  const cats = c.categories.map((x) => escapeHtml(String(x)));
  const max = Math.max(...values, 0) || 1;
  const hl = (i: number) => (i === c.highlight ? " is-hl" : "");

  if (c.kind === "hbar") {
    const rows = values.map(
      (v, i) => `<div class="ch-row${hl(i)}"><span class="ch-cat t-caption">${cats[i]}</span><span class="ch-track"><span class="ch-bar" style="--w:${((v / max) * 100).toFixed(2)}%"></span></span><span class="ch-val t-body-s">${labels[i]}</span></div>`,
    );
    return `<div class="ch ch--hbar">${rows.join("")}</div>`;
  }

  if (c.kind === "bar") {
    const cols = values.map(
      (v, i) => `<div class="ch-col${hl(i)}"><span class="ch-val t-body-s">${labels[i]}</span><span class="ch-bar" style="--h:${((v / max) * 100).toFixed(2)}%"></span><span class="ch-cat t-caption">${cats[i]}</span></div>`,
    );
    return `<div class="ch ch--bar" style="--n:${values.length}">${cols.join("")}</div>`;
  }

  // area: smooth-ish path through points (x evenly spaced, y from 0..max with 8% headroom)
  const W = 1000, H = 400, top = max * 1.08;
  const pts = values.map((v, i) => [values.length === 1 ? W / 2 : (i / (values.length - 1)) * W, H - (v / top) * H] as const);
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const area = `${line} L${W} ${H} L0 ${H} Z`;
  const id = `chg-${hashStr(JSON.stringify(values) + cats.join("|"))}`;
  const hi = c.highlight ?? values.length - 1;
  const [hx, hy] = pts[Math.max(0, Math.min(pts.length - 1, hi))]!;
  return `<div class="ch ch--area">
  <div class="ch-plot">
    <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">
      <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="ch-fill-a"/><stop offset="1" class="ch-fill-b"/></linearGradient></defs>
      <path class="ch-area" d="${area}" fill="url(#${id})"/>
      <path class="ch-line" d="${line}" vector-effect="non-scaling-stroke"/>
    </svg>
    <span class="ch-dot" style="left:${(hx / W) * 100}%;top:${(hy / H) * 100}%"></span>
    <span class="ch-flag t-body-s" style="left:${(hx / W) * 100}%;top:${(hy / H) * 100}%">${labels[hi]}</span>
  </div>
  <div class="ch-x">${cats.map((x) => `<span class="t-caption">${x}</span>`).join("")}</div>
</div>`;
}

function hashStr(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 0x01000193);
  return (h >>> 0).toString(36);
}
