import React, { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Box, Message } from 'react-bulma-components'
import ApiConfig from '@/config/ApiConfig'
import ApiService from '@/config/ApiService'
import type {
  Category, InterestForm, Item, RatedItem,
} from '@/components/types'
import AttributeField from '@/components/interests/AttributeField'
import SimilarRecordsWarning from '@/components/common/SimilarRecordsWarning'
import {
  MAX_RATING, MIN_RATING, emptyInterestForm, toInterestForm, toItemInput, toRatingInput,
} from '@/components/interests/interestForm'

/** Page the form returns to after saving or removing an interest. */
const MY_RANKINGS_PATH = '/rankings'

/** Screen to add an interest, or edit one and the signed-in user's rating of it, with its category's attributes. */
const InterestFormPage: React.FC = () => {
  const { itemId } = useParams()
  const navigate = useNavigate()
  const editingItemId = itemId === undefined ? null : Number(itemId)
  const [categories, setCategories] = useState<Category[]>([])
  const [formFields, setFormFields] = useState<InterestForm>(emptyInterestForm)
  const [ratingId, setRatingId] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const selectedCategory = categories.find((category) => String(category.id) === formFields.categoryId)

  const loadForm = useCallback(async () => {
    try {
      setCategories(await ApiService.get<Category[]>(ApiConfig.ENDPOINTS.CATEGORIES))
      if (editingItemId === null) {
        return
      }

      const item = await ApiService.get<Item>(`${ApiConfig.ENDPOINTS.ITEMS}/${editingItemId}`)
      const myRatings = await ApiService.get<RatedItem[]>(`${ApiConfig.ENDPOINTS.RATINGS}/mine`)
      const myRating = myRatings.find((ratedItem) => ratedItem.item.id === editingItemId)
      setFormFields(toInterestForm(item, myRating))
      setRatingId(myRating?.id ?? null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load the interest')
    }
  }, [editingItemId])

  useEffect(() => {
    loadForm()
  }, [loadForm])

  const setAttributeValue = (attributeId: number, value: string) => {
    setFormFields({ ...formFields, attributeValues: { ...formFields.attributeValues, [attributeId]: value } })
  }

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
      const item = editingItemId === null
        ? await ApiService.post<Item>(ApiConfig.ENDPOINTS.ITEMS, itemInput)
        : await ApiService.put<Item>(`${ApiConfig.ENDPOINTS.ITEMS}/${editingItemId}`, itemInput)

      const ratingInput = toRatingInput(formFields)
      if (ratingId === null) {
        await ApiService.post<RatedItem>(ApiConfig.ENDPOINTS.RATINGS, { item_id: item.id, ...ratingInput })
      } else {
        await ApiService.put<RatedItem>(`${ApiConfig.ENDPOINTS.RATINGS}/${ratingId}`, ratingInput)
      }
      navigate(MY_RANKINGS_PATH)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save the interest')
    } finally {
      setIsSaving(false)
    }
  }

  const handleRemoveRating = async () => {
    if (ratingId === null || !window.confirm(`Remove "${formFields.name}" from your interests?`)) {
      return
    }

    setError('')
    try {
      await ApiService.delete(`${ApiConfig.ENDPOINTS.RATINGS}/${ratingId}`)
      navigate(MY_RANKINGS_PATH)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove the interest')
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
            <label className="label" htmlFor="interest-rating">{`My rating (${MIN_RATING} to ${MAX_RATING})`}</label>
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
                required
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
            {ratingId !== null && (
              <button type="button" className="button is-danger is-outlined" onClick={handleRemoveRating}>
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
