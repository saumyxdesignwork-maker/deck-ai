// GENERATED from "Deck AI Templates/src/engine" — do not edit here.
// Change the engine there, then run `npm run export:app` in that folder.
/**
 * Tiny logic-less template compiler for variant HTML.
 * Supports {{path}}, {{#each path}}…{{/each}}, {{#if path}}…{{else}}…{{/if}}, {{#eq a b}}…{{else}}…{{/eq}},
 * {{@index}}, {{@../index}} (parent loop) and {{this}}.
 * Every interpolation is HTML-escaped; there is no raw-output form on purpose.
 */

type Node =
  | { t: "text"; v: string }
  | { t: "var"; path: string }
  | { t: "rich"; path: string }
  | { t: "helper"; name: string; path: string }
  | { t: "each"; path: string; body: Node[] }
  | { t: "if"; path: string; body: Node[]; alt: Node[] }
  | { t: "eq"; a: string; b: string; body: Node[]; alt: Node[] };

export type Template = (ctx: Record<string, unknown>) => string;

/**
 * Trusted markup generators callable as {{name path}} (e.g. {{chart content.chart}}).
 * A helper must escape any text it emits; registration happens in engine code only, never from templates.
 */
const helpers: Record<string, (value: unknown) => string> = {};
export function registerHelper(name: string, fn: (value: unknown) => string) {
  helpers[name] = fn;
}

const TAG = /\{\{\s*([#/]?)\s*([^}]*?)\s*\}\}/g;

export function compile(src: string): Template {
  const root: Node[] = [];
  const stack: { node: Node | null; list: Node[] }[] = [{ node: null, list: root }];
  let last = 0;
  for (const m of src.matchAll(TAG)) {
    const top = stack[stack.length - 1]!;
    if (m.index! > last) top.list.push({ t: "text", v: src.slice(last, m.index) });
    last = m.index! + m[0].length;
    const sigil = m[1]!;
    const body = m[2]!;
    if (sigil === "#") {
      const [kw, a = "", b = ""] = body.split(/\s+/);
      let node: Node;
      if (kw === "each") node = { t: "each", path: a, body: [] };
      else if (kw === "if") node = { t: "if", path: a, body: [], alt: [] };
      else if (kw === "eq") node = { t: "eq", a, b, body: [], alt: [] };
      else throw new Error(`Unknown block {{#${kw}}}`);
      top.list.push(node);
      stack.push({ node, list: node.body });
    } else if (sigil === "/") {
      const open = stack.pop();
      if (!open?.node || open.node.t !== body) throw new Error(`Unbalanced {{/${body}}}`);
    } else if (body === "else") {
      const n = top.node;
      if (!n || (n.t !== "if" && n.t !== "eq")) throw new Error("{{else}} outside {{#if}}/{{#eq}}");
      top.list = n.alt;
    } else if (body.startsWith("rich ")) {
      top.list.push({ t: "rich", path: body.slice(5).trim() });
    } else if (/^[a-z]+ \S+$/.test(body) && body.split(" ")[0]! in helpers) {
      const [name, path] = body.split(" ") as [string, string];
      top.list.push({ t: "helper", name, path });
    } else {
      top.list.push({ t: "var", path: body });
    }
  }
  if (stack.length !== 1) throw new Error("Unclosed block in template");
  if (last < src.length) root.push({ t: "text", v: src.slice(last) });
  return (ctx) => run(root, [ctx], []);
}

function run(nodes: Node[], scopes: unknown[], idx: number[]): string {
  let out = "";
  for (const n of nodes) {
    switch (n.t) {
      case "text":
        out += n.v;
        break;
      case "var": {
        const v = lookup(n.path, scopes, idx);
        out += v == null ? "" : escapeHtml(String(v));
        break;
      }
      case "rich": {
        const v = lookup(n.path, scopes, idx);
        out += v == null ? "" : richHtml(String(v));
        break;
      }
      case "helper":
        out += helpers[n.name]!(lookup(n.path, scopes, idx));
        break;
      case "each": {
        const list = lookup(n.path, scopes, idx);
        if (Array.isArray(list)) list.forEach((item, i) => (out += run(n.body, [item, ...scopes], [i, ...idx])));
        break;
      }
      case "if": {
        const v = lookup(n.path, scopes, idx);
        const truthy = Array.isArray(v) ? v.length > 0 : Boolean(v);
        out += run(truthy ? n.body : n.alt, scopes, idx);
        break;
      }
      case "eq": {
        const a = lookup(n.a, scopes, idx);
        const b = lookup(n.b, scopes, idx);
        out += run(a != null && String(a) === String(b) ? n.body : n.alt, scopes, idx);
        break;
      }
    }
  }
  return out;
}

function lookup(path: string, scopes: unknown[], idx: number[]): unknown {
  // literals for {{#eq}}: "text" or a plain number
  if (/^".*"$/.test(path)) return path.slice(1, -1);
  if (/^-?\d+(\.\d+)?$/.test(path)) return Number(path);
  if (path === "@index") return idx[0];
  if (path === "@../index") return idx[1];
  if (path === "this") return scopes[0];
  const segs = splitPath(path);
  for (const scope of scopes) {
    if (scope && typeof scope === "object" && segs[0]! in (scope as object)) return walk(scope, segs);
  }
  return undefined;
}

export function splitPath(path: string): string[] {
  return path.replace(/\[(\d+)\]/g, ".$1").split(".").filter(Boolean);
}

function walk(obj: unknown, segs: string[]): unknown {
  let cur: unknown = obj;
  for (const s of segs) {
    if (cur == null) return undefined;
    cur = (cur as Record<string, unknown>)[s];
  }
  return cur;
}

/**
 * Rich subset for display text: `*muted*` → <em>, `==highlight==` → <mark>.
 * Escapes first, so only these two tags can ever be produced.
 */
export function richHtml(s: string): string {
  return escapeHtml(s)
    .replace(/\*([^*\n]+)\*/g, "<em>$1</em>")
    .replace(/==([^=\n]+)==/g, "<mark>$1</mark>");
}

/** Inverse of richHtml for inline-edited DOM: <em>/<mark> back to markers, everything else to plain text. */
export function richFromDom(el: globalThis.Node): string {
  let out = "";
  el.childNodes.forEach((n) => {
    if (n.nodeType === 3) out += n.textContent ?? "";
    else if ((n as Element).hasAttribute?.("data-slot")) return; // a nested slot (e.g. an index badge) is its own field
    else if (n.nodeName === "EM") out += `*${n.textContent ?? ""}*`;
    else if (n.nodeName === "MARK") out += `==${n.textContent ?? ""}==`;
    else out += richFromDom(n);
  });
  return out;
}

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
