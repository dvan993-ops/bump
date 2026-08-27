/**
 * Open Collab details.
 *
 * Everything you need in order to decide whether to take the collab, and then
 * the file itself. The work happens in your DAW, not in the app — so this sheet
 * shows the ask and the track's specs, and hands you the audio.
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

import { AudioVisualizer } from '@/components/audio-visualizer';
import { ArtistAvatar } from '@/components/match/artist-avatar';
import { BumpColors, formatCount } from '@/constants/bump-theme';
import type { Artist, MatchPost } from '@/constants/match-data';

export type DownloadFormat = 'wav' | 'mp3';

/**
 * Deterministic bars for the still preview. The real thing would read the
 * rendered waveform; this keeps the layout honest without inventing audio.
 */
function previewBars(seed: string, count = 34, ceiling = 44): number[] {
  let hash = 0;

  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) % 100000;
  }

  return Array.from({ length: count }, (_, index) => {
    hash = (hash * 1103515245 + 12345) % 2147483648;

    const envelope = 0.55 + 0.45 * Math.sin((index / count) * Math.PI * 3);
    const noise = (hash % 1000) / 1000;

    return 5 + envelope * noise * ceiling;
  });
}

function durationSeconds(label: string): number {
  const [minutes, seconds] = label.split(':').map(Number);

  if (!Number.isFinite(minutes) || !Number.isFinite(seconds)) {
    return 0;
  }

  return minutes * 60 + seconds;
}

/**
 * Rough download size from the duration.
 * WAV at 44.1 kHz / 16-bit / stereo is 176.4 KB per second; MP3 at 320 kbps
 * is 40 KB per second.
 */
function sizeLabel(label: string, format: DownloadFormat): string {
  const seconds = durationSeconds(label);

  if (seconds === 0) {
    return '—';
  }

  const megabytes = (seconds * (format === 'wav' ? 176.4 : 40)) / 1024;

  return `${megabytes < 10 ? megabytes.toFixed(1) : Math.round(megabytes)} MB`;
}

function postedLabel(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);

  if (days <= 0) {
    return 'Today';
  }

  if (days === 1) {
    return 'Yesterday';
  }

  if (days < 7) {
    return `${days} days ago`;
  }

  const weeks = Math.floor(days / 7);

  return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
}

export type CollabResponseSheetProps = {
  visible: boolean;
  artist: Artist | null;
  post: MatchPost | null;
  onClose: () => void;
  onDownload: (options: {
    artist: Artist;
    post: MatchPost;
    format: DownloadFormat;
  }) => void;
};

export function CollabResponseSheet({
  visible,
  artist,
  post,
  onClose,
  onDownload,
}: CollabResponseSheetProps) {
  if (!artist || !post) {
    return null;
  }

  const specs = [
    { label: 'Genre', value: post.genre },
    { label: 'Tempo', value: `${post.bpm} BPM` },
    { label: 'Key', value: post.musicalKey },
    { label: 'Length', value: post.durationLabel },
    { label: 'Plays', value: formatCount(post.plays) },
    { label: 'Posted', value: postedLabel(post.createdAt) },
  ];

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
              size={44}
              ring={BumpColors.mint}
            />

            <View style={styles.headerText}>
              <Text style={styles.title} numberOfLines={1}>
                {post.title}
              </Text>
              <Text style={styles.byline} numberOfLines={1}>
                @{artist.handle} · {artist.role}
              </Text>
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

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scroll}
          >
            <View style={styles.askCard}>
              <View style={styles.askHeader}>
                <Ionicons
                  name="git-merge"
                  size={13}
                  color={BumpColors.black}
                />
                <Text style={styles.askHeaderText}>Open collab</Text>
              </View>

              <Text style={styles.askText}>{post.openCollabAsk}</Text>

              {post.wantedRoles && post.wantedRoles.length > 0 && (
                <View style={styles.wantedRow}>
                  {post.wantedRoles.map((role) => (
                    <View key={role} style={styles.wantedChip}>
                      <Text style={styles.wantedChipText}>{role}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.waveCard}>
              <AudioVisualizer
                bars={previewBars(post.id)}
                width={286}
                height={52}
                color={BumpColors.mint}
                gap={2}
                minHeight={4}
                maxHeight={48}
                glowBlur={5}
              />
            </View>

            <View style={styles.specs}>
              {specs.map((spec) => (
                <View key={spec.label} style={styles.spec}>
                  <Text style={styles.specLabel}>{spec.label}</Text>
                  <Text style={styles.specValue} numberOfLines={1}>
                    {spec.value}
                  </Text>
                </View>
              ))}
            </View>

            <Text style={styles.label}>Download</Text>

            <View style={styles.downloads}>
              <DownloadButton
                format="wav"
                caption={`Lossless · ${sizeLabel(post.durationLabel, 'wav')}`}
                onPress={() => onDownload({ artist, post, format: 'wav' })}
              />

              <DownloadButton
                format="mp3"
                caption={`320 kbps · ${sizeLabel(post.durationLabel, 'mp3')}`}
                onPress={() => onDownload({ artist, post, format: 'mp3' })}
              />
            </View>

            <Text style={styles.footnote}>
              Take it into your DAW, then post what you make back to Bump — it
              links to @{artist.handle}&apos;s original.
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function DownloadButton({
  format,
  caption,
  onPress,
}: {
  format: DownloadFormat;
  caption: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Download ${format.toUpperCase()}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.download,
        pressed && styles.downloadPressed,
      ]}
    >
      <Ionicons
        name="download-outline"
        size={20}
        color={BumpColors.mint}
        style={styles.downloadIcon}
      />
      <Text style={styles.downloadFormat}>{format.toUpperCase()}</Text>
      <Text style={styles.downloadCaption}>{caption}</Text>
    </Pressable>
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
    marginBottom: 14,
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

  title: {
    color: BumpColors.white,
    fontSize: 21,
    fontWeight: '900',
  },

  byline: {
    color: BumpColors.grey,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },

  close: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BumpColors.raised,
  },

  scroll: {
    paddingTop: 18,
    paddingBottom: 8,
  },

  askCard: {
    padding: 14,
    borderRadius: 16,
    backgroundColor: BumpColors.mintWash,
    borderWidth: 1,
    borderColor: BumpColors.mintEdge,
  },

  askHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: BumpColors.mint,
  },

  askHeaderText: {
    color: BumpColors.black,
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },

  askText: {
    color: BumpColors.white,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '600',
    marginTop: 10,
  },

  wantedRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
  },

  wantedChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },

  wantedChipText: {
    color: BumpColors.mint,
    fontSize: 11,
    fontWeight: '800',
  },

  waveCard: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 78,
    marginTop: 14,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: BumpColors.black,
    borderWidth: 1,
    borderColor: BumpColors.border,
  },

  specs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 14,
    borderRadius: 16,
    backgroundColor: BumpColors.surface,
    borderWidth: 1,
    borderColor: BumpColors.border,
    paddingVertical: 6,
  },

  spec: {
    width: '33.33%',
    paddingHorizontal: 12,
    paddingVertical: 9,
  },

  specLabel: {
    color: BumpColors.muted,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },

  specValue: {
    color: BumpColors.white,
    fontSize: 14,
    fontWeight: '800',
    marginTop: 3,
  },

  label: {
    color: BumpColors.grey,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 24,
    marginBottom: 10,
  },

  downloads: {
    flexDirection: 'row',
    gap: 10,
  },

  download: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: BumpColors.surface,
    borderWidth: 1,
    borderColor: BumpColors.mintEdge,
  },

  downloadPressed: {
    backgroundColor: BumpColors.raised,
    transform: [{ scale: 0.985 }],
  },

  downloadIcon: {
    marginBottom: 4,
  },

  downloadFormat: {
    color: BumpColors.white,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  downloadCaption: {
    color: BumpColors.grey,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },

  footnote: {
    color: BumpColors.muted,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 16,
  },
});
