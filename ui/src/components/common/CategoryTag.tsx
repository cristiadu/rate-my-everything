import React from 'react'
import type { CategorySummary } from '@/api/generated/api'
import { categoryColorStyle } from '@/components/common/categoryColor'

/** Props for one category tag. */
interface CategoryTagProps {
  category: Pick<CategorySummary, 'name' | 'color'>;
}

/** Shows a category's name on its own color, or on light grey for a category without a color. */
const CategoryTag: React.FC<CategoryTagProps> = ({ category }) => (
  <span
    className={`tag${category.color ? '' : ' is-light'}`}
    style={categoryColorStyle(category.color)}
  >
    {category.name}
  </span>
)

export default CategoryTag
