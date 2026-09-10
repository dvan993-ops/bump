import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

import { BumpColors } from '@/constants/bump-theme';
import { paletteFor, type Track } from '@/constants/profile-data';

type Props = {
  track: Pick<Track, 'id' | 'title' | 'coverUri'>;
  size: number;
  /**
   * Space kept clear at the bottom of a generated cover, so overlays such as
   * the play count on grid tiles don't sit on top of the title.
   */
  bottomClearance?: number;
};

/**
 * A square, album-style cover for a track.
 *
 * Shows the producer's uploaded image when there is one. Otherwise draws a
 * generated sleeve: a duotone gradient, a record sliding out of the top-right
 * corner, and the title set large. Everything scales with `size`, so the grid
 * tile and the editor preview are the same artwork.
 */
export function TrackCover({ track, size, bottomClearance = 0 }: Props) {
  if (track.coverUri) {
    return (
      <Image
        source={{ uri: track.coverUri }}
        style={{ width: size, height: size }}
        contentFit="cover"
        transition={150}
        accessibilityIgnoresInvertColors
      />
    );
  }

  const [shadow, light, label] = paletteFor(track.id);
  const record = size * 0.92;
  const groove = Math.max(1, size * 0.008);
  const title = track.title.trim() || 'Untitled';

  return (
    <View style={{ width: size, height: size, overflow: 'hidden' }}>
      <LinearGradient
        colors={[light, shadow]}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* The record: outer disc, two grooves, label. */}
      <View
        style={[
          styles.centered,
          {
            position: 'absolute',
            width: record,
            height: record,
            borderRadius: record / 2,
            top: -record * 0.42,
            right: -record * 0.38,
            backgroundColor: 'rgba(0,0,0,0.28)',
          },
        ]}
      >
        {[0.78, 0.6].map((scale) => (
          <View
            key={scale}
            style={{
              position: 'absolute',
              width: record * scale,
              height: record * scale,
              borderRadius: (record * scale) / 2,
              borderWidth: groove,
              borderColor: 'rgba(255,255,255,0.12)',
            }}
          />
        ))}
        <View
          style={{
            width: record * 0.32,
            height: record * 0.32,
            borderRadius: record * 0.16,
            backgroundColor: label,
            opacity: 0.9,
          }}
        />
      </View>

      <Text
        numberOfLines={3}
        style={[
          styles.title,
          {
            left: size * 0.08,
            right: size * 0.08,
            bottom: size * 0.07 + bottomClearance,
            fontSize: size * 0.135,
            lineHeight: size * 0.15,
            letterSpacing: -size * 0.003,
          },
        ]}
      >
        {title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  title: {
    position: 'absolute',
    color: BumpColors.white,
    fontWeight: '900',
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
