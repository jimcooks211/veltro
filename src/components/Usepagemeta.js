import { useEffect } from 'react'
import { useTheme } from './ThemeProvider'

/**
 * usePageMeta
 *
 * Call inside any page component to override the PWA theme-color
 * meta tag (status bar / notch color) with the page's background color.
 * Automatically restores the theme default on unmount.
 *
 * Examples:
 *   usePageMeta({ color: '#1A56FF' })                   // same for light + dark
 *   usePageMeta({ light: '#ffffff', dark: '#0d1428' })  // per-mode
 *   usePageMeta({ dark: '#7B2FFF' })                    // only override dark
 */
export function usePageMeta({ light, dark, color } = {}) {
  const { setPageColor, clearPageColor } = useTheme()

  useEffect(() => {
    const hasOverride = color != null || light != null || dark != null
    if (!hasOverride) return

    setPageColor({ color, light, dark })

    return () => clearPageColor()
  }, [color, light, dark, setPageColor, clearPageColor])
}