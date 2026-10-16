import React from 'react'
import type { CategorySummary } from '@/api/generated/api'
import { readableTextColor } from '@/components/common/categoryColor'

/** Props for one category tag. */
interface CategoryTagProps {
  category: Pick<CategorySummary, 'name' | 'color'>;
  /** Shows the tag as a big label in capitals, as in the interest view's title bar. */
  isLarge?: boolean;
}

/** Shows a category's name on its own color, or on light grey for a category without a color. */
const CategoryTag: React.FC<CategoryTagProps> = ({ category, isLarge = false }) => (
  <span
    className={`tag${category.color ? '' : ' is-light'}${isLarge ? ' is-large is-uppercase has-text-weight-bold interest-view-label' : ''}`}
    style={category.color ? { backgroundColor: category.color, color: readableTextColor(category.color) } : undefined}
  >
    {category.name}
  </span>
)

export default CategoryTag
