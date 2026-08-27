/**
 * One full-screen card in the Match feed.
 *
 * The card is built around the audio: the preview starts the moment the card
 * becomes the active one, the visualiser is the background rather than a
 * decoration, and the text is kept to what you need in order to decide whether
 * you want to make something with this person.
 *
 * Gestures: vertical scrolling belongs to the feed, horizontal belongs to the
 * card. The pan responder only claims a touch once it is clearly sideways, so
 * flicking up to the next artist always wins.
 */

import Ionicons from '@expo/vector-icons/Ionicons';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { AudioVisualizer } from '@/components/audio-visualizer';
import { BumpIcon } from '@/components/bump-icon';
import { ArtistAvatar } from '@/components/match/artist-avatar';
import { BumpColors, formatCount } from '@/constants/bump-theme';
import type { MatchPost } from '@/constants/match-data';
import { useAudioBars } from '@/hooks/use-audio-bars';
import type { FeedItem } from '@/lib/match-discovery';

const PREVIEW_SOURCE = require('../../assets/audio/test-beat.wav');

/** Fraction of the screen width a drag must cross to count as a decision. */
const SWIPE_FRACTION = 0.26;

/** Seconds to preview when a post has no parseable duration. */
const FALLBACK_WINDOW = 20;

function labelToSeconds(label: string): number {
  const [minutes, seconds] = label.split(':').map(Number);

  if (!Number.isFinite(minutes) || !Number.isFinite(seconds)) {
    return FALLBACK_WINDOW;
  }

  return minutes * 60 + seconds;
}

function tap(style: Haptics.ImpactFeedbackStyle) {
  if (Platform.OS === 'web') {
    return;
  }

  void Haptics.impactAsync(style).catch(() => {});
}

export type MatchCardProps = {
  item: FeedItem;
  height: number;
  /** True only for the card on screen, in the focused tab. */
  active: boolean;
  following: boolean;
  bumped: boolean;
  /** Post being previewed. Falls back to the post the ranking chose. */
  selectedPostId?: string;
  /** Shows the swipe hint. Only the first card in the feed passes true. */
  showHint?: boolean;
  onBump: (item: FeedItem) => void;
  onSkip: (item: FeedItem) => void;
  onToggleFollow: (artistId: string) => void;
  onOpenProfile: (item: FeedItem) => void;
  onSelectPost: (artistId: string, postId: string) => void;
  onRespondToCollab: (item: FeedItem) => void;
  onShare: (item: FeedItem) => void;
};

export function MatchCard({
  item,
  height,
  active,
  following,
  bumped,
  selectedPostId,
  showHint = false,
  onBump,
  onSkip,
  onToggleFollow,
  onOpenProfile,
  onSelectPost,
  onRespondToCollab,
  onShare,
}: MatchCardProps) {
  const { width } = useWindowDimensions();
  const { artist } = item;

  const [paused, setPaused] = useState(false);

  const activePostId = selectedPostId ?? item.post.id;
  const postIndex = Math.max(
    0,
    artist.posts.findIndex((entry) => entry.id === activePostId),
  );

  const post: MatchPost = artist.posts[postIndex] ?? item.post;
  const windowSeconds = labelToSeconds(post.durationLabel);

  const player = useAudioPlayer(PREVIEW_SOURCE, { updateInterval: 100 });
  const status = useAudioPlayerStatus(player);
  const { bars, receiving, supported } = useAudioBars(player, { active });

  const playing = active && !paused;

  useEffect(() => {
    player.loop = true;
    player.volume = 1;
  }, [player]);

  // Start on the active card, stop everywhere else.
  useEffect(() => {
    if (playing) {
      player.play();
    } else {
      player.pause();
    }
  }, [playing, player]);

  // Clamped at call time rather than in render, so the effects below do not
  // re-fire the moment the file reports its duration. Every post points at the
  // same bundled file today; a short one must not seek past the end.
  const seekToPreviewStart = useCallback(() => {
    const { duration } = player;

    const start =
      duration > 0
        ? Math.min(post.previewStart, Math.max(0, duration - 6))
        : post.previewStart;

    void player.seekTo(start);
  }, [player, post.previewStart]);

  // Jump to this post's snippet whenever the card wakes up or the post changes.
  useEffect(() => {
    if (active) {
      seekToPreviewStart();
    } else {
      setPaused(false);
    }
  }, [active, seekToPreviewStart]);

  // Loop the snippet rather than the whole file, so a preview stays short.
  const previewEnd = post.previewStart + windowSeconds;
  const overran =
    playing &&
    status.duration > 0 &&
    status.currentTime >= Math.min(previewEnd, status.duration - 0.15);

  useEffect(() => {
    if (overran) {
      seekToPreviewStart();
    }
  }, [overran, seekToPreviewStart]);

  const elapsed = Math.max(0, status.currentTime - post.previewStart);
  const progress = Math.min(1, elapsed / Math.max(1, windowSeconds));
  const progressWidth = `${progress * 100}%` as `${number}%`;

  // --- Swipe -------------------------------------------------------------

  const translateX = useRef(new Animated.Value(0)).current;
  const threshold = width * SWIPE_FRACTION;

  const decidedRef = useRef(false);

  const settle = (direction: 'bump' | 'skip') => {
    if (decidedRef.current) {
      return;
    }

    decidedRef.current = true;

    tap(
      direction === 'bump'
        ? Haptics.ImpactFeedbackStyle.Heavy
        : Haptics.ImpactFeedbackStyle.Light,
    );

    Animated.timing(translateX, {
      toValue: direction === 'bump' ? width * 1.2 : -width * 1.2,
      duration: 210,
      useNativeDriver: true,
    }).start(() => {
      translateX.setValue(0);
      decidedRef.current = false;

      if (direction === 'bump') {
        onBump(item);
      } else {
        onSkip(item);
      }
    });
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_event, gesture) =>
          Math.abs(gesture.dx) > 14 &&
          Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.6,
        onPanResponderMove: (_event, gesture) => {
          translateX.setValue(gesture.dx);
        },
        onPanResponderRelease: (_event, gesture) => {
          const flung = Math.abs(gesture.vx) > 0.5;
          const past = Math.abs(gesture.dx) > threshold;

          if ((past || flung) && gesture.dx > 0) {
            settle('bump');
            return;
          }

          if ((past || flung) && gesture.dx < 0) {
            settle('skip');
            return;
          }

          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 6,
          }).start();
        },
        onPanResponderTerminate: () => {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        },
      }),
    // `settle` closes over the current item, so the responder is rebuilt when
    // the card changes. Cheap, and it keeps the callbacks correct.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [threshold, width, item.key],
  );

  const bumpStampOpacity = translateX.interpolate({
    inputRange: [0, threshold],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const skipStampOpacity = translateX.interpolate({
    inputRange: [-threshold, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const rotate = translateX.interpolate({
    inputRange: [-width, 0, width],
    outputRange: ['-7deg', '0deg', '7deg'],
  });

  // --- Layout ------------------------------------------------------------

  const isCollab = item.kind === 'collab' && Boolean(post.openCollabAsk);
  const waveWidth = Math.max(80, width - 122);
  const accent = isCollab ? BumpColors.mint : BumpColors.green;

  // Role and genres only. Location gets its own chip below, because the three
  // of them on one line truncate on a narrow phone.
  const meta = `${artist.role}  ·  ${artist.genres.slice(0, 2).join(', ')}`;

  const city = artist.location.split(',')[0];
  const place =
    artist.distanceKm <= 400
      ? `${city} · ${Math.round(artist.distanceKm)} km`
      : city;

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.card,
        { height, transform: [{ translateX }, { rotate }] },
      ]}
    >
      <View style={styles.background}>
        <AudioVisualizer
          bars={bars}
          width={waveWidth}
          height={170}
          color={accent}
          style={styles.visualizer}
        />

        <Text style={styles.samplingStatus}>
          {!supported
            ? 'SAMPLING UNSUPPORTED'
            : receiving
              ? 'LIVE AUDIO'
              : 'WAITING FOR AUDIO'}
        </Text>

        {/* Tap anywhere to pause. The play badge only appears when stopped. */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={paused ? 'Play preview' : 'Pause preview'}
          onPress={() => setPaused((current) => !current)}
          style={styles.playSurface}
        >
          {(paused || !active) && (
            <View style={styles.playBadge}>
              <Ionicons name="play" size={40} color={BumpColors.white} />
            </View>
          )}
        </Pressable>

        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.55)', 'rgba(0,0,0,0.94)']}
          locations={[0, 0.45, 1]}
          pointerEvents="none"
          style={styles.bottomScrim}
        />

        {isCollab && (
          <View style={styles.collabBadge}>
            <Ionicons name="git-merge" size={13} color={BumpColors.black} />
            <Text style={styles.collabBadgeText}>Open collab</Text>
          </View>
        )}

        {post.respondsTo && (
          <View style={styles.responseBadge}>
            <Ionicons name="return-down-forward" size={13} color={accent} />
            <Text style={styles.responseBadgeText} numberOfLines={1}>
              on @{post.respondsTo.artistHandle} — {post.respondsTo.title}
            </Text>
          </View>
        )}

        {/* --- Right rail --- */}
        <View style={styles.rail}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Bump ${artist.handle}`}
            onPress={() => settle('bump')}
            style={({ pressed }) => [
              styles.bumpButton,
              bumped && styles.bumpButtonDone,
              pressed && styles.pressed,
            ]}
          >
            <BumpIcon
              size={38}
              color={bumped ? BumpColors.black : BumpColors.mint}
              creaseColor={bumped ? BumpColors.mint : BumpColors.black}
              glow={!bumped}
              sparks={bumped}
            />
          </Pressable>

          <Text style={styles.bumpLabel}>
            {bumped ? 'Bumped' : isCollab ? 'Bump collab' : 'Bump'}
          </Text>

          {isCollab && (
            <RailButton
              icon="download-outline"
              label="Download"
              tint={BumpColors.mint}
              onPress={() => onRespondToCollab(item)}
            />
          )}

          <RailButton
            icon="albums-outline"
            label={String(artist.posts.length)}
            onPress={() => onOpenProfile(item)}
          />

          <RailButton
            icon="arrow-redo-outline"
            label={formatCount(post.bumps)}
            onPress={() => onShare(item)}
          />
        </View>

        {/* --- Info block --- */}
        <View style={styles.info}>
          <View style={styles.identityRow}>
            <Pressable
              accessibilityRole="button"
              onPress={() => onOpenProfile(item)}
              hitSlop={6}
            >
              <ArtistAvatar
                handle={artist.handle}
                name={artist.name}
                size={38}
                ring={artist.bumpedYou ? BumpColors.mint : BumpColors.white}
              />
            </Pressable>

            <View style={styles.identityText}>
              <Text style={styles.handle} numberOfLines={1}>
                @{artist.handle}
              </Text>
              <Text style={styles.meta} numberOfLines={1}>
                {meta}
              </Text>
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={() => onToggleFollow(artist.id)}
              style={[
                styles.followButton,
                following && styles.followingButton,
              ]}
            >
              <Text
                style={[
                  styles.followText,
                  following && styles.followingText,
                ]}
              >
                {following ? 'Following' : 'Follow'}
              </Text>
            </Pressable>
          </View>

          <View style={styles.lookingRow}>
            <View style={styles.lookingChip}>
              <Ionicons name="search" size={11} color={BumpColors.mint} />
              <Text style={styles.lookingText}>{artist.lookingFor}</Text>
            </View>

            <View style={styles.placeChip}>
              <Ionicons
                name="location-outline"
                size={11}
                color={BumpColors.grey}
              />
              <Text style={styles.reasonText}>{place}</Text>
            </View>

            {item.reasons.slice(0, 1).map((reason) => (
              <View key={reason} style={styles.reasonChip}>
                <Text style={styles.reasonText}>{reason}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.postTitle} numberOfLines={1}>
            {post.title}
          </Text>

          {isCollab && (
            <Text style={styles.ask} numberOfLines={2}>
              {post.openCollabAsk}
            </Text>
          )}

          <Text style={styles.trackMeta} numberOfLines={1}>
            {post.genre} · {post.bpm} BPM · {post.musicalKey} ·{' '}
            {post.durationLabel}
          </Text>

          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: progressWidth, backgroundColor: accent },
              ]}
            />
          </View>

          {artist.posts.length > 1 && (
            <View style={styles.postChips}>
              {artist.posts.slice(0, 4).map((option, index) => {
                const selected = index === postIndex;

                return (
                  <Pressable
                    key={option.id}
                    onPress={() => {
                      onSelectPost(artist.id, option.id);
                      setPaused(false);
                      tap(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    style={[
                      styles.postChip,
                      selected && styles.postChipSelected,
                    ]}
                  >
                    <Ionicons
                      name={
                        option.openCollabAsk ? 'git-merge' : 'musical-notes'
                      }
                      size={11}
                      color={selected ? BumpColors.black : BumpColors.grey}
                    />
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.postChipText,
                        selected && styles.postChipTextSelected,
                      ]}
                    >
                      {option.title}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}

          {showHint && (
            <View style={styles.hintRow}>
              <Ionicons
                name="arrow-forward"
                size={12}
                color={BumpColors.muted}
              />
              <Text style={styles.hintText}>
                Swipe right to bump · up for the next artist
              </Text>
            </View>
          )}
        </View>

        {/* --- Swipe stamps --- */}
        <Animated.View
          pointerEvents="none"
          style={[styles.stamp, styles.bumpStamp, { opacity: bumpStampOpacity }]}
        >
          <BumpIcon size={30} color={BumpColors.mint} sparks />
          <Text style={[styles.stampText, { color: BumpColors.mint }]}>
            BUMP
          </Text>
        </Animated.View>

        <Animated.View
          pointerEvents="none"
          style={[styles.stamp, styles.skipStamp, { opacity: skipStampOpacity }]}
        >
          <Text style={[styles.stampText, { color: BumpColors.grey }]}>
            SKIP
          </Text>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

type RailButtonProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  tint?: string;
  onPress: () => void;
};

function RailButton({
  icon,
  label,
  tint = BumpColors.white,
  onPress,
}: RailButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.railButton, pressed && styles.pressed]}
    >
      <Ionicons name={icon} size={27} color={tint} />
      <Text style={styles.railLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: BumpColors.black,
  },

  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: BumpColors.black,
  },

  visualizer: {
    position: 'absolute',
    left: 22,
    top: '27%',
    zIndex: 1,
  },

  samplingStatus: {
    position: 'absolute',
    top: '49%',
    alignSelf: 'center',
    zIndex: 3,
    color: BumpColors.muted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.7,
  },

  playSurface: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },

  playBadge: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 5,
    backgroundColor: 'rgba(0,0,0,0.48)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
  },

  bottomScrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '52%',
    zIndex: 2,
  },

  collabBadge: {
    position: 'absolute',
    top: 74,
    left: 16,
    zIndex: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: BumpColors.mint,
  },

  collabBadgeText: {
    color: BumpColors.black,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },

  responseBadge: {
    position: 'absolute',
    top: 110,
    left: 16,
    right: 90,
    zIndex: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  responseBadgeText: {
    flex: 1,
    color: BumpColors.grey,
    fontSize: 11,
    fontWeight: '700',
  },

  rail: {
    position: 'absolute',
    right: 10,
    bottom: 168,
    alignItems: 'center',
    gap: 16,
    zIndex: 6,
  },

  bumpButton: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(111,255,183,0.12)',
    borderWidth: 1.5,
    borderColor: BumpColors.mintEdge,
  },

  bumpButtonDone: {
    backgroundColor: BumpColors.mint,
    borderColor: BumpColors.mint,
  },

  bumpLabel: {
    marginTop: -12,
    color: BumpColors.mint,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  railButton: {
    minWidth: 54,
    alignItems: 'center',
  },

  railLabel: {
    color: BumpColors.white,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 3,
    textShadowColor: 'rgba(0,0,0,0.9)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  pressed: {
    opacity: 0.62,
    transform: [{ scale: 0.94 }],
  },

  info: {
    position: 'absolute',
    left: 16,
    right: 84,
    bottom: 22,
    zIndex: 5,
    gap: 7,
  },

  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  identityText: {
    flex: 1,
  },

  handle: {
    color: BumpColors.white,
    fontSize: 16,
    fontWeight: '800',
  },

  meta: {
    color: BumpColors.grey,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },

  followButton: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: BumpColors.green,
  },

  followingButton: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: BumpColors.hairline,
  },

  followText: {
    color: BumpColors.black,
    fontSize: 11,
    fontWeight: '800',
  },

  followingText: {
    color: BumpColors.white,
  },

  lookingRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },

  lookingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: BumpColors.mintWash,
    borderWidth: 1,
    borderColor: BumpColors.mintEdge,
  },

  lookingText: {
    color: BumpColors.mint,
    fontSize: 11,
    fontWeight: '800',
  },

  reasonChip: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },

  placeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },

  reasonText: {
    color: BumpColors.dim,
    fontSize: 11,
    fontWeight: '700',
  },

  postTitle: {
    color: BumpColors.white,
    fontSize: 23,
    fontWeight: '900',
  },

  ask: {
    color: BumpColors.white,
    fontSize: 13,
    lineHeight: 18,
    marginTop: -3,
  },

  trackMeta: {
    color: BumpColors.grey,
    fontSize: 11,
    fontWeight: '700',
  },

  progressTrack: {
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.24)',
  },

  progressFill: {
    height: '100%',
  },

  postChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },

  postChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: 150,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },

  postChipSelected: {
    backgroundColor: BumpColors.white,
  },

  postChipText: {
    color: BumpColors.grey,
    fontSize: 11,
    fontWeight: '700',
  },

  postChipTextSelected: {
    color: BumpColors.black,
  },

  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },

  hintText: {
    color: BumpColors.muted,
    fontSize: 11,
    fontWeight: '600',
  },

  stamp: {
    position: 'absolute',
    top: '30%',
    zIndex: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 14,
    borderWidth: 3,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },

  bumpStamp: {
    left: 26,
    borderColor: BumpColors.mint,
    transform: [{ rotate: '-11deg' }],
  },

  skipStamp: {
    right: 26,
    borderColor: BumpColors.grey,
    transform: [{ rotate: '11deg' }],
  },

  stampText: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
});
