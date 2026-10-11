import React, { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Box, Image, Message } from 'react-bulma-components'
import ApiConfig from '@/config/ApiConfig'
import ApiService from '@/config/ApiService'
import type { Item } from '@/components/types'
import InterestDiscussion from '@/components/interests/InterestDiscussion'

/** View page of one interest: its details, and the discussion thread everyone shares about it. */
const InterestPage: React.FC = () => {
  const { itemId } = useParams()
  const viewedItemId = Number(itemId)
  const [item, setItem] = useState<Item | null>(null)
  const [error, setError] = useState('')

  const loadItem = useCallback(async () => {
    try {
      setItem(await ApiService.get<Item>(`${ApiConfig.ENDPOINTS.ITEMS}/${viewedItemId}`))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load the interest')
    }
  }, [viewedItemId])

  useEffect(() => {
    loadItem()
  }, [loadItem])

  if (error) {
    return (
      <Message color="danger">
        <Message.Body>{error}</Message.Body>
      </Message>
    )
  }

  if (!item) {
    return null
  }

  return (
    <>
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
      <InterestDiscussion itemId={item.id} />
    </>
  )
}

export default InterestPage
