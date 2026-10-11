/** External services that interests can be imported from. */
enum ImportSource {
    /** A Last.fm user's most played albums; the query is the Last.fm username. */
    LASTFM = 'lastfm',
    /** The videos of a public YouTube playlist; the query is the playlist URL or id. */
    YOUTUBE = 'youtube',
}

export default ImportSource
