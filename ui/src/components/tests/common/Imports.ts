import type { ImportedItem } from '@/components/types'

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
