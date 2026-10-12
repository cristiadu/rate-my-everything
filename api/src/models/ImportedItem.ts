import Item from '@/models/Item'

/** Number of items requested from a paginated external service at a time. */
export const IMPORT_PAGE_SIZE = 50

/** An interest found on an external service, with the item fields it fills in. */
export type ImportedItem = Pick<Item, 'name' | 'description' | 'imageUrl'>

/** One picture of a Last.fm album, at one of Last.fm's sizes (small, medium, large, extralarge). */
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

/** Body of Last.fm's user.gettopalbums method: the albums on success, or a Last.fm error code and message. */
export type LastFmTopAlbumsResponse = {
    topalbums?: {
        album: LastFmAlbum[]
        '@attr'?: { totalPages: string }
    }
    error?: number
    message?: string
}

/** Body of Last.fm's user.gettopartists method: artists on success, or an API error. */
export type LastFmTopArtistsResponse = {
    topartists?: {
        artist: LastFmArtist[]
        '@attr'?: { totalPages: string }
    }
    error?: number
    message?: string
}

/** One video thumbnail of a YouTube playlist item. */
export type YouTubeThumbnail = {
    url: string
}

/** One entry of a YouTube playlist; deleted and private videos have no owner channel and no thumbnails. */
export type YouTubePlaylistItem = {
    snippet: {
        title: string
        videoOwnerChannelTitle?: string
        thumbnails: { default?: YouTubeThumbnail, medium?: YouTubeThumbnail, high?: YouTubeThumbnail }
    }
}

/** Body of YouTube's playlistItems.list endpoint. */
export type YouTubePlaylistItemsResponse = {
    items: YouTubePlaylistItem[]
    nextPageToken?: string
}

/** One video returned by YouTube's videos.list endpoint. */
export type YouTubeVideo = {
    snippet: {
        title: string
        channelTitle: string
        thumbnails: { default?: YouTubeThumbnail, medium?: YouTubeThumbnail, high?: YouTubeThumbnail }
    }
}

/** Body of YouTube's videos.list endpoint. */
export type YouTubeVideosResponse = {
    items: YouTubeVideo[]
}
