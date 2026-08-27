import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

/**
 * `GestureHandlerRootView` has to sit at the very top of the tree for any
 * react-native-gesture-handler gesture to receive touches. The Match cards use
 * one, because only a native gesture can out-argue the feed's scroll view over
 * a diagonal swipe.
 */
export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#121212' }}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </GestureHandlerRootView>
  );
}
