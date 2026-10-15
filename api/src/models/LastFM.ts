/** One picture of a Last.fm item, at one of Last.fm's sizes. */
export type LastFmImage = {
    size: string
    '#text': string
}

/** One album of a user's Last.fm top albums. */
export type LastFmAlbum = {
    name: string
    playcount: string
    artist: { name: string }
    image: LastFmImage[]
}

/** One artist in a user's Last.fm top artists. */
export type LastFmArtist = {
    name: string
    playcount: string
    image: LastFmImage[]
}

/** Body of Last.fm's user.gettopalbums method. */
export type LastFmTopAlbumsResponse = {
    topalbums?: {
        album: LastFmAlbum[]
        '@attr'?: { totalPages: string }
    }
    error?: number
    message?: string
}

/** Body of Last.fm's user.gettopartists method. */
export type LastFmTopArtistsResponse = {
    topartists?: {
        artist: LastFmArtist[]
        '@attr'?: { totalPages: string }
    }
    error?: number
    message?: string
}
