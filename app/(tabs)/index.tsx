import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.logo}>Bump</Text>

        <View style={styles.feedTabs}>
          <View style={styles.selectedTab}>
            <Text style={styles.selectedTabText}>For You</Text>
          </View>

          <Text style={styles.tabText}>Following</Text>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Discover your next sound.</Text>
        <Text style={styles.subtitle}>
          Beat previews will appear here.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#121212',
  },

  header: {
    paddingHorizontal: 20,
    paddingTop: 15,
  },

  logo: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '800',
  },

  feedTabs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 28,
    marginTop: 24,
  },

  selectedTab: {
    borderBottomColor: '#1DB954',
    borderBottomWidth: 3,
    paddingBottom: 8,
  },

  selectedTabText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  tabText: {
    color: '#A7A7A7',
    fontSize: 16,
    fontWeight: '600',
    paddingBottom: 11,
  },

  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },

  title: {
    color: '#FFFFFF',
    fontSize: 25,
    fontWeight: '800',
    textAlign: 'center',
  },

  subtitle: {
    color: '#A7A7A7',
    fontSize: 15,
    marginTop: 10,
    textAlign: 'center',
  },
});