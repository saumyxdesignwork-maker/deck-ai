import { useTheme } from '@/components/controls/ThemeProvider'
import { glassVariantStyles } from '@/lib/glass-variants'

/**
 * Returns the liquid-glass Tailwind class string when VL2 is active,
 * otherwise an empty string. Use on the outermost container of any card
 * that floats over the meadow background in VL2.
 */
export function useGlassCard() {
  const { vl } = useTheme()
  return vl === '2' ? glassVariantStyles.liquid : ''
}
