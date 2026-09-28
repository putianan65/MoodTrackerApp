// Registers the notification handler before anything else can receive one.
import './services/notifications';

import { NavigationContainer, createNavigationContainerRef, DefaultTheme } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import * as SplashScreen from 'expo-splash-screen';
import React, { useCallback, useEffect } from 'react';
import { Platform, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { todayKey } from './domain/dates';
import { RootNavigator } from './navigation/RootNavigator';
import type { RootStackParamList } from './navigation/types';
import { REMINDER_TYPE, requestPermission, resyncDailyReminder } from './services/notifications';
import { EntriesProvider } from './store/EntriesProvider';
import { colors } from './theme';
import { useAppFonts } from './theme/fonts';

SplashScreen.preventAutoHideAsync().catch(() => {});

const navigationRef = createNavigationContainerRef<RootStackParamList>();

const theme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: colors.paper, text: colors.ink, primary: colors.ink },
};

/** Tapping the daily reminder opens today's check-in. */
function openFromReminder(response: Notifications.NotificationResponse | null) {
  if (response?.notification.request.content.data?.type !== REMINDER_TYPE) return;
  if (navigationRef.isReady()) {
    navigationRef.navigate('MoodPicker', { period: 'morning', date: todayKey() });
  }
}

export default function App() {
  const fontsReady = useAppFonts();

  useEffect(() => {
    if (Platform.OS === 'web') return;
    // Ask once at launch; the Home toggle handles later changes and denial.
    requestPermission().then((granted) => {
      if (granted) resyncDailyReminder();
    });
    const sub = Notifications.addNotificationResponseReceivedListener(openFromReminder);
    return () => sub.remove();
  }, []);

  const onReady = useCallback(() => {
    if (Platform.OS !== 'web') Notifications.getLastNotificationResponseAsync().then(openFromReminder);
  }, []);

  useEffect(() => {
    if (fontsReady) SplashScreen.hideAsync().catch(() => {});
  }, [fontsReady]);

  if (!fontsReady) return null;

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <EntriesProvider>
          <NavigationContainer ref={navigationRef} theme={theme} onReady={onReady}>
            <RootNavigator />
          </NavigationContainer>
        </EntriesProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.paper },
});
