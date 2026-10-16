import { useCallback, useEffect, useState } from 'react'
import { getAttributes, getCategories } from '@/api/generated/api'
import type { ChangeRequestLookups } from '@/components/types'

/** Loads categories and attributes so change requests can show names instead of ids; stays empty if loading fails. */
export const useChangeRequestLookups = (): ChangeRequestLookups => {
  const [lookups, setLookups] = useState<ChangeRequestLookups>({ categories: [], attributes: [] })

  const loadLookups = useCallback(async () => {
    try {
      const [categories, attributes] = await Promise.all([
        getCategories(),
        getAttributes(),
      ])
      setLookups({ categories, attributes })
    } catch {
      // Ids are still shown when names cannot be loaded
    }
  }, [])

  useEffect(() => {
    loadLookups()
  }, [loadLookups])

  return lookups
}
