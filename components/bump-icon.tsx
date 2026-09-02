/**
 * The Bump mark: two fists, apart when idle and connected when bumped.
 *
 * Drawn with Skia rather than an image or an icon font so it stays sharp at any
 * size, recolours per state, and can be split into single fists for the match
 * animation. Skia is already a dependency (it draws the audio visualiser), so
 * this adds nothing to install.
 *
 * The mark is an outline, not a silhouette, and it is wide: roughly 3:1. That
 * is the shape of the gesture, and it is why `size` means WIDTH here — the box
 * is `size` by `size * 2/3`. Anywhere the old square mark sat, the new one
 * wants about 1.5x the number to carry the same weight.
 *
 * Two states, and they are the whole idea:
 *   bumped={false}  fists apart, waiting
 *   bumped={true}   fists connected, impact burst firing
 * The transition springs, so a bump lands rather than cuts.
 */

import { BlurMask, Canvas, Group, Path } from '@shopify/react-native-skia';
import { useEffect } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import {
  useDerivedValue,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

/** The dap is authored in a 240 x 160 box; a single fist is its left half. */
const DAP_WIDTH = 240;
const FIST_WIDTH = DAP_WIDTH / 2;
const ASPECT = 2 / 3;

const DAP_CENTRE_Y = 80;
/** A lone fist keeps the same drawing scale, so its box is cropped, not shrunk. */
const FIST_CENTRE_Y = 40;

/** Where the left fist's knuckle line sits when the fists are apart, and when they meet. */
const KNUCKLES_APART = 109;
const KNUCKLES_TOUCHING = 120;
const TRAVEL = KNUCKLES_TOUCHING - KNUCKLES_APART;

/**
 * Creases close up below roughly 88pt of dap, so they are dropped there and the
 * outline thickens a little to hold its weight.
 */
const DETAIL_WIDTH = 88;
const STROKE_DETAILED = 5;
const STROKE_PLAIN = 6;

/**
 * One fist, wrist at the left, knuckles facing right and sitting on x = 0.
 * The right-hand fist is this same geometry mirrored.
 */
const CUFF_PATH =
  'M -100,-23 h 8 a 4,4 0 0 1 4,4 v 38 a 4,4 0 0 1 -4,4 h -8 ' +
  'a 4,4 0 0 1 -4,-4 v -38 a 4,4 0 0 1 4,-4 z';

const FIST_PATH =
  'M -88,-25 C -80,-30 -70,-31 -58,-31 C -44,-31 -32,-31 -24,-29 ' +
  'C -10,-26 0,-18 0,-5 C 0,7 -7,16 -18,20 C -30,25 -42,26 -54,22 ' +
  'C -66,18 -74,25 -88,25 Z';

/** The thumb lying across the curled fingers, its knuckle, and the finger crease. */
const DETAIL_PATHS = [
  'M -58,3 C -57,-4 -49,-8 -41,-6 C -33,-4 -32,3 -39,6 C -47,9 -55,8 -58,3 Z',
  'M -47,-7 L -47,-15',
  'M -60,6 C -55,16 -42,19 -28,14',
];

/** Impact marks thrown off the point of contact, above and below. */
const SPARK_PATHS = [
  'M 120,40 L 120,25',
  'M 103,44 L 94,31',
  'M 137,44 L 146,31',
  'M 120,120 L 120,135',
  'M 103,116 L 94,129',
  'M 137,116 L 146,129',
];

const MIRROR = { scaleX: -1 } as const;

type StrokeProps = {
  path: string;
  width: number;
};

/** Every line in the mark is the same stroke, in the enclosing group's colour. */
function Stroke({ path, width }: StrokeProps) {
  return (
    <Path
      path={path}
      style="stroke"
      strokeWidth={width}
      strokeCap="round"
      strokeJoin="round"
    />
  );
}

type FistProps = {
  detail: boolean;
  stroke: number;
};

/** One fist plus its cuff, drawn around its own knuckle line. */
function Fist({ detail, stroke }: FistProps) {
  return (
    <Group>
      <Stroke path={CUFF_PATH} width={stroke} />
      <Stroke path={FIST_PATH} width={stroke} />

      {detail &&
        DETAIL_PATHS.map((line) => (
          <Stroke key={line} path={line} width={stroke} />
        ))}
    </Group>
  );
}

export type BumpIconProps = {
  /** Width in points. The mark is 3:2, so height comes out at two thirds of it. */
  size?: number;
  color?: string;
  /** `dap` is both fists; `fist` is a single one, for the match animation. */
  variant?: 'dap' | 'fist';
  /** Flips a single fist to face left. Ignored for `dap`. */
  mirrored?: boolean;
  /** Fists connect and the impact burst fires. Ignored for `fist`. */
  bumped?: boolean;
  /** Set false to land on the given state with no spring. */
  animated?: boolean;
  /** Force the thumb and crease lines on or off. Defaults to on above 88pt. */
  detail?: boolean;
  /** Soft outer glow, matching the visualiser's treatment. */
  glow?: boolean;
  opacity?: number;
  style?: StyleProp<ViewStyle>;
};

export function BumpIcon({
  size = 44,
  color = '#6FFFB7',
  variant = 'dap',
  mirrored = false,
  bumped = false,
  animated = true,
  detail,
  glow = false,
  opacity = 1,
  style,
}: BumpIconProps) {
  const isDap = variant === 'dap';
  const box = isDap ? DAP_WIDTH : FIST_WIDTH;

  // A lone fist draws at twice the scale of a dap of the same `size`, so two of
  // them side by side are exactly one dap.
  const drawnAsDap = isDap ? size : size * 2;
  const showDetail = detail ?? drawnAsDap >= DETAIL_WIDTH;
  const stroke = showDetail ? STROKE_DETAILED : STROKE_PLAIN;

  // 0 = apart, 1 = connected.
  const contact = useSharedValue(bumped && isDap ? 1 : 0);

  useEffect(() => {
    const target = bumped && isDap ? 1 : 0;

    if (!animated) {
      contact.value = target;
      return;
    }

    contact.value = target
      ? withSpring(1, { damping: 11, stiffness: 240, mass: 0.6 })
      : withTiming(0, { duration: 160 });
  }, [animated, bumped, isDap, contact]);

  const leftFist = useDerivedValue(() => [
    { translateX: KNUCKLES_APART + TRAVEL * contact.value },
    { translateY: DAP_CENTRE_Y },
  ]);

  const rightFist = useDerivedValue(() => [
    { translateX: DAP_WIDTH - (KNUCKLES_APART + TRAVEL * contact.value) },
    { translateY: DAP_CENTRE_Y },
    MIRROR,
  ]);

  // The burst pops outward from the point of contact as it fades in.
  const burst = useDerivedValue(() => [
    { translateX: KNUCKLES_TOUCHING },
    { translateY: DAP_CENTRE_Y },
    { scale: 0.62 + 0.38 * contact.value },
    { translateX: -KNUCKLES_TOUCHING },
    { translateY: -DAP_CENTRE_Y },
  ]);

  const burstOpacity = useDerivedValue(() => contact.value);

  const loneFist = mirrored
    ? [{ translateX: FIST_WIDTH - KNUCKLES_APART }, { translateY: FIST_CENTRE_Y }, MIRROR]
    : [{ translateX: KNUCKLES_APART }, { translateY: FIST_CENTRE_Y }];

  const artwork = (
    <Group color={color} opacity={opacity}>
      {isDap ? (
        <>
          <Group transform={leftFist}>
            <Fist detail={showDetail} stroke={stroke} />
          </Group>

          <Group transform={rightFist}>
            <Fist detail={showDetail} stroke={stroke} />
          </Group>

          <Group transform={burst} opacity={burstOpacity}>
            {SPARK_PATHS.map((spark) => (
              <Stroke key={spark} path={spark} width={stroke} />
            ))}
          </Group>
        </>
      ) : (
        <Group transform={loneFist}>
          <Fist detail={showDetail} stroke={stroke} />
        </Group>
      )}
    </Group>
  );

  const height = size * ASPECT;

  return (
    <View
      pointerEvents="none"
      style={[{ width: size, height }, style]}
      accessible={false}
    >
      <Canvas style={{ width: size, height }}>
        <Group transform={[{ scale: size / box }]}>
          {glow && (
            <Group opacity={0.6}>
              <BlurMask blur={Math.max(2, size * 0.07)} style="normal" />
              {artwork}
            </Group>
          )}

          {artwork}
        </Group>
      </Canvas>
    </View>
  );
}
