import { vi } from 'vitest'
import { LastFmTopAlbumsResponse, LastFmTopArtistsResponse, YouTubePlaylistItemsResponse } from '@/models/ImportedItem'

/** Last.fm top albums with one album that has a picture and one that has none. */
export const lastFmTopAlbums: LastFmTopAlbumsResponse = {
  topalbums: {
    '@attr': { totalPages: '1' },
    album: [
      {
        name: 'In Rainbows',
        playcount: '312',
        artist: { name: 'Radiohead' },
        image: [
          { size: 'small', '#text': 'https://lastfm.freetls.fastly.net/i/u/34s/in-rainbows.png' },
          { size: 'extralarge', '#text': 'https://lastfm.freetls.fastly.net/i/u/300x300/in-rainbows.png' },
        ],
      },
      {
        name: 'Demo Tape',
        playcount: '4',
        artist: { name: 'Unknown Band' },
        image: [{ size: 'extralarge', '#text': '' }],
      },
    ],
  },
}

/** Last.fm's answer when the requested user does not exist. */
export const lastFmUserNotFound: LastFmTopAlbumsResponse = { error: 6, message: 'User not found' }

/** Last.fm top artists with one artist that has a picture. */
export const lastFmTopArtists: LastFmTopArtistsResponse = {
  topartists: {
    '@attr': { totalPages: '1' },
    artist: [{
      name: 'Radiohead',
      playcount: '1200',
      image: [{ size: 'extralarge', '#text': 'https://lastfm.freetls.fastly.net/i/u/300x300/radiohead.png' }],
    }],
  },
}

/** A YouTube playlist with one available video and one deleted video. */
export const youTubePlaylistItems: YouTubePlaylistItemsResponse = {
  items: [
    {
      snippet: {
        title: 'Never Gonna Give You Up',
        videoOwnerChannelTitle: 'Rick Astley',
        thumbnails: {
          default: { url: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/default.jpg' },
          high: { url: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg' },
        },
      },
    },
    { snippet: { title: 'Deleted video', thumbnails: {} } },
  ],
}

/** Replaces the global fetch with a mock that answers every call with this JSON body and status. */
export const mockExternalApi = (body: object | ((url: string) => object), status = 200) => vi.spyOn(globalThis, 'fetch')
  .mockImplementation(async (input) => {
    const responseBody = typeof body === 'function' ? body(String(input)) : body
    return new Response(JSON.stringify(responseBody), { status, headers: { 'content-type': 'application/json' } })
  })
