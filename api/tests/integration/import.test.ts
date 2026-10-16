import { describe, it, expect, afterEach, vi } from 'vitest'
import request from 'supertest'
import { appReady } from '@/index'
import APIError from '@/models/APIError'
import { ImportedItem, ImportSourceDescription } from '@/models/ImportedItem'
import ImportSource from '@/models/ImportSource'
import ErrorCode from '@/errors/ErrorCode'
import { getAuthTokenFromFile, getUserRoleAuthToken } from '@@/testutils/common/Auth'
import { Endpoints } from '@@/testutils/common/constants'
import {
  lastFmTopAlbums, lastFmTopArtists, lastFmUserNotFound, mockExternalApi, youTubePlaylistItems,
} from '@@/testutils/common/Imports'

describe('Import API Integration Tests', async () => {
  const app = await appReady
  const testAuthToken = await getAuthTokenFromFile()
  const userAuthToken = await getUserRoleAuthToken(app)

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe(`GET ${Endpoints.IMPORTS_BASE_PATH}`, () => {
    it('should list every import source with its labels to a regular user', async () => {
      // GIVEN a regular user
      // WHEN they list the import sources
      // THEN Last.fm and YouTube come back with the labels the import screen shows
      await request(app)
        .get(Endpoints.IMPORTS_BASE_PATH)
        .set('Authorization', `Bearer ${userAuthToken}`)
        .expect(200)
        .expect(res => {
          expect(res.body as ImportSourceDescription[]).toEqual([
            { source: ImportSource.LASTFM, label: 'Last.fm artists and albums', queryLabel: 'Last.fm username' },
            { source: ImportSource.YOUTUBE, label: 'YouTube', queryLabel: 'Video or playlist URL' },
          ])
        })
    })
  })

  describe(`GET ${Endpoints.IMPORTS_BASE_PATH}/:source`, () => {
    it('should list the Last.fm top artists and albums of a user to a regular user', async () => {
      // GIVEN Last.fm returns the user's top artists and albums
      mockExternalApi((url) => new URL(url).searchParams.get('method') === 'user.gettopartists'
        ? lastFmTopArtists
        : lastFmTopAlbums)

      // WHEN a regular user imports from Last.fm THEN the artists and albums are listed as items
      await request(app)
        .get(`${Endpoints.IMPORTS_BASE_PATH}/lastfm`)
        .query({ query: 'rj' })
        .set('Authorization', `Bearer ${userAuthToken}`)
        .expect(200)
        .expect(res => {
          const items = res.body as ImportedItem[]
          expect(items.map((item) => item.name)).toEqual(['Radiohead', 'In Rainbows', 'Demo Tape'])
          expect(items.map((item) => item.type)).toEqual(['Artist', 'Album', 'Album'])
        })
    })

    it('should list the videos of a YouTube playlist', async () => {
      // GIVEN YouTube returns a playlist with one available video
      mockExternalApi(youTubePlaylistItems)

      // WHEN the playlist is imported THEN its video is listed as an item
      await request(app)
        .get(`${Endpoints.IMPORTS_BASE_PATH}/youtube`)
        .query({ query: 'https://www.youtube.com/playlist?list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf' })
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect(200)
        .expect(res => {
          expect(res.body).toEqual([{
            type: 'Video',
            name: 'Never Gonna Give You Up',
            description: 'Video by Rick Astley on YouTube\n\nThe official music video.',
            imageUrl: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
          }])
        })
    })

    it('should return 404 when the Last.fm user does not exist', async () => {
      // GIVEN Last.fm does not know the user
      mockExternalApi(lastFmUserNotFound, 404)

      // WHEN the user is imported THEN the missing user is reported
      await request(app)
        .get(`${Endpoints.IMPORTS_BASE_PATH}/lastfm`)
        .query({ query: 'nobody' })
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect(404)
        .expect(res => {
          const apiError = res.body as APIError
          expect(apiError.code).toBe(ErrorCode.RESOURCE_NOT_FOUND)
          expect(apiError.message).toBe('Unknown Last.fm user id: nobody')
        })
    })

    it('should return 502 when the source fails', async () => {
      // GIVEN YouTube answers that the daily quota is used up
      mockExternalApi({ error: { code: 403, message: 'quotaExceeded' } }, 403)

      // WHEN a playlist is imported THEN the failure of the source is reported
      await request(app)
        .get(`${Endpoints.IMPORTS_BASE_PATH}/youtube`)
        .query({ query: 'PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf' })
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect(502)
        .expect(res => {
          expect((res.body as APIError).code).toBe(ErrorCode.EXTERNAL_SERVICE_ERROR)
        })
    })

    it('should return 400 for an unknown source', async () => {
      // GIVEN a source that is not supported
      // WHEN it is imported from THEN the request is rejected
      await request(app)
        .get(`${Endpoints.IMPORTS_BASE_PATH}/googleplay`)
        .query({ query: 'anything' })
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect(400)
        .expect(res => {
          expect((res.body as APIError).message).toBe("Invalid request: source: should be one of the following; ['lastfm','youtube']")
        })
    })

    it('should return 400 without a query', async () => {
      // GIVEN no username or playlist
      // WHEN Last.fm is imported from THEN the request is rejected
      await request(app)
        .get(`${Endpoints.IMPORTS_BASE_PATH}/lastfm`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect(400)
        .expect(res => {
          expect((res.body as APIError).message).toBe("Invalid request: query: 'query' is required")
        })
    })
  })
})
