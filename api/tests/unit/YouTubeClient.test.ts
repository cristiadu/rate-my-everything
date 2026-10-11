import { describe, it, expect, afterEach, vi } from 'vitest'
import YouTubeClient from '@/services/imports/YouTubeClient'
import ImportSource from '@/models/ImportSource'
import { ImportNotFound } from '@/errors/ImportNotFound'
import { ImportSourceFailed } from '@/errors/ImportSourceFailed'
import { ImportSourceNotConfigured } from '@/errors/ImportSourceNotConfigured'
import { mockExternalApi, youTubePlaylistItems } from '@@/testutils/common/Imports'

/** Request YouTube receives for the PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf playlist. */
const PLAYLIST_REQUEST_URL = 'https://www.googleapis.com/youtube/v3/playlistItems'
  + '?part=snippet&playlistId=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf&maxResults=50&key=youtube-key'

describe('YouTubeClient', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns the available playlist videos as items, skipping deleted ones', async () => {
    // GIVEN YouTube returns one available and one deleted video
    const fetchMock = mockExternalApi(youTubePlaylistItems)

    // WHEN the videos of a playlist id are read
    const items = await new YouTubeClient('youtube-key').getPlaylistVideos('PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf')

    // THEN YouTube is asked for 50 playlist entries and only the available video becomes an item
    expect(String(fetchMock.mock.calls[0][0])).toBe(PLAYLIST_REQUEST_URL)
    expect(items).toEqual([{
      name: 'Never Gonna Give You Up',
      description: 'Video by Rick Astley on YouTube',
      imageUrl: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
    }])
  })

  it('reads the playlist id from a playlist URL', async () => {
    // GIVEN YouTube returns the playlist
    const fetchMock = mockExternalApi(youTubePlaylistItems)

    // WHEN the videos of a playlist URL are read
    await new YouTubeClient('youtube-key').getPlaylistVideos('https://www.youtube.com/playlist?list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf')

    // THEN YouTube is asked for the playlist id from the URL
    expect(String(fetchMock.mock.calls[0][0])).toBe(PLAYLIST_REQUEST_URL)
  })

  it('fails with ImportNotFound when the playlist does not exist', async () => {
    // GIVEN YouTube does not find the playlist
    mockExternalApi({ error: { code: 404, message: 'playlistNotFound' } }, 404)

    // WHEN the videos are read THEN the missing playlist is reported
    await expect(new YouTubeClient('youtube-key').getPlaylistVideos('PLmissing'))
      .rejects.toThrow(new ImportNotFound('YouTube playlist "PLmissing" was not found'))
  })

  it('fails with ImportSourceFailed on any other YouTube error', async () => {
    // GIVEN YouTube answers that the daily quota is used up
    mockExternalApi({ error: { code: 403, message: 'quotaExceeded' } }, 403)

    // WHEN the videos are read THEN the failed call is reported with its status
    await expect(new YouTubeClient('youtube-key').getPlaylistVideos('PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf'))
      .rejects.toThrow(new ImportSourceFailed(ImportSource.YOUTUBE, 403))
  })

  it('fails with ImportSourceNotConfigured without calling YouTube when there is no API key', async () => {
    // GIVEN no YouTube API key
    const fetchMock = mockExternalApi(youTubePlaylistItems)

    // WHEN the videos are read THEN the missing configuration is reported
    await expect(new YouTubeClient(undefined).getPlaylistVideos('PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf'))
      .rejects.toThrow(ImportSourceNotConfigured)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
