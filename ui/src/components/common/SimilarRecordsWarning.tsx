import React, { useEffect, useState } from 'react'
import ApiService from '@/config/ApiService'
import type { SimilarRecordsLookup } from '@/components/types'

/** Wait after the last keystroke before asking the API for similar names, in milliseconds. */
const SIMILAR_LOOKUP_DELAY_MS = 300

/** Shortest name, in characters, worth checking for duplicates. */
const MIN_LOOKUP_LENGTH = 3

/** Props for the warning listing existing records whose name is close to the one being typed. */
interface SimilarRecordsWarningProps<T> {
  /** API path of a /similar endpoint, such as /items/similar. */
  endpoint: string;
  name: string;
  /** False on edit forms, where the record being edited would match itself. */
  isEnabled: boolean;
  /** Extra query values sent with the name, such as a categoryId. */
  filters?: Record<string, string>;
  /** Accessible name of the warning, such as "Similar interests". */
  label: string;
  message: string;
  renderRecord: (record: T) => React.ReactNode;
}

/**
 * Asks a /similar endpoint, once the user stops typing, for records whose name is likely a duplicate of the given name,
 * and lists them under a warning so the user can pick one instead of adding a duplicate. Shows nothing when none match.
 */
const SimilarRecordsWarning = <T extends { id: number }>({
  endpoint, name, isEnabled, filters = {}, label, message, renderRecord,
}: SimilarRecordsWarningProps<T>) => {
  const trimmedName = name.trim()
  const isLookupNeeded = isEnabled && trimmedName.length >= MIN_LOOKUP_LENGTH
  const query = new URLSearchParams({ ...filters, name: trimmedName }).toString()
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

  const similarRecords = isLookupNeeded && lookup.query === query ? lookup.records : []
  if (similarRecords.length === 0) {
    return null
  }

  return (
    <div className="notification is-warning is-light mt-2" role="status" aria-label={label}>
      <p>{message}</p>
      <ul>
        {similarRecords.map((record) => <li key={record.id} className="mt-1">{renderRecord(record)}</li>)}
      </ul>
    </div>
  )
}

export default SimilarRecordsWarning
