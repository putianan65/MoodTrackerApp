// App.tsx — Notification safe version (Google Play ready)
import './services/NotificationService'; // ✅ โหลด side-effects ก่อนทุกอย่าง

import React, { useEffect, useState } from 'react';
import { AppState, Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Notifications from 'expo-notifications';

import HomeScreen from './screens/HomeScreen';
import MorningMoodScreen from './screens/MorningMoodScreen';
import NightMoodScreen from './screens/NightMoodScreen';
import ActivityLogScreen from './screens/ActivityLogScreen';
import SummaryScreen from './screens/SummaryScreen';
import HistoryScreen from './screens/HistoryScreen';
import WeeklyGraphScreen from './screens/WeeklyGraphScreen';
import ColorMeaningScreen from './screens/ColorMeaningScreen';

import {
  registerForPushNotificationsAsync,
  resyncDailySchedule,
} from './services/NotificationService';

// ✅ Global handler — Play ต้องการให้ระบุชัดเจน
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const Stack = createNativeStackNavigator();

export default function App() {
  const [askedOnce, setAskedOnce] = useState(false);

  // ✅ ขอสิทธิครั้งแรกเมื่อเปิดแอป
  useEffect(() => {
    (async () => {
      const ok = await registerForPushNotificationsAsync();
      if (ok) {
        await resyncDailySchedule();
      } else {
        Alert.alert(
          'เปิดการแจ้งเตือน',
          'กรุณาไปที่การตั้งค่า (Settings) เพื่อเปิดสิทธิการแจ้งเตือน เพื่อให้แอปเตือนบันทึกอารมณ์เวลา 17:00 ได้ตามปกติ'
        );
      }

      // ตรวจสอบว่ามีการเปิดจากแจ้งเตือนครั้งล่าสุดไหม
      const last = await Notifications.getLastNotificationResponseAsync();
      if (last) {
        // navigationRef.current?.navigate('Home');
      }
    })();
  }, []);

  // ✅ ตรวจจับเมื่อกลับเข้าหน้าแอปอีกครั้ง
  useEffect(() => {
    const sub = AppState.addEventListener('change', async (state) => {
      if (state === 'active' && !askedOnce) {
        const ok = await registerForPushNotificationsAsync();
        if (ok) {
          await resyncDailySchedule();
        } else {
          Alert.alert(
            'เปิดการแจ้งเตือน',
            'หากต้องการรับการแจ้งเตือน โปรดเปิดสิทธิใน Settings'
          );
        }
        setAskedOnce(true); // ป้องกันการขอซ้ำรัว ๆ
      }
    });
    return () => sub.remove();
  }, [askedOnce]);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="MorningMood" component={MorningMoodScreen} />
        <Stack.Screen name="NightMood" component={NightMoodScreen} />
        <Stack.Screen name="ActivityLog" component={ActivityLogScreen} />
        <Stack.Screen name="Summary" component={SummaryScreen} />
        <Stack.Screen name="History" component={HistoryScreen} />
        <Stack.Screen name="WeeklyGraph" component={WeeklyGraphScreen} />
        <Stack.Screen name="ColorMeaning" component={ColorMeaningScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
