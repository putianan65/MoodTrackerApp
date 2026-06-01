// services/NotificationService.ts — Google Play Compliant (SDK 53)
import * as Notifications from 'expo-notifications';
import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Keys
const NOTIF_STATUS_KEY = 'dailyNotificationEnabled';
const NOTIF_ID_KEY = 'dailyNotificationId';
const NOTIF_HOUR_KEY = 'dailyNotificationHour';
const NOTIF_MIN_KEY = 'dailyNotificationMinute';

const CHANNEL_ID = 'daily-17-channel';

const devLog = (...args: unknown[]) => {
  if (__DEV__) {
    console.log(...args);
  }
};

// --- Notification handler ---
Notifications.setNotificationHandler({
  handleNotification: async (): Promise<Notifications.NotificationBehavior> => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// --- Android channel (must exist before scheduling) ---
async function ensureAndroidChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Daily Mood Reminder',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'default',
    enableVibrate: true,
    enableLights: true,
    vibrationPattern: [0, 250, 250, 250],
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    description: 'Daily mood tracking reminders',
  });
}

// --- Permissions ---
export async function registerForPushNotificationsAsync(): Promise<boolean> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: { allowAlert: true, allowBadge: false, allowSound: true },
      });
      finalStatus = status;
    }

    if (Platform.OS === 'android') {
      await ensureAndroidChannel();
    }

    // ✅ แจ้งผู้ใช้ถ้าไม่ได้สิทธิ (สำคัญต่อการผ่าน policy)
    if (finalStatus !== 'granted') {
      Alert.alert(
        'เปิดการแจ้งเตือน',
        'เพื่อให้แอปสามารถแจ้งเตือนเวลา 17:00 ได้ โปรดเปิดสิทธิการแจ้งเตือนใน Settings ของอุปกรณ์'
      );
    }

    return finalStatus === 'granted';
  } catch (e) {
    console.error('Error requesting notification permissions:', e);
    return false;
  }
}

// --- Utilities ---
async function cancelExistingSchedule() {
  try {
    const oldId = await AsyncStorage.getItem(NOTIF_ID_KEY);
    if (oldId) {
      await Notifications.cancelScheduledNotificationAsync(oldId);
      devLog('Cancelled existing notification:', oldId);
    }
    await AsyncStorage.removeItem(NOTIF_ID_KEY);
  } catch (e) {
    console.error('Error cancelling existing schedule:', e);
  }
}

export async function isNotificationEnabled(): Promise<boolean> {
  try {
    const status = await AsyncStorage.getItem(NOTIF_STATUS_KEY);
    return status === 'true';
  } catch (e) {
    console.error('Error checking notification status:', e);
    return false;
  }
}

// --- Schedule daily HH:mm (DAILY trigger) ---
export async function enableDailyNotifications(hour = 17, minute = 0): Promise<boolean> {
  try {
    const hasPermission = await registerForPushNotificationsAsync();
    if (!hasPermission) {
      devLog('No notification permission granted');
      return false;
    }

    await cancelExistingSchedule();

    const trigger = {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    } satisfies Notifications.DailyTriggerInput;

    const content: Notifications.NotificationContentInput = {
      title: 'ถึงเวลาเช็คอารมณ์แล้ว 😊',
      body: 'บันทึกความรู้สึกของคุณตอนนี้สัก 1 นาที',
      sound: 'default',
      data: { type: 'daily_mood_reminder' },
    };

    if (Platform.OS === 'android') {
      await ensureAndroidChannel();
      (content as any).channelId = CHANNEL_ID;
      (content as any).priority = Notifications.AndroidNotificationPriority.HIGH;
    }

    const id = await Notifications.scheduleNotificationAsync({
      content,
      trigger,
    });

    await AsyncStorage.multiSet([
      [NOTIF_STATUS_KEY, 'true'],
      [NOTIF_ID_KEY, id],
      [NOTIF_HOUR_KEY, String(hour)],
      [NOTIF_MIN_KEY, String(minute)],
    ]);

    devLog('Daily notification scheduled:', { id, hour, minute });
    return true;
  } catch (e) {
    console.error('Error enabling daily notifications:', e);
    return false;
  }
}

// --- Disable ---
export async function disableDailyNotifications(): Promise<boolean> {
  try {
    await cancelExistingSchedule();
    await AsyncStorage.multiSet([
      [NOTIF_STATUS_KEY, 'false'],
      [NOTIF_HOUR_KEY, ''],
      [NOTIF_MIN_KEY, ''],
    ]);
    devLog('Daily notifications disabled');
    return true;
  } catch (e) {
    console.error('Error disabling daily notifications:', e);
    return false;
  }
}

// --- Resync schedule (ensure one valid DAILY trigger exists) ---
export async function resyncDailySchedule() {
  try {
    const enabled = await isNotificationEnabled();
    if (!enabled) {
      devLog('Notifications disabled, skipping resync');
      return;
    }

    const hour = Number((await AsyncStorage.getItem(NOTIF_HOUR_KEY)) ?? '17') || 17;
    const minute = Number((await AsyncStorage.getItem(NOTIF_MIN_KEY)) ?? '0') || 0;

    const savedId = await AsyncStorage.getItem(NOTIF_ID_KEY);
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();

    const found = scheduled.some((n: any) => n.identifier === savedId);

    if (!found) {
      devLog('Scheduled notification not found -> recreate');
      await enableDailyNotifications(hour, minute);
    } else if (Platform.OS === 'android') {
      await ensureAndroidChannel();
    }

    // Debug log
    const current = await Notifications.getAllScheduledNotificationsAsync();
    devLog('Current scheduled notifications:', current.length);
  } catch (e) {
    console.error('Error resyncing daily schedule:', e);
  }
}

// --- Handle notification tap ---
export function handleNotificationResponse(navigation: any) {
  const sub = Notifications.addNotificationResponseReceivedListener((response) => {
    devLog('Notification tapped:', response);
    navigation.navigate('Summary'); // ✅ นำไปหน้าเป้าหมายชัดเจน
  });
  return sub;
}

// --- Debug helper ---
export async function debugNotificationStatus() {
  try {
    const permissions = await Notifications.getPermissionsAsync();
    const enabled = await isNotificationEnabled();
    const savedId = await AsyncStorage.getItem(NOTIF_ID_KEY);
    const hour = await AsyncStorage.getItem(NOTIF_HOUR_KEY);
    const minute = await AsyncStorage.getItem(NOTIF_MIN_KEY);
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();

    const debug = {
      permissions: permissions.status,
      enabled,
      savedId,
      time: hour && minute ? `${hour}:${String(minute).padStart(2, '0')}` : null,
      scheduledCount: scheduled.length,
    };

    devLog('Notification Debug Info:', JSON.stringify(debug, null, 2));
    return debug;
  } catch (e) {
    console.error('Error debugging notification status:', e);
    return null;
  }
}
