import React from 'react'
import {
  Table, Image, Block,
} from 'react-bulma-components'

export interface RankingItem {
    category: string;
    item_name: string;
    item_id: number;
    item_img_url: string;
    rating: number;
}

interface OverallRankingsProps {
    rankings: RankingItem[];
}

const OverallRankings: React.FC<OverallRankingsProps> = ({ rankings }) => (
  <Block>
    <Table style={{ width: '100%' }}>
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
          <tr key={ranking.item_id}>
            <td>
              <Image size="square" alt="64x64" src={ranking.item_img_url} />
            </td>
            <td><strong>{ranking.item_name}</strong></td>
            <td>{ranking.category}</td>
            <td>{ranking.rating}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  </Block>
)

export default OverallRankings
