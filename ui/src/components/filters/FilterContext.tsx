import React, { createContext, useContext, useState } from 'react'
import { NO_INTEREST_FILTERS, type InterestFilters } from '@/components/types'

/** Filters applied from the filter panel, shared with the pages that list interests. */
interface FilterContextType {
  filters: InterestFilters;
  setFilters: (filters: InterestFilters) => void;
}

/** Context holding the applied filters; without a provider nothing is filtered. */
const FilterContext = createContext<FilterContextType>({
  filters: NO_INTEREST_FILTERS,
  setFilters: () => {},
})

/** Reads the applied filters and the function that replaces them. */
export const useFilters = () => useContext(FilterContext)

/** Keeps the applied filters for the filter panel and the pages under it. */
export const FilterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [filters, setFilters] = useState<InterestFilters>(NO_INTEREST_FILTERS)

  return (
    <FilterContext.Provider value={{ filters, setFilters }}>
      {children}
    </FilterContext.Provider>
  )
}
