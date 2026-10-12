import React, { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Box, Message } from 'react-bulma-components'
import ApiConfig from '@/config/ApiConfig'
import ApiService from '@/config/ApiService'
import { createChangeRequest } from '@/config/ChangeRequestService'
import {
  type Category, ChangeRequestAction, ChangeRequestTarget, type InterestForm, type Item, type RatedItem,
} from '@/components/types'
import { useAuth } from '@/components/users/AuthContext'
import { canModerate, getUserIdFromToken } from '@/components/admin/RequireAdmin'
import AttributeField from '@/components/interests/AttributeField'
import SimilarRecordsWarning from '@/components/common/SimilarRecordsWarning'
import RatingHistory from '@/components/interests/RatingHistory'
import {
  MAX_RATING, MIN_RATING, emptyInterestForm, hasItemChanges, toInterestForm, toItemInput, toRatingInput,
} from '@/components/interests/interestForm'

/** Page the form returns to after saving or removing an interest. */
const MY_RANKINGS_PATH = '/rankings'

/** Page users go to after their edit of a shared interest is sent for approval. */
const MY_CHANGE_REQUESTS_PATH = '/change-requests'

/**
 * Screen to add an interest, or edit one and the signed-in user's rating of it, with its category's attributes.
 * Edits to an existing interest by users without a moderation role are sent to the moderators as a change request.
 */
const InterestFormPage: React.FC = () => {
  const { itemId } = useParams()
  const navigate = useNavigate()
  const { token } = useAuth()
  const editingItemId = itemId === undefined ? null : Number(itemId)
  const [categories, setCategories] = useState<Category[]>([])
  const [formFields, setFormFields] = useState<InterestForm>(emptyInterestForm)
  const [loadedForm, setLoadedForm] = useState<InterestForm>(emptyInterestForm)
  const [ratingId, setRatingId] = useState<number | null>(null)
  /** Id of the signed-in user, used to pick their ratings out of everyone's. */
  const userId = getUserIdFromToken(token)
  const [itemRatings, setItemRatings] = useState<RatedItem[]>([])
  const [loadedForm, setLoadedForm] = useState<InterestForm>(emptyInterestForm)
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const selectedCategory = categories.find((category) => String(category.id) === formFields.categoryId)
  /** Every time the signed-in user rated this item. */
  const myRatings = itemRatings.filter((ratedItem) => ratedItem.userId === userId)
  /** Whether the signed-in user already rated this item, which makes a new rating optional. */
  const hasRated = myRatings.length > 0

  /** Loads the categories and, when editing, the item and everyone's ratings of it. */
  const loadForm = useCallback(async () => {
    try {
      setCategories(await ApiService.get<Category[]>(ApiConfig.ENDPOINTS.CATEGORIES))
      if (editingItemId === null) {
        return
      }

      const item = await ApiService.get<Item>(`${ApiConfig.ENDPOINTS.ITEMS}/${editingItemId}`)
      const ratings = await ApiService.get<RatedItem[]>(`${ApiConfig.ENDPOINTS.RATINGS}/item/${editingItemId}`)
      setItemRatings(ratings)
      const myRating = ratings.find((ratedItem) => ratedItem.userId === userId)
      const itemForm = toInterestForm(item, myRating)
      setFormFields(itemForm)
      setLoadedForm(itemForm)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load the interest')
    }
  }, [editingItemId])

  useEffect(() => {
    loadForm()
  }, [loadForm])

  /** Stores the value typed for one of the chosen category's attributes. */
  const setAttributeValue = (attributeId: number, value: string) => {
    setFormFields({ ...formFields, attributeValues: { ...formFields.attributeValues, [attributeId]: value } })
  }

  /** Saves the item, then adds the rating when one was given; returns to my interests when done. */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCategory) {
      setError('Choose a category')
      return
    }

    setIsSaving(true)
    setError('')
    try {
      const itemInput = toItemInput(formFields, selectedCategory)
      const isProposingChange = editingItemId !== null && !canModerate(token) && hasItemChanges(formFields, loadedForm, selectedCategory)
      let savedItemId = editingItemId
      if (editingItemId === null) {
        savedItemId = (await ApiService.post<Item>(ApiConfig.ENDPOINTS.ITEMS, itemInput)).id
      } else if (isProposingChange) {
        await createChangeRequest({
          targetType: ChangeRequestTarget.ITEM, action: ChangeRequestAction.UPDATE, targetId: editingItemId, changes: itemInput,
        })
      } else if (canModerate(token)) {
        await ApiService.put<Item>(`${ApiConfig.ENDPOINTS.ITEMS}/${editingItemId}`, itemInput)
      }

      if (formFields.rating !== '') {
        await ApiService.post<RatedItem>(ApiConfig.ENDPOINTS.RATINGS, { item_id: savedItemId, ...toRatingInput(formFields) })
      }
      navigate(isProposingChange ? MY_CHANGE_REQUESTS_PATH : MY_RANKINGS_PATH)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save the interest')
    } finally {
      setIsSaving(false)
    }
  }

  /** Removes the item from the signed-in user's interests by deleting all of their ratings of it; the item itself stays. */
  const handleRemoveInterest = async () => {
    if (!window.confirm(`Remove "${formFields.name}" and all your ratings of it from your interests?`)) {
      return
    }

    setError('')
    try {
      for (const ratedItem of myRatings) {
        await ApiService.delete(`${ApiConfig.ENDPOINTS.RATINGS}/${ratedItem.id}`)
      }
      navigate(MY_RANKINGS_PATH)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove the interest')
    }
  }

  /** Deletes one of the signed-in user's ratings after confirming, and updates the grades without reloading. */
  const handleRemoveRating = async (ratedItem: RatedItem) => {
    if (!window.confirm(`Remove your ${ratedItem.rating.toFixed(1)} rating of "${formFields.name}"?`)) {
      return
    }

    setError('')
    try {
      await ApiService.delete(`${ApiConfig.ENDPOINTS.RATINGS}/${ratedItem.id}`)
      setItemRatings(itemRatings.filter((rating) => rating.id !== ratedItem.id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove the rating')
    }
  }

  return (
    <>
      <h2 className="title is-4">{editingItemId === null ? 'Add interest' : `Edit ${formFields.name}`}</h2>
      {error && (
        <Message color="danger">
          <Message.Body>{error}</Message.Body>
        </Message>
      )}
      {hasRated && <RatingHistory itemRatings={itemRatings} userId={userId} onRemove={handleRemoveRating} />}
      <Box>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label className="label" htmlFor="interest-category">Category</label>
            <div className="control">
              <div className="select">
                <select
                  id="interest-category"
                  value={formFields.categoryId}
                  onChange={(e) => setFormFields({ ...formFields, categoryId: e.target.value })}
                  required
                >
                  <option value="" disabled>Choose a category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div className="field">
            <label className="label" htmlFor="interest-name">Name</label>
            <div className="control">
              <input
                className="input"
                id="interest-name"
                value={formFields.name}
                onChange={(e) => setFormFields({ ...formFields, name: e.target.value })}
                required
              />
            </div>
            <SimilarRecordsWarning<Item>
              endpoint={`${ApiConfig.ENDPOINTS.ITEMS}/similar`}
              name={formFields.name}
              isEnabled={editingItemId === null}
              filters={formFields.categoryId ? { categoryId: formFields.categoryId } : {}}
              label="Similar interests"
              message="Similar interests already exist. Rate one of them instead of adding a duplicate:"
              renderRecord={(item) => (
                <>
                  <Link to={`/interests/${item.id}/edit`}>{item.name}</Link>
                  {item.category && ` (${item.category.name})`}
                </>
              )}
            />

          </div>
          <div className="field">
            <label className="label" htmlFor="interest-description">Description</label>
            <div className="control">
              <textarea
                className="textarea"
                id="interest-description"
                value={formFields.description}
                onChange={(e) => setFormFields({ ...formFields, description: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="field">
            <label className="label" htmlFor="interest-image">Image URL</label>
            <div className="control">
              <input
                className="input"
                id="interest-image"
                type="url"
                value={formFields.imageUrl}
                onChange={(e) => setFormFields({ ...formFields, imageUrl: e.target.value })}
              />
            </div>
          </div>
          {selectedCategory && selectedCategory.attributes.length > 0 && (
            <fieldset className="field">
              <legend className="label">{`${selectedCategory.name} details`}</legend>
              {selectedCategory.attributes.map((attribute) => (
                <AttributeField
                  key={attribute.id}
                  attribute={attribute}
                  value={formFields.attributeValues[attribute.id] ?? ''}
                  onChange={(value) => setAttributeValue(attribute.id, value)}
                />
              ))}
            </fieldset>
          )}
          <div className="field">
            <label className="label" htmlFor="interest-rating">
              {`${hasRated ? 'Rate it again' : 'My rating'} (${MIN_RATING} to ${MAX_RATING})`}
            </label>
            <div className="control">
              <input
                className="input"
                id="interest-rating"
                type="number"
                min={MIN_RATING}
                max={MAX_RATING}
                step="0.1"
                value={formFields.rating}
                onChange={(e) => setFormFields({ ...formFields, rating: e.target.value })}
                required={!hasRated || formFields.notes !== ''}
              />
            </div>
          </div>
          <div className="field">
            <label className="label" htmlFor="interest-notes">My notes</label>
            <div className="control">
              <textarea
                className="textarea"
                id="interest-notes"
                value={formFields.notes}
                onChange={(e) => setFormFields({ ...formFields, notes: e.target.value })}
              />
            </div>
          </div>
          <div className="buttons">
            <button type="submit" className={`button is-primary${isSaving ? ' is-loading' : ''}`} disabled={isSaving}>
              {editingItemId === null ? 'Add interest' : 'Save interest'}
            </button>
            <Link className="button" to={MY_RANKINGS_PATH}>Cancel</Link>
            {hasRated && (
              <button type="button" className="button is-danger is-outlined" onClick={handleRemoveInterest}>
                Remove from my interests
              </button>
            )}
          </div>
        </form>
      </Box>
    </>
  )
}

export default InterestFormPage
