import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BumpColors, formatCount } from '@/constants/bump-theme';
import { TRACK_TYPE_ICONS, type Track } from '@/constants/profile-data';

import { TrackCover } from './track-cover';

type Props = {
  track: Track;
  size: number;
  onPress: (track: Track) => void;
};

/** Height of the scrim behind the play count, as a share of the tile. */
const SCRIM = 0.34;

/** Keeps a generated cover's title clear of the play count row. */
export const TITLE_CLEARANCE = 0.12;

/**
 * One square in the profile grid. Reads like a TikTok thumbnail: "Pinned"
 * top-left, play count bottom-left, and the track type bottom-right. The
 * top-right corner is left to the cover art.
 */
export function TrackTile({ track, size, onPress }: Props) {
  return (
    <Pressable
      onPress={() => onPress(track)}
      accessibilityRole="button"
      accessibilityLabel={`${track.title}, ${track.type}, ${formatCount(track.plays)} plays`}
      accessibilityHint="Opens the track editor"
      style={({ pressed }) => [
        { width: size, height: size },
        pressed && styles.pressed,
      ]}
    >
      <TrackCover track={track} size={size} bottomClearance={size * TITLE_CLEARANCE} />

      <LinearGradient
        pointerEvents="none"
        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.55)']}
        style={[styles.scrim, { height: size * SCRIM }]}
      />

      {track.pinned && (
        <View style={styles.pinned}>
          <Text style={styles.pinnedText}>Pinned</Text>
        </View>
      )}

      <View style={styles.typeIcon}>
        <Ionicons
          name={TRACK_TYPE_ICONS[track.type]}
          size={13}
          color={BumpColors.white}
        />
      </View>

      <View style={styles.plays}>
        <Ionicons name="play-outline" size={14} color={BumpColors.white} />
        <Text style={styles.playsText}>{formatCount(track.plays)}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.75,
  },

  scrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },

  pinned: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: BumpColors.white,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },

  pinnedText: {
    color: BumpColors.charcoal,
    fontSize: 10,
    fontWeight: '700',
  },

  typeIcon: {
    position: 'absolute',
    bottom: 4,
    right: 5,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  plays: {
    position: 'absolute',
    left: 6,
    bottom: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },

  playsText: {
    color: BumpColors.white,
    fontSize: 12,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
