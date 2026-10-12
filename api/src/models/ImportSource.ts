/** External services that interests can be imported from. */
enum ImportSource {
    /** A Last.fm user's most played albums; the query is the Last.fm username. */
    LASTFM = 'lastfm',
    /** Public YouTube videos; the query is a video or playlist URL. */
    YOUTUBE = 'youtube',
}

export default ImportSource
