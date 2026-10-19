import { escapeHtml, richFromDom } from "../engine/compiler";
import { fitSlide, type FitIssue } from "../engine/fit";
import { DeckDoc, type Op } from "../engine/ops";
import { visualLanguages } from "../engine/registry";
import { renderDeck, renderSlide } from "../engine/render";
import type { Aspect, PlannedSlide } from "../engine/types";
import { validateDeck } from "../engine/validate";
import { parseMarkdownDeck } from "../markdown/parse";

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const deckEl = $<HTMLDivElement>("deck");
const mdEl = $<HTMLTextAreaElement>("md");
const jsonEl = $<HTMLPreElement>("json");
const issuesEl = $<HTMLOListElement>("issues");
const statusEl = $<HTMLSpanElement>("status");
const aspectEl = $<HTMLSelectElement>("aspect");
const vlEl = $<HTMLSelectElement>("vl");
const editEl = $<HTMLInputElement>("edit");
const cssEl = document.getElementById("deck-css") as HTMLStyleElement;

const fixtures = Object.fromEntries(
  Object.entries(import.meta.glob<string>("../../fixtures/*.md", { eager: true, query: "?raw", import: "default" })).map(([p, md]) => [
    p.split("/").at(-1)!.replace(/\.md$/, ""),
    md,
  ]),
);
const fixtureEl = $<HTMLSelectElement>("fixture");
for (const name of Object.keys(fixtures)) fixtureEl.add(new Option(name, name));
const initialFixture = new URLSearchParams(location.search).get("deck") ?? "gradient-burn";
fixtureEl.value = initialFixture in fixtures ? initialFixture : Object.keys(fixtures)[0]!;

let doc!: DeckDoc;
let mdWarnings: { slide: string; message: string }[] = [];
let renderToken = 0;

for (const id of Object.keys(visualLanguages)) vlEl.add(new Option(id, id));

/**
 * Markdown is the authoring source: every change re-parses into deck.json and re-renders through the same templates.
 * `keepDesign` keeps the aspect/language picked in the toolbar while the user types.
 */
function loadMarkdown(md: string, keepDesign = false) {
  const { deck, warnings } = parseMarkdownDeck(md);
  if (keepDesign && doc) {
    deck.design.aspect = doc.deck.design.aspect;
    deck.design.visual_language = doc.deck.design.visual_language;
  }
  mdWarnings = warnings;
  doc = new DeckDoc(deck);
  aspectEl.value = deck.design.aspect;
  vlEl.value = deck.design.visual_language.split("@")[0]!;
  void renderAll();
}

async function renderAll() {
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
          swaps.push(`${p.slide.id}: ${p.variant.variant} → ${alt.variant} (fit)`);
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
  const planNotes = rendered.plan.flatMap((p) => p.notes.map((n) => `${p.slide.id}: ${n}`));
  showIssues(validation, fitIssues, swaps, planNotes);
  jsonEl.textContent = JSON.stringify(deck, null, 2);
  statusEl.textContent = `${deck.slides.length} slides · render ${(t1 - t0).toFixed(1)} ms · fit ${(t2 - t1).toFixed(1)} ms`;
}

function frameHtml(p: PlannedSlide, html: string) {
  return `<figure class="frame-host" data-host="${escapeHtml(p.slide.id)}" style="margin:0">
    <div class="frame"><div class="frame__scaler">${html}</div></div>
    <figcaption class="frame-meta"></figcaption>
  </figure>`;
}

function setMeta(p: PlannedSlide, issues: FitIssue[]) {
  const cap = deckEl.querySelector(`[data-host="${p.slide.id}"] .frame-meta`);
  if (!cap) return;
  const pin = p.slide.variant ? " (pinned)" : "";
  const e = escapeHtml;
  cap.innerHTML = `<span>${p.index + 1}. ${e(p.slide.id)}</span><span>${e(p.slide.archetype)}/${e(p.variant.variant)}${pin}</span><span>ground: ${e(p.ground)}</span>${
    issues.length ? `<span class="warn">${issues.length} fit issue(s)</span>` : ""
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
  const width = Math.min(deckEl.clientWidth, 1200);
  const s = width / frame.w;
  for (const f of deckEl.querySelectorAll<HTMLElement>(".frame")) {
    f.style.width = `${frame.w * s}px`;
    f.style.height = `${frame.h * s}px`;
    (f.firstElementChild as HTMLElement).style.transform = `scale(${s})`;
  }
}

function showIssues(validation: { path: string; message: string }[], fit: FitIssue[], swaps: string[], planNotes: string[]) {
  const li = (cls: string, text: string) => `<li class="${cls}">${escapeHtml(text)}</li>`;
  const items = [
    ...validation.map((v) => li("is-error", `Schema · ${v.path}: ${v.message}`)),
    ...mdWarnings.map((w) => li("", `Markdown · ${w.slide}: ${w.message}`)),
    ...planNotes.map((n) => li("", `Capacity · ${n}`)),
    ...fit.map((f) => li("", `Fit · ${f.slideId} · ${f.slot}: ${f.kind}`)),
    ...swaps.map((s) => li("is-info", `Layout swap · ${s}`)),
  ];
  issuesEl.innerHTML = items.join("");
}

// ---------- inline editing: DOM edits become ops on deck.json ----------

let typingTimer = 0;

deckEl.addEventListener("click", (e) => {
  if (!editEl.checked) return;
  const el = (e.target as HTMLElement).closest<HTMLElement>("[data-slot-type='text'], [data-slot-type='rich']");
  if (!el || el.isContentEditable) return;
  el.contentEditable = "plaintext-only";
  el.focus();
});

deckEl.addEventListener("input", (e) => {
  const el = e.target as HTMLElement;
  if (!el.dataset.slot) return;
  clearTimeout(typingTimer);
  typingTimer = window.setTimeout(() => {
    doc.applyMerged(opFor(el, slotValue(el)));
    const id = el.closest<HTMLElement>(".slide")?.dataset.slideId;
    if (id) fitIn(id);
    jsonEl.textContent = JSON.stringify(doc.deck, null, 2);
  }, 80);
});

deckEl.addEventListener("keydown", (e) => {
  const el = e.target as HTMLElement;
  if (el.isContentEditable && e.key === "Enter") {
    e.preventDefault();
    el.blur();
  }
});

deckEl.addEventListener(
  "blur",
  (e) => {
    const el = e.target as HTMLElement;
    if (!el.isContentEditable) return;
    clearTimeout(typingTimer);
    const value = slotValue(el);
    const current = readSlot(el);
    if (current !== value) doc.applyMerged(opFor(el, value));
    doc.seal();
    el.removeAttribute("contenteditable");
    markJsonAsSource();
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
  let cur: unknown = el.dataset.editable === "deck" ? doc.deck : doc.deck.slides.find((s) => s.id === el.closest<HTMLElement>(".slide")?.dataset.slideId);
  for (const p of path) cur = (cur as Record<string, unknown> | undefined)?.[p];
  return cur;
}

function markJsonAsSource() {
  statusEl.dataset.note = "edited";
  mdEl.title = "Slides were edited inline; deck.json is now ahead of this Markdown.";
}

// ---------- controls ----------

let mdTimer = 0;
mdEl.addEventListener("input", () => {
  clearTimeout(mdTimer);
  mdTimer = window.setTimeout(() => loadMarkdown(mdEl.value, true), 150);
});
const loadFixture = () => {
  mdEl.value = fixtures[fixtureEl.value]!;
  loadMarkdown(mdEl.value);
};
fixtureEl.addEventListener("change", loadFixture);

aspectEl.addEventListener("change", () => {
  doc.deck.design.aspect = aspectEl.value as Aspect;
  void renderAll();
});
vlEl.addEventListener("change", () => {
  doc.deck.design.visual_language = vlEl.value;
  void renderAll();
});
editEl.addEventListener("change", () => deckEl.classList.toggle("is-editing", editEl.checked));
$("undo").addEventListener("click", () => doc.undo() && renderAll());
$("redo").addEventListener("click", () => doc.redo() && renderAll());
document.addEventListener("keydown", (e) => {
  if ((e.target as HTMLElement).isContentEditable || e.target === mdEl) return;
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
    e.preventDefault();
    if (e.shiftKey ? doc.redo() : doc.undo()) void renderAll();
  }
});

const togglePane = (btn: string, pane: string) => {
  const b = $(btn);
  const p = $(pane);
  b.addEventListener("click", () => {
    p.hidden = !p.hidden;
    b.setAttribute("aria-pressed", String(!p.hidden));
    scaleFrames(renderDeck(doc.deck).frame);
  });
};
togglePane("toggle-md", "pane-md");
togglePane("toggle-json", "pane-json");
window.addEventListener("resize", () => doc && scaleFrames(renderDeck(doc.deck).frame));

loadFixture();

function slotValue(el: HTMLElement): string {
  return el.dataset.slotType === "rich" ? richFromDom(el) : el.textContent ?? "";
}
