import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BumpIcon } from '@/components/bump-icon';

const COLORS = {
  black: '#121212',
  green: '#6fffb7',
  grey: '#A7A7A7',
  border: '#282828',
};

type IoniconName = keyof typeof Ionicons.glyphMap;

type TabConfig = {
  key: string;
  label: string;
  size: number;
} & (
  | { icon: 'ionicon'; activeIcon: IoniconName; inactiveIcon: IoniconName }
  /** The dap mark, so Match carries the same symbol as the Bump action. */
  | { icon: 'bump' }
);

const TABS: TabConfig[] = [
  {
    key: 'index',
    label: 'Home',
    icon: 'ionicon',
    activeIcon: 'home',
    inactiveIcon: 'home-outline',
    size: 25,
  },
  // The dap mark is a wide 3:2 lockup, so it needs more width than a glyph.
  { key: 'match', label: 'Match', icon: 'bump', size: 44 },
  {
    key: 'create',
    label: 'Create',
    icon: 'ionicon',
    activeIcon: 'add-circle',
    inactiveIcon: 'add-circle-outline',
    size: 34,
  },
  {
    key: 'connect',
    label: 'Connect',
    icon: 'ionicon',
    activeIcon: 'chatbubbles',
    inactiveIcon: 'chatbubbles-outline',
    size: 25,
  },
  {
    key: 'profile',
    label: 'Profile',
    icon: 'ionicon',
    activeIcon: 'person',
    inactiveIcon: 'person-outline',
    size: 25,
  },
];

type Props = {
  activeIndex: number;
  onTabPress: (index: number) => void;
};

export function CustomTabBar({ activeIndex, onTabPress }: Props) {
  return (
    <View style={styles.container}>
      {TABS.map((tab, index) => {
        const focused = index === activeIndex;
        const tint = focused ? COLORS.green : COLORS.grey;

        return (
          <Pressable
            key={tab.key}
            style={styles.tabButton}
            onPress={() => onTabPress(index)}
            hitSlop={8}
          >
            {tab.icon === 'bump' ? (
              <BumpIcon
                size={tab.size}
                color={tint}
                bumped={focused}
                glow={focused}
              />
            ) : (
              <Ionicons
                name={focused ? tab.activeIcon : tab.inactiveIcon}
                size={tab.size}
                color={tint}
              />
            )}

            <Text style={[styles.label, { color: tint }]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: COLORS.black,
    borderTopColor: COLORS.border,
    borderTopWidth: 1,
    height: 70,
    paddingTop: 7,
    paddingBottom: 8,
  },

  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  label: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
});
