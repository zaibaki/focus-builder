/**
 * Root Layout — App shell with database init, safe area, and dark status bar
 */
import { useEffect } from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { Colors } from '../constants/colors';
import { getDatabase } from '../services/database';
import { useAudioPlayback } from '../hooks/useAudioPlayback';
import { BlockerOverlay } from '../components/blocker/BlockerOverlay';

export default function RootLayout() {
  useAudioPlayback();

  useEffect(() => {
    getDatabase();
  }, []);

  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: styles.content,
            animation: 'fade',
          }}
        />
        <BlockerOverlay />
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    backgroundColor: Colors.background,
  },
});
