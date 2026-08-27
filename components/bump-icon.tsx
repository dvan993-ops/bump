/**
 * The Bump mark: two fists dapping.
 *
 * Drawn with Skia rather than an image or an icon font so it stays sharp at any
 * size, recolours per state, and can be split into single fists for the match
 * animation. Skia is already a dependency (it draws the audio visualiser), so
 * this adds nothing to install.
 *
 * All geometry is authored in a 48x48 box and scaled to `size`. The fists are
 * tilted towards each other by 10 degrees, which is what stops the silhouette
 * reading as two rounded rectangles and starts it reading as a dap.
 */

import { BlurMask, Canvas, Group, Path } from '@shopify/react-native-skia';
import { View, type StyleProp, type ViewStyle } from 'react-native';

const BOX = 48;
const CENTRE = BOX / 2;
const TILT = (10 * Math.PI) / 180;

/**
 * One fist, wrist at the left, knuckles facing right. The four arcs on the
 * right edge are the knuckles; they bulge to x = 22.875, so a mirrored copy
 * leaves a small gap at the centre — fists touching, not overlapping.
 */
const FIST_PATH =
  'M 12 13 L 20.5 13 ' +
  'A 2.375 2.375 0 0 1 20.5 17.75 ' +
  'A 2.375 2.375 0 0 1 20.5 22.5 ' +
  'A 2.375 2.375 0 0 1 20.5 27.25 ' +
  'A 2.375 2.375 0 0 1 20.5 32 ' +
  'L 20.5 33 Q 20.5 35.5 18 35.5 L 12 35.5 ' +
  'Q 5.5 35.5 5.5 29 L 5.5 19.5 Q 5.5 13 12 13 Z';

const WRIST_PATH =
  'M 3 20.5 L 8 20.5 L 8 28 L 3 28 ' +
  'A 2.75 2.75 0 0 1 0.25 25.25 L 0.25 23.25 A 2.75 2.75 0 0 1 3 20.5 Z';

/** The curve where the thumb crosses the fingers, plus the knuckle creases. */
const DETAIL_PATHS = [
  'M 12.8 13.2 Q 10.4 24.2 12.8 35.3',
  'M 15.6 17.75 L 20.1 17.75',
  'M 15.6 22.5 L 20.1 22.5',
  'M 15.6 27.25 L 20.1 27.25',
];

/** Impact marks thrown off the point of contact. */
const SPARK_PATHS = ['M 19.6 10.6 L 16.4 5.8', 'M 28.4 10.6 L 31.6 5.8'];

/** Rotation about the centre of the box, as a Skia transform list. */
function tiltAboutCentre(radians: number) {
  return [
    { translateX: CENTRE },
    { translateY: CENTRE },
    { rotate: radians },
    { translateX: -CENTRE },
    { translateY: -CENTRE },
  ];
}

const MIRROR = [{ translateX: BOX }, { scaleX: -1 }];

type FistProps = {
  detail: boolean;
  creaseColor: string;
};

/** One fist plus its wrist, drawn in the enclosing group's colour. */
function Fist({ detail, creaseColor }: FistProps) {
  return (
    <Group>
      <Path path={WRIST_PATH} />
      <Path path={FIST_PATH} />

      {detail &&
        DETAIL_PATHS.map((line) => (
          <Path
            key={line}
            path={line}
            style="stroke"
            strokeWidth={1.15}
            strokeCap="round"
            color={creaseColor}
            opacity={0.42}
          />
        ))}
    </Group>
  );
}

export type BumpIconProps = {
  size?: number;
  color?: string;
  /** Colour of the creases — normally whatever sits behind the icon. */
  creaseColor?: string;
  /** `dap` is both fists; `fist` is a single one, for the match animation. */
  variant?: 'dap' | 'fist';
  /** Flips a single fist to face left. Ignored for `dap`. */
  mirrored?: boolean;
  /** Impact marks. Off by default so the resting state stays calm. */
  sparks?: boolean;
  /** Soft outer glow, matching the visualiser's treatment. */
  glow?: boolean;
  opacity?: number;
  style?: StyleProp<ViewStyle>;
};

export function BumpIcon({
  size = 28,
  color = '#6FFFB7',
  creaseColor = '#0B0B0B',
  variant = 'dap',
  mirrored = false,
  sparks = false,
  glow = false,
  opacity = 1,
  style,
}: BumpIconProps) {
  // Creases turn to mush below roughly 26px, so they are dropped there.
  const detail = size >= 26;

  const artwork = (
    <Group color={color} opacity={opacity}>
      {variant === 'dap' ? (
        <>
          <Group transform={tiltAboutCentre(-TILT)}>
            <Fist detail={detail} creaseColor={creaseColor} />
          </Group>

          <Group transform={[...tiltAboutCentre(TILT), ...MIRROR]}>
            <Fist detail={detail} creaseColor={creaseColor} />
          </Group>
        </>
      ) : (
        <Group transform={mirrored ? MIRROR : undefined}>
          <Fist detail={detail} creaseColor={creaseColor} />
        </Group>
      )}

      {sparks &&
        SPARK_PATHS.map((spark) => (
          <Path
            key={spark}
            path={spark}
            style="stroke"
            strokeWidth={2.3}
            strokeCap="round"
          />
        ))}
    </Group>
  );

  return (
    <View
      pointerEvents="none"
      style={[{ width: size, height: size }, style]}
      accessible={false}
    >
      <Canvas style={{ width: size, height: size }}>
        <Group transform={[{ scale: size / BOX }]}>
          {glow && (
            <Group opacity={0.6}>
              <BlurMask blur={Math.max(2, size * 0.14)} style="normal" />
              {artwork}
            </Group>
          )}

          {artwork}
        </Group>
      </Canvas>
    </View>
  );
}
