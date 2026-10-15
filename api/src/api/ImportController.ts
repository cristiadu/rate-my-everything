import { Controller, Get, Path, Query, Res, Response, Route, Security, Tags } from 'tsoa'
import type { TsoaResponse } from 'tsoa'
import ImportService from '@/services/imports/ImportService'
import ImportSource from '@/models/ImportSource'
import type { ImportedItem } from '@/models/ImportedItem'
import APIError, { NewApiError } from '@/models/APIError'
import UserRole from '@/models/UserRole'
import ErrorCode from '@/errors/ErrorCode'
import { UnknownResource } from '@/errors/UnknownResource'
import { ImportSourceFailed } from '@/errors/ImportSourceFailed'
import { ImportSourceNotConfigured } from '@/errors/ImportSourceNotConfigured'
import { BEARER_AUTH } from '@/helpers/Authentication'
import { logger } from '@/helpers/Logger'

@Route('imports')
@Tags('Imports')
@Security(BEARER_AUTH, [UserRole.USER, UserRole.ADMIN])
@Response<APIError>(401, 'The bearer token is missing or invalid')
@Response<APIError>(403, 'The signed-in user may not call this operation')
@Response<APIError>(500, 'Something unexpected failed')
export class ImportController extends Controller {
  private importService = new ImportService()

  /**
   * Lists the items found on an external source for `query`, without saving them.
   * 404 when the user or playlist does not exist, 502 when the source fails,
   * and 503 when the source has no API key configured.
   * @summary Finds items to import from an external source
   * @param source Where to look for items
   * @param query Last.fm username, or YouTube video or playlist URL
   */
  @Get('{source}')
  public async findImportItems(
    @Path() source: ImportSource,
    @Query() query: string,
    @Res() validationError: TsoaResponse<400, APIError>,
    @Res() notFound: TsoaResponse<404, APIError>,
    @Res() sourceFailed: TsoaResponse<502, APIError>,
    @Res() sourceNotConfigured: TsoaResponse<503, APIError>,
  ): Promise<ImportedItem[]> {
    if (!query.trim()) {
      return validationError(400, NewApiError(ErrorCode.VALIDATION_ERROR, 400, 'Missing required query parameter: query'))
    }

    try {
      return await this.importService.findItems(source, query.trim())
    } catch (error) {
      if (error instanceof UnknownResource) {
        return notFound(404, NewApiError(ErrorCode.RESOURCE_NOT_FOUND, 404, error.message))
      }
      if (error instanceof ImportSourceFailed) {
        logger.error(error)
        return sourceFailed(502, NewApiError(ErrorCode.EXTERNAL_SERVICE_ERROR, 502, error.message))
      }
      if (error instanceof ImportSourceNotConfigured) {
        return sourceNotConfigured(503, NewApiError(ErrorCode.SERVICE_UNAVAILABLE, 503, error.message))
      }
      throw error
    }
  }
}
