import "../engine/registry-vite";
import { escapeHtml, richFromDom } from "../engine/compiler";
import { fitSlide, type FitIssue } from "../engine/fit";
import { DeckDoc, type Op } from "../engine/ops";
import { baseCss, variants, visualLanguages } from "../engine/registry";
import { renderDeck, renderSlide } from "../engine/render";
import { tokensToCss } from "../engine/tokens";
import type { Aspect, Deck, PlannedSlide } from "../engine/types";
import { validateDeck } from "../engine/validate";
import { parseMarkdownDeck } from "../markdown/parse";

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const e = escapeHtml;

// ---------- catalogue: what each template is, from its own folder ----------

interface Manifest { name?: string; tags?: string[]; best_for?: string[]; fonts?: { family: string }[] }
const manifests = import.meta.glob<Manifest>("../../vl/*/manifest.json", { eager: true, import: "default" });
const styleDna = import.meta.glob<string>("../../vl/*/style-dna.md", { eager: true, query: "?raw", import: "default" });
const vlFile = <T>(files: Record<string, T>, id: string, file: string): T | undefined => files[`../../vl/${id}/${file}`];

const fixtures = Object.fromEntries(
  Object.entries(import.meta.glob<string>("../../fixtures/*.md", { eager: true, query: "?raw", import: "default" })).map(([p, md]) => [
    p.split("/").at(-1)!.replace(/\.md$/, ""),
    md,
  ]),
);
const fixtureTitle = (name: string) => /^title:\s*(.+)$/m.exec(fixtures[name] ?? "")?.[1]?.trim() ?? name;

const CORPORATE = new Set(["professional", "data", "research", "saas", "tech"]);
interface TemplateInfo { id: string; name: string; category: string; blurb: string; bestFor: string[]; fonts: string[]; palette: string[]; fixture: string }

/** "draft" is the engine's own test language, not a template people pick. */
const templates: TemplateInfo[] = Object.keys(visualLanguages)
  .filter((id) => id !== "draft")
  .map((id) => {
    const m = vlFile(manifests, id, "manifest.json") ?? {};
    const dna = vlFile(styleDna, id, "style-dna.md") ?? "";
    const para = dna.split("\n").find((l) => l.trim() && !l.startsWith("#")) ?? "";
    const p = visualLanguages[id]!.tokens.palettes.default ?? {};
    const swatch = (k: string) => (Array.isArray(p[k]) ? (p[k] as string[])[0] : (p[k] as string | undefined));
    const palette = ["ground.base", "ground.inverse", ...(Array.isArray(p["ground.accent"]) ? (p["ground.accent"] as string[]).map((_, i) => `ground.accent.${i}`) : []), "emphasis", "signal"]
      .map((k) => (k.startsWith("ground.accent.") ? (p["ground.accent"] as string[])[Number(k.split(".").at(-1))] : swatch(k)))
      .filter((c, i, all): c is string => !!c && all.indexOf(c) === i)
      .slice(0, 6);
    return {
      id,
      name: m.name ?? id,
      category: (m.tags ?? []).some((t) => CORPORATE.has(t)) ? "Corporate" : "Creative",
      blurb: (para.match(/^[^.]+\./)?.[0] ?? para).trim(),
      bestFor: m.best_for ?? [],
      fonts: [...new Set((m.fonts ?? []).map((f) => f.family))],
      palette,
      fixture: id in fixtures ? id : "sample",
    };
  })
  .sort((a, b) => a.name.localeCompare(b.name));
const templateById = Object.fromEntries(templates.map((t) => [t.id, t]));

// ---------- home: the template list ----------

const homeEl = $<HTMLElement>("home");
const studioEl = $<HTMLElement>("studio");
const listEl = $<HTMLOListElement>("tl");
$("home-count").textContent = `${templates.length} templates`;

listEl.innerHTML = templates
  .map(
    (t) => `<li class="tl-row" data-vl="${e(t.id)}">
  <button type="button" class="tl-head" aria-expanded="false">
    <span class="tl-name">${e(t.name)}</span>
    <span class="tl-cat">${e(t.category)}</span>
  </button>
  <div class="tl-reveal"><div class="tl-reveal__inner">
    <div class="tl-cover" aria-hidden="true"></div>
    <div class="tl-info">
      <p class="tl-blurb">${e(t.blurb)}</p>
      <dl class="tl-facts">
        <div><dt>Best for</dt><dd>${e(t.bestFor.join(", "))}</dd></div>
        <div><dt>Typefaces</dt><dd>${e(t.fonts.join(", "))}</dd></div>
        <div><dt>Colours</dt><dd class="tl-swatches">${t.palette.map((c) => `<span style="background:${e(c)}" title="${e(c)}"></span>`).join("")}</dd></div>
      </dl>
      <span class="tl-open">Open template →</span>
    </div>
  </div></div>
</li>`,
  )
  .join("");

// Cover CSS: shared layouts once, plus each template's tokens and skin under its own scope.
const coverDecks: Record<string, Deck> = {};
for (const t of templates) {
  const { deck } = parseMarkdownDeck(fixtures[t.fixture]!);
  coverDecks[t.id] = { ...deck, design: { ...deck.design, visual_language: t.id, aspect: "16:9" } };
}
$("home-css").textContent = [baseCss, ...variants.map((v) => v.css), ...templates.map((t) => tokensToCss(visualLanguages[t.id]!, coverDecks[t.id]!, `.deck.vl-${t.id}`) + visualLanguages[t.id]!.skinCss)].join("\n");

let activeRow: HTMLElement | null = null;
function activate(row: HTMLElement) {
  if (row === activeRow) return;
  activeRow?.classList.remove("is-active");
  activeRow?.querySelector(".tl-head")?.setAttribute("aria-expanded", "false");
  activeRow = row;
  row.classList.add("is-active");
  row.querySelector(".tl-head")!.setAttribute("aria-expanded", "true");
  void renderCover(row);
}

async function renderCover(row: HTMLElement) {
  const host = row.querySelector<HTMLElement>(".tl-cover")!;
  if (host.dataset.ready) return;
  host.dataset.ready = "1";
  const id = row.dataset.vl!;
  const r = renderDeck(coverDecks[id]!);
  host.innerHTML = `<div class="deck ${r.scopeClass}" style="--frame-w:${r.frame.w}px;--frame-h:${r.frame.h}px"><div class="frame"><div class="frame__scaler">${r.slides[0]}</div></div></div>`;
  const scale = () => {
    const s = host.clientWidth / r.frame.w;
    const f = host.querySelector<HTMLElement>(".frame")!;
    f.style.width = `${r.frame.w * s}px`;
    f.style.height = `${r.frame.h * s}px`;
    (f.firstElementChild as HTMLElement).style.transform = `scale(${s})`;
  };
  scale();
  new ResizeObserver(scale).observe(host);
  await document.fonts.ready;
  const slide = host.querySelector<HTMLElement>(".slide");
  if (slide) fitSlide(slide);
}

// a short hover delay: opening one row collapses another, so the list shifts under the pointer
let hoverTimer = 0;
listEl.addEventListener("mouseover", (ev) => {
  const row = (ev.target as HTMLElement).closest<HTMLElement>(".tl-row");
  clearTimeout(hoverTimer);
  if (row && row !== activeRow) hoverTimer = window.setTimeout(() => activate(row), 140);
});
listEl.addEventListener("mouseleave", () => clearTimeout(hoverTimer));
listEl.addEventListener("focusin", (ev) => {
  const row = (ev.target as HTMLElement).closest<HTMLElement>(".tl-row");
  if (row) activate(row);
});
listEl.addEventListener("click", (ev) => {
  const row = (ev.target as HTMLElement).closest<HTMLElement>(".tl-row");
  if (!row) return;
  // first tap on touch screens only opens the row
  if (row !== activeRow) return activate(row);
  openTemplate(row.dataset.vl!);
});

// ---------- studio: one template, its slides and content ----------

const deckEl = $<HTMLDivElement>("deck");
const mdEl = $<HTMLTextAreaElement>("md");
const jsonEl = $<HTMLPreElement>("json");
const issuesEl = $<HTMLOListElement>("issues");
const notesEl = $<HTMLDetailsElement>("notes");
const statusEl = $<HTMLParagraphElement>("status");
const aspectEl = $<HTMLSelectElement>("aspect");
const vlEl = $<HTMLSelectElement>("vl");
const fixtureEl = $<HTMLSelectElement>("fixture");
const editEl = $<HTMLInputElement>("edit");
const panelEl = $<HTMLElement>("panel");
const cssEl = document.getElementById("deck-css") as HTMLStyleElement;

for (const t of templates) vlEl.add(new Option(t.name, t.id));
for (const name of Object.keys(fixtures).sort((a, b) => fixtureTitle(a).localeCompare(fixtureTitle(b)))) fixtureEl.add(new Option(fixtureTitle(name), name));

let doc: DeckDoc | undefined;
let mdWarnings: { slide: string; message: string }[] = [];
let renderToken = 0;

function openTemplate(id: string, fixture = templateById[id]?.fixture ?? "sample", push = true) {
  homeEl.hidden = true;
  studioEl.hidden = false;
  document.title = `${templateById[id]?.name ?? id} · Deck Templates`;
  if (push) history.pushState({ t: id }, "", `?t=${encodeURIComponent(id)}`);
  fixtureEl.value = fixture;
  mdEl.value = fixtures[fixture]!;
  loadMarkdown(mdEl.value, id);
  window.scrollTo(0, 0);
}

function showHome(push = true) {
  studioEl.hidden = true;
  homeEl.hidden = false;
  document.title = "Deck Templates";
  if (push) history.pushState({}, "", location.pathname);
}

/**
 * Markdown is the authoring source: every change re-parses into deck.json and re-renders through the same templates.
 * The template and slide size picked in the bar win over whatever the Markdown front matter says.
 */
function loadMarkdown(md: string, templateId = doc?.deck.design.visual_language) {
  const { deck, warnings } = parseMarkdownDeck(md);
  if (templateId) deck.design.visual_language = templateId;
  if (doc) deck.design.aspect = doc.deck.design.aspect;
  mdWarnings = warnings;
  doc = new DeckDoc(deck);
  aspectEl.value = deck.design.aspect;
  vlEl.value = deck.design.visual_language.split("@")[0]!;
  void renderAll();
}

async function renderAll() {
  if (!doc) return;
  const token = ++renderToken;
  const t0 = performance.now();
  const deck = doc.deck;
  const validation = validateDeck(deck);
  const rendered = renderDeck(deck);
  const t1 = performance.now();

  cssEl.textContent = rendered.css;
  deckEl.className = `deck ${rendered.scopeClass}${editEl.checked ? " is-editing" : ""}`;
  deckEl.style.setProperty("--frame-w", `${rendered.frame.w}px`);
  deckEl.style.setProperty("--frame-h", `${rendered.frame.h}px`);
  deckEl.innerHTML = rendered.plan.map((p, i) => frameHtml(p, rendered.slides[i]!)).join("");
  scaleFrames(rendered.frame);

  await document.fonts.ready;
  if (token !== renderToken) return;

  const fitIssues: FitIssue[] = [];
  const swaps: string[] = [];
  rendered.plan.forEach((p) => {
    let issues = fitIn(p.slide.id);
    // Ladder step 4: swap to the next variant that fits (only for unpinned slides).
    if (issues.length && !p.slide.variant) {
      for (const alt of p.alternates) {
        replaceSlide(p.slide.id, renderSlide(deck, { ...p, variant: alt }, rendered.vl));
        const altIssues = fitIn(p.slide.id);
        if (!altIssues.length) {
          swaps.push(`Slide ${p.index + 1}: switched to the “${alt.variant}” layout so the text fits`);
          p.variant = alt;
          issues = [];
          break;
        }
      }
      if (issues.length) replaceSlide(p.slide.id, renderSlide(deck, p, rendered.vl)), (issues = fitIn(p.slide.id));
    }
    fitIssues.push(...issues);
    setMeta(p, issues);
  });

  const t2 = performance.now();
  const planNotes = rendered.plan.flatMap((p) => p.notes.map((n) => ({ n: p.index + 1, text: n })));
  showIssues(validation, fitIssues, swaps, planNotes, rendered.plan);
  jsonEl.textContent = JSON.stringify(deck, null, 2);
  statusEl.textContent = `${deck.slides.length} slides · drawn in ${(t1 - t0).toFixed(0)} ms · fitted in ${(t2 - t1).toFixed(0)} ms`;
}

function frameHtml(p: PlannedSlide, html: string) {
  return `<figure class="frame-host" data-host="${e(p.slide.id)}" style="margin:0">
    <div class="frame"><div class="frame__scaler">${html}</div></div>
    <figcaption class="frame-meta"></figcaption>
  </figure>`;
}

function setMeta(p: PlannedSlide, issues: FitIssue[]) {
  const cap = deckEl.querySelector(`[data-host="${p.slide.id}"] .frame-meta`);
  if (!cap) return;
  const pin = p.slide.variant ? " · chosen in content" : "";
  cap.innerHTML = `<span>Slide ${p.index + 1}</span><span>${e(p.slide.archetype)} · ${e(p.variant.variant)} layout${pin}</span>${
    issues.length ? `<span class="warn">${issues.length} text ${issues.length === 1 ? "box doesn’t" : "boxes don’t"} fit</span>` : ""
  }`;
}

function slideEl(id: string) {
  return deckEl.querySelector<HTMLElement>(`[data-host="${id}"] .slide`);
}

function replaceSlide(id: string, html: string) {
  const el = slideEl(id);
  if (el) el.outerHTML = html;
}

function fitIn(id: string): FitIssue[] {
  const el = slideEl(id);
  if (!el) return [];
  for (const n of el.querySelectorAll<HTMLElement>("[data-fit], [data-overflow]")) {
    n.style.fontSize = "";
    n.style.lineHeight = "";
    delete n.dataset.overflow;
  }
  return fitSlide(el);
}

function scaleFrames(frame: { w: number; h: number }) {
  const width = Math.min(deckEl.clientWidth, 1280);
  const s = width / frame.w;
  for (const f of deckEl.querySelectorAll<HTMLElement>(".frame")) {
    f.style.width = `${frame.w * s}px`;
    f.style.height = `${frame.h * s}px`;
    (f.firstElementChild as HTMLElement).style.transform = `scale(${s})`;
  }
}

/** Notes are secondary: one quiet line ("3 layout notes"), expanded only on request. Wording is for people, not the engine. */
function showIssues(
  validation: { path: string; message: string }[],
  fit: FitIssue[],
  swaps: string[],
  planNotes: { n: number; text: string }[],
  plan: PlannedSlide[],
) {
  const slideNo = (id: string) => (plan.find((p) => p.slide.id === id)?.index ?? 0) + 1;
  const li = (cls: string, text: string) => `<li class="${cls}">${e(text)}</li>`;
  const items = [
    ...validation.map((v) => li("is-error", `Content problem · ${v.path}: ${v.message}`)),
    ...mdWarnings.map((w) => li("", `Content · ${w.slide}: ${w.message}`)),
    ...planNotes.map((p) => li("", `Slide ${p.n}: ${p.text}`)),
    ...fit.map((f) => li("", `Slide ${slideNo(f.slideId)}: text in “${f.slot}” doesn’t fit (${f.kind})`)),
    ...swaps.map((s) => li("is-info", s)),
  ];
  issuesEl.innerHTML = items.join("");
  const errors = validation.length + fit.length;
  $("notes-summary").textContent = items.length
    ? `${items.length} layout ${items.length === 1 ? "note" : "notes"}${errors ? ` · ${errors} need attention` : ""}`
    : "";
  notesEl.hidden = !items.length || !$<HTMLInputElement>("show-notes").checked;
  notesEl.classList.toggle("has-errors", errors > 0);
}

// ---------- inline editing: DOM edits become ops on deck.json ----------

let typingTimer = 0;

deckEl.addEventListener("click", (ev) => {
  if (!editEl.checked) return;
  const el = (ev.target as HTMLElement).closest<HTMLElement>("[data-slot-type='text'], [data-slot-type='rich']");
  if (!el || el.isContentEditable) return;
  el.contentEditable = "plaintext-only";
  el.focus();
});

deckEl.addEventListener("input", (ev) => {
  const el = ev.target as HTMLElement;
  if (!el.dataset.slot || !doc) return;
  clearTimeout(typingTimer);
  typingTimer = window.setTimeout(() => {
    doc!.applyMerged(opFor(el, slotValue(el)));
    const id = el.closest<HTMLElement>(".slide")?.dataset.slideId;
    if (id) fitIn(id);
    jsonEl.textContent = JSON.stringify(doc!.deck, null, 2);
  }, 80);
});

deckEl.addEventListener("keydown", (ev) => {
  const el = ev.target as HTMLElement;
  if (el.isContentEditable && ev.key === "Enter") {
    ev.preventDefault();
    el.blur();
  }
});

deckEl.addEventListener(
  "blur",
  (ev) => {
    const el = ev.target as HTMLElement;
    if (!el.isContentEditable || !doc) return;
    clearTimeout(typingTimer);
    const value = slotValue(el);
    const current = readSlot(el);
    if (current !== value) doc.applyMerged(opFor(el, value));
    doc.seal();
    el.removeAttribute("contenteditable");
    $("panel-hint").textContent = "You edited text on the slides, so the slides are now ahead of this Markdown. Typing here will replace those edits.";
    void renderAll();
  },
  true,
);

function opFor(el: HTMLElement, value: string): Op {
  const path = el.dataset.slot!;
  if (el.dataset.editable === "deck") return { op: "set", path, value };
  return { op: "set", slideId: el.closest<HTMLElement>(".slide")!.dataset.slideId!, path, value };
}

function readSlot(el: HTMLElement): unknown {
  const path = el.dataset.slot!.replace(/\[(\d+)\]/g, ".$1").split(".");
  let cur: unknown = el.dataset.editable === "deck" ? doc!.deck : doc!.deck.slides.find((s) => s.id === el.closest<HTMLElement>(".slide")?.dataset.slideId);
  for (const p of path) cur = (cur as Record<string, unknown> | undefined)?.[p];
  return cur;
}

function slotValue(el: HTMLElement): string {
  return el.dataset.slotType === "rich" ? richFromDom(el) : el.textContent ?? "";
}

// ---------- controls ----------

let mdTimer = 0;
mdEl.addEventListener("input", () => {
  clearTimeout(mdTimer);
  mdTimer = window.setTimeout(() => loadMarkdown(mdEl.value), 150);
});
fixtureEl.addEventListener("change", () => {
  mdEl.value = fixtures[fixtureEl.value]!;
  loadMarkdown(mdEl.value);
});
aspectEl.addEventListener("change", () => {
  if (!doc) return;
  doc.deck.design.aspect = aspectEl.value as Aspect;
  void renderAll();
});
vlEl.addEventListener("change", () => {
  if (!doc) return;
  doc.deck.design.visual_language = vlEl.value;
  history.replaceState({ t: vlEl.value }, "", `?t=${encodeURIComponent(vlEl.value)}`);
  document.title = `${templateById[vlEl.value]?.name ?? vlEl.value} · Deck Templates`;
  void renderAll();
});
editEl.addEventListener("change", () => deckEl.classList.toggle("is-editing", editEl.checked));
$("undo").addEventListener("click", () => doc?.undo() && renderAll());
$("redo").addEventListener("click", () => doc?.redo() && renderAll());
document.addEventListener("keydown", (ev) => {
  if (studioEl.hidden || (ev.target as HTMLElement).isContentEditable || ev.target === mdEl) return;
  if ((ev.metaKey || ev.ctrlKey) && ev.key.toLowerCase() === "z") {
    ev.preventDefault();
    if (ev.shiftKey ? doc?.redo() : doc?.undo()) void renderAll();
  }
});

// left panel: Content (Markdown) by default, Deck data (JSON) as a quiet second tab; closing it gives the slides the full width
const rescale = () => doc && scaleFrames(renderDeck(doc.deck).frame);
function setPanel(open: boolean) {
  panelEl.hidden = !open;
  $("toggle-panel").setAttribute("aria-pressed", String(open));
  rescale();
}
function setTab(tab: "md" | "json") {
  $("tab-md").setAttribute("aria-selected", String(tab === "md"));
  $("tab-json").setAttribute("aria-selected", String(tab === "json"));
  mdEl.hidden = tab !== "md";
  $("panel-hint").hidden = tab !== "md";
  jsonEl.hidden = tab !== "json";
}
$("toggle-panel").addEventListener("click", () => setPanel(panelEl.hasAttribute("hidden")));
$("close-panel").addEventListener("click", () => setPanel(false));
$("tab-md").addEventListener("click", () => setTab("md"));
$("tab-json").addEventListener("click", () => setTab("json"));
$("show-json").addEventListener("click", () => {
  setPanel(true);
  setTab("json");
  (document.querySelector(".more") as HTMLDetailsElement).open = false;
});
$<HTMLInputElement>("show-meta").addEventListener("change", (ev) => deckEl.parentElement!.classList.toggle("show-meta", (ev.target as HTMLInputElement).checked));
$<HTMLInputElement>("show-notes").addEventListener("change", () => (notesEl.hidden = !$<HTMLInputElement>("show-notes").checked || !issuesEl.children.length));
document.addEventListener("click", (ev) => {
  const more = document.querySelector<HTMLDetailsElement>(".more")!;
  if (more.open && !more.contains(ev.target as Node)) more.open = false;
});
window.addEventListener("resize", rescale);

$("back").addEventListener("click", () => showHome());
window.addEventListener("popstate", () => route(false));

function route(push: boolean) {
  const q = new URLSearchParams(location.search);
  // ?t=<template> opens a template; the older ?deck=<sample> links still work
  const t = q.get("t");
  const legacy = q.get("deck");
  if (t && templateById[t]) return openTemplate(t, templateById[t]!.fixture, push);
  if (legacy && legacy in fixtures) {
    const vl = /^visual_language:\s*(\S+)/m.exec(fixtures[legacy]!)?.[1] ?? "draft";
    return openTemplate(vl, legacy, push);
  }
  showHome(push);
  if (!activeRow) activate(listEl.querySelector<HTMLElement>(".tl-row")!);
}
route(false);
