import Ajv, { type ErrorObject } from "ajv";
import { schemas } from "./registry";
import type { Deck } from "./types";

const ajv = new Ajv({ allErrors: true, strict: false });

const deckSchema = {
  type: "object",
  required: ["id", "version", "meta", "design", "slides"],
  properties: {
    id: { type: "string", minLength: 1 },
    version: { const: 1 },
    meta: {
      type: "object",
      required: ["title"],
      properties: {
        title: { type: "string" }, subtitle: { type: "string" }, author: { type: "string" },
        date: { type: "string" }, locale: { type: "string" }, running_label: { type: "string" },
      },
      additionalProperties: false,
    },
    design: {
      type: "object",
      required: ["visual_language", "theme", "aspect"],
      properties: {
        visual_language: { type: "string" },
        aspect: { enum: ["16:9", "4:3", "1:1", "4:5", "A4"] },
        theme: { type: "object" },
      },
    },
    slides: {
      type: "array",
      items: {
        type: "object",
        required: ["id", "archetype", "content"],
        properties: {
          id: { type: "string" },
          archetype: { type: "string" },
          variant: { type: ["string", "null"] },
          ground: { anyOf: [{ type: "null" }, { type: "string", pattern: "^(base|inverse|image|accent:\\d{1,2})$" }] },
          content: { type: "object" },
        },
      },
    },
  },
};

const validateDeckShape = ajv.compile(deckSchema);
const contentValidators = Object.fromEntries(Object.entries(schemas).map(([id, s]) => [id, ajv.compile(s)]));

export interface ValidationIssue { path: string; message: string }

/** Validates the deck envelope and each slide's content against its archetype schema (unknown slots rejected). */
export function validateDeck(deck: unknown): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!validateDeckShape(deck)) issues.push(...fmt(validateDeckShape.errors, ""));
  const d = deck as Deck;
  const ids = new Set<string>();
  d.slides?.forEach((s, i) => {
    if (ids.has(s.id)) issues.push({ path: `slides[${i}].id`, message: `duplicate slide id "${s.id}"` });
    ids.add(s.id);
    const v = contentValidators[s.archetype];
    if (!v) issues.push({ path: `slides[${i}].archetype`, message: `unknown archetype "${s.archetype}"` });
    else if (!v(s.content)) issues.push(...fmt(v.errors, `slides[${i}].content`));
  });
  return issues;
}

function fmt(errors: ErrorObject[] | null | undefined, prefix: string): ValidationIssue[] {
  return (errors ?? []).map((e) => ({
    path: `${prefix}${e.instancePath.replace(/\/(\d+)/g, "[$1]").replace(/\//g, ".")}`,
    message: e.keyword === "additionalProperties" ? `unknown slot "${(e.params as { additionalProperty: string }).additionalProperty}"` : e.message ?? e.keyword,
  }));
}
