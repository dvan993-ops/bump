import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
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

/** Gutter between grid tiles. */
const GAP = 2;
const COLUMNS = 3;

const PROFILE = {
  name: 'Sam Rivers',
  handle: 'samrivers',
  role: 'Producer • Auckland, NZ',
  bio: 'Making beats since 2019. Into lo-fi, boom bap and anything with a dusty sample. Always looking for vocalists to collab with.',
  genres: ['Hip-Hop', 'Lo-Fi', 'R&B', 'Boom Bap'],
  matches: 18,
  followers: 212,
};

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
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <View style={styles.topBarSide} />
        <Text style={styles.topBarName} numberOfLines={1}>
          {PROFILE.name}
        </Text>
        <View style={[styles.topBarSide, styles.topBarRight]}>
          <Pressable hitSlop={10} accessibilityRole="button" accessibilityLabel="Settings">
            <Ionicons name="settings-outline" size={24} color={COLORS.white} />
          </Pressable>
        </View>
      </View>

      <View style={styles.identity}>
        <Image
          source={require('@/assets/images/RobloxScreenShot20260624_233539891.png')}
          style={styles.avatar}
          contentFit="cover"
        />
        <Text style={styles.handle}>@{PROFILE.handle}</Text>

        <View style={styles.statsRow}>
          <Stat value={tracks.length} label="Uploads" />
          <Stat value={PROFILE.matches} label="Matches" />
          <Stat value={PROFILE.followers} label="Followers" />
        </View>

        <View style={styles.actionsRow}>
          <Pressable
            style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}
            accessibilityRole="button"
          >
            <Text style={styles.actionText}>Edit profile</Text>
          </Pressable>
          <Pressable
            onPress={shareProfile}
            style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}
            accessibilityRole="button"
          >
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

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },

  topBarSide: {
    width: 40,
  },

  topBarRight: {
    alignItems: 'flex-end',
  },

  topBarName: {
    flex: 1,
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },

  identity: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 12,
  },

  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.surface,
  },

  handle: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
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

  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 18,
  },

  actionButton: {
    backgroundColor: COLORS.raised,
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 22,
  },

  actionText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '600',
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
    backgroundColor: COLORS.white,
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
