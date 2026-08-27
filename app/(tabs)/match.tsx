/**
 * Match — discovering the person you should make your next song with.
 *
 * A vertical, full-screen, sound-first feed. Every card plays immediately;
 * swipe up for the next artist, swipe either way (or hit the dap button) to
 * Bump.
 * Open Collabs sit inside the same feed rather than in a section of their own,
 * so an ask you can answer right now turns up between people you might work
 * with later.
 *
 * A Bump is deliberately heavier than a like: it means "I would make something
 * with you", and when it goes both ways it opens a room.
 */

import Ionicons from '@expo/vector-icons/Ionicons';
import { setAudioModeAsync } from 'expo-audio';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ViewToken } from 'react-native';
import {
  Alert,
  FlatList,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BumpIcon } from '@/components/bump-icon';
import { ArtistPreviewSheet } from '@/components/match/artist-preview-sheet';
import {
  BumpMatchOverlay,
  type MatchAction,
} from '@/components/match/bump-match-overlay';
import { CollabResponseSheet } from '@/components/match/collab-response-sheet';
import { MatchCard } from '@/components/match/match-card';
import { MatchFilterSheet } from '@/components/match/match-filter-sheet';
import { TAB_INDEX, useIsTabFocused } from '@/components/tab-focus';
import { BumpColors } from '@/constants/bump-theme';
import {
  ARTISTS,
  VIEWER,
  type Artist,
  type Genre,
  type MatchPost,
  type Viewer,
} from '@/constants/match-data';
import {
  buildMatchFeed,
  DEFAULT_FILTERS,
  filtersAreActive,
  type FeedItem,
  type MatchFilters,
} from '@/lib/match-discovery';

/**
 * Playback settings are global, so they only need setting once per launch.
 * Home already requests the Android recording permission that audio sampling
 * needs, and every tab is mounted at the same time, so asking again here would
 * only double the prompt.
 */
let audioSessionReady = false;

async function ensureAudioSession() {
  if (audioSessionReady) {
    return;
  }

  audioSessionReady = true;

  await setAudioModeAsync({
    playsInSilentMode: true,
    interruptionMode: 'doNotMix',
    shouldRouteThroughEarpiece: false,
  });
}

function comingSoon(feature: string) {
  Alert.alert(
    'Coming soon',
    `${feature} will be available once the Connect backend is live.`,
  );
}

export default function MatchScreen() {
  const insets = useSafeAreaInsets();
  const focused = useIsTabFocused(TAB_INDEX.match);
  const listRef = useRef<FlatList<FeedItem>>(null);

  const [feedHeight, setFeedHeight] = useState(0);
  const [filters, setFilters] = useState<MatchFilters>(DEFAULT_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [viewer, setViewer] = useState<Viewer>(VIEWER);

  /**
   * The deck is ranked from a snapshot rather than from live state. Bumping
   * teaches the recommender something, but re-sorting the feed under someone's
   * thumb mid-swipe would be worse than useless — so the new ranking is applied
   * the next time they change what they are looking for.
   */
  const [rankingSeed, setRankingSeed] = useState<Viewer>(VIEWER);

  const [followedIds, setFollowedIds] = useState<string[]>(() =>
    ARTISTS.filter((artist) => artist.following).map((artist) => artist.id),
  );

  const [selectedPosts, setSelectedPosts] = useState<Record<string, string>>({});
  const [activeKey, setActiveKey] = useState<string | null>(null);

  const [previewArtist, setPreviewArtist] = useState<Artist | null>(null);
  const [collabTarget, setCollabTarget] = useState<{
    artist: Artist;
    post: MatchPost;
  } | null>(null);
  const [matchedArtist, setMatchedArtist] = useState<Artist | null>(null);

  useEffect(() => {
    void ensureAudioSession();
  }, []);

  const feed = useMemo(
    () => buildMatchFeed(rankingSeed, ARTISTS, filters),
    [rankingSeed, filters],
  );

  // Keep the active card valid when filters change the feed under us.
  useEffect(() => {
    if (feed.length === 0) {
      setActiveKey(null);
      return;
    }

    setActiveKey((current) =>
      current && feed.some((item) => item.key === current)
        ? current
        : feed[0].key,
    );
  }, [feed]);

  const countFor = useCallback(
    (draft: MatchFilters) => buildMatchFeed(viewer, ARTISTS, draft).length,
    [viewer],
  );

  /** Applying filters is the moment a reshuffle is expected, so re-rank here. */
  const applyFilters = useCallback(
    (next: MatchFilters) => {
      setFilters(next);
      setRankingSeed(viewer);
      setFiltersOpen(false);
    },
    [viewer],
  );

  const advance = useCallback(
    (fromKey: string) => {
      const index = feed.findIndex((item) => item.key === fromKey);

      if (index >= 0 && index + 1 < feed.length) {
        listRef.current?.scrollToIndex({
          index: index + 1,
          animated: true,
        });
      }
    },
    [feed],
  );

  const handleBump = useCallback(
    (item: FeedItem) => {
      const { artist, post } = item;

      setViewer((current) => {
        if (current.bumpedArtistIds.includes(artist.id)) {
          return current;
        }

        // Bumping is the strongest taste signal there is, so it feeds straight
        // back into what gets recommended next.
        const nextWeights: Partial<Record<Genre, number>> = {
          ...current.tasteWeights,
        };

        [post.genre, ...artist.genres].forEach((genre) => {
          nextWeights[genre] = Math.min(
            1,
            (nextWeights[genre] ?? 0.2) + (genre === post.genre ? 0.08 : 0.03),
          );
        });

        return {
          ...current,
          tasteWeights: nextWeights,
          bumpedArtistIds: [artist.id, ...current.bumpedArtistIds],
        };
      });

      if (artist.bumpedYou) {
        setMatchedArtist(artist);
        return;
      }

      advance(item.key);
    },
    [advance],
  );

  const handleShare = useCallback(async (item: FeedItem) => {
    try {
      await Share.share({
        message: `Check out "${item.post.title}" by @${item.artist.handle} on Bump.`,
      });
    } catch {
      Alert.alert('Could not open sharing');
    }
  }, []);

  const handleMatchAction = useCallback(
    (action: MatchAction, artist: Artist) => {
      setMatchedArtist(null);

      const labels: Record<MatchAction, string> = {
        message: `Messaging @${artist.handle}`,
        track: `Sending a track to @${artist.handle}`,
        idea: `Sending a collab idea to @${artist.handle}`,
      };

      comingSoon(labels[action]);
    },
    [],
  );

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const visible = viewableItems.find((entry) => entry.isViewable);
      const item = visible?.item as FeedItem | undefined;

      if (item) {
        setActiveKey(item.key);
      }
    },
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 80,
    minimumViewTime: 100,
  }).current;

  const openCollabsOnly = filters.openCollabsOnly;
  const active = filtersAreActive(filters);
  const waitingOnYou = ARTISTS.filter(
    (artist) =>
      artist.bumpedYou && !viewer.bumpedArtistIds.includes(artist.id),
  ).length;

  return (
    <View
      onLayout={(event) => setFeedHeight(event.nativeEvent.layout.height)}
      style={styles.screen}
    >
      <StatusBar style="light" />

      {feedHeight > 0 && (
        <FlatList
          ref={listRef}
          data={feed}
          extraData={`${activeKey}-${focused}`}
          keyExtractor={(item) => item.key}
          removeClippedSubviews={false}
          renderItem={({ item, index }) => (
            <MatchCard
              item={item}
              height={feedHeight}
              active={focused && item.key === activeKey}
              following={followedIds.includes(item.artist.id)}
              bumped={viewer.bumpedArtistIds.includes(item.artist.id)}
              selectedPostId={selectedPosts[item.artist.id]}
              showHint={index === 0}
              onBump={handleBump}
              onToggleFollow={(artistId) =>
                setFollowedIds((current) =>
                  current.includes(artistId)
                    ? current.filter((entry) => entry !== artistId)
                    : [...current, artistId],
                )
              }
              onOpenProfile={(entry) => setPreviewArtist(entry.artist)}
              onSelectPost={(artistId, postId) =>
                setSelectedPosts((current) => ({
                  ...current,
                  [artistId]: postId,
                }))
              }
              onRespondToCollab={(entry) =>
                setCollabTarget({ artist: entry.artist, post: entry.post })
              }
              onShare={handleShare}
            />
          )}
          pagingEnabled
          snapToInterval={feedHeight}
          snapToAlignment="start"
          decelerationRate="fast"
          showsVerticalScrollIndicator={false}
          bounces={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          initialNumToRender={2}
          windowSize={3}
          getItemLayout={(_data, index) => ({
            length: feedHeight,
            offset: feedHeight * index,
            index,
          })}
          ListEmptyComponent={
            <View style={[styles.empty, { height: feedHeight }]}>
              <BumpIcon size={64} color={BumpColors.muted} />
              <Text style={styles.emptyTitle}>Nobody left to hear</Text>
              <Text style={styles.emptyText}>
                Your filters are narrow. Widen the role, genre or distance and
                more artists will turn up.
              </Text>

              <Pressable
                accessibilityRole="button"
                onPress={() => applyFilters(DEFAULT_FILTERS)}
                style={styles.emptyButton}
              >
                <Text style={styles.emptyButtonText}>Reset filters</Text>
              </Pressable>
            </View>
          }
        />
      )}

      <View style={[styles.topBar, { top: insets.top + 8 }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Discovery filters"
          onPress={() => setFiltersOpen(true)}
          style={styles.iconButton}
        >
          <Ionicons name="options-outline" size={24} color={BumpColors.white} />
          {active && <View style={styles.dot} />}
        </Pressable>

        <View style={styles.segments}>
          <Segment
            label="For you"
            active={!openCollabsOnly}
            onPress={() =>
              applyFilters({ ...filters, openCollabsOnly: false })
            }
          />
          <Segment
            label="Open collabs"
            active={openCollabsOnly}
            onPress={() =>
              applyFilters({ ...filters, openCollabsOnly: true })
            }
          />
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Artists who bumped you"
          onPress={() => comingSoon('Your bumps')}
          style={styles.iconButton}
        >
          <BumpIcon size={24} color={BumpColors.white} />
          {waitingOnYou > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{waitingOnYou}</Text>
            </View>
          )}
        </Pressable>
      </View>

      <MatchFilterSheet
        visible={filtersOpen}
        filters={filters}
        resultCount={countFor}
        onClose={() => setFiltersOpen(false)}
        onApply={applyFilters}
      />

      <ArtistPreviewSheet
        visible={previewArtist !== null}
        artist={previewArtist}
        following={
          previewArtist ? followedIds.includes(previewArtist.id) : false
        }
        bumped={
          previewArtist
            ? viewer.bumpedArtistIds.includes(previewArtist.id)
            : false
        }
        currentPostId={
          previewArtist ? selectedPosts[previewArtist.id] : undefined
        }
        onClose={() => setPreviewArtist(null)}
        onToggleFollow={(artistId) =>
          setFollowedIds((current) =>
            current.includes(artistId)
              ? current.filter((entry) => entry !== artistId)
              : [...current, artistId],
          )
        }
        onSelectPost={(postId) => {
          if (previewArtist) {
            setSelectedPosts((current) => ({
              ...current,
              [previewArtist.id]: postId,
            }));
          }
        }}
        onBump={(artist) => {
          const entry = feed.find((item) => item.artist.id === artist.id);

          if (entry) {
            handleBump(entry);
          }
        }}
      />

      <CollabResponseSheet
        visible={collabTarget !== null}
        artist={collabTarget?.artist ?? null}
        post={collabTarget?.post ?? null}
        onClose={() => setCollabTarget(null)}
        onDownload={({ post, format }) => {
          setCollabTarget(null);
          comingSoon(
            `Downloading "${post.title}" as ${format.toUpperCase()}`,
          );
        }}
      />

      <BumpMatchOverlay
        visible={matchedArtist !== null}
        artist={matchedArtist}
        viewerHandle={viewer.handle}
        viewerName={viewer.handle}
        onClose={() => {
          const artist = matchedArtist;

          setMatchedArtist(null);

          if (artist) {
            const entry = feed.find((item) => item.artist.id === artist.id);

            if (entry) {
              advance(entry.key);
            }
          }
        }}
        onAction={handleMatchAction}
      />
    </View>
  );
}

function Segment({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={styles.segment}
    >
      <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
        {label}
      </Text>
      {active && <View style={styles.underline} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: BumpColors.black,
  },

  topBar: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  iconButton: {
    width: 43,
    height: 43,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.38)',
  },

  dot: {
    position: 'absolute',
    right: 7,
    top: 7,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: BumpColors.mint,
  },

  badge: {
    position: 'absolute',
    right: 2,
    top: 2,
    minWidth: 17,
    height: 17,
    paddingHorizontal: 4,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BumpColors.mint,
  },

  badgeText: {
    color: BumpColors.black,
    fontSize: 10,
    fontWeight: '900',
  },

  segments: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    paddingHorizontal: 16,
    height: 43,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },

  segment: {
    height: 43,
    alignItems: 'center',
    justifyContent: 'center',
  },

  segmentText: {
    color: BumpColors.dim,
    fontSize: 15,
    fontWeight: '700',
  },

  segmentTextActive: {
    color: BumpColors.white,
  },

  underline: {
    position: 'absolute',
    bottom: 5,
    height: 3,
    width: 26,
    borderRadius: 2,
    alignSelf: 'center',
    backgroundColor: BumpColors.mint,
  },

  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    backgroundColor: BumpColors.black,
  },

  emptyTitle: {
    color: BumpColors.white,
    fontSize: 21,
    fontWeight: '900',
    marginTop: 12,
  },

  emptyText: {
    color: BumpColors.grey,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 8,
  },

  emptyButton: {
    marginTop: 20,
    height: 46,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 23,
    backgroundColor: BumpColors.mint,
  },

  emptyButtonText: {
    color: BumpColors.black,
    fontSize: 14,
    fontWeight: '900',
  },
});
