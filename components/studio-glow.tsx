import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, type DimensionValue } from 'react-native';

/** Top stop of the glow — a dark, desaturated teal, not the bright mint accent itself. */
const GLOW_COLOR = 'rgba(58,120,105,0.55)';

type StudioGlowProps = {
  /** How far down the glow fades out. */
  height?: DimensionValue;
};

/**
 * The soft teal light source every screen sits under — a stand-in for the
 * app's mint accent doing what a studio light would over a mixing desk.
 * Renders behind the screen's content; the screen is responsible for
 * `position: 'relative'` and `zIndex: 1`-ing its own children above it.
 */
export function StudioGlow({ height = 340 }: StudioGlowProps) {
  return (
    <LinearGradient
      pointerEvents="none"
      colors={[GLOW_COLOR, 'transparent']}
      style={[StyleSheet.absoluteFill, { height, bottom: undefined }]}
    />
  );
}
