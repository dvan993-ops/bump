/**
 * Turns live PCM samples from an `expo-audio` player into visualiser bar
 * heights.
 *
 * This is the same maths the Home feed uses — RMS per bucket, converted to
 * decibels so loud tracks do not peg every bar, then smoothed — lifted into a
 * hook so Match can reuse it without duplicating the tuning.
 */

import { useAudioSampleListener, type AudioPlayer } from 'expo-audio';
import { useEffect, useRef, useState } from 'react';

export const WAVE_BAR_COUNT = 28;
export const MIN_WAVE_HEIGHT = 8;
export const MAX_WAVE_HEIGHT = 130;

/** Roughly 20 visualiser updates per second. */
const UPDATE_INTERVAL_MS = 50;

export type UseAudioBarsOptions = {
  /** Samples are ignored, and the bars reset, whenever this is false. */
  active: boolean;
  barCount?: number;
  minHeight?: number;
  maxHeight?: number;
};

export type AudioBars = {
  bars: number[];
  /** True once at least one sample has arrived. */
  receiving: boolean;
  /** False on platforms where the player cannot expose PCM data. */
  supported: boolean;
};

export function useAudioBars(
  player: AudioPlayer,
  {
    active,
    barCount = WAVE_BAR_COUNT,
    minHeight = MIN_WAVE_HEIGHT,
    maxHeight = MAX_WAVE_HEIGHT,
  }: UseAudioBarsOptions,
): AudioBars {
  const [bars, setBars] = useState<number[]>(() =>
    Array(barCount).fill(minHeight),
  );
  const [receiving, setReceiving] = useState(false);

  const receivingRef = useRef(false);
  const lastUpdate = useRef(0);

  useAudioSampleListener(player, (sample) => {
    if (!active) {
      return;
    }

    const frames = sample.channels[0]?.frames;

    if (!frames || frames.length === 0) {
      return;
    }

    const now = Date.now();

    if (now - lastUpdate.current < UPDATE_INTERVAL_MS) {
      return;
    }

    lastUpdate.current = now;

    if (!receivingRef.current) {
      receivingRef.current = true;
      setReceiving(true);
    }

    const framesPerBar = Math.max(1, Math.floor(frames.length / barCount));

    const nextBars = Array.from({ length: barCount }, (_, barIndex) => {
      const start = barIndex * framesPerBar;
      const end =
        barIndex === barCount - 1
          ? frames.length
          : Math.min(start + framesPerBar, frames.length);

      let sumOfSquares = 0;
      let frameCount = 0;

      for (let frameIndex = start; frameIndex < end; frameIndex += 1) {
        const frame = frames[frameIndex] ?? 0;

        sumOfSquares += frame * frame;
        frameCount += 1;
      }

      const rms = Math.sqrt(sumOfSquares / Math.max(frameCount, 1));

      // Decibels rather than raw amplitude, so a loud master does not push
      // every bar to the ceiling.
      const decibels = 20 * Math.log10(rms + 0.000001);
      const normalized = Math.max(0, Math.min(1, (decibels + 55) / 52));

      // A stronger curve leaves more room for visible differences.
      const shaped = Math.pow(normalized, 1.5);

      return minHeight + shaped * (maxHeight - minHeight);
    });

    // Smooth movement without letting the bars sit permanently full.
    setBars((previous) =>
      nextBars.map(
        (nextHeight, index) =>
          (previous[index] ?? minHeight) * 0.65 + nextHeight * 0.35,
      ),
    );
  });

  // Reset whenever the card stops being the active one.
  useEffect(() => {
    if (active) {
      return;
    }

    setBars(Array(barCount).fill(minHeight));
    receivingRef.current = false;
    setReceiving(false);
  }, [active, barCount, minHeight]);

  return { bars, receiving, supported: player.isAudioSamplingSupported };
}
