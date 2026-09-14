import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EditTrackSheet } from '@/components/profile/edit-track-sheet';
import { RANKS, RankBadge } from '@/components/profile/rank-badge';
import { TrackTile } from '@/components/profile/track-tile';
import { BumpColors } from '@/constants/bump-theme';
import {
  MOCK_TRACKS,
  TRACK_FILTERS,
  type Track,
  type TrackFilter,
} from '@/constants/profile-data';
import { useAppWidth } from '@/hooks/use-app-width';
import { shareOrCopy } from '@/lib/share';

const COLORS = {
  black: BumpColors.charcoal,
  surface: BumpColors.surface,
  raised: BumpColors.raised,
  border: BumpColors.border,
  white: BumpColors.white,
  grey: BumpColors.grey,
  muted: BumpColors.muted,
};

const PROFILE_BANNER = require('@/assets/images/profile-banner.png');

/** Gutter between grid tiles. */
const GAP = 2;
const COLUMNS = 3;

const PROFILE = {
  name: 'Sam Rivers',
  handle: 'samrivers',
  role: 'Producer',
  location: 'Auckland, NZ',
  bio: 'Making beats since 2019. Into lo-fi, boom bap and anything with a dusty sample. Always looking for vocalists to collab with.',
  genres: ['Hip-Hop', 'Lo-Fi', 'R&B', 'Boom Bap'],
  matches: 18,
  followers: 212,
  avgRating: 4.7,
  level: 24,
  rank: 'Elite',
  xp: 2140,
  xpToNext: 3000,
};

const rankIndex = RANKS.indexOf(PROFILE.rank as (typeof RANKS)[number]);
const nextRank = RANKS[rankIndex + 1] ?? RANKS[rankIndex];
const xpProgress = Math.min(1, PROFILE.xp / PROFILE.xpToNext);

/** Pinned first, then newest first. */
function orderTracks(tracks: Track[]): Track[] {
  return [...tracks].sort((a, b) => {
    if (a.pinned !== b.pinned) {
      return a.pinned ? -1 : 1;
    }
    return b.createdAt.localeCompare(a.createdAt);
  });
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const width = useAppWidth();

  const [tracks, setTracks] = useState<Track[]>(MOCK_TRACKS);
  const [filter, setFilter] = useState<TrackFilter>('all');

  // The sheet keeps showing the last track while it slides away, so "which
  // track" and "is it open" are tracked separately.
  const [editing, setEditing] = useState<Track | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetSession, setSheetSession] = useState(0);

  const tileSize = (width - GAP * (COLUMNS - 1)) / COLUMNS;
  const visibleTracks = orderTracks(tracks).filter(
    (track) => filter === 'all' || track.type === filter,
  );

  function openEditor(track: Track) {
    setEditing(track);
    setSheetSession((session) => session + 1);
    setSheetOpen(true);
  }

  function saveTrack(updated: Track) {
    setTracks((current) =>
      current.map((track) => (track.id === updated.id ? updated : track)),
    );
    setEditing(updated);
    setSheetOpen(false);
  }

  function deleteTrack(removed: Track) {
    setTracks((current) => current.filter((track) => track.id !== removed.id));
    setSheetOpen(false);
  }

  function shareProfile() {
    shareOrCopy({
      message: `Find ${PROFILE.name} (@${PROFILE.handle}) on Bump`,
    }).catch(() => {
      // Dismissing the share sheet isn't an error worth surfacing.
    });
  }

  const header = (
    <View>
      <View style={styles.banner}>
        <Image source={PROFILE_BANNER} style={styles.bannerImage} contentFit="cover" />
        <LinearGradient
          colors={['transparent', COLORS.black]}
          style={styles.bannerFade}
        />
        <Pressable
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Settings"
          style={[styles.settingsButton, { top: insets.top + 8 }]}
        >
          <Ionicons name="settings-outline" size={18} color={COLORS.white} />
        </Pressable>
      </View>

      <View style={styles.identity}>
        <View style={styles.avatarWrap}>
          <LinearGradient
            colors={[BumpColors.mint, '#4F8CFF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatarRing}
          />
          <Image
            source={require('@/assets/images/RobloxScreenShot20260624_233539891.png')}
            style={styles.avatar}
            contentFit="cover"
          />
          <View style={styles.levelBadge}>
            <Text style={styles.levelBadgeText}>LVL {PROFILE.level}</Text>
          </View>
        </View>

        <Text style={styles.name}>{PROFILE.name}</Text>
        <Text style={styles.handle}>@{PROFILE.handle}</Text>

        <View style={styles.rankBadgeWrap}>
          <RankBadge label={PROFILE.rank} />
        </View>

        <View style={styles.xpBlock}>
          <View style={styles.xpLabels}>
            <Text style={styles.xpEdgeLabel}>{PROFILE.rank}</Text>
            <Text style={styles.xpValue}>
              {PROFILE.xp.toLocaleString()} / {PROFILE.xpToNext.toLocaleString()} XP
            </Text>
            <Text style={styles.xpEdgeLabel}>{nextRank}</Text>
          </View>
          <View style={styles.xpTrack}>
            <View style={[styles.xpFill, { width: `${xpProgress * 100}%` }]} />
          </View>
        </View>

        <View style={styles.statsRow}>
          <Stat value={tracks.length} label="Uploads" />
          <Stat value={PROFILE.matches} label="Matches" />
          <Stat value={PROFILE.followers} label="Followers" />
        </View>

        <View style={styles.factsRow}>
          <View style={styles.ratingFact}>
            <Ionicons name="star" size={14} color={BumpColors.mint} />
            <Text style={styles.ratingFactText}>{PROFILE.avgRating} avg rating</Text>
          </View>
          <View style={styles.locationFact}>
            <Ionicons name="location-outline" size={14} color={COLORS.grey} />
            <Text style={styles.locationFactText}>{PROFILE.location}</Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <Pressable
            style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}
            accessibilityRole="button"
          >
            <Text style={styles.actionTextPrimary}>Edit profile</Text>
          </Pressable>
          <Pressable
            onPress={shareProfile}
            style={({ pressed }) => [styles.actionButtonOutline, pressed && styles.pressed]}
            accessibilityRole="button"
          >
            <Ionicons name="share-outline" size={14} color={COLORS.white} />
            <Text style={styles.actionText}>Share profile</Text>
          </Pressable>
        </View>

        <Text style={styles.role}>{PROFILE.role}</Text>
        <Text style={styles.bio}>{PROFILE.bio}</Text>

        <View style={styles.tagsRow}>
          {PROFILE.genres.map((genre) => (
            <View key={genre} style={styles.tag}>
              <Text style={styles.tagText}>{genre}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.filterRow} accessibilityRole="tablist">
        {TRACK_FILTERS.map((option) => {
          const selected = option.key === filter;
          return (
            <Pressable
              key={option.key}
              onPress={() => setFilter(option.key)}
              style={styles.filterTab}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
            >
              <Text style={[styles.filterText, selected && styles.filterTextActive]}>
                {option.label}
              </Text>
              <View style={[styles.filterIndicator, selected && styles.filterIndicatorActive]} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );

  const emptyLabel =
    TRACK_FILTERS.find((option) => option.key === filter)?.label.toLowerCase() ?? 'tracks';

  return (
    <View style={styles.screen}>
      <FlatList
        data={visibleTracks}
        keyExtractor={(track) => track.id}
        numColumns={COLUMNS}
        // Remount the grid when the column count or width changes (rotation, iPad split view).
        key={`grid-${COLUMNS}-${Math.round(width)}`}
        columnWrapperStyle={styles.gridRow}
        ItemSeparatorComponent={GridSeparator}
        ListHeaderComponent={header}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="albums-outline" size={40} color={COLORS.muted} />
            <Text style={styles.emptyTitle}>
              {filter === 'all' ? 'No uploads yet' : `No ${emptyLabel} yet`}
            </Text>
            <Text style={styles.emptyBody}>
              Upload from the Create tab and it will show up here.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TrackTile track={item} size={tileSize} onPress={openEditor} />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      <EditTrackSheet
        visible={sheetOpen}
        sessionKey={sheetSession}
        track={editing}
        onClose={() => setSheetOpen(false)}
        onSave={saveTrack}
        onDelete={deleteTrack}
      />
    </View>
  );
}

function GridSeparator() {
  return <View style={{ height: GAP }} />;
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.black,
  },

  listContent: {
    paddingBottom: 32,
  },

  pressed: {
    opacity: 0.7,
  },

  banner: {
    height: 112,
    width: '100%',
  },

  bannerImage: {
    ...StyleSheet.absoluteFill,
  },

  bannerFade: {
    ...StyleSheet.absoluteFill,
  },

  settingsButton: {
    position: 'absolute',
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },

  identity: {
    alignItems: 'center',
    paddingHorizontal: 24,
    marginTop: -48,
  },

  avatarWrap: {
    width: 96,
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatarRing: {
    ...StyleSheet.absoluteFill,
    borderRadius: 52,
    margin: -4,
  },

  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    borderColor: COLORS.black,
    backgroundColor: COLORS.surface,
  },

  levelBadge: {
    position: 'absolute',
    bottom: -6,
    alignSelf: 'center',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.black,
    backgroundColor: BumpColors.mint,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },

  levelBadgeText: {
    color: COLORS.black,
    fontSize: 10,
    fontWeight: '800',
  },

  name: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: '800',
    marginTop: 14,
  },

  handle: {
    color: COLORS.grey,
    fontSize: 14,
    marginTop: 2,
  },

  rankBadgeWrap: {
    marginTop: 8,
  },

  xpBlock: {
    width: '100%',
    maxWidth: 280,
    marginTop: 12,
  },

  xpLabels: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  xpEdgeLabel: {
    color: COLORS.grey,
    fontSize: 11,
  },

  xpValue: {
    color: BumpColors.mint,
    fontSize: 11,
    fontWeight: '600',
  },

  xpTrack: {
    height: 6,
    borderRadius: 3,
    marginTop: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },

  xpFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: BumpColors.mint,
  },

  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 28,
    marginTop: 18,
  },

  stat: {
    alignItems: 'center',
    minWidth: 64,
  },

  statValue: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '700',
  },

  statLabel: {
    color: COLORS.grey,
    fontSize: 13,
    marginTop: 2,
  },

  factsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    width: '100%',
  },

  ratingFact: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BumpColors.mintEdge,
    backgroundColor: BumpColors.mintWash,
    paddingVertical: 9,
  },

  ratingFactText: {
    color: BumpColors.mint,
    fontSize: 13,
    fontWeight: '700',
  },

  locationFact: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    paddingVertical: 9,
  },

  locationFactText: {
    color: COLORS.grey,
    fontSize: 13,
  },

  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },

  actionButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BumpColors.mint,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 22,
  },

  actionButtonOutline: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    paddingVertical: 10,
    paddingHorizontal: 22,
  },

  actionText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '600',
  },

  actionTextPrimary: {
    color: COLORS.black,
    fontSize: 15,
    fontWeight: '700',
  },

  role: {
    color: COLORS.grey,
    fontSize: 13,
    marginTop: 16,
  },

  bio: {
    color: COLORS.white,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 6,
    maxWidth: 340,
  },

  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
  },

  tag: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },

  tagText: {
    color: COLORS.grey,
    fontSize: 12,
    fontWeight: '600',
  },

  filterRow: {
    flexDirection: 'row',
    marginTop: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },

  filterTab: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 10,
  },

  filterText: {
    color: COLORS.muted,
    fontSize: 14,
    fontWeight: '600',
  },

  filterTextActive: {
    color: COLORS.white,
  },

  filterIndicator: {
    height: 2,
    width: 28,
    marginTop: 9,
    borderRadius: 1,
    backgroundColor: 'transparent',
  },

  filterIndicatorActive: {
    backgroundColor: BumpColors.mint,
  },

  gridRow: {
    gap: GAP,
  },

  empty: {
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 48,
  },

  emptyTitle: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 12,
  },

  emptyBody: {
    color: COLORS.grey,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 6,
  },
});
