import { ImportSource, type ImportedItem, type ImportSourceDescription } from '@/api/generated/api'

/** Albums returned by the mocked Last.fm import; the second has no picture. */
export const lastFmImportedItems: ImportedItem[] = [
  {
    type: 'Artist',
    name: 'Radiohead',
    description: 'Artist, played 1200 times on Last.fm',
    imageUrl: 'https://lastfm.freetls.fastly.net/i/u/300x300/radiohead.png',
  },
  {
    type: 'Album',
    name: 'In Rainbows',
    description: 'Album by Radiohead, played 312 times on Last.fm',
    imageUrl: 'https://lastfm.freetls.fastly.net/i/u/300x300/in-rainbows.png',
  },
  { type: 'Album', name: 'Demo Tape', description: 'Album by Unknown Band, played 4 times on Last.fm' },
]

/** Import sources the mocked API lists, with the labels the import screen shows. */
export const importSources: ImportSourceDescription[] = [
  { source: ImportSource.LASTFM, label: 'Last.fm artists and albums', queryLabel: 'Last.fm username' },
  { source: ImportSource.YOUTUBE, label: 'YouTube', queryLabel: 'Video or playlist URL' },
]
