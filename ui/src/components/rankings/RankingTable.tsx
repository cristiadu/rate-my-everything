import React from 'react'
import { Table } from 'react-bulma-components'
import type { RankingItem } from '@/components/types'
import RankingTableItem from '@/components/rankings/RankingTableItem'

interface RankingTableProps {
    rankings: RankingItem[];
    /** Whether each row links to the interest form; true for the signed-in user's own ratings. */
    canEdit: boolean;
}

/** Table of rated interests. On phones the image and ratings count columns are left out so the grades fit on screen. */
const RankingTable: React.FC<RankingTableProps> = ({ rankings, canEdit }) => (
  <div className="table-container">
    <Table hoverable style={{ width: '100%' }}>
      <thead>
        <tr>
          <th className="is-hidden-mobile">Image</th>
          <th>Name</th>
          <th>Category</th>
          <th>My grade</th>
          <th>Everyone&apos;s grade</th>
          <th className="is-hidden-mobile">Ratings</th>
          {canEdit && <th aria-label="Actions" />}
        </tr>
      </thead>
      <tbody>
        {rankings.map((ranking) => (
          <RankingTableItem key={ranking.item.id} ranking={ranking} canEdit={canEdit} />
        ))}
      </tbody>
    </Table>
  </div>
)

export default RankingTable
