import type { List, ListItem, Paragraph, PhrasingContent, Root, RootContent, Table } from "mdast";
import { toString } from "mdast-util-to-string";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { FRAMES, type Aspect, type Deck, type Ground, type Slide } from "../engine/types";
import { mapToArchetype } from "./mappers";

/** Everything a slide chunk contained, before it is mapped onto an archetype's slots. */
export interface Extracted {
  directives: Record<string, string>;
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  /** paragraphs with soft line breaks joined by spaces */
  paragraphs: string[];
  /** every non-empty line of every paragraph — for short-line slides (title, section, closing) */
  lines: string[];
  lists: MdItem[][];
  table?: { columns: string[]; rows: string[][]; highlight_row?: number };
  quote?: string;
  image?: { src: string; alt: string };
}

export interface MdItem {
  /** text of a leading **bold** run, if the item starts with one */
  lead?: string;
  /** remaining text after the lead (leading separators stripped) */
  rest: string;
  flags: Set<string>;
  /** items of a nested sub-list */
  points?: string[];
}

export interface ParseResult {
  deck: Deck;
  warnings: { slide: string; message: string }[];
}

const processor = unified().use(remarkParse).use(remarkGfm);
const FLAG = /\s*\{(emphasis|highlight)\}\s*/g;
const GROUND = /^(base|inverse|image|accent:\d{1,2})$/;

/**
 * Markdown → deck.json. Slides are separated by a line containing only `---`.
 * An optional front-matter block (`---` … `---` at the very top) sets deck meta/design.
 * A comment like `<!-- archetype: metric; variant: row; ground: inverse; id: s3 -->` sets slide options.
 */
export function parseMarkdownDeck(md: string, defaults: { id?: string; visual_language?: string } = {}): ParseResult {
  const { front, body } = splitFrontMatter(md);
  const chunks = splitSlides(body).filter((c) => c.trim());
  const warnings: ParseResult["warnings"] = [];

  const slides: Slide[] = chunks.map((chunk, i) => {
    const ex = extract(processor.parse(chunk) as Root);
    const id = ex.directives.id ?? `s${i + 1}`;
    const { archetype, content, warnings: w } = mapToArchetype(ex, { index: i, total: chunks.length });
    w.forEach((message) => warnings.push({ slide: id, message }));
    return {
      id,
      archetype,
      variant: ex.directives.variant ?? null,
      ground: GROUND.test(ex.directives.ground ?? "") ? (ex.directives.ground as Ground) : null,
      content,
    };
  });

  const deck: Deck = {
    id: front.id ?? defaults.id ?? "deck_local",
    version: 1,
    meta: {
      title: front.title ?? (slides[0]?.content.title as string | undefined) ?? "Untitled deck",
      ...(front.subtitle && { subtitle: front.subtitle }),
      ...(front.author && { author: front.author }),
      ...(front.date && { date: front.date }),
      ...(front.locale && { locale: front.locale }),
      ...(front.running_label && { running_label: front.running_label }),
    },
    design: {
      visual_language: front.visual_language ?? defaults.visual_language ?? "draft",
      theme: {
        ...(front.palette && { palette: front.palette }),
        ...(front.density && { density: front.density as "airy" | "regular" | "compact" }),
        ...(front.ornament && { ornament: front.ornament as "none" | "subtle" | "standard" | "bold" }),
      },
      aspect: front.aspect && front.aspect in FRAMES ? (front.aspect as Aspect) : "16:9",
    },
    slides,
  };
  return { deck, warnings };
}

function splitFrontMatter(md: string): { front: Record<string, string>; body: string } {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(md);
  if (!m || !/^\s*[\w-]+\s*:/m.test(m[1]!)) return { front: {}, body: md };
  const front: Record<string, string> = {};
  for (const line of m[1]!.split(/\r?\n/)) {
    const kv = /^\s*([\w-]+)\s*:\s*(.*?)\s*$/.exec(line);
    if (kv) front[kv[1]!] = kv[2]!.replace(/^["']|["']$/g, "");
  }
  return { front, body: md.slice(m[0].length) };
}

function splitSlides(body: string): string[] {
  const out: string[] = [];
  let cur: string[] = [];
  let fence = false;
  for (const line of body.split(/\r?\n/)) {
    if (/^\s*(```|~~~)/.test(line)) fence = !fence;
    if (!fence && /^---\s*$/.test(line)) {
      out.push(cur.join("\n"));
      cur = [];
    } else cur.push(line);
  }
  out.push(cur.join("\n"));
  return out;
}

function extract(tree: Root): Extracted {
  const ex: Extracted = { directives: {}, paragraphs: [], lines: [], lists: [] };
  const addParagraph = (raw: string) => {
    ex.paragraphs.push(raw.replace(/\s*\n\s*/g, " ").trim());
    ex.lines.push(...raw.split("\n").map((l) => l.trim()).filter(Boolean));
  };
  for (const node of tree.children as RootContent[]) {
    switch (node.type) {
      case "html": {
        const m = /^<!--([\s\S]*?)-->$/.exec(node.value.trim());
        if (m) for (const part of m[1]!.split(/[;\n]/)) {
          const kv = /^\s*([\w-]+)\s*:\s*(.+?)\s*$/.exec(part);
          if (kv) ex.directives[kv[1]!] = kv[2]!;
        }
        break;
      }
      case "heading": {
        // titles keep *emphasis* as the rich "muted" marker; other headings are plain
        const text = (node.depth === 1 ? inlineRich(node.children as PhrasingContent[]) : toString(node)).trim();
        const key = node.depth === 1 ? "title" : node.depth === 2 ? "subtitle" : "eyebrow";
        if (ex[key] == null) ex[key] = text;
        else addParagraph(text);
        break;
      }
      case "paragraph": {
        // a paragraph that is just an image becomes the slide's image
        const only = (node as Paragraph).children.filter((c) => !(c.type === "text" && !c.value.trim()));
        if (only.length === 1 && only[0]!.type === "image") {
          ex.image ??= { src: only[0]!.url, alt: only[0]!.alt ?? "" };
          break;
        }
        addParagraph(toString(node).trim());
        break;
      }
      case "list":
        ex.lists.push((node as List).children.map(parseItem));
        break;
      case "table":
        ex.table = parseTable(node as Table);
        break;
      case "blockquote":
        ex.quote = toString(node).trim();
        break;
    }
  }
  return ex;
}

function inlineRich(nodes: PhrasingContent[]): string {
  return nodes.map((n) => (n.type === "emphasis" ? `*${toString(n)}*` : n.type === "delete" ? `==${toString(n)}==` : toString(n))).join("");
}

function parseItem(li: ListItem): MdItem {
  const first = li.children[0];
  const flags = new Set<string>();
  const clean = (s: string) => s.replace(FLAG, (_, f: string) => (flags.add(f), " ")).trim();
  // a nested list under an item becomes its sub-points
  const nested = li.children.find((c): c is List => c.type === "list");
  const points = nested?.children.map((c) => clean(toString(c))).filter(Boolean);
  const withPoints = (item: MdItem): MdItem => (points?.length ? { ...item, points } : item);
  if (!first || first.type !== "paragraph") return withPoints({ rest: clean(toString(li)), flags });
  const inl = (first as Paragraph).children as PhrasingContent[];
  if (inl[0]?.type === "strong") {
    const lead = clean(toString(inl[0]));
    const rest = clean(inl.slice(1).map((n) => toString(n)).join("")).replace(/^[\s:—–-]+/, "");
    return withPoints({ lead, rest, flags });
  }
  return withPoints({ rest: clean(toString(first)), flags });
}

function parseTable(t: Table): NonNullable<Extracted["table"]> {
  const [head, ...body] = t.children;
  const columns = (head?.children ?? []).map((c) => toString(c).trim());
  let highlight_row: number | undefined;
  const rows = body.map((r, ri) =>
    r.children.map((c) => {
      const text = toString(c);
      if (/\{highlight\}/.test(text)) highlight_row = ri;
      return text.replace(FLAG, " ").trim();
    }),
  );
  return { columns, rows, ...(highlight_row != null && { highlight_row }) };
}
