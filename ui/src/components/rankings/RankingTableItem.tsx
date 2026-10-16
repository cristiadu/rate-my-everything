import React from 'react'
import { Link } from 'react-router-dom'
import { Image } from 'react-bulma-components'
import type { RankingItem } from '@/components/types'

/** Shown in place of a personal grade for items the signed-in user has not rated. */
const NOT_RATED = '-'

/** Category label for items saved before categories were required. */
const UNCATEGORIZED = 'Uncategorized'

/** Props for one rankings row. */
interface RankingTableItemProps {
    ranking: RankingItem;
    canEdit: boolean;
}

const RankingTableItem: React.FC<RankingTableItemProps> = ({ ranking, canEdit }) => (
  <tr key={ranking.item.id}>
    <td>
      {ranking.item.imageUrl && <Image size={64} alt={ranking.item.name} src={ranking.item.imageUrl} />}
    </td>
    <td><Link to={`/interests/${ranking.item.id}`}><strong>{ranking.item.name}</strong></Link></td>
    <td>{ranking.item.category?.name ?? UNCATEGORIZED}</td>
    <td>{ranking.myRating === null ? NOT_RATED : ranking.myRating.toFixed(1)}</td>
    <td>{ranking.rating.toFixed(1)}</td>
    <td>{ranking.ratingCount}</td>
    {canEdit && (
      <td>
        <Link className="button is-small" to={`/interests/${ranking.item.id}/edit`}>Edit</Link>
      </td>
    )}
  </tr>
)

export default RankingTableItem
