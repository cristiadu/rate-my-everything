import { describe, it, expect, beforeAll } from 'vitest'
import request from 'supertest'
import { appReady } from '@/index'
import APIError from '@/models/APIError'
import Attribute from '@/models/Attribute'
import AttributeValueType from '@/models/AttributeValueType'
import type Category from '@/models/Category'
import type Item from '@/models/Item'
import ErrorCode from '@/errors/ErrorCode'
import { getAuthTokenFromFile } from '@@/testutils/common/Auth'
import { cleanupAllAttributes, cleanupAllCategories } from '@@/testutils/common/DataCleanup'
import { createTestAttribute } from '@@/testutils/common/Attributes'
import { createTestCategory } from '@@/testutils/common/Categories'
import { createTestItemInCategory } from '@@/testutils/common/Items'
import { Endpoints } from '@@/testutils/common/constants'

describe('Attribute value types Integration Tests', async () => {
  const app = await appReady
  const testAuthToken = await getAuthTokenFromFile()
  let priceAttribute: Attribute
  let discountAttribute: Attribute
  let websiteAttribute: Attribute
  let contactAttribute: Attribute
  let runtimeAttribute: Attribute
  let category: Category

  beforeAll(async () => {
    await cleanupAllCategories(app)
    await cleanupAllAttributes(app)
    priceAttribute = await createTestAttribute(app, testAuthToken, 'Price', AttributeValueType.CURRENCY, 'eur')
    discountAttribute = await createTestAttribute(app, testAuthToken, 'Discount', AttributeValueType.PERCENTAGE)
    websiteAttribute = await createTestAttribute(app, testAuthToken, 'Website', AttributeValueType.URL)
    contactAttribute = await createTestAttribute(app, testAuthToken, 'Contact', AttributeValueType.EMAIL)
    runtimeAttribute = await createTestAttribute(app, testAuthToken, 'Runtime', AttributeValueType.DURATION)
    category = await createTestCategory(app, testAuthToken, 'Value-Types', 'For value type tests', [
      priceAttribute.id, discountAttribute.id, websiteAttribute.id, contactAttribute.id, runtimeAttribute.id,
    ])
  })

  describe('currency attributes', () => {
    it('should keep the upper-cased currency code of a currency attribute', () => {
      // GIVEN the Price attribute created as currency with the code eur (beforeAll)
      // THEN it keeps EUR
      expect(priceAttribute.currencyCode).toBe('EUR')
    })

    it('should drop the currency code of an attribute of another value type', async () => {
      // GIVEN a number attribute sent with a currency code
      // WHEN an admin creates it
      const attribute = await createTestAttribute(app, testAuthToken, 'Weight', AttributeValueType.NUMBER, 'USD')

      // THEN it keeps no currency code
      expect(attribute.currencyCode).toBeNull()
    })

    it('should reject a currency attribute without a currency code', async () => {
      // GIVEN a currency attribute without a currency code
      // WHEN an admin creates it
      // THEN the request is rejected asking for an ISO 4217 code
      await request(app)
        .post(Endpoints.ATTRIBUTES_BASE_PATH)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .send({ name: 'Ticket price', valueType: AttributeValueType.CURRENCY })
        .expect('Content-Type', /json/)
        .expect(400)
        .expect(res => {
          const apiError = res.body as APIError
          expect(apiError.message).toBe('Invalid currency code "": a currency attribute needs an ISO 4217 code such as USD')
          expect(apiError.code).toBe(ErrorCode.VALIDATION_ERROR)
        })
    })

    it('should reject turning an attribute into a currency attribute with an unknown currency code', async () => {
      // GIVEN the Discount attribute
      // WHEN an admin changes it to currency with the code ABC
      // THEN the request is rejected naming the code
      await request(app)
        .put(`${Endpoints.ATTRIBUTES_BASE_PATH}/${discountAttribute.id}`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .send({ valueType: AttributeValueType.CURRENCY, currencyCode: 'ABC' })
        .expect('Content-Type', /json/)
        .expect(400)
        .expect(res => {
          expect((res.body as APIError).message)
            .toBe('Invalid currency code "ABC": a currency attribute needs an ISO 4217 code such as USD')
        })
    })
  })

  describe('item values', () => {
    it('should store a value of each new value type', async () => {
      // GIVEN a value fitting each attribute of the category
      const attributeValues = [
        { attributeId: priceAttribute.id, value: '12.50' },
        { attributeId: discountAttribute.id, value: '15' },
        { attributeId: websiteAttribute.id, value: 'https://example.com/menu' },
        { attributeId: contactAttribute.id, value: 'bookings@example.com' },
        { attributeId: runtimeAttribute.id, value: '135' },
      ]

      // WHEN an item is created with them
      const item: Item = await createTestItemInCategory(
        app, testAuthToken, category.id, 'Typed-Item', 'Has every new type', attributeValues,
      )

      // THEN every value is stored as sent
      expect(item.attributes.map((value) => [value.attribute.name, value.value]).sort()).toEqual([
        ['Contact', 'bookings@example.com'],
        ['Discount', '15'],
        ['Price', '12.50'],
        ['Runtime', '135'],
        ['Website', 'https://example.com/menu'],
      ])
    })

    it('should reject an item value that does not fit its attribute', async () => {
      // GIVEN a runtime given as text
      // WHEN an item is created with it
      // THEN the request is rejected naming the attribute and the expected format
      await request(app)
        .post(Endpoints.ITEMS_BASE_PATH)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .send({ name: 'Bad-Runtime', categoryId: category.id, attributeValues: [{ attributeId: runtimeAttribute.id, value: 'two hours' }] })
        .expect('Content-Type', /json/)
        .expect(400)
        .expect(res => {
          const apiError = res.body as APIError
          expect(apiError.message).toBe('Invalid value "two hours" for Runtime: expected a whole number of minutes such as 135')
          expect(apiError.code).toBe(ErrorCode.VALIDATION_ERROR)
        })
    })

    it('should reject a value stored through the attribute values endpoint that does not fit its attribute', async () => {
      // GIVEN an item in the category
      const item = await createTestItemInCategory(app, testAuthToken, category.id, 'Value-Endpoint-Item', 'Gets a value directly')

      // WHEN an admin stores a website without its protocol
      // THEN the request is rejected naming the attribute and the expected format
      await request(app)
        .post(`${Endpoints.ATTRIBUTES_BASE_PATH}/values`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .send({ value: 'example.com', item: { id: item.id }, attribute: { id: websiteAttribute.id } })
        .expect('Content-Type', /json/)
        .expect(400)
        .expect(res => {
          expect((res.body as APIError).message)
            .toBe('Invalid value "example.com" for Website: expected a web address such as https://example.com')
        })
    })
  })
})
