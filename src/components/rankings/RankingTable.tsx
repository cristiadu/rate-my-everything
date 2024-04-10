import React from 'react'
import { Table } from 'react-bulma-components'
import { RankingItem } from '../types'
import RankingTableItem from './RankingTableItem'

interface RankingTableProps {
    rankings: RankingItem[];
}

const RankingTable: React.FC<RankingTableProps> = ({ rankings }) => (
  <Table hoverable style={{ width: '100%' }}>
    <thead>
      <tr>
        <th>Image</th>
        <th>Name</th>
        <th>Category</th>
        <th>Rating</th>
      </tr>
    </thead>
    <tbody>
      {rankings.sort((a, b) => b.rating - a.rating).map((ranking) => (
        <RankingTableItem key={ranking.item_id} ranking={ranking} />
      ))}
    </tbody>
  </Table>
)

export default RankingTable
