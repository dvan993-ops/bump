/**
 * Domain model and seed data for the Match tab.
 *
 * Everything here is local mock data, shaped the way a real API response would
 * be so that swapping in a backend later is a change of source, not of screens.
 * Every preview points at the one bundled audio file; `previewStart` gives each
 * post a different-sounding section so the feed does not repeat itself.
 */

export const ROLES = [
  'Producer',
  'Rapper',
  'Singer',
  'Songwriter',
  'Engineer',
  'Guitarist',
  'Drummer',
  'DJ',
] as const;

export type Role = (typeof ROLES)[number];

export const GENRES = [
  'Trap',
  'Drill',
  'R&B',
  'Hip-Hop',
  'Boom Bap',
  'Afrobeats',
  'Soul',
  'Lo-Fi',
  'Jersey Club',
  'House',
  'Pop',
] as const;

export type Genre = (typeof GENRES)[number];

export const LOOKING_FOR = [
  'Open to collabs',
  'Need vocals',
  'Need a rapper',
  'Looking for producers',
  'Need a mix engineer',
  'Need guitar',
  'Need drums',
  'Need a songwriter',
] as const;

export type LookingFor = (typeof LOOKING_FOR)[number];

export type Rank = 'Underground' | 'Rising' | 'Elite' | 'Worldwide';

/** A single piece of short-form audio attached to an artist. */
export type MatchPost = {
  id: string;
  title: string;
  /** Seconds into the bundled preview file where this snippet starts. */
  previewStart: number;
  durationLabel: string;
  genre: Genre;
  bpm: number;
  musicalKey: string;
  plays: number;
  bumps: number;
  createdAt: string;
  /** Present only on Open Collab posts — the ask, in the artist's words. */
  openCollabAsk?: string;
  /** Roles the artist wants to hear on this post. */
  wantedRoles?: Role[];
  /** Set when this post is a response laid over someone else's track. */
  respondsTo?: {
    postId: string;
    artistHandle: string;
    title: string;
  };
};

export type Artist = {
  id: string;
  name: string;
  handle: string;
  role: Role;
  /** Secondary things they do, shown only in the profile sheet. */
  alsoDoes: Role[];
  genres: Genre[];
  location: string;
  /** Distance from the viewer, in kilometres. */
  distanceKm: number;
  lookingFor: LookingFor;
  /** Roles this artist is actively seeking. */
  wants: Role[];
  rank: Rank;
  followers: number;
  bio: string;
  following: boolean;
  /** They already bumped the viewer — bumping back creates an instant match. */
  bumpedYou: boolean;
  posts: MatchPost[];
};

/** The signed-in user. Drives every recommendation in `lib/match-discovery`. */
export type Viewer = {
  handle: string;
  role: Role;
  alsoDoes: Role[];
  genres: Genre[];
  location: string;
  lookingFor: LookingFor;
  wants: Role[];
  /**
   * How much the viewer actually engages with each genre, 0-1. In production
   * this is derived from listen-through rate, not from what they declared.
   */
  tasteWeights: Partial<Record<Genre, number>>;
  /** Artists the viewer has already bumped, most recent first. */
  bumpedArtistIds: string[];
  /** Artists already matched with — excluded from discovery. */
  matchedArtistIds: string[];
};

export const VIEWER: Viewer = {
  handle: 'you',
  role: 'Producer',
  alsoDoes: ['Engineer'],
  genres: ['Trap', 'Drill', 'R&B'],
  location: 'Auckland, NZ',
  lookingFor: 'Need vocals',
  wants: ['Rapper', 'Singer', 'Songwriter'],
  tasteWeights: {
    Trap: 0.95,
    Drill: 0.8,
    'R&B': 0.7,
    'Hip-Hop': 0.55,
    Soul: 0.35,
    'Lo-Fi': 0.3,
    Afrobeats: 0.25,
  },
  bumpedArtistIds: [],
  matchedArtistIds: [],
};

export const ARTISTS: Artist[] = [
  {
    id: 'a1',
    name: 'Kyd',
    handle: 'kydvibes',
    role: 'Producer',
    alsoDoes: ['Engineer'],
    genres: ['Trap', 'Drill'],
    location: 'Auckland, NZ',
    distanceKm: 4,
    lookingFor: 'Need vocals',
    wants: ['Rapper', 'Singer'],
    rank: 'Elite',
    followers: 18400,
    bio: 'Dark melodic trap. I leave space for the voice on purpose.',
    following: true,
    bumpedYou: true,
    posts: [
      {
        id: 'a1p1',
        title: 'Midnight Drive',
        previewStart: 0,
        durationLabel: '0:24',
        genre: 'Trap',
        bpm: 148,
        musicalKey: 'F# Minor',
        plays: 24180,
        bumps: 1402,
        createdAt: '2026-08-25T08:30:00Z',
        openCollabAsk: 'Need vocals on this — hook first, verse after.',
        wantedRoles: ['Singer', 'Rapper'],
      },
      {
        id: 'a1p2',
        title: 'Rearview',
        previewStart: 32,
        durationLabel: '0:18',
        genre: 'Trap',
        bpm: 142,
        musicalKey: 'B Minor',
        plays: 9120,
        bumps: 610,
        createdAt: '2026-08-19T21:15:00Z',
      },
      {
        id: 'a1p3',
        title: 'Static Bloom',
        previewStart: 64,
        durationLabel: '0:21',
        genre: 'Drill',
        bpm: 144,
        musicalKey: 'D Minor',
        plays: 5330,
        bumps: 288,
        createdAt: '2026-08-11T10:45:00Z',
      },
    ],
  },
  {
    id: 'a2',
    name: 'Raven',
    handle: 'ravengrey',
    role: 'Singer',
    alsoDoes: ['Songwriter'],
    genres: ['R&B', 'Soul'],
    location: 'Auckland, NZ',
    distanceKm: 9,
    lookingFor: 'Looking for producers',
    wants: ['Producer'],
    rank: 'Rising',
    followers: 7620,
    bio: 'Raspy top lines. Send me something with room in the low end.',
    following: false,
    bumpedYou: true,
    posts: [
      {
        id: 'a2p1',
        title: 'Ghost Of It',
        previewStart: 12,
        durationLabel: '0:22',
        genre: 'R&B',
        bpm: 92,
        musicalKey: 'A Minor',
        plays: 15300,
        bumps: 980,
        createdAt: '2026-08-26T13:00:00Z',
      },
      {
        id: 'a2p2',
        title: 'Hook idea over @kydvibes',
        previewStart: 48,
        durationLabel: '0:16',
        genre: 'Trap',
        bpm: 148,
        musicalKey: 'F# Minor',
        plays: 6410,
        bumps: 512,
        createdAt: '2026-08-26T19:20:00Z',
        respondsTo: {
          postId: 'a1p1',
          artistHandle: 'kydvibes',
          title: 'Midnight Drive',
        },
      },
      {
        id: 'a2p3',
        title: 'Slow Burn',
        previewStart: 80,
        durationLabel: '0:19',
        genre: 'Soul',
        bpm: 78,
        musicalKey: 'C Minor',
        plays: 3980,
        bumps: 214,
        createdAt: '2026-08-14T09:05:00Z',
      },
    ],
  },
  {
    id: 'a3',
    name: 'Mvrley',
    handle: 'mvrley',
    role: 'Rapper',
    alsoDoes: ['Songwriter'],
    genres: ['Drill', 'Trap'],
    location: 'Auckland, NZ',
    distanceKm: 2,
    lookingFor: 'Looking for producers',
    wants: ['Producer', 'Engineer'],
    rank: 'Rising',
    followers: 11250,
    bio: 'Fast pocket, no filler. 16s turned around in a day.',
    following: false,
    bumpedYou: true,
    posts: [
      {
        id: 'a3p1',
        title: '16 Bars (Cold Open)',
        previewStart: 20,
        durationLabel: '0:20',
        genre: 'Drill',
        bpm: 142,
        musicalKey: 'D Minor',
        plays: 20140,
        bumps: 1620,
        createdAt: '2026-08-26T21:15:00Z',
      },
      {
        id: 'a3p2',
        title: 'Pressure Freestyle',
        previewStart: 56,
        durationLabel: '0:17',
        genre: 'Drill',
        bpm: 145,
        musicalKey: 'G Minor',
        plays: 8890,
        bumps: 705,
        createdAt: '2026-08-20T18:40:00Z',
      },
    ],
  },
  {
    id: 'a4',
    name: 'Ocean',
    handle: 'prodbyocean',
    role: 'Producer',
    alsoDoes: ['Engineer', 'Songwriter'],
    genres: ['R&B', 'Lo-Fi', 'Soul'],
    location: 'Wellington, NZ',
    distanceKm: 494,
    lookingFor: 'Need vocals',
    wants: ['Singer', 'Songwriter'],
    rank: 'Worldwide',
    followers: 64300,
    bio: 'Late-night chords. Mostly R&B, occasionally something slower.',
    following: true,
    bumpedYou: false,
    posts: [
      {
        id: 'a4p1',
        title: 'Neon Dreams',
        previewStart: 8,
        durationLabel: '0:25',
        genre: 'R&B',
        bpm: 92,
        musicalKey: 'A Minor',
        plays: 53020,
        bumps: 4180,
        createdAt: '2026-08-24T13:00:00Z',
        openCollabAsk: 'Who wants to remix this? Stems are ready.',
        wantedRoles: ['Producer', 'DJ'],
      },
      {
        id: 'a4p2',
        title: 'Blue Hour',
        previewStart: 44,
        durationLabel: '0:20',
        genre: 'Lo-Fi',
        bpm: 84,
        musicalKey: 'E Minor',
        plays: 18700,
        bumps: 1210,
        createdAt: '2026-08-16T11:30:00Z',
      },
    ],
  },
  {
    id: 'a5',
    name: 'Kairo',
    handle: 'beatsbykairo',
    role: 'Producer',
    alsoDoes: [],
    genres: ['Drill', 'Hip-Hop'],
    location: 'London, UK',
    distanceKm: 18320,
    lookingFor: 'Need a rapper',
    wants: ['Rapper'],
    rank: 'Elite',
    followers: 41800,
    bio: 'UK drill, heavy sliding 808s. Beats go to whoever bodies them.',
    following: false,
    bumpedYou: false,
    posts: [
      {
        id: 'a5p1',
        title: 'Pressure',
        previewStart: 28,
        durationLabel: '0:23',
        genre: 'Drill',
        bpm: 142,
        musicalKey: 'D Minor',
        plays: 89120,
        bumps: 6440,
        createdAt: '2026-08-23T21:15:00Z',
        openCollabAsk: 'Looking for someone to rap on this beat.',
        wantedRoles: ['Rapper'],
      },
      {
        id: 'a5p2',
        title: 'Corner Shop',
        previewStart: 72,
        durationLabel: '0:19',
        genre: 'Hip-Hop',
        bpm: 138,
        musicalKey: 'A Minor',
        plays: 22400,
        bumps: 1580,
        createdAt: '2026-08-12T16:00:00Z',
      },
    ],
  },
  {
    id: 'a6',
    name: 'Luna',
    handle: 'lunaroots',
    role: 'Singer',
    alsoDoes: ['Songwriter'],
    genres: ['Afrobeats', 'Soul', 'Pop'],
    location: 'Sydney, AU',
    distanceKm: 2160,
    lookingFor: 'Open to collabs',
    wants: ['Producer', 'Guitarist'],
    rank: 'Rising',
    followers: 9340,
    bio: 'Afro-soul melodies. I write fast and I write a lot.',
    following: false,
    bumpedYou: false,
    posts: [
      {
        id: 'a6p1',
        title: 'Golden Hour',
        previewStart: 16,
        durationLabel: '0:21',
        genre: 'Afrobeats',
        bpm: 104,
        musicalKey: 'F Major',
        plays: 12800,
        bumps: 890,
        createdAt: '2026-08-25T07:10:00Z',
      },
      {
        id: 'a6p2',
        title: 'Sun Down',
        previewStart: 60,
        durationLabel: '0:18',
        genre: 'Soul',
        bpm: 88,
        musicalKey: 'D Major',
        plays: 5210,
        bumps: 340,
        createdAt: '2026-08-17T15:45:00Z',
      },
    ],
  },
  {
    id: 'a7',
    name: 'Nox',
    handle: 'nox.wav',
    role: 'Engineer',
    alsoDoes: ['Producer'],
    genres: ['Hip-Hop', 'Trap', 'R&B'],
    location: 'Auckland, NZ',
    distanceKm: 6,
    lookingFor: 'Open to collabs',
    wants: ['Producer', 'Rapper', 'Singer'],
    rank: 'Elite',
    followers: 14900,
    bio: 'Mix and master. Send stems, get them back loud and clean.',
    following: false,
    bumpedYou: false,
    posts: [
      {
        id: 'a7p1',
        title: 'Before / After — Cold Summer',
        previewStart: 36,
        durationLabel: '0:22',
        genre: 'Hip-Hop',
        bpm: 126,
        musicalKey: 'C Minor',
        plays: 7340,
        bumps: 520,
        createdAt: '2026-08-26T10:45:00Z',
        openCollabAsk: 'Send me a rough mix, I will do one free pass this week.',
        wantedRoles: ['Producer', 'Rapper'],
      },
      {
        id: 'a7p2',
        title: 'Vocal Chain Demo',
        previewStart: 88,
        durationLabel: '0:15',
        genre: 'R&B',
        bpm: 90,
        musicalKey: 'G Minor',
        plays: 3120,
        bumps: 180,
        createdAt: '2026-08-18T12:20:00Z',
      },
    ],
  },
  {
    id: 'a8',
    name: 'TK',
    handle: 'tk.strings',
    role: 'Guitarist',
    alsoDoes: ['Producer'],
    genres: ['Lo-Fi', 'Soul', 'R&B'],
    location: 'Auckland, NZ',
    distanceKm: 12,
    lookingFor: 'Open to collabs',
    wants: ['Producer', 'Singer'],
    rank: 'Underground',
    followers: 2140,
    bio: 'Neo-soul guitar, one take, no grid. Loops on request.',
    following: false,
    bumpedYou: false,
    posts: [
      {
        id: 'a8p1',
        title: 'Warm Room Loop',
        previewStart: 24,
        durationLabel: '0:19',
        genre: 'Soul',
        bpm: 86,
        musicalKey: 'E Major',
        plays: 4180,
        bumps: 390,
        createdAt: '2026-08-25T17:00:00Z',
      },
      {
        id: 'a8p2',
        title: 'Guitar over @prodbyocean',
        previewStart: 68,
        durationLabel: '0:16',
        genre: 'Lo-Fi',
        bpm: 84,
        musicalKey: 'E Minor',
        plays: 2760,
        bumps: 246,
        createdAt: '2026-08-26T08:00:00Z',
        respondsTo: {
          postId: 'a4p2',
          artistHandle: 'prodbyocean',
          title: 'Blue Hour',
        },
      },
    ],
  },
  {
    id: 'a9',
    name: 'Glasswave',
    handle: 'glasswave',
    role: 'DJ',
    alsoDoes: ['Producer'],
    genres: ['Jersey Club', 'House'],
    location: 'Melbourne, AU',
    distanceKm: 2620,
    lookingFor: 'Need vocals',
    wants: ['Singer', 'Rapper'],
    rank: 'Rising',
    followers: 16700,
    bio: 'Club edits and jersey flips. Everything is 140 and up.',
    following: false,
    bumpedYou: false,
    posts: [
      {
        id: 'a9p1',
        title: 'Run It Back (Club Mix)',
        previewStart: 40,
        durationLabel: '0:20',
        genre: 'Jersey Club',
        bpm: 146,
        musicalKey: 'A Minor',
        plays: 31400,
        bumps: 2280,
        createdAt: '2026-08-22T23:30:00Z',
      },
    ],
  },
  {
    id: 'a10',
    name: 'Sabre',
    handle: 'sabrewest',
    role: 'Rapper',
    alsoDoes: [],
    genres: ['Boom Bap', 'Hip-Hop'],
    location: 'Auckland, NZ',
    distanceKm: 15,
    lookingFor: 'Looking for producers',
    wants: ['Producer'],
    rank: 'Underground',
    followers: 3480,
    bio: 'Boom bap purist. Dusty drums or nothing.',
    following: false,
    bumpedYou: false,
    posts: [
      {
        id: 'a10p1',
        title: 'Tape Deck',
        previewStart: 52,
        durationLabel: '0:18',
        genre: 'Boom Bap',
        bpm: 90,
        musicalKey: 'F Minor',
        plays: 6120,
        bumps: 410,
        createdAt: '2026-08-21T14:10:00Z',
      },
    ],
  },
  {
    id: 'a11',
    name: 'Ivy',
    handle: 'ivyokafor',
    role: 'Singer',
    alsoDoes: ['Songwriter'],
    genres: ['Afrobeats', 'Pop', 'R&B'],
    location: 'Auckland, NZ',
    distanceKm: 7,
    lookingFor: 'Looking for producers',
    wants: ['Producer', 'Engineer'],
    rank: 'Rising',
    followers: 8890,
    bio: 'Big hooks, small room. Looking for someone to build a project with.',
    following: false,
    bumpedYou: false,
    posts: [
      {
        id: 'a11p1',
        title: 'No Signal',
        previewStart: 4,
        durationLabel: '0:23',
        genre: 'Afrobeats',
        bpm: 106,
        musicalKey: 'B Minor',
        plays: 14200,
        bumps: 1090,
        createdAt: '2026-08-26T06:30:00Z',
        openCollabAsk: 'Acapella is up — need someone to build a beat under it.',
        wantedRoles: ['Producer'],
      },
      {
        id: 'a11p2',
        title: 'Told You',
        previewStart: 76,
        durationLabel: '0:17',
        genre: 'R&B',
        bpm: 94,
        musicalKey: 'A Minor',
        plays: 5640,
        bumps: 402,
        createdAt: '2026-08-15T20:00:00Z',
      },
    ],
  },
  {
    id: 'a12',
    name: 'Rei',
    handle: 'drumsbyrei',
    role: 'Drummer',
    alsoDoes: ['Producer'],
    genres: ['Soul', 'Hip-Hop', 'Lo-Fi'],
    location: 'Christchurch, NZ',
    distanceKm: 762,
    lookingFor: 'Open to collabs',
    wants: ['Producer', 'Guitarist'],
    rank: 'Underground',
    followers: 1960,
    bio: 'Live drums for people who are tired of the same three loops.',
    following: false,
    bumpedYou: false,
    posts: [
      {
        id: 'a12p1',
        title: 'Live Break — 92bpm',
        previewStart: 92,
        durationLabel: '0:16',
        genre: 'Soul',
        bpm: 92,
        musicalKey: 'N/A',
        plays: 2840,
        bumps: 260,
        createdAt: '2026-08-24T09:15:00Z',
        openCollabAsk: 'Need a guitarist to play over this break.',
        wantedRoles: ['Guitarist', 'Producer'],
      },
    ],
  },
];

/** Every post that is marked as an Open Collab, paired with its artist. */
export function openCollabs(
  artists: Artist[] = ARTISTS,
): { artist: Artist; post: MatchPost }[] {
  return artists.flatMap((artist) =>
    artist.posts
      .filter((post) => Boolean(post.openCollabAsk))
      .map((post) => ({ artist, post })),
  );
}

/** Finds an artist by handle. Used to resolve `respondsTo` links. */
export function artistByHandle(handle: string): Artist | undefined {
  return ARTISTS.find((artist) => artist.handle === handle);
}
