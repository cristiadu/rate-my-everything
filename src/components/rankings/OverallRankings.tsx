import React from 'react'
import { Block } from 'react-bulma-components'
import { RankingItem } from '../types'
import RankingTable from './RankingTable'

interface OverallRankingsProps {
    rankings: RankingItem[];
}

const OverallRankings: React.FC<OverallRankingsProps> = ({ rankings }) => (
  <Block>
    <RankingTable rankings={rankings.sort((a, b) => b.rating - a.rating)} />
  </Block>
)

export default OverallRankings
