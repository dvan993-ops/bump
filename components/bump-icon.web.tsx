/**
 * Web version of the Bump mark.
 *
 * The native mark is hand-drawn with Skia paths. Skia's web backend needs its
 * CanvasKit WebAssembly loaded before any component that imports Skia even
 * renders, and screens import it too high in the tree to guarantee that
 * ordering (see `components/bump-icon.tsx` for the native version and its
 * rationale). Rather than fight that load-order problem, this redraws the
 * same idea — two fists, apart when idle and connected when bumped — as
 * plain Views, animated with Reanimated (which does run on web).
 *
 * Geometry is a simplified stand-in for the native artwork, not a pixel
 * match: a rounded outline block per fist, with three knuckle dots above the
 * detail threshold, and a burst of short spark lines on contact.
 */

import { useEffect } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

const DAP_WIDTH = 240;
const FIST_WIDTH = DAP_WIDTH / 2;
const ASPECT = 2 / 3;

const DAP_CENTRE_Y = 80;
const FIST_CENTRE_Y = 40;

const KNUCKLES_APART = 109;
const KNUCKLES_TOUCHING = 120;
const TRAVEL = KNUCKLES_TOUCHING - KNUCKLES_APART;

const DETAIL_WIDTH = 88;

/** Size of one fist block, in the same box units as the native path data. */
const FIST_W = 96;
const FIST_H = 54;

/** Short spark lines thrown off the point of contact, above and below. */
const SPARK_OFFSETS = [
  { x: 0, y: -15, rotate: '0deg' },
  { x: -17, y: -9, rotate: '35deg' },
  { x: 17, y: -9, rotate: '-35deg' },
  { x: 0, y: 15, rotate: '0deg' },
  { x: -17, y: 9, rotate: '-35deg' },
  { x: 17, y: 9, rotate: '35deg' },
];

export type BumpIconProps = {
  size?: number;
  color?: string;
  variant?: 'dap' | 'fist';
  mirrored?: boolean;
  bumped?: boolean;
  animated?: boolean;
  detail?: boolean;
  glow?: boolean;
  opacity?: number;
  style?: StyleProp<ViewStyle>;
};

/** One fist: a rounded outline block, its knuckles a row of dots once big enough to read. */
function Fist({ stroke, color, detail }: { stroke: number; color: string; detail: boolean }) {
  return (
    <View
      style={{
        width: FIST_W,
        height: FIST_H,
        borderRadius: FIST_H / 2,
        borderWidth: stroke,
        borderColor: color,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {detail && (
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {[0, 1, 2].map((index) => (
            <View
              key={index}
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                borderWidth: Math.max(1, stroke * 0.6),
                borderColor: color,
              }}
            />
          ))}
        </View>
      )}
    </View>
  );
}

type AnimatedFistProps = {
  /** X position, in box units, this fist's knuckle (contact) edge animates to. */
  knuckleX: SharedValue<number>;
  /** Whether the knuckle edge is the block's left side (facing left) or right (facing right). */
  knuckleOnLeft: boolean;
  centerY: number;
  stroke: number;
  color: string;
  detail: boolean;
};

function AnimatedFist({ knuckleX, knuckleOnLeft, centerY, stroke, color, detail }: AnimatedFistProps) {
  const positionStyle = useAnimatedStyle(() => ({
    left: knuckleOnLeft ? knuckleX.value : knuckleX.value - FIST_W,
  }));

  return (
    <Animated.View
      style={[
        { position: 'absolute', top: centerY - FIST_H / 2, width: FIST_W, height: FIST_H },
        positionStyle,
      ]}
    >
      <Fist stroke={stroke} color={color} detail={detail} />
    </Animated.View>
  );
}

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

  const drawnAsDap = isDap ? size : size * 2;
  const showDetail = detail ?? drawnAsDap >= DETAIL_WIDTH;
  const stroke = showDetail ? 5 : 6;

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

  const leftKnuckleX = useDerivedValue(() => KNUCKLES_APART + TRAVEL * contact.value);
  const rightKnuckleX = useDerivedValue(() => DAP_WIDTH - (KNUCKLES_APART + TRAVEL * contact.value));

  const burstStyle = useAnimatedStyle(() => ({
    opacity: contact.value,
    transform: [{ scale: 0.62 + 0.38 * contact.value }],
  }));

  const height = size * ASPECT;
  const scale = size / box;
  const staticKnuckleX = mirrored ? FIST_WIDTH - KNUCKLES_APART : KNUCKLES_APART;

  return (
    <View pointerEvents="none" style={[{ width: size, height }, style]} accessible={false}>
      <View
        style={
          {
            width: box,
            height: box * ASPECT,
            opacity,
            transform: [{ scale }],
            transformOrigin: 'top left',
            ...(glow
              ? { filter: `drop-shadow(0 0 ${Math.max(2, size * 0.09)}px ${color})` }
              : null),
          } as any
        }
      >
        {isDap ? (
          <>
            <AnimatedFist
              knuckleX={leftKnuckleX}
              knuckleOnLeft={false}
              centerY={DAP_CENTRE_Y}
              stroke={stroke}
              color={color}
              detail={showDetail}
            />

            <AnimatedFist
              knuckleX={rightKnuckleX}
              knuckleOnLeft={true}
              centerY={DAP_CENTRE_Y}
              stroke={stroke}
              color={color}
              detail={showDetail}
            />

            <Animated.View
              pointerEvents="none"
              style={[
                {
                  position: 'absolute',
                  left: KNUCKLES_TOUCHING - 20,
                  top: DAP_CENTRE_Y - 20,
                  width: 40,
                  height: 40,
                },
                burstStyle,
              ]}
            >
              {SPARK_OFFSETS.map((spark, index) => (
                <View
                  key={index}
                  style={{
                    position: 'absolute',
                    left: 20 + spark.x - 5,
                    top: 20 + spark.y - 1,
                    width: 10,
                    height: 2,
                    borderRadius: 1,
                    backgroundColor: color,
                    transform: [{ rotate: spark.rotate }],
                  }}
                />
              ))}
            </Animated.View>
          </>
        ) : (
          <View
            style={{
              position: 'absolute',
              left: mirrored ? staticKnuckleX : staticKnuckleX - FIST_W,
              top: FIST_CENTRE_Y - FIST_H / 2,
            }}
          >
            <Fist stroke={stroke} color={color} detail={showDetail} />
          </View>
        )}
      </View>
    </View>
  );
}
