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
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

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
  const slide = useRef(new Animated.Value(0)).current;
  const pop = useRef(new Animated.Value(0)).current;
  const content = useRef(new Animated.Value(0)).current;

  const [impacted, setImpacted] = useState(false);

  const run = useCallback(() => {
    slide.setValue(0);
    pop.setValue(0);
    content.setValue(0);
    setImpacted(false);

    Animated.timing(slide, {
      toValue: 1,
      duration: 300,
      easing: Easing.bezier(0.2, 0.9, 0.2, 1),
      useNativeDriver: true,
    }).start(() => {
      setImpacted(true);

      if (Platform.OS !== 'web') {
        void Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        ).catch(() => {});
      }

      Animated.sequence([
        Animated.spring(pop, {
          toValue: 1,
          useNativeDriver: true,
          bounciness: 14,
          speed: 14,
        }),
        Animated.timing(content, {
          toValue: 1,
          duration: 260,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, [content, pop, slide]);

  useEffect(() => {
    if (visible) {
      run();
    }
  }, [visible, run]);

  if (!artist) {
    return null;
  }

  const leftFist = slide.interpolate({
    inputRange: [0, 1],
    outputRange: [-150, 0],
  });

  const rightFist = slide.interpolate({
    inputRange: [0, 1],
    outputRange: [150, 0],
  });

  const popScale = pop.interpolate({
    inputRange: [0, 1],
    outputRange: [0.75, 1],
  });

  const contentShift = content.interpolate({
    inputRange: [0, 1],
    outputRange: [18, 0],
  });

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
              <Animated.View style={{ transform: [{ translateX: leftFist }] }}>
                <BumpIcon size={92} variant="fist" color={BumpColors.mint} />
              </Animated.View>

              <Animated.View style={{ transform: [{ translateX: rightFist }] }}>
                <BumpIcon
                  size={92}
                  variant="fist"
                  mirrored
                  color={BumpColors.mint}
                />
              </Animated.View>
            </View>
          ) : (
            <Animated.View
              style={[styles.fistStage, { transform: [{ scale: popScale }] }]}
            >
              <BumpIcon
                size={140}
                color={BumpColors.mint}
                creaseColor={BumpColors.black}
                sparks
                glow
              />
            </Animated.View>
          )}

          <Animated.View
            pointerEvents={impacted ? 'auto' : 'none'}
            style={[
              styles.body,
              { opacity: content, transform: [{ translateY: contentShift }] },
            ]}
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
                <BumpIcon size={30} color={BumpColors.mint} />
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
    ...StyleSheet.absoluteFillObject,
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
