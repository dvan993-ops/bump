/**
 * Artist avatar.
 *
 * Nobody has uploaded a photo yet, so each artist gets a stable gradient
 * derived from their handle plus their initial. When `imageUri` arrives from a
 * backend it takes over and everything else stays the same.
 */

import { LinearGradient } from 'expo-linear-gradient';
import { Image, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { BumpColors, gradientFor } from '@/constants/bump-theme';

export type ArtistAvatarProps = {
  handle: string;
  name: string;
  size?: number;
  imageUri?: string;
  /** Ring colour. Pass null for no ring. */
  ring?: string | null;
  style?: StyleProp<ViewStyle>;
};

export function ArtistAvatar({
  handle,
  name,
  size = 44,
  imageUri,
  ring = BumpColors.white,
  style,
}: ArtistAvatarProps) {
  const [from, to] = gradientFor(handle);

  const frame: ViewStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    borderWidth: ring ? 2 : 0,
    borderColor: ring ?? 'transparent',
  };

  return (
    <View style={[styles.frame, frame, style]}>
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.fill} />
      ) : (
        <LinearGradient
          colors={[from, to]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.fill, styles.centre]}
        >
          <Text style={[styles.initial, { fontSize: size * 0.42 }]}>
            {name.charAt(0).toUpperCase()}
          </Text>
        </LinearGradient>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    overflow: 'hidden',
    backgroundColor: BumpColors.raised,
  },

  fill: {
    width: '100%',
    height: '100%',
  },

  centre: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  initial: {
    color: BumpColors.black,
    fontWeight: '900',
  },
});
