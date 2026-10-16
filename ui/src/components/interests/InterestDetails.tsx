import React from 'react'
import { Box, Image } from 'react-bulma-components'
import AttributeValueDisplay from '@/components/common/AttributeValueDisplay'
import type { ItemResponse } from '@/api/generated/api'

/** Props for the descriptive portion of an interest's detail page. */
interface InterestDetailsProps {
  item: ItemResponse;
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
          <div className="columns is-multiline">
            {item.attributes.map((attributeValue) => (
              <div className="column is-one-quarter" key={attributeValue.id}>
                <div className="box">
                  <p className="heading">{attributeValue.attribute.name}</p>
                  <AttributeValueDisplay attribute={attributeValue.attribute} value={attributeValue.value} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </article>
  </Box>
)

export default InterestDetails
