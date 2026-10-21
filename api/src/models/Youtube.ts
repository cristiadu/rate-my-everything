/** One video thumbnail returned by the YouTube Data API. */
type YouTubeThumbnail = {
    url: string
}

/** One entry of a YouTube playlist; deleted and private videos have no owner channel. */
type YouTubePlaylistItem = {
    snippet: {
        title: string
        videoOwnerChannelTitle?: string
        description?: string
        thumbnails: { default?: YouTubeThumbnail, medium?: YouTubeThumbnail, high?: YouTubeThumbnail }
    }
}

/** Body of YouTube's playlistItems.list endpoint. */
export type YouTubePlaylistItemsResponse = {
    items: YouTubePlaylistItem[]
    nextPageToken?: string
}

/** One video returned by YouTube's videos.list endpoint. */
type YouTubeVideo = {
    snippet: {
        title: string
        channelTitle: string
        description?: string
        thumbnails: { default?: YouTubeThumbnail, medium?: YouTubeThumbnail, high?: YouTubeThumbnail }
    }
}

/** Body of YouTube's videos.list endpoint. */
export type YouTubeVideosResponse = {
    items: YouTubeVideo[]
}
