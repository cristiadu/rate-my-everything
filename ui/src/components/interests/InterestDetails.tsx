import React from 'react'
import { Box, Image } from 'react-bulma-components'
import type { Item } from '@/components/types'

/** Props for the descriptive portion of an interest's detail page. */
interface InterestDetailsProps {
  item: Item;
}

/** Shows an interest's name, category, description, image, and category attributes. */
const InterestDetails: React.FC<InterestDetailsProps> = ({ item }) => (
  <Box>
    <article className="media">
      {item.imageUrl && (
        <div className="media-left">
          <Image size={128} alt={item.name} src={item.imageUrl} />
        </div>
      )}
      <div className="media-content">
        <h2 className="title is-4">{item.name}</h2>
        {item.category && <p className="subtitle is-6">{item.category.name}</p>}
        <p>{item.description}</p>
        {item.attributes.length > 0 && (
          <dl>
            {item.attributes.map((attributeValue) => (
              <React.Fragment key={attributeValue.id}>
                <dt><strong>{attributeValue.attribute.name}</strong></dt>
                <dd>{attributeValue.value}</dd>
              </React.Fragment>
            ))}
          </dl>
        )}
      </div>
    </article>
  </Box>
)

export default InterestDetails
