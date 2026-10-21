import type React from 'react'

/** Color a new category starts with in the category form, until another one is picked. */
export const DEFAULT_CATEGORY_COLOR = '#3E8ED0'

/** Relative luminance above which dark text reads better than white text on a background. */
const LIGHT_BACKGROUND_LUMINANCE = 0.5

/** How much each sRGB channel adds to relative luminance (ITU-R BT.709 weights). */
const LUMINANCE_WEIGHTS = { red: 0.2126, green: 0.7152, blue: 0.0722 }

/** Picks dark or white text for a hex background color, whichever reads better on it. */
const readableTextColor = (hexColor: string): string => {
  const [red, green, blue] = [1, 3, 5].map((start) => parseInt(hexColor.slice(start, start + 2), 16) / 255)
  const luminance = LUMINANCE_WEIGHTS.red * red + LUMINANCE_WEIGHTS.green * green + LUMINANCE_WEIGHTS.blue * blue
  return luminance > LIGHT_BACKGROUND_LUMINANCE ? 'var(--bulma-text-strong)' : 'var(--bulma-white)'
}

/** Inline colors for something filled with a category's color, or none for a category without a color. */
export const categoryColorStyle = (color: string | null | undefined): React.CSSProperties | undefined => (
  color ? { backgroundColor: color, color: readableTextColor(color) } : undefined
)
