import React from 'react'
import { Table } from 'react-bulma-components'
import type { RankingItem } from '@/components/types'
import RankingTableItem from '@/components/rankings/RankingTableItem'

interface RankingTableProps {
    rankings: RankingItem[];
    /** Whether each row links to the interest form; true for the signed-in user's own ratings. */
    canEdit: boolean;
}

const RankingTable: React.FC<RankingTableProps> = ({ rankings, canEdit }) => (
  <Table hoverable style={{ width: '100%' }}>
    <thead>
      <tr>
        <th>Image</th>
        <th>Name</th>
        <th>Category</th>
        <th>My grade</th>
        <th>Everyone&apos;s grade</th>
        <th>Ratings</th>
        {canEdit && <th aria-label="Actions" />}
      </tr>
    </thead>
    <tbody>
      {rankings.map((ranking) => (
        <RankingTableItem key={ranking.item_id} ranking={ranking} canEdit={canEdit} />
      ))}
    </tbody>
  </Table>
)

export default RankingTable
