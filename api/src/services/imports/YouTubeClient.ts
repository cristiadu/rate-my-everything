import ImportSource from '@/models/ImportSource'
import {
  ImportedItem, MAX_IMPORTED_ITEMS, YouTubePlaylistItemsResponse, YouTubeVideosResponse,
} from '@/models/ImportedItem'
import { ImportNotFound } from '@/errors/ImportNotFound'
import { ImportSourceFailed } from '@/errors/ImportSourceFailed'
import { ImportSourceNotConfigured } from '@/errors/ImportSourceNotConfigured'

/** YouTube Data API endpoint listing the videos of a playlist. */
const YOUTUBE_PLAYLIST_ITEMS_URL = 'https://www.googleapis.com/youtube/v3/playlistItems'

/** YouTube Data API endpoint returning one video's metadata. */
const YOUTUBE_VIDEOS_URL = 'https://www.googleapis.com/youtube/v3/videos'

/** Status YouTube answers with when the playlist does not exist or is private. */
const YOUTUBE_PLAYLIST_NOT_FOUND_STATUS = 404

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
    const videoId = this.getVideoId(parsedUrl)
    const playlistId = parsedUrl?.searchParams.get('list') ?? query
    const params = new URLSearchParams(videoId
      ? { part: 'snippet', id: videoId, key: this.apiKey }
      : { part: 'snippet', playlistId, maxResults: String(MAX_IMPORTED_ITEMS), key: this.apiKey })
    const response = await fetch(`${videoId ? YOUTUBE_VIDEOS_URL : YOUTUBE_PLAYLIST_ITEMS_URL}?${params}`)
    if (response.status === YOUTUBE_PLAYLIST_NOT_FOUND_STATUS) {
      throw new ImportNotFound(`YouTube ${videoId ? 'video' : 'playlist'} "${videoId ?? playlistId}" was not found`)
    }
    if (!response.ok) {
      throw new ImportSourceFailed(ImportSource.YOUTUBE, response.status)
    }

    if (videoId) {
      const body = await response.json() as YouTubeVideosResponse
      if (body.items.length === 0) {
        throw new ImportNotFound(`YouTube video "${videoId}" was not found`)
      }
      return body.items.map(({ snippet }) => ({
        name: snippet.title,
        description: `Video by ${snippet.channelTitle} on YouTube`,
        imageUrl: (snippet.thumbnails.high ?? snippet.thumbnails.medium ?? snippet.thumbnails.default)?.url,
      }))
    }

    const body = await response.json() as YouTubePlaylistItemsResponse
    return body.items
      .filter((playlistItem) => playlistItem.snippet.videoOwnerChannelTitle)
      .map(({ snippet }) => ({
        name: snippet.title,
        description: `Video by ${snippet.videoOwnerChannelTitle} on YouTube`,
        imageUrl: (snippet.thumbnails.high ?? snippet.thumbnails.medium ?? snippet.thumbnails.default)?.url,
      }))
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
