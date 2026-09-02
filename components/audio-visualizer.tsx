/**
 * The glowing Bump waveform.
 *
 * Same treatment as the Home feed — a blurred copy underneath for the glow, a
 * sharp copy on top — but sized and coloured by props so Match can drop it into
 * a card of any shape.
 */

import { BlurMask, Canvas, Group, RoundedRect } from '@shopify/react-native-skia';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { BumpColors } from '@/constants/bump-theme';
import { MAX_WAVE_HEIGHT, MIN_WAVE_HEIGHT } from '@/hooks/use-audio-bars';

export type AudioVisualizerProps = {
  /** Bar heights in pixels, as produced by `useAudioBars`. */
  bars: number[];
  width: number;
  height: number;
  color?: string;
  gap?: number;
  minHeight?: number;
  maxHeight?: number;
  /** Blur radius of the glow copy. Set to 0 to draw the bars flat. */
  glowBlur?: number;
  style?: StyleProp<ViewStyle>;
};

export function AudioVisualizer({
  bars,
  width,
  height,
  color = BumpColors.green,
  gap = 4,
  minHeight = MIN_WAVE_HEIGHT,
  maxHeight = MAX_WAVE_HEIGHT,
  glowBlur = 9,
  style,
}: AudioVisualizerProps) {
  if (bars.length === 0 || width <= 0 || height <= 0) {
    return null;
  }

  const barWidth = Math.max(
    1,
    (width - gap * (bars.length - 1)) / bars.length,
  );

  const ceiling = Math.min(maxHeight, height);

  const rects = bars.map((barHeight, index) => {
    const drawn = Math.max(minHeight, Math.min(ceiling, barHeight));

    return {
      key: index,
      x: index * (barWidth + gap),
      y: (height - drawn) / 2,
      height: drawn,
    };
  });

  const bank = (keyPrefix: string) =>
    rects.map((rect) => (
      <RoundedRect
        key={`${keyPrefix}-${rect.key}`}
        x={rect.x}
        y={rect.y}
        width={barWidth}
        height={rect.height}
        r={barWidth / 2}
        color={color}
      />
    ));

  return (
    <View pointerEvents="none" style={style}>
      <Canvas style={{ width, height }}>
        {glowBlur > 0 && (
          <Group opacity={0.55}>
            <BlurMask blur={glowBlur} style="normal" />
            {bank('glow')}
          </Group>
        )}

        {bank('bar')}
      </Canvas>
    </View>
  );
}
