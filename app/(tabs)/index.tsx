import Ionicons from "@expo/vector-icons/Ionicons";

import { TAB_INDEX, useIsTabFocused } from "@/components/tab-focus";
import { ThoughtsSheet, type Thought } from "@/components/thoughts-sheet";
import {
  BlurMask,
  Canvas,
  Group,
  RoundedRect,
} from "@shopify/react-native-skia";
import {
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
  useAudioSampleListener,
} from "expo-audio";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ViewToken } from "react-native";
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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
const TEST_BEAT = require("../../assets/audio/test-beat.wav");
const WAVE_BAR_COUNT = 28;
const MIN_WAVE_HEIGHT = 8;
const MAX_WAVE_HEIGHT = 130;
type FeedTab = "forYou" | "following";
type SortMode = "Recommended" | "Trending" | "Recent";

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
  black: "#000000",
  charcoal: "#121212",
  surface: "#1A1A1A",
  raised: "#242424",
  green: "#1DB954",
  greenPressed: "#169C46",
  white: "#FFFFFF",
  grey: "#B3B3B3",
  muted: "#777777",
  border: "rgba(0,0,0,1)",
};

const BEATS: Beat[] = [
  {
    id: "1",
    title: "Midnight Drive",
    producer: "kydvibes",
    caption: "Dark melodic trap beat. Who would sound best on this?",
    genre: "Trap",
    bpm: 148,
    musicalKey: "F# Minor",
    likes: 2418,
    comments: 128,
    shares: 196,
    averageRating: 4.3,
    ratingCount: 842,
    followed: true,
    recommendedScore: 98,
    createdAt: "2026-07-23T08:30:00Z",
  },
  {
    id: "2",
    title: "Pressure",
    producer: "beatsbykairo",
    caption: "Heavy drill bounce with space for an aggressive verse.",
    genre: "Drill",
    bpm: 142,
    musicalKey: "D Minor",
    likes: 8912,
    comments: 364,
    shares: 522,
    averageRating: 4.7,
    ratingCount: 1260,
    followed: false,
    recommendedScore: 95,
    createdAt: "2026-07-22T21:15:00Z",
  },
  {
    id: "3",
    title: "Neon Dreams",
    producer: "prodbyocean",
    caption: "Late-night R&B. Smooth vocals would go crazy on this.",
    genre: "R&B",
    bpm: 92,
    musicalKey: "A Minor",
    likes: 15302,
    comments: 706,
    shares: 1104,
    averageRating: 4.8,
    ratingCount: 2184,
    followed: true,
    recommendedScore: 93,
    createdAt: "2026-07-20T13:00:00Z",
  },
  {
    id: "4",
    title: "Cold Summer",
    producer: "nox.wav",
    caption: "Ambient hip-hop with a clean switch halfway through.",
    genre: "Hip-Hop",
    bpm: 126,
    musicalKey: "C Minor",
    likes: 5337,
    comments: 219,
    shares: 311,
    averageRating: 4.1,
    ratingCount: 634,
    followed: false,
    recommendedScore: 89,
    createdAt: "2026-07-23T10:45:00Z",
  },
];

const GENRES = ["All", "Trap", "Drill", "R&B", "Hip-Hop"];

const MOCK_THOUGHTS: Record<string, Thought[]> = {
  "1": [
    {
      id: "t1-1",
      user: "ravengrey",
      text: "That F# minor progression is haunting, this needs a raspy female vocal on it.",
      minutesAgo: 12,
    },
    {
      id: "t1-2",
      user: "jayblnk",
      text: "Drums hit different around the 0:40 mark, whoever mixed this knew what they were doing.",
      minutesAgo: 47,
    },
    {
      id: "t1-3",
      user: "lunaroots",
      text: "Reminds me of early Travis Scott but darker. Would love a slower flow over this.",
      minutesAgo: 130,
    },
  ],
  "2": [
    {
      id: "t2-1",
      user: "drilltalk_nyc",
      text: "The bounce on this is insane, perfect for a UK-style flow.",
      minutesAgo: 8,
    },
    {
      id: "t2-2",
      user: "kairofan22",
      text: "Kairo never misses honestly. This is going in my playlist regardless of vocals.",
      minutesAgo: 55,
    },
  ],
  "3": [
    {
      id: "t3-1",
      user: "smoothrnb",
      text: "This is exactly the vibe I've been looking for. Sending to my singer right now.",
      minutesAgo: 5,
    },
    {
      id: "t3-2",
      user: "oceanwave_prod",
      text: "The chord voicing in the bridge is so smooth, love the space you left for vocals.",
      minutesAgo: 21,
    },
    {
      id: "t3-3",
      user: "nightowl_a",
      text: "Feels like a late night drive through the city. Beautiful work.",
      minutesAgo: 200,
    },
  ],
  "4": [
    {
      id: "t4-1",
      user: "hiphopheadz",
      text: "That switch caught me off guard, in the best way possible.",
      minutesAgo: 33,
    },
  ],
};

/**
 * Converts large numbers into short labels for the UI.
 * Example: 2418 becomes "2.4k" and 1200000 becomes "1.2m".
 */
function formatCount(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1).replace(".0", "")}m`;
  }

  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1).replace(".0", "")}k`;
  }

  return String(value);
}

type DraggableRatingProps = {
  value: number;
  onChange: (rating: number) => void;
};

/**
 * Displays the five-star rating control.
 * The user can tap or drag across the stars to choose a rating from 0 to 5.
 */
function DraggableRating({ value, onChange }: DraggableRatingProps) {
  const [trackWidth, setTrackWidth] = useState(1);

  // Creates and remembers the touch/drag handler used by the star rating control.
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (event) => {
          const x = Math.max(
            0,
            Math.min(event.nativeEvent.locationX, trackWidth),
          );
          onChange(Math.round((x / trackWidth) * 10) / 2);
        },
        onPanResponderMove: (event) => {
          const x = Math.max(
            0,
            Math.min(event.nativeEvent.locationX, trackWidth),
          );
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
          {value === 0 ? "Drag to rate" : `${value.toFixed(1)} / 5`}
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
              name={full ? "star" : half ? "star-half" : "star-outline"}
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

/**
 * Renders one action button in the right-hand rail, such as like, comment, rating, or share.
 */
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

/**
 * Draws the glowing green audio visualizer with React Native Skia.
 * Each value in `bars` controls the height of one visualizer bar.
 */
function AudioWaveform({ bars }: AudioWaveformProps) {
  const { width: screenWidth } = useWindowDimensions();

  const canvasWidth = screenWidth - 105;
  const canvasHeight = 170;
  const gap = 4;

  const barWidth = (canvasWidth - gap * (bars.length - 1)) / bars.length;

  return (
    <View pointerEvents="none" style={styles.skiaWaveformContainer}>
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

/**
 * Renders one full-screen beat in the scrolling feed.
 * It manages playback, visualizer data, likes, following, ratings, sharing, and beat details.
 */
function BeatCard({ beat, height, active }: BeatCardProps) {
  const [following, setFollowing] = useState(beat.followed);
  const [paused, setPaused] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [hasReceivedSamples, setHasReceivedSamples] = useState(false);
  const [thoughts, setThoughts] = useState<Thought[]>(
    () => MOCK_THOUGHTS[beat.id] ?? [],
  );
  const [thoughtCount, setThoughtCount] = useState(beat.comments);
  const [thoughtsOpen, setThoughtsOpen] = useState(false);

  // Adds a new thought to the top of the list and bumps the displayed count.
  const addThought = (text: string) => {
    const newThought: Thought = {
      id: `${beat.id}-${Date.now()}`,
      user: "you",
      text,
      minutesAgo: 0,
    };

    setThoughts((previous) => [newThought, ...previous]);
    setThoughtCount((count) => count + 1);
  };

  const player = useAudioPlayer(TEST_BEAT, {
    updateInterval: 100,
  });

  const audioStatus = useAudioPlayerStatus(player);

  const [waveBars, setWaveBars] = useState<number[]>(
    Array(WAVE_BAR_COUNT).fill(MIN_WAVE_HEIGHT),
  );

  const hasReceivedSamplesRef = useRef(false);

  const lastWaveUpdate = useRef(0);

  // Receives live PCM audio samples from the player and converts their loudness into bar heights.
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

    const nextBars = Array.from({ length: WAVE_BAR_COUNT }, (_, barIndex) => {
      const start = barIndex * framesPerBar;
      const end =
        barIndex === WAVE_BAR_COUNT - 1
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

      // Convert loudness to decibels. This prevents loud tracks from
      // immediately forcing every bar to the maximum height.
      const decibels = 20 * Math.log10(rms + 0.000001);
      const normalized = Math.max(0, Math.min(1, (decibels + 55) / 52));

      // A stronger curve leaves more room for visible differences.
      const shapedLevel = Math.pow(normalized, 1.5);

      return (
        MIN_WAVE_HEIGHT + shapedLevel * (MAX_WAVE_HEIGHT - MIN_WAVE_HEIGHT)
      );
    });

    // Smooth the movement without allowing the bars to remain permanently full.
    setWaveBars((previousBars) =>
      nextBars.map(
        (nextHeight, index) => previousBars[index] * 0.65 + nextHeight * 0.35,
      ),
    );
  });

  // Configures the audio player to loop the preview and play at full volume.
  useEffect(() => {
    player.loop = true;
    player.volume = 1;
  }, [player]);

  // Starts the active card, pauses inactive cards, and resets cards when the user scrolls away.
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

  // Opens the phone's native share menu with a message for the current beat.
  const shareBeat = async () => {
    try {
      await Share.share({
        message: `Listen to "${beat.title}" by @${beat.producer} on Bump.`,
      });
    } catch {
      Alert.alert("Could not open sharing");
    }
  };

  return (
    <View style={[styles.card, { height }]}>
      <View style={styles.beatBackground}>
        <AudioWaveform bars={waveBars} />

        <Text style={styles.samplingStatus}>
          {!player.isAudioSamplingSupported
            ? "SAMPLING UNSUPPORTED"
            : hasReceivedSamples
              ? "LIVE AUDIO"
              : "WAITING FOR AUDIO"}
        </Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={paused ? "Play preview" : "Pause preview"}
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
              Alert.alert("Producer profile", `Open @${beat.producer}`)
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
            icon="chatbubble-ellipses-outline"
            label={formatCount(thoughtCount)}
            onPress={() => setThoughtsOpen(true)}
          />

          <RailButton
            icon="star"
            label={displayedAverage.toFixed(1)}
            active
            onPress={() =>
              Alert.alert(
                "Average rating",
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
              style={[styles.followButton, following && styles.followingButton]}
            >
              <Text
                style={[
                  styles.followButtonText,
                  following && styles.followingButtonText,
                ]}
              >
                {following ? "Following" : "Follow"}
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
              name={paused || !active ? "play" : "musical-notes"}
              size={16}
              color={COLORS.white}
            />
            <Text style={styles.previewText}>
              {paused || !active ? "Preview paused" : "Playing preview"}
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

      <ThoughtsSheet
        visible={thoughtsOpen}
        beatTitle={beat.title}
        thoughts={thoughts}
        onClose={() => setThoughtsOpen(false)}
        onSubmit={addThought}
      />
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

/**
 * Displays the bottom-sheet filter menu for choosing a genre and feed sorting mode.
 */
function FilterSheet({
  visible,
  currentGenre,
  currentSort,
  onClose,
  onApply,
}: FilterSheetProps) {
  const [draftGenre, setDraftGenre] = useState(currentGenre);
  const [draftSort, setDraftSort] = useState<SortMode>(currentSort);

  // Restores the temporary filter choices to the currently applied values whenever the sheet opens.
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
            {(["Recommended", "Trending", "Recent"] as SortMode[]).map(
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
                      name={selected ? "radio-button-on" : "radio-button-off"}
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

/**
 * Main Home tab for Bump.
 * It prepares audio, filters and sorts beats, tracks the visible card, and renders the scrolling feed.
 */
export default function HomeScreen() {
  // Runs once when the Home screen loads to prepare audio playback and sampling.
  useEffect(() => {
    // Requests permission when required and sets the app's playback behaviour.
    const prepareAudio = async () => {
      if (Platform.OS === "android") {
        const permission = await requestRecordingPermissionsAsync();

        if (!permission.granted) {
          Alert.alert(
            "Audio visualiser permission",
            "Permission is required on Android for the music-reactive waveform.",
          );
        }
      }

      await setAudioModeAsync({
        playsInSilentMode: true,
        interruptionMode: "doNotMix",
        shouldRouteThroughEarpiece: false,
      });
    };

    void prepareAudio();
  }, []);

  const insets = useSafeAreaInsets();

  // Every tab stays mounted, so the feed has to stop when you swipe away —
  // otherwise Home keeps playing underneath Match.
  const focused = useIsTabFocused(TAB_INDEX.home);

  const [feedHeight, setFeedHeight] = useState(0);
  const [activeBeatId, setActiveBeatId] = useState(BEATS[0].id);
  const [activeTab, setActiveTab] = useState<FeedTab>("forYou");
  const [genre, setGenre] = useState("All");
  const [sortMode, setSortMode] = useState<SortMode>("Recommended");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortMenuOpen, setSortMenuOpen] = useState(false);

  // Builds the feed from the selected tab, genre filter, and sorting option.
  const filteredBeats = useMemo(() => {
    let result =
      activeTab === "following"
        ? BEATS.filter((beat) => beat.followed)
        : [...BEATS];

    if (genre !== "All") {
      result = result.filter((beat) => beat.genre === genre);
    }

    return result.sort((first, second) => {
      if (sortMode === "Trending") {
        return second.likes - first.likes;
      }

      if (sortMode === "Recent") {
        return (
          new Date(second.createdAt).getTime() -
          new Date(first.createdAt).getTime()
        );
      }

      return second.recommendedScore - first.recommendedScore;
    });
  }, [activeTab, genre, sortMode]);

  // Updates `activeBeatId` whenever the user scrolls to a different full-screen beat.
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const visibleItem = viewableItems.find((item) => item.isViewable);
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

  const filtersActive = genre !== "All" || sortMode !== "Recommended";

  return (
    <View
      onLayout={(event) => setFeedHeight(event.nativeEvent.layout.height)}
      style={styles.screen}
    >
      <StatusBar style="light" />

      {feedHeight > 0 && (
        <FlatList
          data={filteredBeats}
          extraData={`${activeBeatId}-${focused}`}
          removeClippedSubviews={false}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <BeatCard
              beat={item}
              height={feedHeight}
              active={focused && item.id === activeBeatId}
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
            onPress={() => setActiveTab("following")}
            style={styles.feedTabButton}
          >
            <Text
              style={[
                styles.feedTabText,
                activeTab === "following" && styles.activeFeedTabText,
              ]}
            >
              Following
            </Text>
            {activeTab === "following" && <View style={styles.tabUnderline} />}
          </Pressable>

          <Pressable
            onPress={() => {
              if (activeTab !== "forYou") {
                setActiveTab("forYou");
                setSortMenuOpen(false);
              } else {
                setSortMenuOpen((open) => !open);
              }
            }}
            style={styles.feedTabButton}
          >
            <View style={styles.sortTabInner}>
              <Text
                style={[
                  styles.feedTabText,
                  activeTab === "forYou" && styles.activeFeedTabText,
                ]}
              >
                {sortMode}
              </Text>
              <Ionicons
                name={sortMenuOpen ? "chevron-up" : "chevron-down"}
                size={14}
                color={
                  activeTab === "forYou"
                    ? COLORS.white
                    : "rgba(255,255,255,0.66)"
                }
              />
            </View>
            {activeTab === "forYou" && <View style={styles.tabUnderline} />}
          </Pressable>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Search"
          onPress={() =>
            Alert.alert(
              "Search",
              "Search will let you find beats, producers and artists.",
            )
          }
          style={styles.topIconButton}
        >
          <Ionicons name="search" size={25} color={COLORS.white} />
        </Pressable>
      </View>

      {sortMenuOpen && (
        <>
          <Pressable
            style={styles.sortDropdownBackdrop}
            onPress={() => setSortMenuOpen(false)}
          />

          <View
            style={[styles.sortDropdownWrapper, { top: insets.top + 8 + 51 }]}
          >
            <View style={styles.sortDropdownCard}>
              {(["Recommended", "Trending", "Recent"] as SortMode[]).map(
                (option, index) => {
                  const selected = sortMode === option;

                  return (
                    <Pressable
                      key={option}
                      onPress={() => {
                        setSortMode(option);
                        setSortMenuOpen(false);
                      }}
                      style={[
                        styles.sortDropdownRow,
                        index === 2 && styles.sortDropdownRowLast,
                      ]}
                    >
                      <Text
                        style={[
                          styles.sortDropdownText,
                          selected && styles.sortDropdownTextActive,
                        ]}
                      >
                        {option}
                      </Text>
                      {selected && (
                        <Ionicons
                          name="checkmark"
                          size={18}
                          color={COLORS.green}
                        />
                      )}
                    </Pressable>
                  );
                },
              )}
            </View>
          </View>
        </>
      )}

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
    position: "absolute",
    left: 22,
    right: 78,
    top: "27%",
    height: 170,
    zIndex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  samplingStatus: {
    position: "absolute",
    top: "49%",
    alignSelf: "center",
    zIndex: 3,
    color: COLORS.grey,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.7,
  },
  screen: {
    flex: 1,
    backgroundColor: COLORS.black,
  },
  card: {
    width: "100%",
    backgroundColor: COLORS.black,
    overflow: "hidden",
  },
  playSurface: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  playButton: {
    width: 78,
    height: 78,
    borderRadius: 39,
    alignItems: "center",
    justifyContent: "center",
    paddingLeft: 5,
    backgroundColor: "rgba(0,0,0,0.48)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.24)",
  },
  topBar: {
    position: "absolute",
    left: 12,
    right: 12,
    zIndex: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  topIconButton: {
    width: 43,
    height: 43,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.38)",
  },
  filterDot: {
    position: "absolute",
    right: 7,
    top: 7,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.green,
  },
  feedTabs: {
    flexDirection: "row",
    alignItems: "center",
    gap: 24,
    paddingHorizontal: 17,
    height: 43,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  feedTabButton: {
    height: 43,
    alignItems: "center",
    justifyContent: "center",
  },
  feedTabText: {
    color: "rgba(255,255,255,0.66)",
    fontSize: 16,
    fontWeight: "700",
  },
  activeFeedTabText: {
    color: COLORS.white,
  },
  tabUnderline: {
    position: "absolute",
    bottom: 4,
    height: 3,
    width: 27,
    borderRadius: 2,
    backgroundColor: COLORS.green,
    alignSelf: "center",
  },
  sortTabInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    minWidth: 120,
  },
  sortDropdownBackdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 24,
  },
  sortDropdownWrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 25,
  },
  sortDropdownCard: {
    width: 176,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  sortDropdownRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  sortDropdownRowLast: {
    borderBottomWidth: 0,
  },
  sortDropdownText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "700",
  },
  sortDropdownTextActive: {
    color: COLORS.green,
  },
  rightRail: {
    position: "absolute",
    right: 10,
    bottom: 148,
    alignItems: "center",
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
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.raised,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  followBadge: {
    position: "absolute",
    bottom: -6,
    left: 17,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.green,
    borderWidth: 2,
    borderColor: COLORS.black,
  },
  railButton: {
    minWidth: 58,
    alignItems: "center",
  },
  pressedAction: {
    opacity: 0.62,
    transform: [{ scale: 0.94 }],
  },
  railLabel: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 3,
    textShadowColor: "rgba(0,0,0,0.9)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  beatDetails: {
    position: "absolute",
    left: 15,
    right: 82,
    bottom: 94,
    zIndex: 5,
  },
  producerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  producer: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: "800",
  },
  followButton: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 15,
    backgroundColor: COLORS.green,
  },
  followingButton: {
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  followButtonText: {
    color: COLORS.black,
    fontSize: 12,
    fontWeight: "800",
  },
  followingButtonText: {
    color: COLORS.white,
  },
  beatTitle: {
    color: COLORS.white,
    fontSize: 25,
    fontWeight: "900",
    marginTop: 9,
  },
  caption: {
    color: COLORS.white,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 5,
  },
  metadataRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
  },
  genrePill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: "rgba(29,185,84,0.22)",
    borderWidth: 1,
    borderColor: "rgba(29,185,84,0.55)",
  },
  genrePillText: {
    color: COLORS.green,
    fontSize: 12,
    fontWeight: "800",
  },
  metadata: {
    color: COLORS.grey,
    fontSize: 12,
    fontWeight: "700",
  },
  metadataDot: {
    color: COLORS.green,
    fontSize: 14,
  },
  previewRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 12,
  },
  previewText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  progressTrack: {
    height: 3,
    borderRadius: 2,
    overflow: "hidden",
    marginTop: 7,
    backgroundColor: "rgba(255,255,255,0.26)",
  },
  progressFill: {
    height: "100%",
    backgroundColor: COLORS.green,
  },
  ratingSection: {
    position: "absolute",
    left: 14,
    right: 78,
    bottom: 14,
    zIndex: 8,
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 15,
    backgroundColor: "rgba(0,0,0,0.64)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.13)",
  },
  ratingTextRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  ratingTitle: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "800",
  },
  yourRating: {
    color: COLORS.grey,
    fontSize: 11,
    fontWeight: "700",
  },
  ratingTrack: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 2,
  },
  modalRoot: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.68)",
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
    alignSelf: "center",
    width: 42,
    height: 5,
    borderRadius: 3,
    marginBottom: 16,
    backgroundColor: COLORS.muted,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sheetTitle: {
    color: COLORS.white,
    fontSize: 25,
    fontWeight: "900",
  },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.raised,
  },
  filterLabel: {
    color: COLORS.grey,
    fontSize: 13,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginTop: 23,
    marginBottom: 12,
  },
  optionWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
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
    fontWeight: "700",
  },
  optionTextSelected: {
    color: COLORS.black,
  },
  sortList: {
    overflow: "hidden",
    borderRadius: 15,
    backgroundColor: COLORS.surface,
  },
  sortRow: {
    minHeight: 53,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  sortText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "700",
  },
  applyButton: {
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
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
    fontWeight: "900",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 38,
    backgroundColor: COLORS.black,
  },
  emptyTitle: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: "900",
    marginTop: 14,
  },
  emptyText: {
    color: COLORS.grey,
    fontSize: 15,
    lineHeight: 21,
    textAlign: "center",
    marginTop: 8,
  },
});
