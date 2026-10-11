import { describe, it, expect, afterEach, vi } from 'vitest'
import LastFmClient from '@/services/imports/LastFmClient'
import ImportSource from '@/models/ImportSource'
import { ImportNotFound } from '@/errors/ImportNotFound'
import { ImportSourceFailed } from '@/errors/ImportSourceFailed'
import { ImportSourceNotConfigured } from '@/errors/ImportSourceNotConfigured'
import { lastFmTopAlbums, lastFmUserNotFound, mockExternalApi } from '@@/testutils/common/Imports'

describe('LastFmClient', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns the top albums as items', async () => {
    // GIVEN Last.fm returns two top albums
    const fetchMock = mockExternalApi(lastFmTopAlbums)

    // WHEN the albums of a user are read
    const items = await new LastFmClient('lastfm-key').getTopAlbums('rj')

    // THEN Last.fm is asked for the user's top 50 albums and each album becomes an item
    expect(String(fetchMock.mock.calls[0][0])).toBe('https://ws.audioscrobbler.com/2.0/'
      + '?method=user.gettopalbums&user=rj&period=overall&limit=50&api_key=lastfm-key&format=json')
    expect(items).toEqual([
      {
        name: 'In Rainbows',
        description: 'Album by Radiohead, played 312 times on Last.fm',
        imageUrl: 'https://lastfm.freetls.fastly.net/i/u/300x300/in-rainbows.png',
      },
      { name: 'Demo Tape', description: 'Album by Unknown Band, played 4 times on Last.fm', imageUrl: undefined },
    ])
  })

  it('fails with ImportNotFound when the user does not exist', async () => {
    // GIVEN Last.fm does not know the user
    mockExternalApi(lastFmUserNotFound, 404)

    // WHEN the albums are read THEN the missing user is reported
    await expect(new LastFmClient('lastfm-key').getTopAlbums('nobody'))
      .rejects.toThrow(new ImportNotFound('Last.fm user "nobody" was not found'))
  })

  it('fails with ImportSourceFailed on any other Last.fm error', async () => {
    // GIVEN Last.fm rejects the API key
    mockExternalApi({ error: 10, message: 'Invalid API key' }, 403)

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
})
