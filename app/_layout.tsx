import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';

const COLORS = {
  black: '#121212',
  green: '#1DB954',
  grey: '#A7A7A7',
  border: '#282828',
  white: '#FFFFFF',
};

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.green,
        tabBarInactiveTintColor: COLORS.grey,

        tabBarStyle: {
          backgroundColor: COLORS.black,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          height: 70,
          paddingTop: 7,
          paddingBottom: 8,
        },

        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'home' : 'home-outline'}
              size={25}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="match"
        options={{
          title: 'Match',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'flame' : 'flame-outline'}
              size={26}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="create"
        options={{
          title: 'Create',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'add-circle' : 'add-circle-outline'}
              size={34}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="connect"
        options={{
          title: 'Connect',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'chatbubbles' : 'chatbubbles-outline'}
              size={25}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
              size={25}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}