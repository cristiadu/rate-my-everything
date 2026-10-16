import { describe, it, expect, afterEach, vi } from 'vitest'
import LastFmClient from '@/services/imports/LastFmClient'
import ImportSource from '@/models/ImportSource'
import { UnknownResource } from '@/errors/UnknownResource'
import { ImportSourceFailed } from '@/errors/ImportSourceFailed'
import { ImportSourceNotConfigured } from '@/errors/ImportSourceNotConfigured'
import {
  lastFmInvalidApiKey, lastFmTopAlbums, lastFmTopArtists, lastFmUserNotFound, mockExternalApi,
} from '@@/testutils/common/Imports'

describe('LastFmClient', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns the top albums as items', async () => {
    // GIVEN Last.fm returns two top albums
    const fetchMock = mockExternalApi(lastFmTopAlbums)

    // WHEN the albums of a user are read
    const items = await new LastFmClient('lastfm-key').getTopAlbums('rj')

    // THEN Last.fm is asked for the user's first album page and each album becomes an item
    expect(String(fetchMock.mock.calls[0][0])).toBe('https://ws.audioscrobbler.com/2.0/'
      + '?method=user.gettopalbums&user=rj&period=overall&limit=50&page=1&api_key=lastfm-key&format=json')
    expect(items).toEqual([
      {
        type: 'Album',
        name: 'In Rainbows',
        description: 'Album by Radiohead, played 312 times on Last.fm',
        imageUrl: 'https://lastfm.freetls.fastly.net/i/u/300x300/in-rainbows.png',
      },
      {
        type: 'Album',
        name: 'Demo Tape',
        description: 'Album by Unknown Band, played 4 times on Last.fm',
        imageUrl: 'https://lastfm.freetls.fastly.net/i/u/34s/demo-tape.png',
      },
    ])
  })

  it('returns albums from every Last.fm page', async () => {
    // GIVEN Last.fm has two pages of albums for the user
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const page = new URL(String(input)).searchParams.get('page')
      const body = page === '1'
        ? { ...lastFmTopAlbums, topalbums: { ...lastFmTopAlbums.topalbums!, '@attr': { totalPages: '2' } } }
        : { topalbums: { album: [{
          name: 'OK Computer', playcount: '200', artist: { name: 'Radiohead' }, image: [],
        }], '@attr': { totalPages: '2' } } }
      return new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } })
    })

    // WHEN all top albums are requested
    const items = await new LastFmClient('lastfm-key').getTopAlbums('rj')

    // THEN both pages are requested and the page two album is returned
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(String(fetchMock.mock.calls[1][0])).toContain('page=2')
    expect(items.map((item) => item.name)).toEqual(['In Rainbows', 'Demo Tape', 'OK Computer'])
  })

  it('returns the users top artists with their images', async () => {
    // GIVEN Last.fm returns the user's top artists
    const fetchMock = mockExternalApi(lastFmTopArtists)

    // WHEN the user's artists are read
    const items = await new LastFmClient('lastfm-key').getTopArtists('rj')

    // THEN Last.fm is asked for top artists and the artist becomes an item
    expect(String(fetchMock.mock.calls[0][0])).toContain('method=user.gettopartists')
    expect(items).toEqual([{
      type: 'Artist',
      name: 'Radiohead',
      description: 'Artist, played 1200 times on Last.fm',
      imageUrl: 'https://lastfm.freetls.fastly.net/i/u/300x300/radiohead.png',
    }])
  })

  it('fails with UnknownResource when the user does not exist', async () => {
    // GIVEN Last.fm does not know the user
    mockExternalApi(lastFmUserNotFound, 404)

    // WHEN the albums are read THEN the missing user is reported
    await expect(new LastFmClient('lastfm-key').getTopAlbums('nobody'))
      .rejects.toThrow(new UnknownResource('Last.fm user', 'nobody'))
  })

  it('fails with ImportSourceFailed on any other Last.fm error', async () => {
    // GIVEN Last.fm rejects the API key
    mockExternalApi(lastFmInvalidApiKey, 403)

    // WHEN the albums are read THEN the failed call is reported with its status
    await expect(new LastFmClient('bad-key').getTopAlbums('rj'))
      .rejects.toThrow(new ImportSourceFailed(ImportSource.LASTFM, 403))
  })

  it('fails with ImportSourceNotConfigured without calling Last.fm when there is no API key', async () => {
    // GIVEN no Last.fm API key
    const fetchMock = mockExternalApi(lastFmTopAlbums)

    // WHEN the albums are read THEN the missing configuration is reported
    await expect(new LastFmClient(undefined).getTopAlbums('rj')).rejects.toThrow(ImportSourceNotConfigured)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('fails with ImportSourceFailed when Last.fm refuses the top artists', async () => {
    // GIVEN Last.fm rejects the API key
    mockExternalApi(lastFmInvalidApiKey, 403)

    // WHEN the artists are read THEN the failed call is reported with its status
    await expect(new LastFmClient('bad-key').getTopArtists('rj'))
      .rejects.toThrow(new ImportSourceFailed(ImportSource.LASTFM, 403))
  })

  it('fails with ImportSourceNotConfigured without calling Last.fm for artists when there is no API key', async () => {
    // GIVEN no Last.fm API key
    const fetchMock = mockExternalApi(lastFmTopArtists)

    // WHEN the artists are read THEN the missing configuration is reported
    await expect(new LastFmClient(undefined).getTopArtists('rj')).rejects.toThrow(ImportSourceNotConfigured)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
