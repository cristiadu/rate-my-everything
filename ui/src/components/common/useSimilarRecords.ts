import { useEffect, useState } from 'react'
import ApiService from '@/config/ApiService'
import type { SimilarRecordsLookup } from '@/components/types'

/** Wait after the last keystroke before asking the API for similar names, in milliseconds. */
const SIMILAR_LOOKUP_DELAY_MS = 300

/** Shortest name, in characters, worth checking for duplicates. */
const MIN_LOOKUP_LENGTH = 3

/**
 * Asks a list endpoint, through its ?similarTo= filter, for records whose name is likely a duplicate of the given name,
 * once the user stops typing. Returns no records while disabled or while the name is too short.
 */
const useSimilarRecords = <T extends object>(
  endpoint: string,
  name: string,
  isEnabled: boolean,
  filters: Record<string, string> = {},
): T[] => {
  const trimmedName = name.trim()
  const isLookupNeeded = isEnabled && trimmedName.length >= MIN_LOOKUP_LENGTH
  const query = new URLSearchParams({ ...filters, similarTo: trimmedName }).toString()
  // Records are kept with the query they answer so an answer to an older query is never shown
  const [lookup, setLookup] = useState<SimilarRecordsLookup<T>>({ query: '', records: [] })

  useEffect(() => {
    if (!isLookupNeeded) {
      return undefined
    }

    let isCurrent = true
    const timer = setTimeout(async () => {
      try {
        const records = await ApiService.get<T[]>(`${endpoint}?${query}`)
        if (isCurrent) {
          setLookup({ query, records })
        }
      } catch {
        // A failed lookup only means no warning is shown; saving still works
      }
    }, SIMILAR_LOOKUP_DELAY_MS)

    return () => {
      isCurrent = false
      clearTimeout(timer)
    }
  }, [endpoint, query, isLookupNeeded])

  return isLookupNeeded && lookup.query === query ? lookup.records : []
}

export default useSimilarRecords
