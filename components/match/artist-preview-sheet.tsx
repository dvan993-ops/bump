/**
 * A quick look at everything an artist has posted, without leaving the feed.
 *
 * Tapping a track does not open a second player — it hands the choice back to
 * the card behind the sheet, which is already playing. One player, one sound.
 */

import Ionicons from '@expo/vector-icons/Ionicons';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { BumpIcon } from '@/components/bump-icon';
import { ArtistAvatar } from '@/components/match/artist-avatar';
import { BumpColors, formatCount } from '@/constants/bump-theme';
import type { Artist } from '@/constants/match-data';

export type ArtistPreviewSheetProps = {
  visible: boolean;
  artist: Artist | null;
  following: boolean;
  bumped: boolean;
  /** Id of the post the card behind is currently previewing. */
  currentPostId?: string;
  onClose: () => void;
  onToggleFollow: (artistId: string) => void;
  onSelectPost: (postId: string) => void;
  onBump: (artist: Artist) => void;
};

export function ArtistPreviewSheet({
  visible,
  artist,
  following,
  bumped,
  currentPostId,
  onClose,
  onToggleFollow,
  onSelectPost,
  onBump,
}: ArtistPreviewSheetProps) {
  if (!artist) {
    return null;
  }

  const roles = [artist.role, ...artist.alsoDoes].join(' · ');

  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <ArtistAvatar
              handle={artist.handle}
              name={artist.name}
              size={58}
              ring={artist.bumpedYou ? BumpColors.mint : BumpColors.white}
            />

            <View style={styles.headerText}>
              <Text style={styles.handleText}>@{artist.handle}</Text>
              <Text style={styles.roles}>{roles}</Text>

              <View style={styles.badgeRow}>
                <View style={styles.rankBadge}>
                  <Ionicons name="trophy" size={10} color={BumpColors.mint} />
                  <Text style={styles.rankText}>{artist.rank}</Text>
                </View>

                <Text style={styles.followers}>
                  {formatCount(artist.followers)} followers
                </Text>
              </View>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close"
              onPress={onClose}
              style={styles.close}
            >
              <Ionicons name="close" size={22} color={BumpColors.white} />
            </Pressable>
          </View>

          <Text style={styles.bio}>{artist.bio}</Text>

          <View style={styles.factRow}>
            <Fact icon="location-outline" text={artist.location} />
            <Fact icon="search" text={artist.lookingFor} tint={BumpColors.mint} />
          </View>

          <View style={styles.genreRow}>
            {artist.genres.map((genre) => (
              <View key={genre} style={styles.genrePill}>
                <Text style={styles.genrePillText}>{genre}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.sectionLabel}>
            {artist.posts.length} {artist.posts.length === 1 ? 'post' : 'posts'}
          </Text>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.list}
          >
            {artist.posts.map((post) => {
              const playing = post.id === currentPostId;

              return (
                <Pressable
                  key={post.id}
                  accessibilityRole="button"
                  onPress={() => {
                    onSelectPost(post.id);
                    onClose();
                  }}
                  style={({ pressed }) => [
                    styles.postRow,
                    playing && styles.postRowPlaying,
                    pressed && styles.postRowPressed,
                  ]}
                >
                  <View style={styles.postIcon}>
                    <Ionicons
                      name={playing ? 'volume-high' : 'play'}
                      size={16}
                      color={playing ? BumpColors.black : BumpColors.mint}
                    />
                  </View>

                  <View style={styles.postText}>
                    <Text style={styles.postTitle} numberOfLines={1}>
                      {post.title}
                    </Text>
                    <Text style={styles.postMeta} numberOfLines={1}>
                      {post.genre} · {post.bpm} BPM · {post.durationLabel} ·{' '}
                      {formatCount(post.plays)} plays
                    </Text>

                    {post.openCollabAsk && (
                      <View style={styles.askPill}>
                        <Ionicons
                          name="git-merge"
                          size={10}
                          color={BumpColors.black}
                        />
                        <Text style={styles.askPillText} numberOfLines={1}>
                          {post.openCollabAsk}
                        </Text>
                      </View>
                    )}

                    {post.respondsTo && (
                      <Text style={styles.responseLine} numberOfLines={1}>
                        ↳ on @{post.respondsTo.artistHandle} —{' '}
                        {post.respondsTo.title}
                      </Text>
                    )}
                  </View>

                  <View style={styles.postBumps}>
                    <BumpIcon
                      size={26}
                      color={BumpColors.grey}
                      bumped
                      animated={false}
                    />
                    <Text style={styles.postBumpsText}>
                      {formatCount(post.bumps)}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={styles.footer}>
            <Pressable
              accessibilityRole="button"
              onPress={() => onToggleFollow(artist.id)}
              style={[styles.follow, following && styles.followActive]}
            >
              <Text
                style={[
                  styles.followText,
                  following && styles.followTextActive,
                ]}
              >
                {following ? 'Following' : 'Follow'}
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              disabled={bumped}
              onPress={() => {
                onBump(artist);
                onClose();
              }}
              style={({ pressed }) => [
                styles.bump,
                bumped && styles.bumpDone,
                pressed && styles.bumpPressed,
              ]}
            >
              <BumpIcon
                size={34}
                color={bumped ? BumpColors.mint : BumpColors.black}
                bumped={bumped}
              />
              <Text style={[styles.bumpText, bumped && styles.bumpTextDone]}>
                {bumped ? 'Bumped' : 'Bump'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function Fact({
  icon,
  text,
  tint = BumpColors.grey,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
  tint?: string;
}) {
  return (
    <View style={styles.fact}>
      <Ionicons name={icon} size={13} color={tint} />
      <Text style={[styles.factText, { color: tint }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },

  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },

  sheet: {
    maxHeight: '88%',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 22,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    backgroundColor: BumpColors.charcoal,
  },

  handle: {
    alignSelf: 'center',
    width: 42,
    height: 5,
    borderRadius: 3,
    marginBottom: 16,
    backgroundColor: BumpColors.muted,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  headerText: {
    flex: 1,
  },

  handleText: {
    color: BumpColors.white,
    fontSize: 19,
    fontWeight: '900',
  },

  roles: {
    color: BumpColors.grey,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },

  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },

  rankBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: BumpColors.mintWash,
  },

  rankText: {
    color: BumpColors.mint,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },

  followers: {
    color: BumpColors.muted,
    fontSize: 11,
    fontWeight: '700',
  },

  close: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BumpColors.raised,
  },

  bio: {
    color: BumpColors.white,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 14,
  },

  factRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginTop: 10,
  },

  fact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  factText: {
    fontSize: 12,
    fontWeight: '700',
  },

  genreRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginTop: 12,
  },

  genrePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: BumpColors.greenWash,
    borderWidth: 1,
    borderColor: BumpColors.greenEdge,
  },

  genrePillText: {
    color: BumpColors.green,
    fontSize: 11,
    fontWeight: '800',
  },

  sectionLabel: {
    color: BumpColors.grey,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 22,
    marginBottom: 10,
  },

  list: {
    gap: 8,
    paddingBottom: 6,
  },

  postRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    padding: 11,
    borderRadius: 15,
    backgroundColor: BumpColors.surface,
    borderWidth: 1,
    borderColor: BumpColors.border,
  },

  postRowPlaying: {
    borderColor: BumpColors.mintEdge,
  },

  postRowPressed: {
    backgroundColor: BumpColors.raised,
  },

  postIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BumpColors.mintWash,
  },

  postText: {
    flex: 1,
    gap: 3,
  },

  postTitle: {
    color: BumpColors.white,
    fontSize: 14,
    fontWeight: '800',
  },

  postMeta: {
    color: BumpColors.grey,
    fontSize: 11,
    fontWeight: '600',
  },

  askPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    maxWidth: '100%',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 2,
    backgroundColor: BumpColors.mint,
  },

  askPillText: {
    flexShrink: 1,
    color: BumpColors.black,
    fontSize: 10,
    fontWeight: '800',
  },

  responseLine: {
    color: BumpColors.muted,
    fontSize: 11,
    fontWeight: '600',
  },

  postBumps: {
    alignItems: 'center',
    gap: 2,
  },

  postBumpsText: {
    color: BumpColors.grey,
    fontSize: 10,
    fontWeight: '700',
  },

  footer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },

  follow: {
    height: 50,
    paddingHorizontal: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 25,
    borderWidth: 1,
    borderColor: BumpColors.border,
    backgroundColor: BumpColors.surface,
  },

  followActive: {
    borderColor: BumpColors.hairline,
  },

  followText: {
    color: BumpColors.white,
    fontSize: 14,
    fontWeight: '800',
  },

  followTextActive: {
    color: BumpColors.grey,
  },

  bump: {
    flex: 1,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 25,
    backgroundColor: BumpColors.mint,
  },

  bumpPressed: {
    backgroundColor: BumpColors.mintPressed,
    transform: [{ scale: 0.985 }],
  },

  bumpDone: {
    backgroundColor: BumpColors.raised,
  },

  bumpText: {
    color: BumpColors.black,
    fontSize: 15,
    fontWeight: '900',
  },

  bumpTextDone: {
    color: BumpColors.mint,
  },
});
