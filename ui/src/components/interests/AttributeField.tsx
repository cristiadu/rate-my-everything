import React from 'react'
import { AttributeValueType, type AttributeResponse } from '@/api/generated/api'
import type { AttributeInputShape } from '@/components/types'

/** Props for one attribute value field: the attribute, its current value and the change handler. */
interface AttributeFieldProps {
  attribute: AttributeResponse;
  value: string;
  onChange: (value: string) => void;
}

/** Input shape for each attribute value type shown as an input; booleans are checkboxes instead. */
const INPUT_SHAPES: Record<Exclude<AttributeValueType, AttributeValueType.BOOLEAN>, AttributeInputShape> = {
  [AttributeValueType.STRING]: { type: 'text' },
  [AttributeValueType.NUMBER]: { type: 'number' },
  [AttributeValueType.DATE]: { type: 'date' },
  [AttributeValueType.CURRENCY]: { type: 'number', step: '0.01' },
  [AttributeValueType.PERCENTAGE]: { type: 'number', step: 'any', unit: '%' },
  [AttributeValueType.URL]: { type: 'url' },
  [AttributeValueType.EMAIL]: { type: 'email' },
  [AttributeValueType.DURATION]: { type: 'number', step: '1', min: '0', unit: 'min' },
}

/** One form field for an attribute value, shaped by the attribute's value type. */
const AttributeField: React.FC<AttributeFieldProps> = ({ attribute, value, onChange }) => {
  const inputId = `attribute-${attribute.id}`

  if (attribute.valueType === AttributeValueType.BOOLEAN) {
    return (
      <div className="field">
        <label className="checkbox" htmlFor={inputId}>
          <input
            id={inputId}
            type="checkbox"
            checked={value === 'true'}
            onChange={(e) => onChange(String(e.target.checked))}
          />
          {` ${attribute.name}`}
        </label>
      </div>
    )
  }

  const { type, step, min, unit } = INPUT_SHAPES[attribute.valueType]
  const unitText = attribute.valueType === AttributeValueType.CURRENCY ? attribute.currencyCode : unit

  return (
    <div className="field">
      <label className="label" htmlFor={inputId}>{attribute.name}</label>
      <div className={unitText ? 'field has-addons' : undefined}>
        <div className="control is-expanded">
          <input
            className="input"
            id={inputId}
            type={type}
            step={step}
            min={min}
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
        {unitText && (
          <div className="control">
            <span className="button is-static">{unitText}</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default AttributeField
