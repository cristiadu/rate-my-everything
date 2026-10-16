import React, { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Block, Message } from 'react-bulma-components'
import { getRatings } from '@/api/generated/api'
import { RankingScope, type RankingItem } from '@/components/types'
import RankingTable from '@/components/rankings/RankingTable'
import { toMyRankings, toOverallRankings } from '@/components/rankings/rankingData'
import { useAuth } from '@/components/users/AuthContext'
import { getUserIdFromToken } from '@/components/admin/RequireAdmin'
import { useFilters } from '@/components/filters/FilterContext'
import { hasFilters, toRatingQuery } from '@/components/filters/filterQuery'

/** Props for the rankings page. */
interface OverallRankingsProps {
    scope: RankingScope;
}

/**
 * Rankings page: the items the signed-in user rated, or every rated item, each with its personal and collective grades.
 * The API narrows them down to the filters applied in the filter panel.
 */
const OverallRankings: React.FC<OverallRankingsProps> = ({ scope }) => {
  const [rankings, setRankings] = useState<RankingItem[] | null>(null)
  const [error, setError] = useState('')
  const { token } = useAuth()
  const isMine = scope === RankingScope.MINE
  const userId = getUserIdFromToken(token)
  const { filters } = useFilters()

  const loadRankings = useCallback(async () => {
    try {
      const ratings = await getRatings()
      setRankings(isMine ? toMyRankings(ratings, userId) : toOverallRankings(ratings, userId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load rankings')
    }
  }, [isMine, userId, filters, scope])

  useEffect(() => {
    loadRankings()
  }, [loadRankings])

  return (
    <Block>
      <div className="level">
        <h2 className="title is-4 level-left">{isMine ? 'My interests' : 'All rankings'}</h2>
        {isMine && (
          <Link className="button is-primary level-right" to="/interests/new">Add interest</Link>
        )}
      </div>
      {error && (
        <Message color="danger">
          <Message.Body>{error}</Message.Body>
        </Message>
      )}
      {rankings?.length === 0 && hasFilters(filters) && <p>No interests match the filters.</p>}
      {rankings?.length === 0 && !hasFilters(filters) && (
        <p>{isMine ? 'You have not rated anything yet.' : 'Nobody has rated anything yet.'}</p>
      )}
      {rankings && rankings.length > 0 && <RankingTable rankings={rankings} canEdit={isMine} />}
    </Block>
  )
}

export default OverallRankings
