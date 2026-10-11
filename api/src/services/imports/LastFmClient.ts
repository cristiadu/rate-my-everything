import ImportSource from '@/models/ImportSource'
import { ImportedItem, LastFmTopAlbumsResponse, MAX_IMPORTED_ITEMS } from '@/models/ImportedItem'
import { ImportNotFound } from '@/errors/ImportNotFound'
import { ImportSourceFailed } from '@/errors/ImportSourceFailed'
import { ImportSourceNotConfigured } from '@/errors/ImportSourceNotConfigured'

/** Last.fm's API endpoint; the method is chosen with the `method` query parameter. */
const LASTFM_API_URL = 'https://ws.audioscrobbler.com/2.0/'

/** Last.fm error code for invalid parameters, which it returns when the user does not exist. */
const LASTFM_INVALID_PARAMETERS = 6

/** Largest album picture size Last.fm returns. */
const LASTFM_IMAGE_SIZE = 'extralarge'

/** Reads a Last.fm user's most played albums through the Last.fm API. */
export default class LastFmClient {
  private apiKey?: string

  constructor(apiKey: string | undefined) {
    this.apiKey = apiKey
  }

  /** Returns the user's most played albums of all time as items; fails when the user does not exist. */
  public async getTopAlbums(username: string): Promise<ImportedItem[]> {
    if (!this.apiKey) {
      throw new ImportSourceNotConfigured(ImportSource.LASTFM)
    }

    const params = new URLSearchParams({
      method: 'user.gettopalbums',
      user: username,
      period: 'overall',
      limit: String(MAX_IMPORTED_ITEMS),
      api_key: this.apiKey,
      format: 'json',
    })
    const response = await fetch(`${LASTFM_API_URL}?${params}`)
    const body = await response.json() as LastFmTopAlbumsResponse
    if (body.error === LASTFM_INVALID_PARAMETERS) {
      throw new ImportNotFound(`Last.fm user "${username}" was not found`)
    }
    if (!response.ok || !body.topalbums) {
      throw new ImportSourceFailed(ImportSource.LASTFM, response.status)
    }

    return body.topalbums.album.map((album) => ({
      name: album.name,
      description: `Album by ${album.artist.name}, played ${album.playcount} times on Last.fm`,
      imageUrl: album.image.find((image) => image.size === LASTFM_IMAGE_SIZE)?.['#text'] || undefined,
    }))
  }
}
