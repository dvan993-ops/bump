/**
 * Ranking for the Match feed.
 *
 * Pure functions, no React and no I/O, so the ordering logic can be reasoned
 * about (and later unit tested) on its own. Every signal contributes a bounded
 * number of points and a human-readable reason; the card shows the top reasons
 * so the ranking never feels like a black box.
 */

import type {
  Artist,
  Genre,
  LookingFor,
  MatchPost,
  Role,
  Viewer,
} from '@/constants/match-data';

/** Roles that tend to need each other in a room. */
const COMPLEMENTARY_ROLES: Record<Role, Role[]> = {
  Producer: ['Rapper', 'Singer', 'Songwriter', 'Engineer', 'Guitarist', 'Drummer'],
  Rapper: ['Producer', 'Engineer', 'DJ', 'Songwriter'],
  Singer: ['Producer', 'Songwriter', 'Guitarist', 'Engineer'],
  Songwriter: ['Producer', 'Singer', 'Rapper'],
  Engineer: ['Producer', 'Rapper', 'Singer'],
  Guitarist: ['Producer', 'Singer', 'Drummer'],
  Drummer: ['Producer', 'Guitarist'],
  DJ: ['Producer', 'Rapper', 'Singer'],
};

/** Which roles a "looking for" tag is actually asking for. */
const LOOKING_FOR_ROLES: Record<LookingFor, Role[]> = {
  'Open to collabs': [],
  'Need vocals': ['Singer', 'Rapper'],
  'Need a rapper': ['Rapper'],
  'Looking for producers': ['Producer'],
  'Need a mix engineer': ['Engineer'],
  'Need guitar': ['Guitarist'],
  'Need drums': ['Drummer'],
  'Need a songwriter': ['Songwriter'],
};

export type MatchFilters = {
  roles: Role[];
  genres: Genre[];
  /** null means "anywhere". */
  maxDistanceKm: number | null;
  lookingFor: LookingFor[];
  openCollabsOnly: boolean;
};

export const DEFAULT_FILTERS: MatchFilters = {
  roles: [],
  genres: [],
  maxDistanceKm: null,
  lookingFor: [],
  openCollabsOnly: false,
};

export const DISTANCE_OPTIONS: { label: string; km: number | null }[] = [
  { label: 'Anywhere', km: null },
  { label: 'In my city', km: 30 },
  { label: 'Within 100 km', km: 100 },
  { label: 'Same country', km: 2000 },
];

export function filtersAreActive(filters: MatchFilters): boolean {
  return (
    filters.roles.length > 0 ||
    filters.genres.length > 0 ||
    filters.lookingFor.length > 0 ||
    filters.maxDistanceKm !== null ||
    filters.openCollabsOnly
  );
}

/** One card in the feed. Collab cards foreground the ask, artist cards the person. */
export type FeedItem = {
  key: string;
  kind: 'artist' | 'collab';
  artist: Artist;
  post: MatchPost;
  score: number;
  reasons: string[];
};

type ScoredSignal = {
  points: number;
  reason?: string;
};

/** Jaccard overlap of two genre lists, 0-1. */
function genreOverlap(first: Genre[], second: Genre[]): number {
  if (first.length === 0 || second.length === 0) {
    return 0;
  }

  const shared = first.filter((genre) => second.includes(genre));
  const union = new Set([...first, ...second]);

  return shared.length / union.size;
}

function sharedGenres(first: Genre[], second: Genre[]): Genre[] {
  return first.filter((genre) => second.includes(genre));
}

/**
 * Distance falls off smoothly rather than in steps, so a great artist two
 * cities over still surfaces above a mediocre one down the road.
 */
function proximityFactor(distanceKm: number): number {
  if (distanceKm <= 25) {
    return 1;
  }

  if (distanceKm >= 3000) {
    return 0;
  }

  return Math.max(0, 1 - Math.log10(distanceKm / 25) / Math.log10(3000 / 25));
}

function daysSince(iso: string, now: number): number {
  return (now - new Date(iso).getTime()) / 86_400_000;
}

/** Average of the viewer's engagement weights across an artist's genres, 0-1. */
function tasteAffinity(viewer: Viewer, genres: Genre[]): number {
  if (genres.length === 0) {
    return 0;
  }

  const total = genres.reduce(
    (sum, genre) => sum + (viewer.tasteWeights[genre] ?? 0),
    0,
  );

  return total / genres.length;
}

/**
 * Picks the post to lead with: the one in the genre this viewer actually
 * listens to, with recency and traction breaking ties.
 */
export function leadPostFor(viewer: Viewer, artist: Artist, now = Date.now()): MatchPost {
  const ranked = [...artist.posts].sort((first, second) => {
    const firstTaste = viewer.tasteWeights[first.genre] ?? 0;
    const secondTaste = viewer.tasteWeights[second.genre] ?? 0;

    if (Math.abs(firstTaste - secondTaste) > 0.05) {
      return secondTaste - firstTaste;
    }

    const firstFresh = Math.max(0, 14 - daysSince(first.createdAt, now));
    const secondFresh = Math.max(0, 14 - daysSince(second.createdAt, now));

    if (Math.abs(firstFresh - secondFresh) > 1) {
      return secondFresh - firstFresh;
    }

    return second.bumps - first.bumps;
  });

  return ranked[0] ?? artist.posts[0];
}

/**
 * Scores how much this viewer should want to work with this artist.
 * Returns the raw score plus the reasons worth showing on the card.
 */
export function scoreArtist(
  viewer: Viewer,
  artist: Artist,
  post: MatchPost,
  now = Date.now(),
): { score: number; reasons: string[] } {
  const signals: ScoredSignal[] = [];

  // They already bumped you. Bumping back is an instant match, so this
  // outranks everything else.
  if (artist.bumpedYou) {
    signals.push({ points: 34, reason: 'Bumped you' });
  }

  // Complementary roles — the core of the product.
  const viewerWantsThem =
    viewer.wants.includes(artist.role) ||
    COMPLEMENTARY_ROLES[viewer.role].includes(artist.role);

  if (viewerWantsThem) {
    signals.push({
      points: viewer.wants.includes(artist.role) ? 22 : 15,
      reason: `${artist.role} for your ${viewer.role.toLowerCase()} work`,
    });
  }

  // They are asking for what the viewer does.
  const theyWantViewer =
    artist.wants.includes(viewer.role) ||
    LOOKING_FOR_ROLES[artist.lookingFor].includes(viewer.role) ||
    viewer.alsoDoes.some((role) => artist.wants.includes(role));

  if (theyWantViewer) {
    signals.push({ points: 16, reason: `Wants a ${viewer.role.toLowerCase()}` });
  } else if (artist.lookingFor === 'Open to collabs') {
    signals.push({ points: 5, reason: 'Open to collabs' });
  }

  // Shared genres.
  const overlap = genreOverlap(viewer.genres, artist.genres);

  if (overlap > 0) {
    const shared = sharedGenres(viewer.genres, artist.genres);

    signals.push({
      points: overlap * 18,
      reason: `Also makes ${shared.slice(0, 2).join(' and ')}`,
    });
  }

  // What the viewer actually listens to, which is not always what they claim.
  const affinity = tasteAffinity(viewer, artist.genres);

  if (affinity > 0.45) {
    signals.push({ points: affinity * 14, reason: 'Matches your listening' });
  } else {
    signals.push({ points: affinity * 14 });
  }

  // Location.
  const proximity = proximityFactor(artist.distanceKm);

  if (proximity > 0) {
    signals.push({
      points: proximity * 12,
      reason:
        artist.distanceKm <= 25
          ? `${Math.round(artist.distanceKm)} km away`
          : undefined,
    });
  }

  // Freshness of the post being shown.
  const age = daysSince(post.createdAt, now);
  signals.push({ points: Math.max(0, 6 - age * 0.6) });

  // A little weight for traction, capped so big accounts cannot dominate.
  signals.push({ points: Math.min(4, Math.log10(artist.followers + 1)) });

  // Open Collab posts are actionable right now.
  if (post.openCollabAsk) {
    const wantsViewerRole =
      !post.wantedRoles ||
      post.wantedRoles.includes(viewer.role) ||
      viewer.alsoDoes.some((role) => post.wantedRoles?.includes(role));

    signals.push({
      points: wantsViewerRole ? 12 : 4,
      reason: wantsViewerRole ? 'Open collab you could take' : undefined,
    });
  }

  // Already bumped — keep them in the deck but well down it.
  if (viewer.bumpedArtistIds.includes(artist.id)) {
    signals.push({ points: -50 });
  }

  const score = signals.reduce((sum, signal) => sum + signal.points, 0);

  const reasons = signals
    .filter((signal) => signal.reason && signal.points > 0)
    .sort((first, second) => second.points - first.points)
    .map((signal) => signal.reason as string)
    .slice(0, 3);

  return { score, reasons };
}

function passesFilters(
  artist: Artist,
  post: MatchPost,
  filters: MatchFilters,
): boolean {
  if (filters.openCollabsOnly && !post.openCollabAsk) {
    return false;
  }

  if (filters.roles.length > 0) {
    const roles = [artist.role, ...artist.alsoDoes];

    if (!roles.some((role) => filters.roles.includes(role))) {
      return false;
    }
  }

  if (filters.genres.length > 0) {
    const genres = [post.genre, ...artist.genres];

    if (!genres.some((genre) => filters.genres.includes(genre))) {
      return false;
    }
  }

  if (
    filters.maxDistanceKm !== null &&
    artist.distanceKm > filters.maxDistanceKm
  ) {
    return false;
  }

  if (
    filters.lookingFor.length > 0 &&
    !filters.lookingFor.includes(artist.lookingFor)
  ) {
    return false;
  }

  return true;
}

/**
 * Spaces Open Collab cards out so they read as part of the feed rather than a
 * separate section, without ever putting two of them back to back.
 */
/** Cards to leave between two appearances of the same artist. */
const ARTIST_SPACING = 3;

function weave(items: FeedItem[]): FeedItem[] {
  const woven: FeedItem[] = [];
  const deferred: FeedItem[] = [];

  const fits = (item: FeedItem): boolean => {
    const previous = woven[woven.length - 1];

    if (!previous) {
      return true;
    }

    // Two Open Collabs in a row start to feel like a section.
    if (previous.kind === 'collab' && item.kind === 'collab') {
      return false;
    }

    // Seeing the same person twice in quick succession reads as a bug.
    const recent = woven.slice(-ARTIST_SPACING);

    return !recent.some((entry) => entry.artist.id === item.artist.id);
  };

  // A held-back card drops in at the first place it fits, which keeps it close
  // to where its score earned it.
  const drain = () => {
    for (let index = 0; index < deferred.length; index += 1) {
      if (fits(deferred[index])) {
        woven.push(deferred.splice(index, 1)[0]);
        index = -1;
      }
    }
  };

  items.forEach((item) => {
    if (fits(item)) {
      woven.push(item);
      drain();
      return;
    }

    deferred.push(item);
  });

  // Anything that never found a gap goes on the end, still in score order.
  return [...woven, ...deferred];
}

/**
 * Builds the ranked Match feed: one card per artist, plus a card for each Open
 * Collab, filtered, scored and woven together.
 */
export function buildMatchFeed(
  viewer: Viewer,
  artists: Artist[],
  filters: MatchFilters = DEFAULT_FILTERS,
  now = Date.now(),
): FeedItem[] {
  const items: FeedItem[] = [];

  artists.forEach((artist) => {
    if (viewer.matchedArtistIds.includes(artist.id)) {
      return;
    }

    const lead = leadPostFor(viewer, artist, now);

    if (lead && passesFilters(artist, lead, filters)) {
      const { score, reasons } = scoreArtist(viewer, artist, lead, now);

      items.push({
        key: `artist-${artist.id}`,
        kind: 'artist',
        artist,
        post: lead,
        score,
        reasons,
      });
    }

    artist.posts
      .filter((post) => post.openCollabAsk && post.id !== lead?.id)
      .forEach((post) => {
        if (!passesFilters(artist, post, filters)) {
          return;
        }

        const { score, reasons } = scoreArtist(viewer, artist, post, now);

        items.push({
          key: `collab-${post.id}`,
          kind: 'collab',
          artist,
          post,
          score,
          reasons,
        });
      });
  });

  // An Open Collab that happens to be the artist's lead post should read as a
  // collab card, since the ask is the more actionable thing on screen.
  const normalised = items.map((item) =>
    item.kind === 'artist' && item.post.openCollabAsk
      ? { ...item, kind: 'collab' as const, key: `collab-${item.post.id}` }
      : item,
  );

  const sorted = normalised.sort((first, second) => second.score - first.score);

  return weave(sorted);
}
