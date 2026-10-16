import { describe, it, expect, afterEach, vi } from 'vitest'
import YouTubeClient from '@/services/imports/YouTubeClient'
import ImportSource from '@/models/ImportSource'
import { UnknownResource } from '@/errors/UnknownResource'
import { ImportSourceFailed } from '@/errors/ImportSourceFailed'
import { ImportSourceNotConfigured } from '@/errors/ImportSourceNotConfigured'
import {
  mockExternalApi, youTubePlaylistItems, youTubeQuotaExceeded, youTubeVideos,
} from '@@/testutils/common/Imports'

/** Request YouTube receives for the PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf playlist. */
const PLAYLIST_REQUEST_URL = 'https://www.googleapis.com/youtube/v3/playlistItems'
  + '?part=snippet&playlistId=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf&maxResults=50&key=youtube-key'

/** Standard watch URL of the Never Gonna Give You Up video. */
const VIDEO_WATCH_URL = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'

/** Request YouTube receives for the Never Gonna Give You Up video. */
const VIDEO_REQUEST_URL = 'https://www.googleapis.com/youtube/v3/videos?part=snippet&id=dQw4w9WgXcQ&key=youtube-key'

describe('YouTubeClient', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns the available playlist videos as items, skipping deleted ones', async () => {
    // GIVEN YouTube returns one available and one deleted video
    const fetchMock = mockExternalApi(youTubePlaylistItems)

    // WHEN the videos of a playlist id are read
    const items = await new YouTubeClient('youtube-key').getVideos('PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf')

    // THEN YouTube is asked for 50 playlist entries and only the available video becomes an item
    expect(String(fetchMock.mock.calls[0][0])).toBe(PLAYLIST_REQUEST_URL)
    expect(items).toEqual([{
      type: 'Video',
      name: 'Never Gonna Give You Up',
      description: 'Video by Rick Astley on YouTube\n\nThe official music video.',
      imageUrl: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
    }])
  })

  it('reads the playlist id from a playlist URL', async () => {
    // GIVEN YouTube returns the playlist
    const fetchMock = mockExternalApi(youTubePlaylistItems)

    // WHEN the videos of a playlist URL are read
    await new YouTubeClient('youtube-key').getVideos('https://www.youtube.com/playlist?list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf')

    // THEN YouTube is asked for the playlist id from the URL
    expect(String(fetchMock.mock.calls[0][0])).toBe(PLAYLIST_REQUEST_URL)
  })

  it('returns videos from every YouTube playlist page', async () => {
    // GIVEN YouTube has two pages of playlist videos
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const params = new URL(String(input)).searchParams
      const body = params.has('pageToken')
        ? { items: [{ snippet: {
          title: 'Second song', videoOwnerChannelTitle: 'Artist', thumbnails: {},
        } }] }
        : { ...youTubePlaylistItems, nextPageToken: 'page-2' }
      return new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } })
    })

    // WHEN the playlist is read
    const items = await new YouTubeClient('youtube-key').getVideos('PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf')

    // THEN both pages are requested and the later video is included
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(String(fetchMock.mock.calls[1][0])).toContain('pageToken=page-2')
    expect(items.map((item) => item.name)).toEqual(['Never Gonna Give You Up', 'Second song'])
  })

  it('imports one video from a standard YouTube watch URL', async () => {
    // GIVEN YouTube returns one video's public details
    const fetchMock = mockExternalApi(youTubeVideos)

    // WHEN the video is read from its watch URL
    const items = await new YouTubeClient('youtube-key').getVideos(VIDEO_WATCH_URL)

    // THEN YouTube is asked for that video and it is returned as an importable item
    expect(String(fetchMock.mock.calls[0][0])).toBe(VIDEO_REQUEST_URL)
    expect(items).toEqual([{
      type: 'Video',
      name: 'Never Gonna Give You Up',
      description: 'Video by Rick Astley on YouTube',
      imageUrl: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
    }])
  })

  it.each([
    'https://youtu.be/dQw4w9WgXcQ',
    'https://www.youtube.com/shorts/dQw4w9WgXcQ',
  ])('imports one video from the short URL %s', async (videoUrl) => {
    // GIVEN YouTube returns one video's public details
    const fetchMock = mockExternalApi(youTubeVideos)

    // WHEN the video is read from a youtu.be or shorts URL
    const items = await new YouTubeClient('youtube-key').getVideos(videoUrl)

    // THEN YouTube is asked for the video id in the URL
    expect(String(fetchMock.mock.calls[0][0])).toBe(VIDEO_REQUEST_URL)
    expect(items.map((item) => item.name)).toEqual(['Never Gonna Give You Up'])
  })

  it.each([
    'https://vimeo.com/76979871',
    'https://www.youtube.com/@RickAstleyYT',
  ])('looks up %s as a playlist id because it is not a YouTube video URL', async (otherUrl) => {
    // GIVEN YouTube returns a playlist
    const fetchMock = mockExternalApi(youTubePlaylistItems)

    // WHEN the videos of a URL that names no video are read
    await new YouTubeClient('youtube-key').getVideos(otherUrl)

    // THEN YouTube is asked for a playlist with the whole URL as its id
    const requestUrl = new URL(String(fetchMock.mock.calls[0][0]))
    expect(requestUrl.pathname).toBe('/youtube/v3/playlistItems')
    expect(requestUrl.searchParams.get('playlistId')).toBe(otherUrl)
  })

  it.each([
    ['answers not found', { error: { code: 404, message: 'videoNotFound' } }, 404],
    ['returns no video', { items: [] }, 200],
  ])('fails with UnknownResource when YouTube %s for the video', async (_answer, body, status) => {
    // GIVEN YouTube does not have the video
    mockExternalApi(body, status)

    // WHEN the video is read THEN the missing video is reported
    await expect(new YouTubeClient('youtube-key').getVideos(VIDEO_WATCH_URL))
      .rejects.toThrow(new UnknownResource('YouTube video', 'dQw4w9WgXcQ'))
  })

  it('fails with ImportSourceFailed when YouTube refuses the video request', async () => {
    // GIVEN YouTube answers that the daily quota is used up
    mockExternalApi(youTubeQuotaExceeded, 403)

    // WHEN the video is read THEN the failed call is reported with its status
    await expect(new YouTubeClient('youtube-key').getVideos(VIDEO_WATCH_URL))
      .rejects.toThrow(new ImportSourceFailed(ImportSource.YOUTUBE, 403))
  })

  it('fails with UnknownResource when the playlist does not exist', async () => {
    // GIVEN YouTube does not find the playlist
    mockExternalApi({ error: { code: 404, message: 'playlistNotFound' } }, 404)

    // WHEN the videos are read THEN the missing playlist is reported
    await expect(new YouTubeClient('youtube-key').getVideos('PLmissing'))
      .rejects.toThrow(new UnknownResource('YouTube playlist', 'PLmissing'))
  })

  it('fails with ImportSourceFailed on any other YouTube error', async () => {
    // GIVEN YouTube answers that the daily quota is used up
    mockExternalApi(youTubeQuotaExceeded, 403)

    // WHEN the videos are read THEN the failed call is reported with its status
    await expect(new YouTubeClient('youtube-key').getVideos('PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf'))
      .rejects.toThrow(new ImportSourceFailed(ImportSource.YOUTUBE, 403))
  })

  it('fails with ImportSourceNotConfigured without calling YouTube when there is no API key', async () => {
    // GIVEN no YouTube API key
    const fetchMock = mockExternalApi(youTubePlaylistItems)

    // WHEN the videos are read THEN the missing configuration is reported
    await expect(new YouTubeClient(undefined).getVideos('PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf'))
      .rejects.toThrow(ImportSourceNotConfigured)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
