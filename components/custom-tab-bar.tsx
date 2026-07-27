import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

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
  activeIcon: IoniconName;
  inactiveIcon: IoniconName;
  size: number;
};

const TABS: TabConfig[] = [
  { key: 'index', label: 'Home', activeIcon: 'home', inactiveIcon: 'home-outline', size: 25 },
  { key: 'match', label: 'Match', activeIcon: 'flame', inactiveIcon: 'flame-outline', size: 26 },
  { key: 'create', label: 'Create', activeIcon: 'add-circle', inactiveIcon: 'add-circle-outline', size: 34 },
  { key: 'connect', label: 'Connect', activeIcon: 'chatbubbles', inactiveIcon: 'chatbubbles-outline', size: 25 },
  { key: 'profile', label: 'Profile', activeIcon: 'person', inactiveIcon: 'person-outline', size: 25 },
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
        return (
          <Pressable
            key={tab.key}
            style={styles.tabButton}
            onPress={() => onTabPress(index)}
            hitSlop={8}
          >
            <Ionicons
              name={focused ? tab.activeIcon : tab.inactiveIcon}
              size={tab.size}
              color={focused ? COLORS.green : COLORS.grey}
            />
            <Text
              style={[
                styles.label,
                { color: focused ? COLORS.green : COLORS.grey },
              ]}
            >
              {tab.label}
            </Text>
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
