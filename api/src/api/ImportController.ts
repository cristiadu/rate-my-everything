import { Controller, Get, Path, Query, Response, Route, Security, Tags } from 'tsoa'
import ImportService from '@/services/imports/ImportService'
import ImportSource from '@/models/ImportSource'
import type { ImportedItem } from '@/models/ImportedItem'
import APIError, { NewApiError } from '@/models/APIError'
import UserRole from '@/models/UserRole'
import ErrorCode from '@/errors/ErrorCode'
import { RequestRejected } from '@/errors/RequestRejected'
import { UnknownResource } from '@/errors/UnknownResource'
import { ImportSourceFailed } from '@/errors/ImportSourceFailed'
import { ImportSourceNotConfigured } from '@/errors/ImportSourceNotConfigured'
import { BEARER_AUTH } from '@/helpers/Authentication'
import { logger } from '@/helpers/Logger'
import {
  BAD_REQUEST_DESCRIPTION, BAD_REQUEST_EXAMPLE, EXTERNAL_SERVICE_ERROR_DESCRIPTION, EXTERNAL_SERVICE_ERROR_EXAMPLE,
  FORBIDDEN_DESCRIPTION, FORBIDDEN_EXAMPLE, INTERNAL_ERROR_DESCRIPTION, INTERNAL_ERROR_EXAMPLE, NOT_FOUND_DESCRIPTION,
  NOT_FOUND_EXAMPLE, SERVICE_UNAVAILABLE_DESCRIPTION, SERVICE_UNAVAILABLE_EXAMPLE, TOO_MANY_REQUESTS_DESCRIPTION,
  TOO_MANY_REQUESTS_EXAMPLE, UNAUTHORIZED_DESCRIPTION, UNAUTHORIZED_EXAMPLE,
} from '@/api/ApiDocumentation'
import type { RateLimitHeaders } from '@/api/ApiDocumentation'

/** Looks up items on external sources such as Last.fm and YouTube so users can add them as interests. */
@Route('imports')
@Tags('Imports')
@Security(BEARER_AUTH, [UserRole.USER, UserRole.ADMIN])
@Response<APIError>(401, UNAUTHORIZED_DESCRIPTION, UNAUTHORIZED_EXAMPLE)
@Response<APIError>(403, FORBIDDEN_DESCRIPTION, FORBIDDEN_EXAMPLE)
@Response<APIError, { [Header in keyof RateLimitHeaders]: RateLimitHeaders[Header] }>(
  429, TOO_MANY_REQUESTS_DESCRIPTION, TOO_MANY_REQUESTS_EXAMPLE,
)
@Response<APIError>(500, INTERNAL_ERROR_DESCRIPTION, INTERNAL_ERROR_EXAMPLE)
export class ImportController extends Controller {
  private importService = new ImportService()

  /**
   * Lists the items found on an external source for `query`, without saving them.
   * 404 when the user or playlist does not exist, 502 when the source fails,
   * and 503 when the source has no API key configured.
   * @summary Finds items to import from an external source
   * @param source Where to look for items
   * @param query Last.fm username, or YouTube video or playlist URL
   * @example query "rj"
   */
  @Get('{source}')
  @Response<APIError>(400, BAD_REQUEST_DESCRIPTION, BAD_REQUEST_EXAMPLE)
  @Response<APIError>(404, NOT_FOUND_DESCRIPTION, NOT_FOUND_EXAMPLE)
  @Response<APIError>(502, EXTERNAL_SERVICE_ERROR_DESCRIPTION, EXTERNAL_SERVICE_ERROR_EXAMPLE)
  @Response<APIError>(503, SERVICE_UNAVAILABLE_DESCRIPTION, SERVICE_UNAVAILABLE_EXAMPLE)
  public async findImportItems(@Path() source: ImportSource, @Query() query: string): Promise<ImportedItem[]> {
    if (!query.trim()) {
      throw new RequestRejected(NewApiError(ErrorCode.VALIDATION_ERROR, 400, 'Missing required query parameter: query'))
    }

    try {
      return await this.importService.findItems(source, query.trim())
    } catch (error) {
      if (error instanceof UnknownResource) {
        throw new RequestRejected(NewApiError(ErrorCode.RESOURCE_NOT_FOUND, 404, error.message))
      }
      if (error instanceof ImportSourceFailed) {
        logger.error(error)
        throw new RequestRejected(NewApiError(ErrorCode.EXTERNAL_SERVICE_ERROR, 502, error.message))
      }
      if (error instanceof ImportSourceNotConfigured) {
        throw new RequestRejected(NewApiError(ErrorCode.SERVICE_UNAVAILABLE, 503, error.message))
      }
      throw error
    }
  }
}
