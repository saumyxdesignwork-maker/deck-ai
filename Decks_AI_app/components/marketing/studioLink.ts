/** Builds a `/create/studio` link that pre-fills the composer prompt and/or
 * preselects a template, via the `?prompt=` / `?template=` params StudioPage
 * now reads on mount (see app/create/studio/page.tsx). Centralized here so
 * every marketing CTA constructs the same shape of link. */
export function studioHref(opts: { prompt?: string; template?: string } = {}): string {
  const params = new URLSearchParams()
  if (opts.prompt) params.set('prompt', opts.prompt)
  if (opts.template) params.set('template', opts.template)
  const qs = params.toString()
  return qs ? `/create/studio?${qs}` : '/create/studio'
}
