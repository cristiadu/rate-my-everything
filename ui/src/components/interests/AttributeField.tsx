import React from 'react'
import { AttributeValueType, type Attribute } from '@/components/types'

interface AttributeFieldProps {
  attribute: Attribute;
  value: string;
  onChange: (value: string) => void;
}

/** HTML input type for each attribute value type shown as an input; booleans are checkboxes instead. */
const INPUT_TYPES: Record<Exclude<AttributeValueType, AttributeValueType.BOOLEAN>, string> = {
  [AttributeValueType.STRING]: 'text',
  [AttributeValueType.NUMBER]: 'number',
  [AttributeValueType.DATE]: 'date',
}

/** Input type for a value type, falling back to text for value types saved before the enum existed. */
const DEFAULT_INPUT_TYPE = INPUT_TYPES[AttributeValueType.STRING]

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

  return (
    <div className="field">
      <label className="label" htmlFor={inputId}>{attribute.name}</label>
      <div className="control">
        <input
          className="input"
          id={inputId}
          type={INPUT_TYPES[attribute.valueType as keyof typeof INPUT_TYPES] ?? DEFAULT_INPUT_TYPE}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  )
}

export default AttributeField
