// GENERATED from "Deck AI Templates/src/engine" — do not edit here.
// Change the engine there, then run `npm run export:app` in that folder.
export type Aspect = "16:9" | "4:3" | "1:1" | "4:5" | "A4";

export const FRAMES: Record<Aspect, { w: number; h: number }> = {
  "16:9": { w: 1920, h: 1080 },
  "4:3": { w: 1440, h: 1080 },
  "1:1": { w: 1080, h: 1080 },
  "4:5": { w: 1080, h: 1350 },
  A4: { w: 1240, h: 1754 },
};

export type GroundKind = "base" | "inverse" | "accent" | "image";
/** "accent:1" selects ground.accent[1]. */
export type Ground = "base" | "inverse" | `accent:${number}` | "image";

export interface DeckMeta {
  title: string;
  subtitle?: string;
  author?: string;
  date?: string;
  locale?: string;
  running_label?: string;
}

export interface Deck {
  id: string;
  version: 1;
  meta: DeckMeta;
  design: {
    visual_language: string;
    theme: {
      palette?: string; density?: Density; ornament?: "none" | "subtle" | "standard" | "bold";
      /** false = avoid layouts that would show an empty photo frame when a slide has no image (default true: show the frame as a drop target) */
      placeholders?: boolean;
    };
    aspect: Aspect;
  };
  slides: Slide[];
}

export type Density = "airy" | "regular" | "compact";

export interface Slide {
  id: string;
  archetype: string;
  /** null = planner decides; string = user-pinned */
  variant: string | null;
  ground: Ground | null;
  content: Record<string, unknown>;
  notes?: string;
  locks?: string[];
  stash?: Record<string, unknown>;
}

export interface SlotSpec {
  type: "text" | "rich" | "paragraphs" | "list" | "number" | "image" | "icon" | "chart" | "table" | "person";
  optional?: boolean;
  chars_ideal?: number;
  chars_max?: number;
  words_max?: number;
  lines_max?: number;
  nowrap?: boolean;
  /** hard requirement on the value's shape, e.g. percentages only for gauges */
  pattern?: string;
  min?: number;
  max?: number;
  of?: Record<string, SlotSpec>;
  /** table capacity */
  cols_max?: number;
  rows_max?: number;
  /** every body cell after the first column must match (e.g. dot symbols) */
  cell_pattern?: string;
}

export interface VariantDef {
  archetype: string;
  variant: string;
  image_led?: boolean;
  slots: Record<string, SlotSpec>;
  decor_anchors: string[];
  supports_aspects: Aspect[];
  /** grounds this layout reads well on; the planner swaps an unpinned ground that is not listed */
  grounds?: GroundKind[];
  fallback_variants?: string[];
}

export interface Variant extends VariantDef {
  html: string;
  css: string;
}

export interface OrnamentDef {
  id: string;
  svg: string;
  anchors: string[];
  roles: string[];
  max_per_slide: number;
  grounds?: GroundKind[];
  /** limit to specific layout variants (by variant name) */
  variants?: string[];
  /** never place on these layout variants */
  exclude_variants?: string[];
  /** stand-in for a missing photo (a drop target); skipped when theme.placeholders is false */
  placeholder?: boolean;
  /** finished-looking fill for a photo slot with no image; used only when theme.placeholders is false */
  fill?: boolean;
}

export interface VisualLanguage {
  id: string;
  version: string;
  tokens: Tokens;
  composition: Composition;
  ornaments: OrnamentDef[];
  skinCss: string;
}

export interface TypeStep {
  size: number;
  weight?: number;
  leading?: number;
  tracking?: number;
  case?: "none" | "upper" | "lower" | "small-caps";
  font?: "display" | "text" | "label";
  features?: string;
  fit_min?: string;
  /** width axis in % for variable fonts (e.g. 75 = condensed) */
  stretch?: number;
}

export interface Tokens {
  palettes: Record<string, Record<string, string | string[]>>;
  /** `accent` is an optional fourth family used by the rich `*muted*` marker (e.g. an italic serif) */
  font_pairs: Record<string, { display: string; text: string; label: string; accent?: string }>;
  font_sources?: string[];
  type: Record<string, TypeStep>;
  space: Record<string, number>;
  radius: Record<string, number>;
  line: Record<string, number>;
  /** unitless effect amounts (e.g. grain opacity) → --fx-<name> */
  effects?: Record<string, number>;
}

export interface Composition {
  variant_allow: Record<string, string[]>;
  variant_weights?: Record<string, number>;
  grounds: {
    rotation: "role-based" | "cycle" | "alternate" | "uniform";
    by_role?: Record<string, Ground[]>;
    default?: Ground;
    max_consecutive_same?: number;
  };
  chrome?: { show_on?: "all" | "all-but-title" | "none" };
  /**
   * Palette array roles whose order rotates per slide. For role "field.heat" the slide gets
   * --r-field-heat-0..n = var(--color-field-heat-k) shifted by slide index. Lets one fixed palette burn differently on every slide.
   */
  rotate_roles?: string[];
}

export interface PlannedSlide {
  slide: Slide;
  index: number;
  variant: Variant;
  ground: Ground;
  /** variants that also fit, in planner preference order (for fit-ladder swaps) */
  alternates: Variant[];
  /** capacity problems the planner could not avoid (shown as warnings) */
  notes: string[];
  /** ornament chosen per decor anchor (filled by the renderer; kept across variant swaps) */
  decor?: Record<string, string>;
}
