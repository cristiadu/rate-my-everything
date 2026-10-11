import { AttributeValueType, type Attribute, type Category } from '@/components/types'

/** Attributes returned by the mocked attributes endpoint. */
export const testAttributes: Attribute[] = [
  { id: 1, name: 'Author', valueType: AttributeValueType.STRING },
  { id: 2, name: 'Pages', valueType: AttributeValueType.NUMBER },
]

/** Categories returned by the mocked categories endpoint; Books is linked to Author. */
export const testCategories: Category[] = [
  { id: 10, name: 'Books', description: 'Things to read', attributes: [testAttributes[0]] },
]
