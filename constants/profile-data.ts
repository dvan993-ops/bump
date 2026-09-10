export type TrackType = 'Beat' | 'Demo' | 'Open Verse';

export const TRACK_TYPES: TrackType[] = ['Beat', 'Demo', 'Open Verse'];

export type Track = {
  id: string;
  title: string;
  type: TrackType;
  /** Local or remote image URI. `null` falls back to a generated cover. */
  coverUri: string | null;
  genre: string;
  bpm: number | null;
  musicalKey: string;
  caption: string;
  plays: number;
  pinned: boolean;
  createdAt: string;
};

export type TrackFilter = 'all' | TrackType;

export const TRACK_FILTERS: { key: TrackFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'Beat', label: 'Beats' },
  { key: 'Demo', label: 'Demos' },
  { key: 'Open Verse', label: 'Open verses' },
];

export const MOCK_TRACKS: Track[] = [
  {
    id: '1',
    title: 'Midnight Drive',
    type: 'Beat',
    coverUri: null,
    genre: 'Trap',
    bpm: 148,
    musicalKey: 'F# Minor',
    caption: 'Dark melodic trap. Who would sound best on this?',
    plays: 24180,
    pinned: true,
    createdAt: '2026-08-30T08:30:00Z',
  },
  {
    id: '2',
    title: 'No Sleep (Demo)',
    type: 'Demo',
    coverUri: null,
    genre: 'R&B',
    bpm: 94,
    musicalKey: 'A Minor',
    caption: 'Rough vocal idea. Hook is there, verses need work.',
    plays: 3120,
    pinned: false,
    createdAt: '2026-09-06T21:15:00Z',
  },
  {
    id: '3',
    title: '16 Bars Freestyle',
    type: 'Open Verse',
    coverUri: null,
    genre: 'Boom Bap',
    bpm: 90,
    musicalKey: 'D Minor',
    caption: 'Left 16 bars open after the second hook. Jump on it.',
    plays: 8912,
    pinned: false,
    createdAt: '2026-09-02T13:00:00Z',
  },
  {
    id: '4',
    title: 'Glass City',
    type: 'Beat',
    coverUri: null,
    genre: 'Lo-Fi',
    bpm: 82,
    musicalKey: 'C Minor',
    caption: 'Rainy window, cold coffee.',
    plays: 15302,
    pinned: false,
    createdAt: '2026-08-24T10:45:00Z',
  },
  {
    id: '5',
    title: 'Dust on the Needle',
    type: 'Beat',
    coverUri: null,
    genre: 'Boom Bap',
    bpm: 88,
    musicalKey: 'G Minor',
    caption: 'Chopped from a 70s soul record. Drums hit hard.',
    plays: 5337,
    pinned: false,
    createdAt: '2026-08-19T18:20:00Z',
  },
  {
    id: '6',
    title: 'Harbour Lights',
    type: 'Beat',
    coverUri: null,
    genre: 'Lo-Fi',
    bpm: 76,
    musicalKey: 'E♭ Major',
    caption: 'Made this one on the ferry home.',
    plays: 2204,
    pinned: false,
    createdAt: '2026-08-12T07:05:00Z',
  },
  {
    id: '7',
    title: 'Tell Me Twice',
    type: 'Demo',
    coverUri: null,
    genre: 'R&B',
    bpm: 98,
    musicalKey: 'B♭ Minor',
    caption: 'Looking for a vocalist to finish this.',
    plays: 1480,
    pinned: false,
    createdAt: '2026-08-08T16:40:00Z',
  },
  {
    id: '8',
    title: 'K Road Cypher',
    type: 'Open Verse',
    coverUri: null,
    genre: 'Hip-Hop',
    bpm: 96,
    musicalKey: 'F Minor',
    caption: 'Three verses open. First come, first served.',
    plays: 11045,
    pinned: false,
    createdAt: '2026-07-30T20:10:00Z',
  },
];

/**
 * Duotone palettes for generated covers: [shadow, light, record label].
 * Chosen per track by hashing its id, so a cover never changes colour
 * while the producer is editing the title.
 */
export const COVER_PALETTES = [
  ['#2A1540', '#D9467F', '#FFD2E2'],
  ['#0B2E3F', '#2F9FC4', '#CFF1FF'],
  ['#3A2108', '#E39A33', '#FFE8C2'],
  ['#15301F', '#79AD62', '#E3F5D6'],
  ['#4A1010', '#EF6436', '#FFD9C9'],
  ['#161A47', '#6C78FF', '#DCE0FF'],
  ['#242424', '#8E8E8E', '#EDEDED'],
  ['#35300C', '#CDBD3F', '#FFF6C4'],
] as const;

export type CoverPalette = (typeof COVER_PALETTES)[number];

export function paletteFor(id: string): CoverPalette {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }
  return COVER_PALETTES[Math.abs(hash) % COVER_PALETTES.length];
}

export const TRACK_TYPE_ICONS = {
  Beat: 'musical-notes',
  Demo: 'pulse',
  'Open Verse': 'mic',
} as const;
