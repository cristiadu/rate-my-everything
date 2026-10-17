import React, { useState } from 'react'
import { AttributeValueType, type AttributeInput, type AttributeResponse } from '@/api/generated/api'
import { CURRENCY_CODE_LENGTH } from '@/components/types'

/** Props for the admin attribute form; pass an attribute to edit it, or none to create one. */
interface AttributeFormProps {
  attribute?: AttributeResponse;
  isSaving: boolean;
  onSubmit: (values: AttributeInput) => void;
  onCancel: () => void;
}

/** Form for creating or editing an attribute's name, value type and, for currency attributes, currency code. */
const AttributeForm: React.FC<AttributeFormProps> = ({
  attribute, isSaving, onSubmit, onCancel,
}) => {
  const isEditing = !!attribute
  const [values, setValues] = useState<AttributeInput>({
    name: attribute?.name ?? '',
    valueType: attribute?.valueType ?? AttributeValueType.STRING,
    currencyCode: attribute?.currencyCode ?? '',
  })
  const isCurrency = values.valueType === AttributeValueType.CURRENCY

  /** Hands the form values to the parent instead of submitting the page. */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({ name: values.name, valueType: values.valueType, ...(isCurrency && { currencyCode: values.currencyCode }) })
  }

  return (
    <form onSubmit={handleSubmit} aria-label={isEditing ? 'Edit attribute' : 'Create attribute'}>
      <div className="field">
        <label className="label" htmlFor="attribute-name">Name</label>
        <div className="control">
          <input
            className="input"
            id="attribute-name"
            name="name"
            value={values.name}
            onChange={(e) => setValues({ ...values, name: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="field">
        <label className="label" htmlFor="attribute-value-type">Value type</label>
        <div className="control">
          <div className="select">
            <select
              id="attribute-value-type"
              name="valueType"
              value={values.valueType}
              onChange={(e) => setValues({ ...values, valueType: e.target.value as AttributeValueType })}
            >
              {Object.values(AttributeValueType).map((valueType) => (
                <option key={valueType} value={valueType}>{valueType}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {isCurrency && (
        <div className="field">
          <label className="label" htmlFor="attribute-currency-code">Currency code</label>
          <div className="control">
            <input
              className="input currency-code-input"
              id="attribute-currency-code"
              name="currencyCode"
              placeholder="USD"
              maxLength={CURRENCY_CODE_LENGTH}
              value={values.currencyCode ?? ''}
              onChange={(e) => setValues({ ...values, currencyCode: e.target.value.toUpperCase() })}
              required
            />
          </div>
          <p className="help">The ISO 4217 code amounts are in, such as USD, EUR or BRL.</p>
        </div>
      )}

      <div className="field is-grouped">
        <div className="control">
          <button className={`button is-primary ${isSaving ? 'is-loading' : ''}`} type="submit" disabled={isSaving}>
            {isEditing ? 'Save changes' : 'Create attribute'}
          </button>
        </div>
        <div className="control">
          <button className="button is-light" type="button" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </form>
  )
}

export default AttributeForm
