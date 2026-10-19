import { splitPath } from "./compiler";
import type { Deck, Ground } from "./types";

/**
 * Edits are operations on the content model, never on the DOM.
 * `slideId` scopes `path` to that slide (e.g. "content.items[1].value"); without it, `path` is deck-relative ("meta.running_label").
 */
export type Op =
  | { op: "set"; slideId?: string; path: string; value: unknown }
  | { op: "insert"; slideId?: string; path: string; index: number; value: unknown }
  | { op: "remove"; slideId?: string; path: string; index: number }
  | { op: "move"; slideId?: string; path: string; from: number; to: number }
  | { op: "setVariant"; slideId: string; variant: string | null }
  | { op: "setGround"; slideId: string; ground: Ground | null }
  | { op: "setTheme"; key: string; value: string };

export class DeckDoc {
  private undoStack: Op[][] = [];
  private redoStack: Op[][] = [];

  constructor(public deck: Deck) {}

  /** Apply ops as one undoable step. */
  apply(...ops: Op[]): void {
    const inverses = ops.map((o) => this.applyOne(o)).reverse();
    this.undoStack.push(inverses);
    this.redoStack = [];
    this.sealed = true;
  }

  /** Coalesce into the previous step (used while typing so one word ≠ one undo step). */
  applyMerged(op: Op): void {
    const inv = this.applyOne(op);
    const prev = this.undoStack.at(-1)?.[0];
    if (!this.sealed && prev && prev.op === "set" && inv.op === "set" && prev.path === inv.path && prev.slideId === inv.slideId) return;
    this.undoStack.push([inv]);
    this.redoStack = [];
    this.sealed = false;
  }

  /** End the current typing burst so the next edit starts a new undo step. */
  seal(): void {
    this.sealed = true;
  }

  private sealed = true;

  undo(): boolean {
    const step = this.undoStack.pop();
    if (!step) return false;
    this.redoStack.push(step.map((o) => this.applyOne(o)).reverse());
    return true;
  }

  redo(): boolean {
    const step = this.redoStack.pop();
    if (!step) return false;
    this.undoStack.push(step.map((o) => this.applyOne(o)).reverse());
    return true;
  }

  /** Applies an op and returns its inverse. */
  private applyOne(o: Op): Op {
    const d = this.deck;
    switch (o.op) {
      case "set": {
        const { parent, key } = this.resolve(o.slideId, o.path, true);
        const before = parent[key];
        if (o.value === undefined) delete parent[key];
        else parent[key] = structuredClone(o.value);
        return { ...o, value: before };
      }
      case "insert": {
        const list = this.list(o.slideId, o.path);
        list.splice(o.index, 0, structuredClone(o.value));
        return { op: "remove", slideId: o.slideId, path: o.path, index: o.index };
      }
      case "remove": {
        const list = this.list(o.slideId, o.path);
        const [removed] = list.splice(o.index, 1);
        return { op: "insert", slideId: o.slideId, path: o.path, index: o.index, value: removed };
      }
      case "move": {
        const list = this.list(o.slideId, o.path);
        const [item] = list.splice(o.from, 1);
        list.splice(o.to, 0, item);
        return { ...o, from: o.to, to: o.from };
      }
      case "setVariant": {
        const s = this.slide(o.slideId);
        const before = s.variant;
        s.variant = o.variant;
        return { ...o, variant: before };
      }
      case "setGround": {
        const s = this.slide(o.slideId);
        const before = s.ground;
        s.ground = o.ground;
        return { ...o, ground: before };
      }
      case "setTheme": {
        const theme = d.design.theme as Record<string, string>;
        const before = theme[o.key];
        theme[o.key] = o.value;
        return { ...o, value: before ?? "" };
      }
    }
  }

  private slide(id: string) {
    const s = this.deck.slides.find((x) => x.id === id);
    if (!s) throw new Error(`No slide "${id}"`);
    return s;
  }

  private resolve(slideId: string | undefined, path: string, create: boolean) {
    const segs = splitPath(path);
    let cur: Record<string, unknown> = slideId ? (this.slide(slideId) as unknown as Record<string, unknown>) : (this.deck as unknown as Record<string, unknown>);
    for (const s of segs.slice(0, -1)) {
      if (cur[s] == null) {
        if (!create) throw new Error(`Path "${path}" not found`);
        cur[s] = {};
      }
      cur = cur[s] as Record<string, unknown>;
    }
    return { parent: cur, key: segs.at(-1)! };
  }

  private list(slideId: string | undefined, path: string): unknown[] {
    const { parent, key } = this.resolve(slideId, path, false);
    const v = parent[key];
    if (!Array.isArray(v)) throw new Error(`"${path}" is not a list`);
    return v;
  }
}
