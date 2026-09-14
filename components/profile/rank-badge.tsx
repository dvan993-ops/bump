import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { BumpColors, BumpRadii } from '@/constants/bump-theme';

/** Progression tiers, lowest to highest. */
export const RANKS = [
  'Underground',
  'Local Celeb',
  'Rising Star',
  'Underground Legend',
  'Elite',
  'One-Of-A-Kind',
  'CEO',
  'Award Winner',
  'Platinum Producer',
  'Industry Name',
  'Household Name',
] as const;

export function RankBadge({ label }: { label: string }) {
  return (
    <View style={styles.badge}>
      <Ionicons name="trophy" size={11} color={BumpColors.mint} />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    borderRadius: BumpRadii.pill,
    borderWidth: 1,
    borderColor: BumpColors.mintEdge,
    backgroundColor: BumpColors.mintWash,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },

  label: {
    color: BumpColors.mint,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
});
