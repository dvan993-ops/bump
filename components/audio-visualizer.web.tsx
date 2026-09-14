/**
 * Web version of the glowing Bump waveform.
 *
 * Skia's web backend (`JsiSkApi(global.CanvasKit)`) runs the moment
 * `@shopify/react-native-skia` is imported, needing the CanvasKit wasm
 * loaded first — and pulling it in would add an 8MB (3.1MB gzipped)
 * download, five times the app's whole JS bundle, just to draw bars. Same
 * prop interface as the native `audio-visualizer.tsx`, drawn with plain
 * Views and a CSS glow instead.
 */

import { View, type StyleProp, type ViewStyle } from 'react-native';

import { BumpColors } from '@/constants/bump-theme';
import { MAX_WAVE_HEIGHT, MIN_WAVE_HEIGHT } from '@/hooks/use-audio-bars';

export type AudioVisualizerProps = {
  bars: number[];
  width: number;
  height: number;
  color?: string;
  gap?: number;
  minHeight?: number;
  maxHeight?: number;
  glowBlur?: number;
  style?: StyleProp<ViewStyle>;
};

export function AudioVisualizer({
  bars,
  width,
  height,
  color = BumpColors.mint,
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

  return (
    <View pointerEvents="none" style={[{ width, height }, style]}>
      {bars.map((barHeight, index) => {
        const drawn = Math.max(minHeight, Math.min(ceiling, barHeight));

        return (
          <View
            key={index}
            style={{
              position: 'absolute',
              left: index * (barWidth + gap),
              top: (height - drawn) / 2,
              width: barWidth,
              height: drawn,
              borderRadius: barWidth / 2,
              backgroundColor: color,
              ...(glowBlur > 0
                ? ({ boxShadow: `0 0 ${glowBlur * 2}px ${color}` } as any)
                : null),
            }}
          />
        );
      })}
    </View>
  );
}
