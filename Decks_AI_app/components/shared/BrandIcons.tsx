// Real connector logos (added to /public) — small wrapper components so they
// drop into the same call sites as lucide icons (`<Icon size={n} />`)
// elsewhere in the connector UI (DataNudgeCard, DataConnectPanel). Unlike a
// lucide icon, these render an actual brand mark and don't tint with
// `color` — that's intentional, brand logos keep their own colors.

interface BrandIconProps {
  size?: number
  style?: React.CSSProperties
}

export function GoogleSheetsIcon({ size = 16, style }: BrandIconProps) {
  return (
    <img
      src="/Google_Sheets_Logo_05.2026.png"
      alt="Google Sheets"
      width={size}
      height={size}
      style={{ objectFit: 'contain', flexShrink: 0, ...style }}
    />
  )
}

export function GoogleDocsIcon({ size = 16, style }: BrandIconProps) {
  return (
    <img
      src="/Google_Docs_icon_(2026).svg.webp"
      alt="Google Docs"
      width={size}
      height={size}
      style={{ objectFit: 'contain', flexShrink: 0, ...style }}
    />
  )
}

export function SlackIcon({ size = 16, style }: BrandIconProps) {
  return (
    <img
      src="/Slack_icon_2019.svg.webp"
      alt="Slack"
      width={size}
      height={size}
      style={{ objectFit: 'contain', flexShrink: 0, ...style }}
    />
  )
}
