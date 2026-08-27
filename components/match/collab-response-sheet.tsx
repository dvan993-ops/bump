/**
 * Instant Collab Preview.
 *
 * Someone posted an Open Collab; this is where you answer it. Pick one of your
 * own tracks (or record a part), see the two stacked as one preview, and send
 * it. The response becomes its own short-form Bump post that links back to the
 * original — which is the loop: post, get discovered, get answered, both of you
 * get discovered again.
 */

import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { AudioVisualizer } from '@/components/audio-visualizer';
import { BumpColors } from '@/constants/bump-theme';
import {
  YOUR_TRACKS,
  type Artist,
  type MatchPost,
} from '@/constants/match-data';

/**
 * Deterministic bars for the stacked preview. The real thing would read the
 * rendered mix; this keeps the layout honest without inventing audio.
 */
function previewBars(seed: string, count = 26, ceiling = 34): number[] {
  let hash = 0;

  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) % 100000;
  }

  return Array.from({ length: count }, (_, index) => {
    hash = (hash * 1103515245 + 12345) % 2147483648;

    const wave = 0.55 + 0.45 * Math.sin((index / count) * Math.PI * 3);
    const noise = (hash % 1000) / 1000;

    return 6 + wave * noise * ceiling;
  });
}

export type CollabResponseSheetProps = {
  visible: boolean;
  artist: Artist | null;
  post: MatchPost | null;
  onClose: () => void;
  onSend: (options: {
    artist: Artist;
    post: MatchPost;
    responseTrackId: string | null;
    note: string;
  }) => void;
};

export function CollabResponseSheet({
  visible,
  artist,
  post,
  onClose,
  onSend,
}: CollabResponseSheetProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (visible) {
      setSelectedId(null);
      setNote('');
    }
  }, [visible]);

  if (!artist || !post) {
    return null;
  }

  const selected = YOUR_TRACKS.find((track) => track.id === selectedId) ?? null;
  const canSend = selected !== null;

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
            <View style={styles.headerText}>
              <Text style={styles.title}>Add your part</Text>
              <Text style={styles.subtitle} numberOfLines={2}>
                @{artist.handle} · {post.openCollabAsk}
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
            {/* The stack: their track on top, yours underneath. */}
            <View style={styles.stack}>
              <StackLayer
                label={`@${artist.handle} — ${post.title}`}
                sublabel={`${post.bpm} BPM · ${post.musicalKey}`}
                color={BumpColors.green}
                seed={post.id}
              />

              <View style={styles.stackJoin}>
                <View style={styles.stackLine} />
                <Ionicons name="add" size={15} color={BumpColors.muted} />
                <View style={styles.stackLine} />
              </View>

              {selected ? (
                <StackLayer
                  label={`You — ${selected.title}`}
                  sublabel={`${selected.bpm} BPM · ${selected.musicalKey}`}
                  color={BumpColors.mint}
                  seed={selected.id}
                  warn={
                    selected.bpm !== post.bpm
                      ? `${Math.abs(selected.bpm - post.bpm)} BPM apart`
                      : undefined
                  }
                />
              ) : (
                <View style={styles.emptyLayer}>
                  <Ionicons
                    name="add-circle-outline"
                    size={22}
                    color={BumpColors.muted}
                  />
                  <Text style={styles.emptyLayerText}>
                    Pick a track to lay over it
                  </Text>
                </View>
              )}
            </View>

            <Text style={styles.label}>Your tracks</Text>

            <View style={styles.trackList}>
              {YOUR_TRACKS.map((track) => {
                const active = track.id === selectedId;

                return (
                  <Pressable
                    key={track.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    onPress={() => setSelectedId(active ? null : track.id)}
                    style={[styles.track, active && styles.trackActive]}
                  >
                    <Ionicons
                      name={active ? 'checkmark-circle' : 'ellipse-outline'}
                      size={20}
                      color={active ? BumpColors.mint : BumpColors.muted}
                    />

                    <View style={styles.trackText}>
                      <Text style={styles.trackTitle} numberOfLines={1}>
                        {track.title}
                      </Text>
                      <Text style={styles.trackMeta} numberOfLines={1}>
                        {track.genre} · {track.bpm} BPM · {track.musicalKey} ·{' '}
                        {track.durationLabel}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}

              <Pressable
                accessibilityRole="button"
                onPress={() => setSelectedId(null)}
                style={styles.recordRow}
              >
                <Ionicons name="mic" size={19} color={BumpColors.mint} />
                <Text style={styles.recordText}>Record something new</Text>
                <Text style={styles.recordSoon}>Soon</Text>
              </Pressable>
            </View>

            <Text style={styles.label}>Note</Text>

            <TextInput
              value={note}
              onChangeText={setNote}
              multiline
              maxLength={200}
              placeholder="What did you hear on it?"
              placeholderTextColor={BumpColors.muted}
              style={styles.noteInput}
            />
          </ScrollView>

          <Pressable
            accessibilityRole="button"
            disabled={!canSend}
            onPress={() =>
              onSend({
                artist,
                post,
                responseTrackId: selectedId,
                note: note.trim(),
              })
            }
            style={({ pressed }) => [
              styles.send,
              !canSend && styles.sendDisabled,
              pressed && canSend && styles.sendPressed,
            ]}
          >
            <Text style={[styles.sendText, !canSend && styles.sendTextDisabled]}>
              {canSend ? 'Send response' : 'Pick a track first'}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function StackLayer({
  label,
  sublabel,
  color,
  seed,
  warn,
}: {
  label: string;
  sublabel: string;
  color: string;
  seed: string;
  warn?: string;
}) {
  return (
    <View style={[styles.layer, { borderColor: color }]}>
      <View style={styles.layerText}>
        <Text style={styles.layerLabel} numberOfLines={1}>
          {label}
        </Text>
        <Text style={styles.layerSub} numberOfLines={1}>
          {sublabel}
        </Text>
      </View>

      <AudioVisualizer
        bars={previewBars(seed)}
        width={132}
        height={40}
        color={color}
        gap={2}
        minHeight={4}
        maxHeight={36}
        glowBlur={4}
      />

      {warn && (
        <View style={styles.warn}>
          <Ionicons name="alert-circle" size={11} color={BumpColors.black} />
          <Text style={styles.warnText}>{warn}</Text>
        </View>
      )}
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
    marginBottom: 14,
    backgroundColor: BumpColors.muted,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },

  headerText: {
    flex: 1,
  },

  title: {
    color: BumpColors.white,
    fontSize: 23,
    fontWeight: '900',
  },

  subtitle: {
    color: BumpColors.grey,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
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
    paddingBottom: 12,
  },

  stack: {
    gap: 0,
  },

  layer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: BumpColors.surface,
  },

  layerText: {
    flex: 1,
  },

  layerLabel: {
    color: BumpColors.white,
    fontSize: 13,
    fontWeight: '800',
  },

  layerSub: {
    color: BumpColors.grey,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },

  stackJoin: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },

  stackLine: {
    flex: 1,
    height: 1,
    backgroundColor: BumpColors.border,
  },

  emptyLayer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 78,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: BumpColors.border,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },

  emptyLayerText: {
    color: BumpColors.muted,
    fontSize: 13,
    fontWeight: '700',
  },

  warn: {
    position: 'absolute',
    top: -8,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: '#FFB03A',
  },

  warnText: {
    color: BumpColors.black,
    fontSize: 10,
    fontWeight: '800',
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

  trackList: {
    gap: 8,
  },

  track: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    padding: 12,
    borderRadius: 15,
    backgroundColor: BumpColors.surface,
    borderWidth: 1,
    borderColor: BumpColors.border,
  },

  trackActive: {
    borderColor: BumpColors.mintEdge,
    backgroundColor: BumpColors.mintWash,
  },

  trackText: {
    flex: 1,
  },

  trackTitle: {
    color: BumpColors.white,
    fontSize: 14,
    fontWeight: '800',
  },

  trackMeta: {
    color: BumpColors.grey,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },

  recordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    padding: 12,
    borderRadius: 15,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: BumpColors.border,
  },

  recordText: {
    flex: 1,
    color: BumpColors.white,
    fontSize: 14,
    fontWeight: '700',
  },

  recordSoon: {
    color: BumpColors.muted,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },

  noteInput: {
    minHeight: 74,
    borderRadius: 15,
    padding: 13,
    color: BumpColors.white,
    fontSize: 14,
    textAlignVertical: 'top',
    backgroundColor: BumpColors.surface,
    borderWidth: 1,
    borderColor: BumpColors.border,
  },

  send: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 26,
    marginTop: 16,
    backgroundColor: BumpColors.mint,
  },

  sendPressed: {
    backgroundColor: BumpColors.mintPressed,
    transform: [{ scale: 0.985 }],
  },

  sendDisabled: {
    backgroundColor: BumpColors.raised,
  },

  sendText: {
    color: BumpColors.black,
    fontSize: 15,
    fontWeight: '900',
  },

  sendTextDisabled: {
    color: BumpColors.muted,
  },
});
