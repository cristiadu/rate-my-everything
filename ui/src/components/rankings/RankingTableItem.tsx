import React from 'react'
import { Link } from 'react-router-dom'
import { Image } from 'react-bulma-components'
import type { RankingItem } from '@/components/types'

/** Props for one rankings row. */
interface RankingTableItemProps {
    ranking: RankingItem;
    canEdit: boolean;
}

const RankingTableItem: React.FC<RankingTableItemProps> = ({ ranking, canEdit }) => (
  <tr key={ranking.item_id}>
    <td>
      {ranking.item_img_url && <Image size={64} alt={ranking.item_name} src={ranking.item_img_url} />}
    </td>
    <td><strong>{ranking.item_name}</strong></td>
    <td>{ranking.category}</td>
    <td>{ranking.rating.toFixed(1)}</td>
    <td>{ranking.rating_count}</td>
    {canEdit && (
      <td>
        <Link className="button is-small" to={`/interests/${ranking.item_id}/edit`}>Edit</Link>
      </td>
    )}
  </tr>
)

export default RankingTableItem
