import type { Extracted, MdItem } from "./parse";

type Content = Record<string, unknown>;
interface Mapped { archetype: string; content: Content; warnings: string[] }

const NUMERIC_LEAD = /^[+\-−~≈]?[₹$€£¥]?\s?[\d.,]+\s?(%|x|×|k|K|M|B|Cr|L|bn|mn)?\+?$/;
const SECTION_TITLE = /^(\d{1,3})[\s.:—–-]+(.+)$/;

/** Map extracted Markdown onto an archetype's slot names. Unused content is reported, never silently dropped. */
export function mapToArchetype(ex: Extracted, pos: { index: number; total: number }): Mapped {
  const archetype = ex.directives.archetype ?? classify(ex, pos);
  const mapper = MAPPERS[archetype];
  if (!mapper) return { archetype, content: generic(ex), warnings: [`no Markdown mapper for "${archetype}"; generic slots used`] };
  const warnings: string[] = [];
  const content = prune(mapper(ex, warnings));
  return { archetype, content, warnings };
}

/** Content-shape classifier (deck-template-system.md §11.6). */
export function classify(ex: Extracted, { index, total }: { index: number; total: number }): string {
  if (ex.table) return "table";
  if (ex.quote && !ex.title && !ex.lists.length) return "quote";
  const list = ex.lists[0];
  if (list?.length && list.every((i) => i.lead && NUMERIC_LEAD.test(i.lead))) return "metric";
  if (list?.length) return "bullets";
  if (index === 0) return "title";
  if (ex.title && SECTION_TITLE.test(ex.title) && ex.paragraphs.length <= 1) return "section";
  if (index === total - 1 && ex.paragraphs.length <= 2) return "closing";
  return "text";
}

const MAPPERS: Record<string, (ex: Extracted, warn: string[]) => Content> = {
  title: (ex, warn) => {
    const [a, b, ...rest] = ex.lines;
    if (rest.length) warn.push(`${rest.length} extra line(s) ignored on title slide`);
    return ex.subtitle
      ? { eyebrow: ex.eyebrow, title: ex.title, subtitle: ex.subtitle, date: a }
      : { eyebrow: ex.eyebrow, title: ex.title, subtitle: a, date: b };
  },

  section: (ex) => {
    const m = ex.title ? SECTION_TITLE.exec(ex.title) : null;
    return {
      number: m?.[1] ?? ex.eyebrow,
      title: m?.[2] ?? ex.title,
      kicker: ex.subtitle ?? ex.lines[0],
    };
  },

  text: (ex, warn) => {
    if (ex.lists.length) warn.push("lists on a text slide were appended to the body");
    const listText = ex.lists.flat().map(itemText);
    return { eyebrow: ex.eyebrow, title: ex.title, lead: ex.subtitle, body: [...ex.paragraphs, ...listText] };
  },

  bullets: (ex, warn) => {
    if (ex.lists.length > 1) warn.push("only the first list is used; others were merged into it");
    return {
      eyebrow: ex.eyebrow,
      title: ex.title,
      intro: ex.subtitle ?? ex.paragraphs[0],
      items: ex.lists.flat().map((i) => (i.lead ? { title: i.lead, text: i.rest || undefined } : { title: i.rest })),
    };
  },

  metric: (ex) => ({
    eyebrow: ex.eyebrow,
    title: ex.title,
    items: (ex.lists[0] ?? []).map((i) => {
      const [label, note] = splitOnce(i.rest, /\s+[—–]\s+|\s+-\s+/);
      return { value: i.lead ?? "", label, note, emphasis: i.flags.has("emphasis") || undefined };
    }),
    source: ex.quote?.replace(/^source:\s*/i, "") ?? undefined,
  }),

  table: (ex) => ({
    eyebrow: ex.eyebrow,
    title: ex.title,
    table: ex.table,
    note: ex.quote ?? ex.paragraphs[0],
  }),

  quote: (ex) => {
    const numeric = ex.eyebrow && /^[#№]?\s?\d{1,4}$/.test(ex.eyebrow);
    return {
      number: numeric ? ex.eyebrow!.replace(/^[#№]\s?/, "") : undefined,
      eyebrow: numeric ? undefined : ex.eyebrow,
      quote: ex.quote ?? ex.title ?? ex.paragraphs[0],
      attribution: ex.lines.find((l) => l !== ex.quote)?.replace(/^[—–-]\s*/, ""),
    };
  },

  closing: (ex) => ({
    title: ex.title,
    body: ex.subtitle ?? ex.lines[0],
    contact: ex.subtitle ? ex.lines[0] : ex.lines[1],
  }),
};

function generic(ex: Extracted): Content {
  return prune({ eyebrow: ex.eyebrow, title: ex.title, body: ex.paragraphs });
}

const itemText = (i: MdItem) => (i.lead ? `${i.lead} — ${i.rest}` : i.rest);

function splitOnce(s: string, re: RegExp): [string, string | undefined] {
  const m = re.exec(s);
  if (!m) return [s.trim(), undefined];
  return [s.slice(0, m.index).trim(), s.slice(m.index + m[0].length).trim() || undefined];
}

/** Drop undefined/empty values so optional slots stay absent (schemas reject nulls). */
function prune<T>(v: T): T {
  if (Array.isArray(v)) return v.map(prune).filter((x) => x !== undefined) as T;
  if (v && typeof v === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, x] of Object.entries(v)) {
      const p = prune(x);
      if (p === undefined || p === "" || (Array.isArray(p) && p.length === 0)) continue;
      out[k] = p;
    }
    return out as T;
  }
  return v;
}
