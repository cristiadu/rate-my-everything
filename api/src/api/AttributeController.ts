import {
  Body, Controller, Delete, Get, Path, Post, Put, Res, Response, Route, Security, SuccessResponse, Tags,
} from 'tsoa'
import type { TsoaResponse } from 'tsoa'
import AttributeService from '@/services/AttributeService'
import APIError, { NewApiError } from '@/models/APIError'
import ErrorCode from '@/errors/ErrorCode'
import Attribute from '@/models/Attribute'
import type { AttributeInput, AttributeResponse } from '@/models/Attribute'
import AttributeValue from '@/models/AttributeValue'
import type { AttributeValueRecordInput, AttributeValueResponse } from '@/models/AttributeValue'
import UserRole from '@/models/UserRole'
import { BEARER_AUTH } from '@/helpers/Authentication'

/** Attributes describe the items of a category; users read them and admins change them. */
@Route('attributes')
@Tags('Attributes')
@Security(BEARER_AUTH, [UserRole.USER, UserRole.ADMIN])
@Response<APIError>(401, 'The bearer token is missing or invalid')
@Response<APIError>(403, 'The signed-in user may not call this operation')
@Response<APIError>(500, 'Something unexpected failed')
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

  /** @summary Gets an attribute value */
  @Get('values/{id}')
  public async getAttributeValue(@Path() id: number, @Res() notFound: TsoaResponse<404, APIError>): Promise<AttributeValueResponse> {
    const data = await this.attributeService.getAttributeValue(id)
    if (!data) {
      return notFound(404, NewApiError(ErrorCode.RESOURCE_NOT_FOUND, 404, 'Attribute value not found'))
    }
    return data
  }

  /** @summary Gets an attribute */
  @Get('{id}')
  public async getAttribute(@Path() id: number, @Res() notFound: TsoaResponse<404, APIError>): Promise<AttributeResponse> {
    const data = await this.attributeService.getAttribute(id)
    if (!data) {
      return notFound(404, NewApiError(ErrorCode.RESOURCE_NOT_FOUND, 404, 'Attribute not found'))
    }
    return data
  }

  /** @summary Lists the values items hold for an attribute */
  @Get('{id}/values')
  public async getAttributeValuesByAttribute(@Path() id: number): Promise<AttributeValueResponse[]> {
    return this.attributeService.getAllAttributeValuesByAttribute(id)
  }

  /** @summary Creates an attribute */
  @Post()
  @Security(BEARER_AUTH, [UserRole.ADMIN])
  @SuccessResponse(201, 'Attribute created')
  public async createAttribute(
    @Body() input: AttributeInput, @Res() validationError: TsoaResponse<400, APIError>,
  ): Promise<AttributeResponse> {
    if (!input.name || !input.valueType) {
      return validationError(400, NewApiError(ErrorCode.VALIDATION_ERROR, 400, 'Missing required fields: name, valueType'))
    }
    const data = await this.attributeService.createAttribute(input as Attribute)
    this.setStatus(201)
    return data
  }

  /** @summary Creates an attribute value */
  @Post('values')
  @Security(BEARER_AUTH, [UserRole.ADMIN])
  @SuccessResponse(201, 'Attribute value created')
  public async createAttributeValue(@Body() input: AttributeValueRecordInput): Promise<AttributeValueResponse> {
    const data = await this.attributeService.createAttributeValue(input as AttributeValue)
    this.setStatus(201)
    return data
  }

  /** @summary Changes the fields sent for an attribute */
  @Put('{id}')
  @Security(BEARER_AUTH, [UserRole.ADMIN])
  public async updateAttribute(
    @Path() id: number,
    @Body() input: Partial<AttributeInput>,
    @Res() notFound: TsoaResponse<404, APIError>,
  ): Promise<AttributeResponse> {
    const data = await this.attributeService.updateAttribute(id, input as Attribute)
    if (!data) {
      return notFound(404, NewApiError(ErrorCode.RESOURCE_NOT_FOUND, 404, 'Attribute not found'))
    }
    return data
  }

  /** @summary Changes an attribute value */
  @Put('values/{id}')
  @Security(BEARER_AUTH, [UserRole.ADMIN])
  public async updateAttributeValue(
    @Path() id: number, @Body() input: AttributeValueRecordInput, @Res() notFound: TsoaResponse<404, APIError>,
  ): Promise<AttributeValueResponse> {
    const data = await this.attributeService.updateAttributeValue(id, input as AttributeValue)
    if (!data) {
      return notFound(404, NewApiError(ErrorCode.RESOURCE_NOT_FOUND, 404, 'Attribute value not found'))
    }
    return data
  }

  /** @summary Deletes an attribute */
  @Delete('{id}')
  @Security(BEARER_AUTH, [UserRole.ADMIN])
  @SuccessResponse(204, 'Attribute deleted')
  public async deleteAttribute(@Path() id: number): Promise<void> {
    await this.attributeService.deleteAttribute(id)
    this.setStatus(204)
  }

  /** @summary Deletes an attribute value */
  @Delete('values/{id}')
  @Security(BEARER_AUTH, [UserRole.ADMIN])
  @SuccessResponse(204, 'Attribute value deleted')
  public async deleteAttributeValue(@Path() id: number): Promise<void> {
    await this.attributeService.deleteAttributeValue(id)
    this.setStatus(204)
  }
}
