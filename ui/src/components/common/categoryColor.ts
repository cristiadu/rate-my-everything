import type React from 'react'

/** Color a new category starts with in the category form, until another one is picked. */
export const DEFAULT_CATEGORY_COLOR = '#3E8ED0'

/** Relative luminance above which dark text reads better than white text on a background. */
const LIGHT_BACKGROUND_LUMINANCE = 0.5

/** Picks dark or white text for a hex background color, whichever reads better on it. */
export const readableTextColor = (hexColor: string): string => {
  const [red, green, blue] = [1, 3, 5].map((start) => parseInt(hexColor.slice(start, start + 2), 16) / 255)
  const luminance = 0.2126 * red + 0.7152 * green + 0.0722 * blue
  return luminance > LIGHT_BACKGROUND_LUMINANCE ? 'var(--bulma-text-strong)' : 'var(--bulma-white)'
}

/** Inline colors for something filled with a category's color, or none for a category without a color. */
export const categoryColorStyle = (color: string | null | undefined): React.CSSProperties | undefined => (
  color ? { backgroundColor: color, color: readableTextColor(color) } : undefined
)
