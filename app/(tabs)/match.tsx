import Ionicons from "@expo/vector-icons/Ionicons";
import { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

const COLORS = {
  black: "#121212",
  card: "#1A1A1A",
  green: "#6fffb7",
  grey: "#A7A7A7",
  border: "#282828",
  white: "#FFFFFF",
  red: "#FF5C5C",
};

// Placeholder clip-card colors, standing in for real thumbnails/video
const CARD_COLORS = ["#2B2540", "#123B33", "#3A2318", "#3A1F2B", "#3A2E12"];

type Role = "Producer" | "Engineer" | "Mixer";
type SortMode = "Recommended" | "Highest rated";

type Clip = {
  id: string;
  isCopyrighted: boolean;
};

type CreatorProfile = {
  id: string;
  name: string;
  role: Role;
  location: string;
  rating: number;
  likedYou: boolean;
  clips: Clip[];
};

// Mock data — swap for a real feed query once the backend/schema is agreed on
const MOCK_CREATORS: CreatorProfile[] = [
  {
    id: "1",
    name: "Jordan M.",
    role: "Producer",
    location: "Atlanta",
    rating: 4.8,
    likedYou: false,
    clips: [{ id: "c1", isCopyrighted: false }, { id: "c2", isCopyrighted: false }],
  },
  {
    id: "2",
    name: "Rae K.",
    role: "Engineer",
    location: "Houston",
    rating: 4.6,
    likedYou: true,
    clips: [
      { id: "c1", isCopyrighted: false },
      { id: "c2", isCopyrighted: true },
      { id: "c3", isCopyrighted: false },
    ],
  },
  {
    id: "3",
    name: "Devon P.",
    role: "Mixer",
    location: "Chicago",
    rating: 4.9,
    likedYou: false,
    clips: [{ id: "c1", isCopyrighted: false }, { id: "c2", isCopyrighted: false }],
  },
  {
    id: "4",
    name: "Nia W.",
    role: "Producer",
    location: "Memphis",
    rating: 4.3,
    likedYou: true,
    clips: [
      { id: "c1", isCopyrighted: false },
      { id: "c2", isCopyrighted: false },
      { id: "c3", isCopyrighted: false },
      { id: "c4", isCopyrighted: false },
    ],
  },
  {
    id: "5",
    name: "Cole S.",
    role: "Engineer",
    location: "Nashville",
    rating: 4.5,
    likedYou: false,
    clips: [{ id: "c1", isCopyrighted: true }, { id: "c2", isCopyrighted: false }],
  },
];

const ROLE_OPTIONS: Role[] = ["Producer", "Engineer", "Mixer"];
const SORT_OPTIONS: SortMode[] = ["Recommended", "Highest rated"];

export default function MatchScreen() {
  const [roleFilter, setRoleFilter] = useState<Role>("Producer");
  const [sortMode, setSortMode] = useState<SortMode>("Recommended");
  const [likesYouMode, setLikesYouMode] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  const [matchVisible, setMatchVisible] = useState(false);

  const [creatorIndex, setCreatorIndex] = useState(0);
  const [clipIndex, setClipIndex] = useState(0);

  const translateY = useSharedValue(0);

  const feed = getFeed(roleFilter, sortMode, likesYouMode);
  const current = feed[creatorIndex];

  // Reset position whenever the underlying feed changes shape
  useEffect(() => {
    setCreatorIndex(0);
    setClipIndex(0);
  }, [roleFilter, sortMode, likesYouMode]);

  function goNextCreator() {
    setCreatorIndex((i) => Math.min(i + 1, feed.length - 1));
    setClipIndex(0);
  }

  function goPrevCreator() {
    setCreatorIndex((i) => Math.max(i - 1, 0));
    setClipIndex(0);
  }

  function nextClip() {
    if (!current) return;
    if (clipIndex < current.clips.length - 1) {
      setClipIndex((i) => i + 1);
    } else {
      goNextCreator();
    }
  }

  function prevClip() {
    if (clipIndex > 0) setClipIndex((i) => i - 1);
  }

  function handleLike() {
    if (!current) return;
    if (current.likedYou) {
      setMatchVisible(true);
    } else {
      goNextCreator();
    }
  }

  function handlePass() {
    goNextCreator();
  }

  function toggleLikesYou() {
    setLikesYouMode((v) => !v);
  }

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      translateY.value = e.translationY * 0.3;
    })
    .onEnd((e) => {
      if (e.translationY < -60) {
        runOnJS(goNextCreator)();
      } else if (e.translationY > 60) {
        runOnJS(goPrevCreator)();
      }
      translateY.value = withSpring(0);
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const likesYouCount = MOCK_CREATORS.filter((c) => c.likedYou).length;

  return (
    <SafeAreaView style={styles.screen}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <Pressable
          style={styles.filterButton}
          onPress={() => setFilterVisible(true)}
        >
          <Ionicons name="options-outline" size={16} color={COLORS.white} />
          <Text style={styles.filterButtonText}>
            {likesYouMode ? "Likes you" : `${roleFilter}s`}
          </Text>
        </Pressable>

        <View style={styles.topBarRight}>
          <Pressable
            style={styles.likesButton}
            onPress={toggleLikesYou}
            accessibilityLabel="Toggle likes you"
            accessibilityState={{ selected: likesYouMode }}
          >
            <Ionicons
              name={likesYouMode ? "heart" : "heart-outline"}
              size={18}
              color={likesYouMode ? COLORS.red : COLORS.white}
            />
            {likesYouCount > 0 && (
              <View style={styles.likesBadge}>
                <Text style={styles.likesBadgeText}>{likesYouCount}</Text>
              </View>
            )}
          </Pressable>
          <Text style={styles.counter}>
            {feed.length ? `${creatorIndex + 1} / ${feed.length}` : "0 / 0"}
          </Text>
        </View>
      </View>

      {/* Card */}
      {current ? (
        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.card, cardStyle]}>
            {/* Story-style progress bar */}
            <View style={styles.progressRow}>
              {current.clips.map((clip, i) => (
                <View
                  key={clip.id}
                  style={[
                    styles.progressSegment,
                    {
                      backgroundColor:
                        i <= clipIndex ? COLORS.white : COLORS.border,
                    },
                  ]}
                />
              ))}
            </View>

            {/* Clip placeholder */}
            <View
              style={[
                styles.clipArea,
                {
                  backgroundColor: current.clips[clipIndex].isCopyrighted
                    ? COLORS.card
                    : CARD_COLORS[creatorIndex % CARD_COLORS.length],
                },
              ]}
            >
              {current.clips[clipIndex].isCopyrighted ? (
                <View style={styles.clipPlaceholderContent}>
                  <Ionicons name="lock-closed-outline" size={26} color={COLORS.grey} />
                  <Text style={styles.clipPlaceholderText}>
                    Preview unavailable
                  </Text>
                  <Text style={styles.clipPlaceholderSub}>
                    Clip {clipIndex + 1} of {current.clips.length}
                  </Text>
                </View>
              ) : (
                <View style={styles.clipPlaceholderContent}>
                  <Ionicons name="play-circle-outline" size={26} color={COLORS.white} />
                  <Text style={styles.clipPlaceholderText}>
                    Clip {clipIndex + 1} of {current.clips.length}
                  </Text>
                </View>
              )}

              {current.likedYou && (
                <View style={styles.likedYouTag}>
                  <Text style={styles.likedYouTagText}>Likes you</Text>
                </View>
              )}

              {/* Tap zones for clip navigation */}
              <Pressable style={styles.leftZone} onPress={prevClip} />
              <Pressable style={styles.rightZone} onPress={nextClip} />
            </View>

            {/* Footer info + actions */}
            <View style={styles.footer}>
              <View>
                <Text style={styles.creatorName}>{current.name}</Text>
                <Text style={styles.creatorMeta}>
                  {current.role} · {current.location} · ★ {current.rating}
                </Text>
              </View>
              <View style={styles.actionRow}>
                <Pressable
                  style={styles.actionButton}
                  onPress={handlePass}
                  accessibilityLabel="Pass"
                >
                  <Ionicons name="close" size={22} color={COLORS.red} />
                </Pressable>
                <Pressable
                  style={styles.actionButton}
                  onPress={handleLike}
                  accessibilityLabel="Like"
                >
                  <Ionicons name="heart" size={20} color={COLORS.green} />
                </Pressable>
              </View>
            </View>
          </Animated.View>
        </GestureDetector>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="heart-outline" size={32} color={COLORS.grey} />
          <Text style={styles.emptyStateTitle}>
            {likesYouMode ? "No one new yet" : "You're all caught up"}
          </Text>
          <Text style={styles.emptyStateSub}>
            {likesYouMode
              ? "People who like you will show up here."
              : "Check back later for more people to discover."}
          </Text>
        </View>
      )}

      {/* Filter sheet */}
      <Modal
        visible={filterVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFilterVisible(false)}
      >
        <View style={styles.sheetBackdrop}>
          <View style={styles.sheet}>
            <Text style={styles.sheetLabel}>Show me</Text>
            <View style={styles.sheetOptions}>
              {ROLE_OPTIONS.map((role) => (
                <Pressable
                  key={role}
                  style={[
                    styles.sheetOption,
                    roleFilter === role && !likesYouMode && styles.sheetOptionActive,
                  ]}
                  onPress={() => {
                    setRoleFilter(role);
                    setLikesYouMode(false);
                  }}
                >
                  <Text style={styles.sheetOptionText}>{role}s</Text>
                </Pressable>
              ))}
            </View>

            <Text style={[styles.sheetLabel, { marginTop: 20 }]}>Sort by</Text>
            <View style={styles.sheetOptions}>
              {SORT_OPTIONS.map((mode) => (
                <Pressable
                  key={mode}
                  style={[
                    styles.sheetOption,
                    sortMode === mode && styles.sheetOptionActive,
                  ]}
                  onPress={() => setSortMode(mode)}
                >
                  <Text style={styles.sheetOptionText}>{mode}</Text>
                </Pressable>
              ))}
            </View>

            <Pressable
              style={styles.sheetDone}
              onPress={() => setFilterVisible(false)}
            >
              <Text style={styles.sheetDoneText}>Done</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Match overlay */}
      <Modal visible={matchVisible} transparent animationType="fade">
        <View style={styles.matchBackdrop}>
          <View style={styles.matchCard}>
            <Text style={styles.matchTitle}>It's a match</Text>
            <Text style={styles.matchSub}>
              You and {current?.name} both liked each other.
            </Text>
            <Pressable
              style={styles.matchPrimaryButton}
              onPress={() => {
                setMatchVisible(false);
                goNextCreator();
                // navigate to Connect tab here once wired to real navigation
              }}
            >
              <Text style={styles.matchPrimaryButtonText}>
                Message in Connect
              </Text>
            </Pressable>
            <Pressable
              style={styles.matchSecondaryButton}
              onPress={() => {
                setMatchVisible(false);
                goNextCreator();
              }}
            >
              <Text style={styles.matchSecondaryButtonText}>
                Keep browsing
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function getFeed(
  roleFilter: Role,
  sortMode: SortMode,
  likesYouMode: boolean
): CreatorProfile[] {
  let list = likesYouMode
    ? MOCK_CREATORS.filter((c) => c.likedYou)
    : MOCK_CREATORS.filter((c) => c.role === roleFilter);

  if (sortMode === "Highest rated") {
    list = [...list].sort((a, b) => b.rating - a.rating);
  }

  return list;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.black,
    paddingHorizontal: 20,
    paddingTop: 20,
  },

  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },

  filterButtonText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: "600",
  },

  topBarRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  likesButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },

  likesBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: COLORS.red,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },

  likesBadgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: "700",
  },

  counter: {
    color: COLORS.grey,
    fontSize: 13,
  },

  card: {
    flex: 1,
    marginTop: 16,
    marginBottom: 20,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  progressRow: {
    position: "absolute",
    top: 12,
    left: 12,
    right: 12,
    zIndex: 5,
    flexDirection: "row",
    gap: 4,
  },

  progressSegment: {
    flex: 1,
    height: 3,
    borderRadius: 2,
  },

  clipArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  clipPlaceholderContent: {
    alignItems: "center",
    gap: 6,
  },

  clipPlaceholderText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "600",
  },

  clipPlaceholderSub: {
    color: COLORS.grey,
    fontSize: 12,
  },

  likedYouTag: {
    position: "absolute",
    top: 30,
    left: 12,
    backgroundColor: "#1F2B24",
    borderRadius: 8,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },

  likedYouTagText: {
    color: COLORS.green,
    fontSize: 11,
    fontWeight: "600",
  },

  leftZone: {
    position: "absolute",
    top: 0,
    bottom: 90,
    left: 0,
    width: "33%",
  },

  rightZone: {
    position: "absolute",
    top: 0,
    bottom: 90,
    right: 0,
    width: "67%",
  },

  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },

  creatorName: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "700",
  },

  creatorMeta: {
    color: COLORS.grey,
    fontSize: 12,
    marginTop: 2,
  },

  actionRow: {
    flexDirection: "row",
    gap: 10,
  },

  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  emptyStateTitle: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "700",
  },

  emptyStateSub: {
    color: COLORS.grey,
    fontSize: 13,
    textAlign: "center",
    paddingHorizontal: 30,
  },

  sheetBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },

  sheet: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    borderTopWidth: 1,
    borderColor: COLORS.border,
  },

  sheetLabel: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 10,
  },

  sheetOptions: {
    gap: 8,
  },

  sheetOption: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },

  sheetOptionActive: {
    borderColor: COLORS.green,
    backgroundColor: "#1F2B24",
  },

  sheetOptionText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "600",
  },

  sheetDone: {
    marginTop: 20,
    backgroundColor: COLORS.green,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },

  sheetDoneText: {
    color: COLORS.black,
    fontSize: 15,
    fontWeight: "700",
  },

  matchBackdrop: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
  },

  matchCard: {
    width: 280,
    backgroundColor: COLORS.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 24,
    alignItems: "center",
  },

  matchTitle: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: "800",
  },

  matchSub: {
    color: COLORS.grey,
    fontSize: 13,
    textAlign: "center",
    marginTop: 6,
    marginBottom: 20,
  },

  matchPrimaryButton: {
    width: "100%",
    backgroundColor: COLORS.green,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
    marginBottom: 8,
  },

  matchPrimaryButtonText: {
    color: COLORS.black,
    fontSize: 14,
    fontWeight: "700",
  },

  matchSecondaryButton: {
    width: "100%",
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  matchSecondaryButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "600",
  },
});
