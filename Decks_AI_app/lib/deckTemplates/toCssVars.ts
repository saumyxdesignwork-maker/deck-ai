import type { CSSProperties } from 'react'
import type { DeckTemplate, SlideSurface } from './types'
import type { LayoutType } from '../fixtures'

/**
 * Converts a template (plus an optional active layout, for layouts that
 * swap to an 'accent'/'inverse' surface — e.g. Riso's pink divider) into a
 * flat set of CSS custom properties. Deliberately overrides the SAME names
 * the app's own theme (VL1/2/3) defines at `:root`/`[data-vl]` —
 * `--surface-solid`, `--text`, `--accent`, `--font-heading`, etc — because
 * setting them again on a descendant (see DeckThemeScope) wins by normal
 * CSS cascade/specificity, no !important or JS-driven restyling needed.
 * Everything under `--dt-*` is new: it has no app-level equivalent to
 * collide with.
 */
export function resolveSlideVars(template: DeckTemplate, layout?: LayoutType): CSSProperties {
  const override = layout ? template.layouts?.[layout] : undefined
  const surface: SlideSurface = override?.surface ?? 'base'
  const [bg, fg] =
    surface === 'accent' ? [template.colors.accent, template.colors.accentFg]
    : surface === 'inverse' ? [template.colors.inverseBg, template.colors.inverseText]
    : [template.colors.bg, template.colors.text]

  const h1 = Math.round(template.type.scale.h1 * (override?.headingScale ?? 1))

  const vars: Record<string, string> = {
    // App-theme tokens the renderer already reads — overridden here so
    // slides stop following the app's Craft/Night/Warm "Style" pill.
    '--surface-solid': bg,
    '--surface-muted': template.colors.surfaceMuted,
    '--text': fg,
    '--text-muted': template.colors.textMuted,
    '--accent': template.colors.accent,
    '--accent-soft': template.colors.accentSoft,
    '--border': template.colors.border,
    '--font-heading': template.type.heading,
    '--font-body': template.type.body,

    // Template-only tokens — no app-level equivalent.
    '--dt-pad': template.space.slidePad,
    '--dt-gap': `${template.space.gap}px`,
    '--dt-h-weight': String(template.type.headingWeight),
    '--dt-h-case': template.type.headingCase,
    '--dt-h-track': template.type.headingTracking,
    '--dt-h1': `${h1}px`,
    '--dt-h2': `${template.type.scale.h2}px`,
    '--dt-body': `${template.type.scale.body}px`,
    '--dt-numeric-font': template.type.numeric ?? template.type.heading,
    '--dt-card-bg': template.surfaces.card.bg,
    '--dt-card-border': template.surfaces.card.border,
    '--dt-card-radius': `${template.surfaces.card.radius}px`,
    '--dt-card-shadow': template.surfaces.card.shadow,
    '--dt-img-radius': `${template.image.radius}px`,
    '--dt-img-filter': template.image.filter,
    '--dt-img-frame': template.image.frame,
    '--dt-img-blend': template.image.blend ?? 'normal',
    '--dt-stat-color': template.data.valueColor,
    '--dt-texture': template.surfaces.texture ?? 'none',
    '--dt-texture-size': template.surfaces.textureSize ?? 'auto',
  }

  return vars as CSSProperties
}

/** The cover slide has its own color pair (`template.surfaces.cover`),
 * separate from the general slide bg/text — a Riso deck's paper-and-pink
 * cover doesn't have to match its dark-inverse closing slide, for example.
 * Only the type tokens are shared with resolveSlideVars; CoverBlock decides
 * the actual background (deck-color vs. solid/gradient/pattern) directly in
 * JS since that branch is awkward to express as a single CSS value. */
export function resolveCoverVars(template: DeckTemplate): CSSProperties {
  const vars: Record<string, string> = {
    '--font-heading': template.type.heading,
    '--font-body': template.type.body,
    '--dt-h-weight': String(template.type.headingWeight),
    '--dt-h-case': template.type.headingCase,
    '--dt-h-track': template.type.headingTracking,
    '--dt-cover-fg': template.surfaces.cover.fg,
  }
  return vars as CSSProperties
}
