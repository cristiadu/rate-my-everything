import React from 'react'
import { Box } from 'react-bulma-components'
import AttributeValueDisplay from '@/components/common/AttributeValueDisplay'
import type { ItemResponse } from '@/api/generated/api'

/** Props for the interest view rectangle. */
interface InterestDetailsProps {
  item: ItemResponse;
  /** Shown next to the photo: the item's grades and the way to rate it. */
  grades?: React.ReactNode;
  /** Shown next to the description: the item's rating history. */
  history?: React.ReactNode;
}

/**
 * Shows an interest as one view: its name and category across the top, its photo next to its grades,
 * its description next to its rating history, and its category attributes as "Field: Value" pairs in two columns.
 */
const InterestDetails: React.FC<InterestDetailsProps> = ({ item, grades, history }) => (
  <Box className="interest-view">
    <header className="is-flex is-align-items-center interest-view-header">
      <h2 className="title is-3 is-flex-grow-1 mb-0">{item.name}</h2>
      {item.category && <p className="subtitle is-5 interest-view-category">{item.category.name}</p>}
    </header>
    <div className="columns is-vcentered">
      <div className="column is-half">
        <figure className="image is-4by3 interest-view-photo">
          {item.imageUrl ? (
            <img alt={item.name} src={item.imageUrl} />
          ) : (
            <span className="is-overlay is-flex is-align-items-center is-justify-content-center has-text-grey">No photo</span>
          )}
        </figure>
      </div>
      <div className="column is-half">{grades}</div>
    </div>
    <div className="columns">
      <div className="column is-half">
        <h3 className="title is-5">Description</h3>
        <p>{item.description}</p>
      </div>
      <div className="column is-half interest-view-history">{history}</div>
    </div>
    {item.attributes.length > 0 && (
      <div className="interest-view-attributes">
        <div className="columns is-multiline">
          {item.attributes.map((attributeValue) => (
            <div className="column is-half is-flex is-align-items-baseline" key={attributeValue.id}>
              <span className="has-text-weight-semibold mr-2">{`${attributeValue.attribute.name}:`}</span>
              <AttributeValueDisplay attribute={attributeValue.attribute} value={attributeValue.value} />
            </div>
          ))}
        </div>
      </div>
    )}
  </Box>
)

export default InterestDetails
