import type { Aspect, SlotSpec, Variant } from "./types";

export interface CapacityResult {
  /** no hard violations: structure fits (item counts, required slots, aspect, word limits, table size) */
  fits: boolean;
  /** hard violations — the variant cannot show this content */
  hard: string[];
  /** soft violations — over the character budget; the fit engine will try to shrink */
  soft: string[];
  /** 0..1 — how much room is left on the tightest constraint */
  headroom: number;
}

/** Static pre-check of content against a variant's declared slot budgets (before any measuring). */
export function checkCapacity(variant: Variant, content: Record<string, unknown>, aspect: Aspect): CapacityResult {
  const hard: string[] = [];
  const soft: string[] = [];
  let headroom = 1;
  if (!variant.supports_aspects.includes(aspect)) hard.push(`aspect ${aspect} unsupported`);

  const visit = (spec: SlotSpec, value: unknown, path: string) => {
    if (value == null || value === "" || (Array.isArray(value) && value.length === 0)) {
      if (!spec.optional) hard.push(`${path} is required`);
      return;
    }
    if (spec.type === "list" && Array.isArray(value)) {
      if (spec.min != null && value.length < spec.min) hard.push(`${path}: ${value.length} items < min ${spec.min}`);
      if (spec.max != null && value.length > spec.max) hard.push(`${path}: ${value.length} items > max ${spec.max}`);
      if (spec.max) headroom = Math.min(headroom, 1 - value.length / (spec.max + 1));
      if (spec.of) value.forEach((item, i) => {
        for (const [k, s] of Object.entries(spec.of!)) visit(s, (item as Record<string, unknown>)?.[k], `${path}[${i}].${k}`);
      });
      return;
    }
    if (spec.type === "table" && typeof value === "object") {
      const t = value as { columns?: unknown[]; rows?: unknown[] };
      if (spec.cols_max && (t.columns?.length ?? 0) > spec.cols_max) hard.push(`${path}: ${t.columns?.length} columns > ${spec.cols_max}`);
      if (spec.rows_max && (t.rows?.length ?? 0) > spec.rows_max) hard.push(`${path}: ${t.rows?.length} rows > ${spec.rows_max}`);
      return;
    }
    if (typeof value === "string" || Array.isArray(value)) {
      const text = Array.isArray(value) ? value.join(" ") : value;
      if (spec.words_max) {
        const words = text.trim().split(/\s+/).length;
        if (words > spec.words_max) hard.push(`${path}: ${words} words > ${spec.words_max}`);
      }
      if (spec.chars_max) {
        if (text.length > spec.chars_max) soft.push(`${path}: ${text.length} chars > ${spec.chars_max}`);
        headroom = Math.min(headroom, 1 - text.length / spec.chars_max);
      }
    }
  };

  for (const [slot, spec] of Object.entries(variant.slots)) visit(spec, content[slot], `content.${slot}`);
  return { fits: hard.length === 0, hard, soft, headroom: Math.max(0, headroom) };
}
