import React, { useCallback, useEffect, useState } from 'react'
import { Block, Tag } from 'react-bulma-components'
import { slide as SlideMenu } from 'react-burger-menu'
import Arrow, { FILTER_PANEL_WIDTH } from '@/components/filters/Arrow'
import { getCategories, type CategoryResponse } from '@/api/generated/api'
import { NO_INTEREST_FILTERS, type InterestFilters } from '@/components/types'
import MultiSelectDropdown from '@/components/common/MultiSelectDropdown'
import AttributeField from '@/components/interests/AttributeField'
import { MAX_RATING, MIN_RATING } from '@/components/interests/interestForm'
import { filterAttributes, toAppliedFilters } from '@/components/filters/filterQuery'
import { useFilters } from '@/components/filters/FilterContext'
import { useAuth } from '@/components/users/AuthContext'

/** Props for the filter panel. */
interface FilterMenuProps {
  /** Height of the fixed header above the panel, in pixels, so the panel starts right under the top menu. */
  topOffset: number;
}

/**
 * Collapsible panel with the filters for the interests and rankings pages: name, categories, the chosen categories'
 * attributes and a grade range. Applying them hands them to the pages, which ask the API for the matching ratings.
 */
const FilterMenu: React.FC<FilterMenuProps> = ({ topOffset }) => {
  const [isOpen, setIsOpen] = useState(false)
  const { isAuthenticated } = useAuth()
  const { filters, setFilters } = useFilters()
  const [draft, setDraft] = useState<InterestFilters>(filters)
  const [categories, setCategories] = useState<CategoryResponse[]>([])
  const [error, setError] = useState('')

  const attributes = filterAttributes(categories, draft.categoryIds)

  const styles = {
    bmBurgerButton: {
      display: 'none',
    },
    // The tab next to the panel already closes it
    bmCrossButton: {
      display: 'none',
    },
    // Pins the panel to the window's left edge right under the top menu, so the closed panel slides fully out of view
    bmMenuWrap: {
      left: '0',
      width: `${FILTER_PANEL_WIDTH}px`,
      top: `${topOffset}px`,
      height: `calc(100% - ${topOffset}px)`,
    },
    // Lifts the panel off the page and lets the top menu cast a soft shadow on it, so the two read as separate layers
    bmMenu: {
      padding: '1.25rem 1.5rem 1.5rem',
      boxShadow: 'inset 0 8px 8px -8px rgba(0, 0, 0, 0.3), 6px 0 18px rgba(0, 0, 0, 0.18)',
    },
    // Dims only the page below the top menu while the panel is open
    bmOverlay: {
      top: `${topOffset}px`,
    },
  }

  /** Loads the categories, with their attributes, to filter by. */
  const loadCategories = useCallback(async () => {
    try {
      setCategories(await getCategories())
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load the categories')
    }
  }, [])

  /** Loads the categories once signed in, and again each time the panel opens or closes so new ones show up. */
  useEffect(() => {
    if (isAuthenticated) {
      loadCategories()
    }
  }, [isOpen, isAuthenticated, loadCategories])

  /** Stores the value typed for one of the chosen categories' attributes. */
  const setAttributeValue = (attributeId: number, value: string) => {
    setDraft({ ...draft, attributeValues: { ...draft.attributeValues, [attributeId]: value } })
  }

  /** Applies the typed filters to the listed interests. */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFilters(toAppliedFilters(draft, attributes))
  }

  /** Empties the panel and lists every interest again. */
  const clearFilters = () => {
    setDraft(NO_INTEREST_FILTERS)
    setFilters(NO_INTEREST_FILTERS)
  }

  return (
    <>
      <Arrow isOpen={isOpen} setIsOpen={setIsOpen} top={topOffset} />
      <SlideMenu
        // react-burger-menu only applies new styles when it opens or closes, so it is remounted when the header height changes
        key={topOffset}
        isOpen={isOpen}
        onStateChange={(state: { isOpen: boolean }) => setIsOpen(state.isOpen)}
        // The header band's light pink keeps the panel in the palette while setting it apart from the top menu
        className="has-background-danger-light"
        styles={styles}
      >
        <Block>
          <Tag color="danger" size="medium" className="has-text-weight-semibold mb-4">FILTERS</Tag>
          <form onSubmit={handleSubmit}>
            {error && <p className="help is-danger">{error}</p>}
            <div className="field">
              <label className="label" htmlFor="filter-name">Name</label>
              <div className="control">
                <input
                  className="input"
                  id="filter-name"
                  placeholder="Search by name"
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                />
              </div>
            </div>
            <div className="field">
              <label className="label" htmlFor="filter-categories">Categories</label>
              <div className="control">
                <MultiSelectDropdown
                  id="filter-categories"
                  label="Categories"
                  placeholder="Any category"
                  options={categories.map((category) => ({ value: category.id, label: category.name }))}
                  selected={draft.categoryIds}
                  onChange={(categoryIds) => setDraft({ ...draft, categoryIds })}
                />
              </div>
            </div>
            {attributes.map((attribute) => (
              <AttributeField
                key={attribute.id}
                attribute={attribute}
                value={draft.attributeValues[attribute.id] ?? ''}
                onChange={(value) => setAttributeValue(attribute.id, value)}
              />
            ))}
            <div className="field">
              <span className="label">{`Grade (${MIN_RATING} to ${MAX_RATING})`}</span>
              <div className="field-body">
                <div className="field">
                  <div className="control">
                    <input
                      className="input"
                      type="number"
                      aria-label="Lowest grade"
                      placeholder="From"
                      min={MIN_RATING}
                      max={MAX_RATING}
                      step="any"
                      value={draft.minGrade}
                      onChange={(e) => setDraft({ ...draft, minGrade: e.target.value })}
                    />
                  </div>
                </div>
                <div className="field">
                  <div className="control">
                    <input
                      className="input"
                      type="number"
                      aria-label="Highest grade"
                      placeholder="To"
                      min={MIN_RATING}
                      max={MAX_RATING}
                      step="any"
                      value={draft.maxGrade}
                      onChange={(e) => setDraft({ ...draft, maxGrade: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="field is-grouped">
              <div className="control">
                <button className="button is-primary" type="submit">Apply</button>
              </div>
              <div className="control">
                <button className="button is-light" type="button" onClick={clearFilters}>Clear</button>
              </div>
            </div>
          </form>
        </Block>
      </SlideMenu>
    </>
  )
}

export default FilterMenu
