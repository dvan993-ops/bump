import { useCallback, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import PagerView from 'react-native-pager-view';

import { CustomTabBar } from '@/components/custom-tab-bar';

import ConnectScreen from './connect';
import CreateScreen from './create';
import HomeScreen from './index';
import MatchScreen from './match';
import ProfileScreen from './profile';

const COLORS = {
  black: '#121212',
};

export default function TabLayout() {
  const pagerRef = useRef<PagerView>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleTabPress = useCallback((index: number) => {
    pagerRef.current?.setPage(index);
  }, []);

  return (
    <>
      <PagerView
        ref={pagerRef}
        style={styles.pager}
        initialPage={0}
        onPageSelected={(event) => {
          setActiveIndex(event.nativeEvent.position);
        }}
      >
        <HomeScreen key="index" />
        <MatchScreen key="match" />
        <CreateScreen key="create" />
        <ConnectScreen key="connect" />
        <ProfileScreen key="profile" />
      </PagerView>

      <CustomTabBar activeIndex={activeIndex} onTabPress={handleTabPress} />
    </>
  );
}

const styles = StyleSheet.create({
  pager: {
    flex: 1,
    backgroundColor: COLORS.black,
  },
});
