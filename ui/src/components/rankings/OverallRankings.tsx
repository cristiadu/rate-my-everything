import React, { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Block, Message } from 'react-bulma-components'
import ApiConfig from '@/config/ApiConfig'
import ApiService from '@/config/ApiService'
import { RankingScope, type RankingItem, type RatedItem } from '@/components/types'
import RankingTable from '@/components/rankings/RankingTable'
import { toMyRankings, toOverallRankings } from '@/components/rankings/rankingData'

/** Props for the rankings page. */
interface OverallRankingsProps {
    scope: RankingScope;
}

/** Rankings page: the signed-in user's own ratings, or everyone's ratings averaged per item. */
const OverallRankings: React.FC<OverallRankingsProps> = ({ scope }) => {
  const [rankings, setRankings] = useState<RankingItem[] | null>(null)
  const [error, setError] = useState('')
  const isMine = scope === RankingScope.MINE

  const loadRankings = useCallback(async () => {
    try {
      const endpoint = isMine ? `${ApiConfig.ENDPOINTS.RATINGS}/mine` : ApiConfig.ENDPOINTS.RATINGS
      const ratings = await ApiService.get<RatedItem[]>(endpoint)
      setRankings(isMine ? toMyRankings(ratings) : toOverallRankings(ratings))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load rankings')
    }
  }, [isMine])

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
      {rankings?.length === 0 && (
        <p>{isMine ? 'You have not rated anything yet.' : 'Nobody has rated anything yet.'}</p>
      )}
      {rankings && rankings.length > 0 && <RankingTable rankings={rankings} canEdit={isMine} />}
    </Block>
  )
}

export default OverallRankings
