import { AttributeValueType, type AttributeResponse, type CategoryResponse } from '@/api/generated/api'

/** Attributes returned by the mocked attributes endpoint. */
export const testAttributes: AttributeResponse[] = [
  { id: 1, name: 'Author', valueType: AttributeValueType.STRING },
  { id: 2, name: 'Pages', valueType: AttributeValueType.NUMBER },
]

/** Categories returned by the mocked categories endpoint; Books is linked to Author. */
export const testCategories: CategoryResponse[] = [
  { id: 10, name: 'Books', description: 'Things to read', color: '#8C3060', attributes: [testAttributes[0]] },
]
