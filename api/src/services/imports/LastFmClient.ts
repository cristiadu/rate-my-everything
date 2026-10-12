import ImportSource from '@/models/ImportSource'
import { IMPORT_PAGE_SIZE, ImportedItem } from '@/models/ImportedItem'
import type { LastFmImage, LastFmTopAlbumsResponse, LastFmTopArtistsResponse } from '@/models/LastFmModels'
import { ImportNotFound } from '@/errors/ImportNotFound'
import { ImportSourceFailed } from '@/errors/ImportSourceFailed'
import { ImportSourceNotConfigured } from '@/errors/ImportSourceNotConfigured'

/** Last.fm's API endpoint; the method is chosen with the `method` query parameter. */
const LASTFM_API_URL = 'https://ws.audioscrobbler.com/2.0/'

/** Last.fm error code for invalid parameters, which it returns when the user does not exist. */
const LASTFM_INVALID_PARAMETERS = 6

/** Largest picture size returned by Last.fm. */
const LASTFM_IMAGE_SIZE = 'extralarge'

/** Last.fm API method that returns a user's most played albums. */
const LASTFM_TOP_ALBUMS_METHOD = 'user.gettopalbums'

/** Last.fm API method that returns a user's most played artists. */
const LASTFM_TOP_ARTISTS_METHOD = 'user.gettopartists'

/** Last.fm period that requests all-time top items. */
const LASTFM_OVERALL_PERIOD = 'overall'

/** Last.fm response encoding requested by the client. */
const LASTFM_RESPONSE_FORMAT = 'json'

/** Returns the largest available Last.fm image URL, falling back when the largest size is blank. */
const getLastFmImageUrl = (images: LastFmImage[]): string | undefined => (
  images.find((image) => image.size === LASTFM_IMAGE_SIZE && image['#text'])?.['#text']
  ?? images.filter((image) => image['#text']).at(-1)?.['#text']
)

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
        method: LASTFM_TOP_ALBUMS_METHOD,
        user: username,
        period: LASTFM_OVERALL_PERIOD,
        limit: String(IMPORT_PAGE_SIZE),
        page: String(page),
        api_key: this.apiKey,
        format: LASTFM_RESPONSE_FORMAT,
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
        imageUrl: getLastFmImageUrl(album.image),
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
        method: LASTFM_TOP_ARTISTS_METHOD,
        user: username,
        period: LASTFM_OVERALL_PERIOD,
        limit: String(IMPORT_PAGE_SIZE),
        page: String(page),
        api_key: this.apiKey,
        format: LASTFM_RESPONSE_FORMAT,
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
        imageUrl: getLastFmImageUrl(artist.image),
      })))
      totalPages = Number(body.topartists['@attr']?.totalPages ?? page)
      page += 1
    }

    return items
  }
}
