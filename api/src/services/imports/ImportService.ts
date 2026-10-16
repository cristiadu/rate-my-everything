import ImportSource from '@/models/ImportSource'
import { ImportedItem, ImportSourceDescription } from '@/models/ImportedItem'
import LastFmClient from '@/services/imports/LastFmClient'
import YouTubeClient from '@/services/imports/YouTubeClient'

/** Every source items can be imported from, in the order the import screen lists them. */
const IMPORT_SOURCE_DESCRIPTIONS: ImportSourceDescription[] = [
  { source: ImportSource.LASTFM, label: 'Last.fm artists and albums', queryLabel: 'Last.fm username' },
  { source: ImportSource.YOUTUBE, label: 'YouTube', queryLabel: 'Video or playlist URL' },
]

/** Finds interests on external services so users can add them as items without typing them in. */
export default class ImportService {
  private lastFmClient = new LastFmClient(process.env.LASTFM_API_KEY)

  private youTubeClient = new YouTubeClient(process.env.YOUTUBE_API_KEY)

  /** Lists the sources items can be imported from, with the labels the import screen shows. */
  public getSources(): ImportSourceDescription[] {
    return IMPORT_SOURCE_DESCRIPTIONS
  }

  /** Returns the items found on the source for the query: a Last.fm username or a YouTube video or playlist URL. */
  public async findItems(source: ImportSource, query: string): Promise<ImportedItem[]> {
    switch (source) {
      case ImportSource.LASTFM:
        return (await Promise.all([
          this.lastFmClient.getTopArtists(query),
          this.lastFmClient.getTopAlbums(query),
        ])).flat()
      case ImportSource.YOUTUBE:
        return this.youTubeClient.getVideos(query)
    }
  }
}
