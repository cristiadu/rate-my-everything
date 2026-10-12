import ImportSource from '@/models/ImportSource'
import {
  IMPORT_PAGE_SIZE, ImportedItem,
} from '@/models/ImportedItem'
import type { YouTubePlaylistItemsResponse, YouTubeVideosResponse } from '@/models/YouTubeModels'
import { ImportNotFound } from '@/errors/ImportNotFound'
import { ImportSourceFailed } from '@/errors/ImportSourceFailed'
import { ImportSourceNotConfigured } from '@/errors/ImportSourceNotConfigured'

/** YouTube Data API endpoint listing the videos of a playlist. */
const YOUTUBE_PLAYLIST_ITEMS_URL = 'https://www.googleapis.com/youtube/v3/playlistItems'

/** YouTube Data API endpoint returning one video's metadata. */
const YOUTUBE_VIDEOS_URL = 'https://www.googleapis.com/youtube/v3/videos'

/** Status YouTube answers with when the playlist does not exist or is private. */
const YOUTUBE_PLAYLIST_NOT_FOUND_STATUS = 404

/** Combines a video's source channel and description for the imported interest. */
const createVideoDescription = (channelTitle: string, description?: string): string => (
  [`Video by ${channelTitle} on YouTube`, description?.trim()].filter(Boolean).join('\n\n')
)

/** Reads a public YouTube video or playlist through the YouTube Data API. */
export default class YouTubeClient {
  private apiKey?: string

  constructor(apiKey: string | undefined) {
    this.apiKey = apiKey
  }

  /** Returns an individual video or playlist as items; accepts YouTube URLs and bare playlist ids. */
  public async getVideos(query: string): Promise<ImportedItem[]> {
    if (!this.apiKey) {
      throw new ImportSourceNotConfigured(ImportSource.YOUTUBE)
    }

    const parsedUrl = URL.parse(query)
    const playlistIdFromUrl = parsedUrl?.searchParams.get('list')
    const videoId = playlistIdFromUrl ? null : this.getVideoId(parsedUrl)
    const playlistId = playlistIdFromUrl ?? query
    if (videoId) {
      const params = new URLSearchParams({ part: 'snippet', id: videoId, key: this.apiKey })
      const response = await fetch(`${YOUTUBE_VIDEOS_URL}?${params}`)
      if (response.status === YOUTUBE_PLAYLIST_NOT_FOUND_STATUS) {
        throw new ImportNotFound(`YouTube video "${videoId}" was not found`)
      }
      if (!response.ok) {
        throw new ImportSourceFailed(ImportSource.YOUTUBE, response.status)
      }
      const body = await response.json() as YouTubeVideosResponse
      if (body.items.length === 0) {
        throw new ImportNotFound(`YouTube video "${videoId}" was not found`)
      }
      return body.items.map(({ snippet }) => ({
        type: 'Video' as const,
        name: snippet.title,
        description: createVideoDescription(snippet.channelTitle, snippet.description),
        imageUrl: (snippet.thumbnails.high ?? snippet.thumbnails.medium ?? snippet.thumbnails.default)?.url,
      }))
    }

    const items: ImportedItem[] = []
    let pageToken: string | undefined
    do {
      const params = new URLSearchParams({
        part: 'snippet', playlistId, maxResults: String(IMPORT_PAGE_SIZE), key: this.apiKey,
      })
      if (pageToken) {
        params.set('pageToken', pageToken)
      }
      const response = await fetch(`${YOUTUBE_PLAYLIST_ITEMS_URL}?${params}`)
      if (response.status === YOUTUBE_PLAYLIST_NOT_FOUND_STATUS) {
        throw new ImportNotFound(`YouTube playlist "${playlistId}" was not found`)
      }
      if (!response.ok) {
        throw new ImportSourceFailed(ImportSource.YOUTUBE, response.status)
      }
      const body = await response.json() as YouTubePlaylistItemsResponse
      items.push(...body.items
        .filter((playlistItem) => playlistItem.snippet.videoOwnerChannelTitle)
        .map(({ snippet }) => ({
          type: 'Video' as const,
          name: snippet.title,
          description: createVideoDescription(snippet.videoOwnerChannelTitle ?? 'Unknown channel', snippet.description),
          imageUrl: (snippet.thumbnails.high ?? snippet.thumbnails.medium ?? snippet.thumbnails.default)?.url,
        })))
      pageToken = body.nextPageToken
    } while (pageToken)

    return items
  }

  /** Reads a video id from supported YouTube video URLs, returning null for playlists and other text. */
  private getVideoId(url: URL | null): string | null {
    if (!url) {
      return null
    }
    if (url.hostname === 'youtu.be') {
      return url.pathname.split('/').filter(Boolean)[0] ?? null
    }
    if (!['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com'].includes(url.hostname)) {
      return null
    }
    if (url.pathname === '/watch') {
      return url.searchParams.get('v')
    }
    if (/^\/(shorts|embed|live)\//.test(url.pathname)) {
      return url.pathname.split('/')[2] ?? null
    }
    return null
  }
}
