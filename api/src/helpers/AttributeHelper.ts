import AttributeValueType from '@/models/AttributeValueType'

/** Message returned when a request names a value type outside AttributeValueType. */
export const INVALID_VALUE_TYPE_MESSAGE = `valueType must be one of: ${Object.values(AttributeValueType).join(', ')}`

/** Whether the value is one of the AttributeValueType values. */
export const isAttributeValueType = (valueType: string): valueType is AttributeValueType => (
  Object.values<string>(AttributeValueType).includes(valueType)
)
