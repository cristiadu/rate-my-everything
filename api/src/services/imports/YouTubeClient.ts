import ImportSource from '@/models/ImportSource'
import { ImportedItem, MAX_IMPORTED_ITEMS, YouTubePlaylistItemsResponse } from '@/models/ImportedItem'
import { ImportNotFound } from '@/errors/ImportNotFound'
import { ImportSourceFailed } from '@/errors/ImportSourceFailed'
import { ImportSourceNotConfigured } from '@/errors/ImportSourceNotConfigured'

/** YouTube Data API endpoint listing the videos of a playlist. */
const YOUTUBE_PLAYLIST_ITEMS_URL = 'https://www.googleapis.com/youtube/v3/playlistItems'

/** Status YouTube answers with when the playlist does not exist or is private. */
const YOUTUBE_PLAYLIST_NOT_FOUND_STATUS = 404

/** Reads the videos of a public YouTube playlist through the YouTube Data API. */
export default class YouTubeClient {
  private apiKey?: string

  constructor(apiKey: string | undefined) {
    this.apiKey = apiKey
  }

  /** Returns the playlist's available videos as items; accepts a playlist URL or a bare playlist id. */
  public async getPlaylistVideos(playlist: string): Promise<ImportedItem[]> {
    if (!this.apiKey) {
      throw new ImportSourceNotConfigured(ImportSource.YOUTUBE)
    }

    const playlistId = URL.parse(playlist)?.searchParams.get('list') ?? playlist
    const params = new URLSearchParams({
      part: 'snippet',
      playlistId,
      maxResults: String(MAX_IMPORTED_ITEMS),
      key: this.apiKey,
    })
    const response = await fetch(`${YOUTUBE_PLAYLIST_ITEMS_URL}?${params}`)
    if (response.status === YOUTUBE_PLAYLIST_NOT_FOUND_STATUS) {
      throw new ImportNotFound(`YouTube playlist "${playlistId}" was not found`)
    }
    if (!response.ok) {
      throw new ImportSourceFailed(ImportSource.YOUTUBE, response.status)
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
}
