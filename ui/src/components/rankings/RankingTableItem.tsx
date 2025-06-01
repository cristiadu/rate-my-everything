import React from 'react'
import { Image } from 'react-bulma-components'
import { RankingItem } from '../types'

interface RankingTableItemProps {
    ranking: RankingItem;
}

const RankingTableItem: React.FC<RankingTableItemProps> = ({ ranking }) => (
  <tr key={ranking.item_id}>
    <td>
      <Image size="square" alt="64x64" src={ranking.item_img_url} />
    </td>
    <td><strong>{ranking.item_name}</strong></td>
    <td>{ranking.category}</td>
    <td>{ranking.rating}</td>
  </tr>
)

export default RankingTableItem
