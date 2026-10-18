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

/** One attribute of each formatting value type, as a restaurant would use them; Price is in euros. */
export const formattedAttributes: Record<'price' | 'discount' | 'website' | 'contact' | 'runtime', AttributeResponse> = {
  price: { id: 11, name: 'Price', valueType: AttributeValueType.CURRENCY, currencyCode: 'EUR' },
  discount: { id: 12, name: 'Discount', valueType: AttributeValueType.PERCENTAGE },
  website: { id: 13, name: 'Website', valueType: AttributeValueType.URL },
  contact: { id: 14, name: 'Contact', valueType: AttributeValueType.EMAIL },
  runtime: { id: 15, name: 'Runtime', valueType: AttributeValueType.DURATION },
}
