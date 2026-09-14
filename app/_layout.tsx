import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AlertHost } from '@/components/alert-host';
import { MAX_APP_WIDTH } from '@/constants/layout';

const IS_WEB = Platform.OS === 'web';

/**
 * `GestureHandlerRootView` has to sit at the very top of the tree for any
 * react-native-gesture-handler gesture to receive touches. The Match cards use
 * one, because only a native gesture can out-argue the feed's scroll view over
 * a diagonal swipe.
 */
export default function RootLayout() {
  const routes = (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
    </Stack>
  );

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#121212' }}>
      <StatusBar style="light" />
      <AlertHost />
      {IS_WEB ? (
        // On wide viewports the app is a phone-shaped column, not a page
        // that stretches to fill the browser — the UI was designed for
        // phone widths and never told to stop growing past them.
        <View style={styles.backdrop}>
          <View style={styles.phoneColumn}>{routes}</View>
        </View>
      ) : (
        routes
      )}
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  phoneColumn: {
    flex: 1,
    width: '100%',
    maxWidth: MAX_APP_WIDTH,
    backgroundColor: '#121212',
    ...(Platform.OS === 'web' ? { boxShadow: '0 0 60px rgba(0, 0, 0, 0.6)' } : null),
  },
});
