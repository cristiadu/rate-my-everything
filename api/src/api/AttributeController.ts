import {
  Body, Controller, Delete, Get, Path, Post, Put, Response, Route, Security, SuccessResponse, Tags,
} from 'tsoa'
import AttributeService from '@/services/AttributeService'
import APIError, { NewApiError } from '@/models/APIError'
import ErrorCode from '@/errors/ErrorCode'
import { RequestRejected } from '@/errors/RequestRejected'
import Attribute from '@/models/Attribute'
import type { AttributeInput, AttributeResponse, AttributeUpdate } from '@/models/Attribute'
import AttributeValue from '@/models/AttributeValue'
import type { AttributeValueRecordInput, AttributeValueResponse } from '@/models/AttributeValue'
import UserRole from '@/models/UserRole'
import { BEARER_AUTH } from '@/helpers/Authentication'
import {
  BAD_REQUEST_DESCRIPTION, BAD_REQUEST_EXAMPLE, FORBIDDEN_DESCRIPTION, FORBIDDEN_EXAMPLE, INTERNAL_ERROR_DESCRIPTION,
  INTERNAL_ERROR_EXAMPLE, NOT_FOUND_DESCRIPTION, NOT_FOUND_EXAMPLE, TOO_MANY_REQUESTS_DESCRIPTION, TOO_MANY_REQUESTS_EXAMPLE,
  UNAUTHORIZED_DESCRIPTION, UNAUTHORIZED_EXAMPLE,
} from '@/api/ApiDocumentation'
import type { RateLimitHeaders } from '@/api/ApiDocumentation'
import type { ResourceId } from '@/models/ResourceId'

/** Attributes describe the items of a category; users read them and admins change them. */
@Route('attributes')
@Tags('Attributes')
@Security(BEARER_AUTH, [UserRole.USER, UserRole.ADMIN])
@Response<APIError>(401, UNAUTHORIZED_DESCRIPTION, UNAUTHORIZED_EXAMPLE)
@Response<APIError>(403, FORBIDDEN_DESCRIPTION, FORBIDDEN_EXAMPLE)
@Response<APIError, { [Header in keyof RateLimitHeaders]: RateLimitHeaders[Header] }>(
  429, TOO_MANY_REQUESTS_DESCRIPTION, TOO_MANY_REQUESTS_EXAMPLE,
)
@Response<APIError>(500, INTERNAL_ERROR_DESCRIPTION, INTERNAL_ERROR_EXAMPLE)
export class AttributeController extends Controller {
  private attributeService = new AttributeService()

  /** @summary Lists every attribute */
  @Get()
  public async getAttributes(): Promise<AttributeResponse[]> {
    return this.attributeService.getAllAttributes()
  }

  /** @summary Lists every attribute value */
  @Get('values')
  public async getAttributeValues(): Promise<AttributeValueResponse[]> {
    return this.attributeService.getAllAttributeValues()
  }

  /**
   * @summary Gets an attribute value
   * @param id Id of the attribute value
   */
  @Get('values/{id}')
  @Response<APIError>(400, BAD_REQUEST_DESCRIPTION, BAD_REQUEST_EXAMPLE)
  @Response<APIError>(404, NOT_FOUND_DESCRIPTION, NOT_FOUND_EXAMPLE)
  public async getAttributeValue(@Path() id: ResourceId): Promise<AttributeValueResponse> {
    const data = await this.attributeService.getAttributeValue(id)
    if (!data) {
      throw new RequestRejected(NewApiError(ErrorCode.RESOURCE_NOT_FOUND, 404, 'Attribute value not found'))
    }
    return data
  }

  /**
   * @summary Gets an attribute
   * @param id Id of the attribute
   */
  @Get('{id}')
  @Response<APIError>(400, BAD_REQUEST_DESCRIPTION, BAD_REQUEST_EXAMPLE)
  @Response<APIError>(404, NOT_FOUND_DESCRIPTION, NOT_FOUND_EXAMPLE)
  public async getAttribute(@Path() id: ResourceId): Promise<AttributeResponse> {
    const data = await this.attributeService.getAttribute(id)
    if (!data) {
      throw new RequestRejected(NewApiError(ErrorCode.RESOURCE_NOT_FOUND, 404, 'Attribute not found'))
    }
    return data
  }

  /**
   * @summary Lists the values items hold for an attribute
   * @param id Id of the attribute
   */
  @Get('{id}/values')
  @Response<APIError>(400, BAD_REQUEST_DESCRIPTION, BAD_REQUEST_EXAMPLE)
  public async getAttributeValuesByAttribute(@Path() id: ResourceId): Promise<AttributeValueResponse[]> {
    return this.attributeService.getAllAttributeValuesByAttribute(id)
  }

  /** @summary Creates an attribute */
  @Post()
  @Security(BEARER_AUTH, [UserRole.ADMIN])
  @SuccessResponse(201, 'Attribute created')
  @Response<APIError>(400, BAD_REQUEST_DESCRIPTION, BAD_REQUEST_EXAMPLE)
  public async createAttribute(@Body() input: AttributeInput): Promise<AttributeResponse> {
    if (!input.name || !input.valueType) {
      throw new RequestRejected(NewApiError(ErrorCode.VALIDATION_ERROR, 400, 'Missing required fields: name, valueType'))
    }
    const data = await this.attributeService.createAttribute(input as Attribute)
    this.setStatus(201)
    return data
  }

  /** @summary Creates an attribute value */
  @Post('values')
  @Security(BEARER_AUTH, [UserRole.ADMIN])
  @SuccessResponse(201, 'Attribute value created')
  @Response<APIError>(400, BAD_REQUEST_DESCRIPTION, BAD_REQUEST_EXAMPLE)
  public async createAttributeValue(@Body() input: AttributeValueRecordInput): Promise<AttributeValueResponse> {
    const data = await this.attributeService.createAttributeValue(input as AttributeValue)
    this.setStatus(201)
    return data
  }

  /**
   * @summary Changes the fields sent for an attribute
   * @param id Id of the attribute
   */
  @Put('{id}')
  @Security(BEARER_AUTH, [UserRole.ADMIN])
  @Response<APIError>(400, BAD_REQUEST_DESCRIPTION, BAD_REQUEST_EXAMPLE)
  @Response<APIError>(404, NOT_FOUND_DESCRIPTION, NOT_FOUND_EXAMPLE)
  public async updateAttribute(@Path() id: ResourceId, @Body() input: AttributeUpdate): Promise<AttributeResponse> {
    const data = await this.attributeService.updateAttribute(id, input as Attribute)
    if (!data) {
      throw new RequestRejected(NewApiError(ErrorCode.RESOURCE_NOT_FOUND, 404, 'Attribute not found'))
    }
    return data
  }

  /**
   * @summary Changes an attribute value
   * @param id Id of the attribute value
   */
  @Put('values/{id}')
  @Security(BEARER_AUTH, [UserRole.ADMIN])
  @Response<APIError>(400, BAD_REQUEST_DESCRIPTION, BAD_REQUEST_EXAMPLE)
  @Response<APIError>(404, NOT_FOUND_DESCRIPTION, NOT_FOUND_EXAMPLE)
  public async updateAttributeValue(
    @Path() id: ResourceId, @Body() input: AttributeValueRecordInput,
  ): Promise<AttributeValueResponse> {
    const data = await this.attributeService.updateAttributeValue(id, input as AttributeValue)
    if (!data) {
      throw new RequestRejected(NewApiError(ErrorCode.RESOURCE_NOT_FOUND, 404, 'Attribute value not found'))
    }
    return data
  }

  /**
   * @summary Deletes an attribute
   * @param id Id of the attribute
   */
  @Delete('{id}')
  @Security(BEARER_AUTH, [UserRole.ADMIN])
  @SuccessResponse(204, 'Attribute deleted')
  @Response<APIError>(400, BAD_REQUEST_DESCRIPTION, BAD_REQUEST_EXAMPLE)
  public async deleteAttribute(@Path() id: ResourceId): Promise<void> {
    await this.attributeService.deleteAttribute(id)
    this.setStatus(204)
  }

  /**
   * @summary Deletes an attribute value
   * @param id Id of the attribute value
   */
  @Delete('values/{id}')
  @Security(BEARER_AUTH, [UserRole.ADMIN])
  @SuccessResponse(204, 'Attribute value deleted')
  @Response<APIError>(400, BAD_REQUEST_DESCRIPTION, BAD_REQUEST_EXAMPLE)
  public async deleteAttributeValue(@Path() id: ResourceId): Promise<void> {
    await this.attributeService.deleteAttributeValue(id)
    this.setStatus(204)
  }
}
