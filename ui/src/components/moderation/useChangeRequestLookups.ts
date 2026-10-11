import { useCallback, useEffect, useState } from 'react'
import ApiConfig from '@/config/ApiConfig'
import ApiService from '@/config/ApiService'
import type { Attribute, Category, ChangeRequestLookups } from '@/components/types'

/** Loads categories and attributes so change requests can show names instead of ids; stays empty if loading fails. */
export const useChangeRequestLookups = (): ChangeRequestLookups => {
  const [lookups, setLookups] = useState<ChangeRequestLookups>({ categories: [], attributes: [] })

  const loadLookups = useCallback(async () => {
    try {
      const [categories, attributes] = await Promise.all([
        ApiService.get<Category[]>(ApiConfig.ENDPOINTS.CATEGORIES),
        ApiService.get<Attribute[]>(ApiConfig.ENDPOINTS.ATTRIBUTES),
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
