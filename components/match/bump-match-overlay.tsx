/**
 * The Bump match moment.
 *
 * Two fists fly in, connect, and the screen throws sparks — then the three
 * things you would actually want to do next appear underneath. A Bump means
 * "I would make something with you", so the actions are about starting work,
 * not about starting small talk.
 */

import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { BumpIcon } from '@/components/bump-icon';
import { ArtistAvatar } from '@/components/match/artist-avatar';
import { BumpColors } from '@/constants/bump-theme';
import type { Artist } from '@/constants/match-data';

export type MatchAction = 'message' | 'track' | 'idea';

export type BumpMatchOverlayProps = {
  visible: boolean;
  artist: Artist | null;
  /** The viewer's handle, shown opposite theirs. */
  viewerHandle: string;
  viewerName: string;
  onClose: () => void;
  onAction: (action: MatchAction, artist: Artist) => void;
};

const ACTIONS: {
  key: MatchAction;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  hint: string;
}[] = [
  {
    key: 'message',
    icon: 'chatbubble-ellipses',
    label: 'Message',
    hint: 'Say what you heard',
  },
  {
    key: 'track',
    icon: 'musical-notes',
    label: 'Send a track',
    hint: 'Share a beat or a verse',
  },
  {
    key: 'idea',
    icon: 'bulb',
    label: 'Collab idea',
    hint: 'Pitch what you would make',
  },
];

export function BumpMatchOverlay({
  visible,
  artist,
  viewerHandle,
  viewerName,
  onClose,
  onAction,
}: BumpMatchOverlayProps) {
  // Shared values, not refs: reanimated's `.value` is a compiler-safe
  // stand-in for `useRef(...).current` here, since the completion callbacks
  // below read and write it well after the render that starts the animation.
  const slide = useSharedValue(0);
  const pop = useSharedValue(0);
  const content = useSharedValue(0);

  const [impacted, setImpacted] = useState(false);

  const announceImpact = useCallback(() => {
    setImpacted(true);

    if (Platform.OS !== 'web') {
      void Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success,
      ).catch(() => {});
    }
  }, []);

  const run = useCallback(() => {
    slide.value = 0;
    pop.value = 0;
    content.value = 0;
    setImpacted(false);

    slide.value = withTiming(
      1,
      { duration: 300, easing: Easing.bezier(0.2, 0.9, 0.2, 1) },
      (finished) => {
        if (!finished) {
          return;
        }

        runOnJS(announceImpact)();

        pop.value = withSpring(
          1,
          { damping: 9, stiffness: 190, mass: 0.8 },
          (poppedFinished) => {
            if (poppedFinished) {
              content.value = withTiming(1, {
                duration: 260,
                easing: Easing.out(Easing.quad),
              });
            }
          },
        );
      },
    );
    // `slide`, `pop`, and `content` are shared values — stable references for
    // the lifetime of the component, like refs, so they don't belong in the
    // dependency array.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [announceImpact]);

  useEffect(() => {
    if (visible) {
      // Kicks off the fist-bump animation sequence — the canonical case for
      // synchronizing an external animation system with a prop change.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      run();
    }
  }, [visible, run]);

  const leftFistStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(slide.value, [0, 1], [-150, 0]) }],
  }));

  const rightFistStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(slide.value, [0, 1], [150, 0]) }],
  }));

  const popStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(pop.value, [0, 1], [0.75, 1]) }],
  }));

  const bodyStyle = useAnimatedStyle(() => ({
    opacity: content.value,
    transform: [
      { translateY: interpolate(content.value, [0, 1], [18, 0]) },
    ],
  }));

  if (!artist) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.root}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          onPress={onClose}
          style={styles.backdrop}
        />

        <View pointerEvents="box-none" style={styles.stage}>
          {!impacted ? (
            <View style={styles.fistStage}>
              <Animated.View style={leftFistStyle}>
                <BumpIcon size={85} variant="fist" color={BumpColors.mint} />
              </Animated.View>

              <Animated.View style={rightFistStyle}>
                <BumpIcon
                  size={85}
                  variant="fist"
                  mirrored
                  color={BumpColors.mint}
                />
              </Animated.View>
            </View>
          ) : (
            <Animated.View style={[styles.fistStage, popStyle]}>
              {/* Two 85pt fists side by side are exactly one 170pt dap, so the
                  swap from the approach to the impact lands on the same mark. */}
              <BumpIcon size={170} color={BumpColors.mint} bumped glow />
            </Animated.View>
          )}

          <Animated.View
            pointerEvents={impacted ? 'auto' : 'none'}
            style={[styles.body, bodyStyle]}
          >
            <Text style={styles.title}>It&apos;s a Bump</Text>
            <Text style={styles.subtitle}>
              You and @{artist.handle} both want to make something.
            </Text>

            <View style={styles.avatarRow}>
              <ArtistAvatar
                handle={viewerHandle}
                name={viewerName}
                size={68}
                ring={BumpColors.mint}
              />

              <View style={styles.avatarGap}>
                <BumpIcon size={40} color={BumpColors.mint} bumped animated={false} />
              </View>

              <ArtistAvatar
                handle={artist.handle}
                name={artist.name}
                size={68}
                ring={BumpColors.mint}
              />
            </View>

            <Text style={styles.pairing}>
              {artist.role} · {artist.genres.slice(0, 2).join(', ')} ·{' '}
              {artist.lookingFor}
            </Text>

            <View style={styles.actions}>
              {ACTIONS.map((action) => (
                <Pressable
                  key={action.key}
                  accessibilityRole="button"
                  onPress={() => onAction(action.key, artist)}
                  style={({ pressed }) => [
                    styles.action,
                    pressed && styles.actionPressed,
                  ]}
                >
                  <View style={styles.actionIcon}>
                    <Ionicons
                      name={action.icon}
                      size={19}
                      color={BumpColors.mint}
                    />
                  </View>

                  <View style={styles.actionText}>
                    <Text style={styles.actionLabel}>{action.label}</Text>
                    <Text style={styles.actionHint}>{action.hint}</Text>
                  </View>

                  <Ionicons
                    name="chevron-forward"
                    size={17}
                    color={BumpColors.muted}
                  />
                </Pressable>
              ))}
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={onClose}
              style={styles.keepBrowsing}
            >
              <Text style={styles.keepBrowsingText}>Keep listening</Text>
            </Pressable>
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'center',
  },

  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.93)',
  },

  stage: {
    paddingHorizontal: 26,
    alignItems: 'center',
  },

  fistStage: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 150,
  },

  body: {
    alignSelf: 'stretch',
    alignItems: 'center',
  },

  title: {
    color: BumpColors.mint,
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 0.4,
  },

  subtitle: {
    color: BumpColors.grey,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 12,
  },

  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 22,
  },

  avatarGap: {
    width: 44,
    alignItems: 'center',
  },

  pairing: {
    color: BumpColors.grey,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 12,
  },

  actions: {
    alignSelf: 'stretch',
    marginTop: 26,
    gap: 9,
  },

  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: 16,
    backgroundColor: BumpColors.surface,
    borderWidth: 1,
    borderColor: BumpColors.border,
  },

  actionPressed: {
    backgroundColor: BumpColors.raised,
    transform: [{ scale: 0.99 }],
  },

  actionIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BumpColors.mintWash,
  },

  actionText: {
    flex: 1,
  },

  actionLabel: {
    color: BumpColors.white,
    fontSize: 15,
    fontWeight: '800',
  },

  actionHint: {
    color: BumpColors.grey,
    fontSize: 12,
    marginTop: 1,
  },

  keepBrowsing: {
    marginTop: 18,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },

  keepBrowsingText: {
    color: BumpColors.muted,
    fontSize: 13,
    fontWeight: '700',
  },
});
