import Ionicons from '@expo/vector-icons/Ionicons';

import {
  BlurMask,
  Canvas,
  Group,
  RoundedRect,
} from '@shopify/react-native-skia';
import {
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
  useAudioSampleListener,
} from 'expo-audio';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ViewToken } from 'react-native';
import {
  Alert,
  FlatList,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
const TEST_BEAT = require('../../assets/audio/test-beat.wav');
const WAVE_BAR_COUNT = 28;
const MIN_WAVE_HEIGHT = 8;
const MAX_WAVE_HEIGHT = 130;
type FeedTab = 'forYou' | 'following';
type SortMode = 'Recommended' | 'Trending' | 'Recent';

type Beat = {
  id: string;
  title: string;
  producer: string;
  caption: string;
  genre: string;
  bpm: number;
  musicalKey: string;
  likes: number;
  comments: number;
  shares: number;
  averageRating: number;
  ratingCount: number;
  followed: boolean;
  recommendedScore: number;
  createdAt: string;
};

const COLORS = {
  black: '#000000',
  charcoal: '#121212',
  surface: '#1A1A1A',
  raised: '#242424',
  green: '#1DB954',
  greenPressed: '#169C46',
  white: '#FFFFFF',
  grey: '#B3B3B3',
  muted: '#777777',
  border: 'rgba(255,255,255,0.18)',
};

const BEATS: Beat[] = [
  {
    id: '1',
    title: 'Midnight Drive',
    producer: 'kydvibes',
    caption: 'Dark melodic trap beat. Who would sound best on this?',
    genre: 'Trap',
    bpm: 148,
    musicalKey: 'F# Minor',
    likes: 2418,
    comments: 128,
    shares: 196,
    averageRating: 4.3,
    ratingCount: 842,
    followed: true,
    recommendedScore: 98,
    createdAt: '2026-07-23T08:30:00Z',
  },
  {
    id: '2',
    title: 'Pressure',
    producer: 'beatsbykairo',
    caption: 'Heavy drill bounce with space for an aggressive verse.',
    genre: 'Drill',
    bpm: 142,
    musicalKey: 'D Minor',
    likes: 8912,
    comments: 364,
    shares: 522,
    averageRating: 4.7,
    ratingCount: 1260,
    followed: false,
    recommendedScore: 95,
    createdAt: '2026-07-22T21:15:00Z',
  },
  {
    id: '3',
    title: 'Neon Dreams',
    producer: 'prodbyocean',
    caption: 'Late-night R&B. Smooth vocals would go crazy on this.',
    genre: 'R&B',
    bpm: 92,
    musicalKey: 'A Minor',
    likes: 15302,
    comments: 706,
    shares: 1104,
    averageRating: 4.8,
    ratingCount: 2184,
    followed: true,
    recommendedScore: 93,
    createdAt: '2026-07-20T13:00:00Z',
  },
  {
    id: '4',
    title: 'Cold Summer',
    producer: 'nox.wav',
    caption: 'Ambient hip-hop with a clean switch halfway through.',
    genre: 'Hip-Hop',
    bpm: 126,
    musicalKey: 'C Minor',
    likes: 5337,
    comments: 219,
    shares: 311,
    averageRating: 4.1,
    ratingCount: 634,
    followed: false,
    recommendedScore: 89,
    createdAt: '2026-07-23T10:45:00Z',
  },
];

const GENRES = ['All', 'Trap', 'Drill', 'R&B', 'Hip-Hop'];

function formatCount(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1).replace('.0', '')}m`;
  }

  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1).replace('.0', '')}k`;
  }

  return String(value);
}

type DraggableRatingProps = {
  value: number;
  onChange: (rating: number) => void;
};

function DraggableRating({ value, onChange }: DraggableRatingProps) {
  const [trackWidth, setTrackWidth] = useState(1);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (event) => {
          const x = Math.max(0, Math.min(event.nativeEvent.locationX, trackWidth));
          onChange(Math.round((x / trackWidth) * 10) / 2);
        },
        onPanResponderMove: (event) => {
          const x = Math.max(0, Math.min(event.nativeEvent.locationX, trackWidth));
          onChange(Math.round((x / trackWidth) * 10) / 2);
        },
      }),
    [onChange, trackWidth],
  );

  return (
    <View style={styles.ratingSection}>
      <View style={styles.ratingTextRow}>
        <Text style={styles.ratingTitle}>Rate this beat</Text>
        <Text style={styles.yourRating}>
          {value === 0 ? 'Drag to rate' : `${value.toFixed(1)} / 5`}
        </Text>
      </View>

      <View
        {...panResponder.panHandlers}
        onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
        style={styles.ratingTrack}
      >
        {[0, 1, 2, 3, 4].map((index) => {
          const full = value >= index + 1;
          const half = !full && value >= index + 0.5;

          return (
            <Ionicons
              key={index}
              name={full ? 'star' : half ? 'star-half' : 'star-outline'}
              size={31}
              color={value > index ? COLORS.green : COLORS.white}
            />
          );
        })}
      </View>
    </View>
  );
}

type RailButtonProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  active?: boolean;
  onPress: () => void;
};

function RailButton({ icon, label, active = false, onPress }: RailButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.railButton,
        pressed && styles.pressedAction,
      ]}
    >
      <Ionicons
        name={icon}
        size={31}
        color={active ? COLORS.green : COLORS.white}
      />
      <Text style={styles.railLabel}>{label}</Text>
    </Pressable>
  );
}

type AudioWaveformProps = {
  bars: number[];
};

function AudioWaveform({ bars }: AudioWaveformProps) {
  const { width: screenWidth } = useWindowDimensions();

  const canvasWidth = screenWidth - 105;
  const canvasHeight = 170;
  const gap = 4;

  const barWidth =
    (canvasWidth - gap * (bars.length - 1)) / bars.length;

  return (
    <View
      pointerEvents="none"
      style={styles.skiaWaveformContainer}
    >
      <Canvas
        style={{
          width: canvasWidth,
          height: canvasHeight,
        }}
      >
        {/* Blurred copy creates the green glow. */}
        <Group opacity={0.55}>
          <BlurMask blur={9} style="normal" />

          {bars.map((barHeight, index) => {
            const height = Math.max(
              MIN_WAVE_HEIGHT,
              Math.min(MAX_WAVE_HEIGHT, barHeight),
            );

            return (
              <RoundedRect
                key={`glow-${index}`}
                x={index * (barWidth + gap)}
                y={(canvasHeight - height) / 2}
                width={barWidth}
                height={height}
                r={barWidth / 2}
                color={COLORS.green}
              />
            );
          })}
        </Group>

        {/* Sharp copy sits above the glow. */}
        {bars.map((barHeight, index) => {
          const height = Math.max(
            MIN_WAVE_HEIGHT,
            Math.min(MAX_WAVE_HEIGHT, barHeight),
          );

          return (
            <RoundedRect
              key={`bar-${index}`}
              x={index * (barWidth + gap)}
              y={(canvasHeight - height) / 2}
              width={barWidth}
              height={height}
              r={barWidth / 2}
              color={COLORS.green}
            />
          );
        })}
      </Canvas>
    </View>
  );
}

type BeatCardProps = {
  beat: Beat;
  height: number;
  active: boolean;
};

function BeatCard({ beat, height, active }: BeatCardProps) {
  const [liked, setLiked] = useState(false);
  const [following, setFollowing] = useState(beat.followed);
  const [paused, setPaused] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [hasReceivedSamples, setHasReceivedSamples] = useState(false);

  const player = useAudioPlayer(TEST_BEAT, {
    updateInterval: 100,
  });

  const audioStatus = useAudioPlayerStatus(player);

  const [waveBars, setWaveBars] = useState<number[]>(
    Array(WAVE_BAR_COUNT).fill(MIN_WAVE_HEIGHT),
  );

  const hasReceivedSamplesRef = useRef(false);

  const lastWaveUpdate = useRef(0);

  useAudioSampleListener(player, (sample) => {
  if (!active) {
    return;
  }

  const frames = sample.channels[0]?.frames;

    if (!frames || frames.length === 0) {
      return;
    }

    // Limit rendering work to roughly 20 updates per second.
    const now = Date.now();

    if (now - lastWaveUpdate.current < 50) {
      return;
    }

    lastWaveUpdate.current = now;

    if (!hasReceivedSamplesRef.current) {
      hasReceivedSamplesRef.current = true;
      setHasReceivedSamples(true);
    }

    const framesPerBar = Math.max(
      1,
      Math.floor(frames.length / WAVE_BAR_COUNT),
    );

    const nextBars = Array.from(
      { length: WAVE_BAR_COUNT },
      (_, barIndex) => {
        const start = barIndex * framesPerBar;
        const end =
          barIndex === WAVE_BAR_COUNT - 1
            ? frames.length
            : Math.min(start + framesPerBar, frames.length);

        let sumOfSquares = 0;
        let frameCount = 0;

        for (
          let frameIndex = start;
          frameIndex < end;
          frameIndex += 1
        ) {
          const frame = frames[frameIndex] ?? 0;

          sumOfSquares += frame * frame;
          frameCount += 1;
        }

        const rms = Math.sqrt(
          sumOfSquares / Math.max(frameCount, 1),
        );

        // Convert loudness to decibels. This prevents loud tracks from
        // immediately forcing every bar to the maximum height.
        const decibels = 20 * Math.log10(rms + 0.000001);
        const normalized = Math.max(
          0,
          Math.min(1, (decibels + 55) / 52),
        );

        // A stronger curve leaves more room for visible differences.
        const shapedLevel = Math.pow(normalized, 1.5);

        return (
          MIN_WAVE_HEIGHT +
          shapedLevel *
            (MAX_WAVE_HEIGHT - MIN_WAVE_HEIGHT)
        );
      },
    );

    // Smooth the movement without allowing the bars to remain permanently full.
    setWaveBars((previousBars) =>
      nextBars.map(
        (nextHeight, index) =>
          previousBars[index] * 0.65 + nextHeight * 0.35,
      ),
    );
  });

  useEffect(() => {
    player.loop = true;
    player.volume = 1;
  }, [player]);

  useEffect(() => {
    if (active && !paused) {
      player.play();
    } else {
      player.pause();
    }

    if (!active) {
      void player.seekTo(0);
      setWaveBars(Array(WAVE_BAR_COUNT).fill(MIN_WAVE_HEIGHT));
      hasReceivedSamplesRef.current = false;
      setHasReceivedSamples(false);
    }
  }, [active, paused, player]);

  const progress =
    audioStatus.duration > 0
      ? Math.min(audioStatus.currentTime / audioStatus.duration, 1)
      : 0;

  const progressWidth = `${progress * 100}%` as `${number}%`;

  const displayedAverage =
    userRating === 0
      ? beat.averageRating
      : (beat.averageRating * beat.ratingCount + userRating) /
        (beat.ratingCount + 1);

  const shareBeat = async () => {
    try {
      await Share.share({
        message: `Listen to "${beat.title}" by @${beat.producer} on Bump.`,
      });
    } catch {
      Alert.alert('Could not open sharing');
    }
  };

  return (
    <View style={[styles.card, { height }]}>
      
    <View style={styles.beatBackground}>
      <AudioWaveform bars={waveBars} />

      <Text style={styles.samplingStatus}>
        {!player.isAudioSamplingSupported
          ? 'SAMPLING UNSUPPORTED'
          : hasReceivedSamples
            ? 'LIVE AUDIO'
            : 'WAITING FOR AUDIO'}
      </Text>

      <Pressable
          accessibilityRole="button"
          accessibilityLabel={paused ? 'Play preview' : 'Pause preview'}
          onPress={() => setPaused((current) => !current)}
          style={styles.playSurface}
        >
          {(paused || !active) && (
            <View style={styles.playButton}>
              <Ionicons name="play" size={42} color={COLORS.white} />
            </View>
          )}
        </Pressable>

        <View style={styles.rightRail}>
          <Pressable
            accessibilityRole="button"
            onPress={() =>
              Alert.alert('Producer profile', `Open @${beat.producer}`)
            }
            style={styles.profileButton}
          >
            <View style={styles.blankProfile}>
              <Ionicons name="person" size={25} color={COLORS.grey} />
            </View>

            {!following && (
              <View style={styles.followBadge}>
                <Ionicons name="add" size={15} color={COLORS.black} />
              </View>
            )}
          </Pressable>

          <RailButton
            icon={liked ? 'heart' : 'heart-outline'}
            label={formatCount(beat.likes + (liked ? 1 : 0))}
            active={liked}
            onPress={() => setLiked((current) => !current)}
          />

          <RailButton
            icon="chatbubble-ellipses-outline"
            label={formatCount(beat.comments)}
            onPress={() =>
              Alert.alert('Comments', 'The comments panel will be added later.')
            }
          />

          <RailButton
            icon="star"
            label={displayedAverage.toFixed(1)}
            active
            onPress={() =>
              Alert.alert(
                'Average rating',
                `${displayedAverage.toFixed(1)} from ${
                  beat.ratingCount + (userRating > 0 ? 1 : 0)
                } ratings.`,
              )
            }
          />

          <RailButton
            icon="arrow-redo-outline"
            label={formatCount(beat.shares)}
            onPress={shareBeat}
          />
        </View>

        <View style={styles.beatDetails}>
          <View style={styles.producerRow}>
            <Text style={styles.producer}>@{beat.producer}</Text>

            <Pressable
              accessibilityRole="button"
              onPress={() => setFollowing((current) => !current)}
              style={[
                styles.followButton,
                following && styles.followingButton,
              ]}
            >
              <Text
                style={[
                  styles.followButtonText,
                  following && styles.followingButtonText,
                ]}
              >
                {following ? 'Following' : 'Follow'}
              </Text>
            </Pressable>
          </View>

          <Text style={styles.beatTitle}>{beat.title}</Text>
          <Text numberOfLines={2} style={styles.caption}>
            {beat.caption}
          </Text>

          <View style={styles.metadataRow}>
            <View style={styles.genrePill}>
              <Text style={styles.genrePillText}>{beat.genre}</Text>
            </View>
            <Text style={styles.metadata}>{beat.bpm} BPM</Text>
            <Text style={styles.metadataDot}>•</Text>
            <Text style={styles.metadata}>{beat.musicalKey}</Text>
          </View>

          <View style={styles.previewRow}>
            <Ionicons
              name={paused || !active ? 'play' : 'musical-notes'}
              size={16}
              color={COLORS.white}
            />
            <Text style={styles.previewText}>
              {paused || !active ? 'Preview paused' : 'Playing preview'}
            </Text>
          </View>

          <View style={styles.progressTrack}>
            <View
  style={[
    styles.progressFill,
    {
      width: progressWidth,
    },
  ]}
/>
          </View>
        </View>

        <DraggableRating value={userRating} onChange={setUserRating} />
      </View>
    </View>
  );
}

type FilterSheetProps = {
  visible: boolean;
  currentGenre: string;
  currentSort: SortMode;
  onClose: () => void;
  onApply: (genre: string, sort: SortMode) => void;
};

function FilterSheet({
  visible,
  currentGenre,
  currentSort,
  onClose,
  onApply,
}: FilterSheetProps) {
  const [draftGenre, setDraftGenre] = useState(currentGenre);
  const [draftSort, setDraftSort] = useState<SortMode>(currentSort);

  const resetDrafts = () => {
    setDraftGenre(currentGenre);
    setDraftSort(currentSort);
  };

  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={onClose}
      onShow={resetDrafts}
    >
      <View style={styles.modalRoot}>
        <Pressable style={styles.modalBackdrop} onPress={onClose} />

        <View style={styles.filterSheet}>
          <View style={styles.sheetHandle} />

          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Filter feed</Text>

            <Pressable
              accessibilityRole="button"
              onPress={onClose}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={25} color={COLORS.white} />
            </Pressable>
          </View>

          <Text style={styles.filterLabel}>Genre</Text>
          <View style={styles.optionWrap}>
            {GENRES.map((genre) => {
              const selected = draftGenre === genre;

              return (
                <Pressable
                  key={genre}
                  onPress={() => setDraftGenre(genre)}
                  style={[
                    styles.optionChip,
                    selected && styles.optionChipSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.optionText,
                      selected && styles.optionTextSelected,
                    ]}
                  >
                    {genre}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.filterLabel}>Show me</Text>
          <View style={styles.sortList}>
            {(['Recommended', 'Trending', 'Recent'] as SortMode[]).map(
              (sortOption) => {
                const selected = draftSort === sortOption;

                return (
                  <Pressable
                    key={sortOption}
                    onPress={() => setDraftSort(sortOption)}
                    style={styles.sortRow}
                  >
                    <Text style={styles.sortText}>{sortOption}</Text>
                    <Ionicons
                      name={
                        selected ? 'radio-button-on' : 'radio-button-off'
                      }
                      size={23}
                      color={selected ? COLORS.green : COLORS.grey}
                    />
                  </Pressable>
                );
              },
            )}
          </View>

          <Pressable
            onPress={() => onApply(draftGenre, draftSort)}
            style={({ pressed }) => [
              styles.applyButton,
              pressed && styles.applyButtonPressed,
            ]}
          >
            <Text style={styles.applyButtonText}>Apply filters</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

export default function HomeScreen() {
  

useEffect(() => {
  const prepareAudio = async () => {
    if (Platform.OS === 'android') {
      const permission = await requestRecordingPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          'Audio visualiser permission',
          'Permission is required on Android for the music-reactive waveform.',
        );
      }
    }

    await setAudioModeAsync({
      playsInSilentMode: true,
      interruptionMode: 'doNotMix',
      shouldRouteThroughEarpiece: false,
    });
  };

  void prepareAudio();
}, []);
  const insets = useSafeAreaInsets();

  const [feedHeight, setFeedHeight] = useState(0);
  const [activeBeatId, setActiveBeatId] = useState(BEATS[0].id);
  const [activeTab, setActiveTab] = useState<FeedTab>('forYou');
  const [genre, setGenre] = useState('All');
  const [sortMode, setSortMode] = useState<SortMode>('Recommended');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filteredBeats = useMemo(() => {
    let result =
      activeTab === 'following'
        ? BEATS.filter((beat) => beat.followed)
        : [...BEATS];

    if (genre !== 'All') {
      result = result.filter((beat) => beat.genre === genre);
    }

    return result.sort((first, second) => {
      if (sortMode === 'Trending') {
        return second.likes - first.likes;
      }

      if (sortMode === 'Recent') {
        return (
          new Date(second.createdAt).getTime() -
          new Date(first.createdAt).getTime()
        );
      }

      return second.recommendedScore - first.recommendedScore;
    });
  }, [activeTab, genre, sortMode]);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const visibleItem = viewableItems.find(
        (item) => item.isViewable,
      );
      const visibleBeat = visibleItem?.item as Beat | undefined;

      if (visibleBeat) {
        setActiveBeatId(visibleBeat.id);
      }
    },
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 80,
    minimumViewTime: 100,
  }).current;

  const filtersActive = genre !== 'All' || sortMode !== 'Recommended';

  return (
    <View
      onLayout={(event) => setFeedHeight(event.nativeEvent.layout.height)}
      style={styles.screen}
    >
      
      <StatusBar style="light" />

      {feedHeight > 0 && (
        <FlatList
          data={filteredBeats}
          extraData={activeBeatId}
          removeClippedSubviews={false}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <BeatCard
              beat={item}
              height={feedHeight}
              active={item.id === activeBeatId}
            />
          )}
          pagingEnabled
          snapToInterval={feedHeight}
          snapToAlignment="start"
          decelerationRate="fast"
          showsVerticalScrollIndicator={false}
          bounces={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          initialNumToRender={2}
          windowSize={3}
          getItemLayout={(_, index) => ({
            length: feedHeight,
            offset: feedHeight * index,
            index,
          })}
          ListEmptyComponent={
            <View style={[styles.emptyState, { height: feedHeight }]}>
              <Ionicons
                name="musical-notes-outline"
                size={54}
                color={COLORS.grey}
              />
              <Text style={styles.emptyTitle}>No beats found</Text>
              <Text style={styles.emptyText}>
                Change your filters or follow more producers.
              </Text>
            </View>
          }
        />
      )}

      <View style={[styles.topBar, { top: insets.top + 8 }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open feed filters"
          onPress={() => setFiltersOpen(true)}
          style={styles.topIconButton}
        >
          <Ionicons name="options-outline" size={25} color={COLORS.white} />
          {filtersActive && <View style={styles.filterDot} />}
        </Pressable>

        <View style={styles.feedTabs}>
          <Pressable
            onPress={() => setActiveTab('following')}
            style={styles.feedTabButton}
          >
            <Text
              style={[
                styles.feedTabText,
                activeTab === 'following' && styles.activeFeedTabText,
              ]}
            >
              Following
            </Text>
            {activeTab === 'following' && <View style={styles.tabUnderline} />}
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('forYou')}
            style={styles.feedTabButton}
          >
            <Text
              style={[
                styles.feedTabText,
                activeTab === 'forYou' && styles.activeFeedTabText,
              ]}
            >
              For You
            </Text>
            {activeTab === 'forYou' && <View style={styles.tabUnderline} />}
          </Pressable>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Search"
          onPress={() =>
            Alert.alert(
              'Search',
              'Search will let you find beats, producers and artists.',
            )
          }
          style={styles.topIconButton}
        >
          <Ionicons name="search" size={25} color={COLORS.white} />
        </Pressable>
      </View>

      <FilterSheet
        visible={filtersOpen}
        currentGenre={genre}
        currentSort={sortMode}
        onClose={() => setFiltersOpen(false)}
        onApply={(nextGenre, nextSort) => {
          setGenre(nextGenre);
          setSortMode(nextSort);
          setFiltersOpen(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  beatBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.black,
  },

  skiaWaveformContainer: {
  position: 'absolute',
  left: 22,
  right: 78,
  top: '27%',
  height: 170,
  zIndex: 1,
  alignItems: 'center',
  justifyContent: 'center',
},
  samplingStatus: {
  position: 'absolute',
  top: '49%',
  alignSelf: 'center',
  zIndex: 3,
  color: COLORS.grey,
  fontSize: 11,
  fontWeight: '700',
  letterSpacing: 0.7,
},
  screen: {
    flex: 1,
    backgroundColor: COLORS.black,
  },
  card: {
    width: '100%',
    backgroundColor: COLORS.black,
    overflow: 'hidden',
  },
  playSurface: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    width: 78,
    height: 78,
    borderRadius: 39,
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 5,
    backgroundColor: 'rgba(0,0,0,0.48)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
  },
  topBar: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topIconButton: {
    width: 43,
    height: 43,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.38)',
  },
  filterDot: {
    position: 'absolute',
    right: 7,
    top: 7,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.green,
  },
  feedTabs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    paddingHorizontal: 17,
    height: 43,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  feedTabButton: {
    height: 43,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedTabText: {
    color: 'rgba(255,255,255,0.66)',
    fontSize: 16,
    fontWeight: '700',
  },
  activeFeedTabText: {
    color: COLORS.white,
  },
  tabUnderline: {
    position: 'absolute',
    bottom: 4,
    height: 3,
    width: 27,
    borderRadius: 2,
    backgroundColor: COLORS.green,
  },
  rightRail: {
    position: 'absolute',
    right: 10,
    bottom: 148,
    alignItems: 'center',
    gap: 17,
    zIndex: 6,
  },
  profileButton: {
    marginBottom: 3,
  },
  blankProfile: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.raised,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  followBadge: {
    position: 'absolute',
    bottom: -6,
    left: 17,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.green,
    borderWidth: 2,
    borderColor: COLORS.black,
  },
  railButton: {
    minWidth: 58,
    alignItems: 'center',
  },
  pressedAction: {
    opacity: 0.62,
    transform: [{ scale: 0.94 }],
  },
  railLabel: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 3,
    textShadowColor: 'rgba(0,0,0,0.9)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  beatDetails: {
    position: 'absolute',
    left: 15,
    right: 82,
    bottom: 94,
    zIndex: 5,
  },
  producerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  producer: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '800',
  },
  followButton: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 15,
    backgroundColor: COLORS.green,
  },
  followingButton: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  followButtonText: {
    color: COLORS.black,
    fontSize: 12,
    fontWeight: '800',
  },
  followingButtonText: {
    color: COLORS.white,
  },
  beatTitle: {
    color: COLORS.white,
    fontSize: 25,
    fontWeight: '900',
    marginTop: 9,
  },
  caption: {
    color: COLORS.white,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 5,
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  genrePill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: 'rgba(29,185,84,0.22)',
    borderWidth: 1,
    borderColor: 'rgba(29,185,84,0.55)',
  },
  genrePillText: {
    color: COLORS.green,
    fontSize: 12,
    fontWeight: '800',
  },
  metadata: {
    color: COLORS.grey,
    fontSize: 12,
    fontWeight: '700',
  },
  metadataDot: {
    color: COLORS.green,
    fontSize: 14,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 12,
  },
  previewText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  progressTrack: {
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 7,
    backgroundColor: 'rgba(255,255,255,0.26)',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.green,
  },
  ratingSection: {
    position: 'absolute',
    left: 14,
    right: 78,
    bottom: 14,
    zIndex: 8,
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.64)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.13)',
  },
  ratingTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  ratingTitle: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '800',
  },
  yourRating: {
    color: COLORS.grey,
    fontSize: 11,
    fontWeight: '700',
  },
  ratingTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.68)',
  },
  filterSheet: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 28,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    backgroundColor: COLORS.charcoal,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 42,
    height: 5,
    borderRadius: 3,
    marginBottom: 16,
    backgroundColor: COLORS.muted,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sheetTitle: {
    color: COLORS.white,
    fontSize: 25,
    fontWeight: '900',
  },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.raised,
  },
  filterLabel: {
    color: COLORS.grey,
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 23,
    marginBottom: 12,
  },
  optionWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
  },
  optionChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: COLORS.raised,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  optionChipSelected: {
    backgroundColor: COLORS.green,
    borderColor: COLORS.green,
  },
  optionText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
  },
  optionTextSelected: {
    color: COLORS.black,
  },
  sortList: {
    overflow: 'hidden',
    borderRadius: 15,
    backgroundColor: COLORS.surface,
  },
  sortRow: {
    minHeight: 53,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  sortText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
  },
  applyButton: {
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    backgroundColor: COLORS.green,
  },
  applyButtonPressed: {
    backgroundColor: COLORS.greenPressed,
    transform: [{ scale: 0.985 }],
  },
  applyButtonText: {
    color: COLORS.black,
    fontSize: 16,
    fontWeight: '900',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 38,
    backgroundColor: COLORS.black,
  },
  emptyTitle: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: '900',
    marginTop: 14,
  },
  emptyText: {
    color: COLORS.grey,
    fontSize: 15,
    lineHeight: 21,
    textAlign: 'center',
    marginTop: 8,
  },
});
