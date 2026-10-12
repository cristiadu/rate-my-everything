import ImportSource from '@/models/ImportSource'
import {
  IMPORT_PAGE_SIZE, ImportedItem, LastFmTopAlbumsResponse, LastFmTopArtistsResponse,
} from '@/models/ImportedItem'
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

  /** Returns every page of the user's all-time top albums as items; fails when the user does not exist. */
  public async getTopAlbums(username: string): Promise<ImportedItem[]> {
    if (!this.apiKey) {
      throw new ImportSourceNotConfigured(ImportSource.LASTFM)
    }

    const items: ImportedItem[] = []
    let page = 1
    let totalPages = 1
    while (page <= totalPages) {
      const params = new URLSearchParams({
      method: 'user.gettopalbums',
      user: username,
      period: 'overall',
      limit: String(IMPORT_PAGE_SIZE),
      page: String(page),
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

      items.push(...body.topalbums.album.map((album) => ({
        type: 'Album' as const,
        name: album.name,
        description: `Album by ${album.artist.name}, played ${album.playcount} times on Last.fm`,
        imageUrl: album.image.find((image) => image.size === LASTFM_IMAGE_SIZE)?.['#text'] || undefined,
      })))
      totalPages = Number(body.topalbums['@attr']?.totalPages ?? page)
      page += 1
    }

    return items
  }

  /** Returns every page of the user's all-time top artists as items; fails when the user does not exist. */
  public async getTopArtists(username: string): Promise<ImportedItem[]> {
    if (!this.apiKey) {
      throw new ImportSourceNotConfigured(ImportSource.LASTFM)
    }

    const items: ImportedItem[] = []
    let page = 1
    let totalPages = 1
    while (page <= totalPages) {
      const params = new URLSearchParams({
        method: 'user.gettopartists',
        user: username,
        period: 'overall',
        limit: String(IMPORT_PAGE_SIZE),
        page: String(page),
        api_key: this.apiKey,
        format: 'json',
      })
      const response = await fetch(`${LASTFM_API_URL}?${params}`)
      const body = await response.json() as LastFmTopArtistsResponse
      if (body.error === LASTFM_INVALID_PARAMETERS) {
        throw new ImportNotFound(`Last.fm user "${username}" was not found`)
      }
      if (!response.ok || !body.topartists) {
        throw new ImportSourceFailed(ImportSource.LASTFM, response.status)
      }

      items.push(...body.topartists.artist.map((artist) => ({
        type: 'Artist' as const,
        name: artist.name,
        description: `Artist, played ${artist.playcount} times on Last.fm`,
        imageUrl: artist.image.find((image) => image.size === LASTFM_IMAGE_SIZE)?.['#text'] || undefined,
      })))
      totalPages = Number(body.topartists['@attr']?.totalPages ?? page)
      page += 1
    }

    return items
  }
}
