import React from 'react'
import { Box, Image } from 'react-bulma-components'
import { AttributeValueType, type Attribute, type Item } from '@/components/types'

/** Props for one type-aware attribute value. */
interface AttributeValueDisplayProps {
  attribute: Attribute;
  value: string;
}

/** Formats a date-only attribute without shifting its calendar day across time zones. */
const formatDate = (value: string): string => {
  const date = new Date(`${value}T00:00:00Z`)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeZone: 'UTC' }).format(date)
}

/** Presents an attribute value with a visual treatment suited to its type. */
const AttributeValueDisplay: React.FC<AttributeValueDisplayProps> = ({ attribute, value }) => {
  switch (attribute.valueType) {
    case AttributeValueType.NUMBER: {
      const number = Number(value)
      const formatted = value.trim() && Number.isFinite(number) ? new Intl.NumberFormat().format(number) : value
      return <p className="title is-5 mb-0">{formatted}</p>
    }
    case AttributeValueType.BOOLEAN:
      return <span className={`tag is-medium ${value === 'true' ? 'is-success' : 'is-light'}`}>{value === 'true' ? 'Yes' : 'No'}</span>
    case AttributeValueType.DATE:
      return <time className="has-text-weight-semibold" dateTime={value}>{formatDate(value)}</time>
    case AttributeValueType.STRING:
      return <p className="mb-0">{value}</p>
  }
}

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
