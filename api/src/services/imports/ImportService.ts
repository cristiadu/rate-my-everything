import ImportSource from '@/models/ImportSource'
import { ImportedItem } from '@/models/ImportedItem'
import LastFmClient from '@/services/imports/LastFmClient'
import YouTubeClient from '@/services/imports/YouTubeClient'

/** Finds interests on external services so users can add them as items without typing them in. */
export default class ImportService {
  private lastFmClient = new LastFmClient(process.env.LASTFM_API_KEY)

  private youTubeClient = new YouTubeClient(process.env.YOUTUBE_API_KEY)

  /** Returns the items found on the source for the query: a Last.fm username or a YouTube playlist. */
  public async findItems(source: ImportSource, query: string): Promise<ImportedItem[]> {
    switch (source) {
      case ImportSource.LASTFM:
        return this.lastFmClient.getTopAlbums(query)
      case ImportSource.YOUTUBE:
        return this.youTubeClient.getPlaylistVideos(query)
    }
  }
}
