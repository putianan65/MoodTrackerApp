import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const STATUS_KEY = 'dailyNotificationEnabled';
const ID_KEY = 'dailyNotificationId';
const HOUR_KEY = 'dailyNotificationHour';
const MINUTE_KEY = 'dailyNotificationMinute';
const CHANNEL_ID = 'daily-17-channel';

export const DEFAULT_REMINDER = { hour: 17, minute: 0 };
export const REMINDER_TYPE = 'daily_mood_reminder';

const devLog = (...args: unknown[]) => {
  if (__DEV__) console.log('[notifications]', ...args);
};

// Registered once, at import time, before any notification can arrive.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

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

/** Requests permission if needed. Returns whether notifications are allowed. */
export async function requestPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    const current = await Notifications.getPermissionsAsync();
    let status = current.status;
    if (status !== 'granted' && current.canAskAgain !== false) {
      status = (
        await Notifications.requestPermissionsAsync({
          ios: { allowAlert: true, allowBadge: false, allowSound: true },
        })
      ).status;
    }
    await ensureAndroidChannel();
    return status === 'granted';
  } catch (e) {
    console.error('Error requesting notification permissions:', e);
    return false;
  }
}

async function cancelExistingSchedule() {
  const oldId = await AsyncStorage.getItem(ID_KEY);
  if (oldId) await Notifications.cancelScheduledNotificationAsync(oldId).catch(() => {});
  await AsyncStorage.removeItem(ID_KEY);
}

export async function isReminderEnabled(): Promise<boolean> {
  return (await AsyncStorage.getItem(STATUS_KEY)) === 'true';
}

export async function enableDailyReminder(
  hour = DEFAULT_REMINDER.hour,
  minute = DEFAULT_REMINDER.minute,
): Promise<boolean> {
  try {
    if (!(await requestPermission())) return false;
    await cancelExistingSchedule();

    const content: Notifications.NotificationContentInput = {
      title: 'ถึงเวลาเช็คอารมณ์แล้ว 😊',
      body: 'บันทึกความรู้สึกของคุณตอนนี้สัก 1 นาที',
      sound: 'default',
      data: { type: REMINDER_TYPE },
    };
    if (Platform.OS === 'android') {
      content.priority = Notifications.AndroidNotificationPriority.HIGH;
    }

    const id = await Notifications.scheduleNotificationAsync({
      content,
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
        channelId: CHANNEL_ID,
      },
    });

    await AsyncStorage.multiSet([
      [STATUS_KEY, 'true'],
      [ID_KEY, id],
      [HOUR_KEY, String(hour)],
      [MINUTE_KEY, String(minute)],
    ]);
    devLog('scheduled', { id, hour, minute });
    return true;
  } catch (e) {
    console.error('Error enabling daily reminder:', e);
    return false;
  }
}

export async function disableDailyReminder(): Promise<boolean> {
  try {
    await cancelExistingSchedule();
    await AsyncStorage.multiSet([
      [STATUS_KEY, 'false'],
      [HOUR_KEY, ''],
      [MINUTE_KEY, ''],
    ]);
    return true;
  } catch (e) {
    console.error('Error disabling daily reminder:', e);
    return false;
  }
}

/** Makes sure exactly one valid daily trigger exists when the reminder is on. */
export async function resyncDailyReminder() {
  if (Platform.OS === 'web') return;
  try {
    if (!(await isReminderEnabled())) return;
    const hour = Number(await AsyncStorage.getItem(HOUR_KEY)) || DEFAULT_REMINDER.hour;
    const minute = Number(await AsyncStorage.getItem(MINUTE_KEY)) || DEFAULT_REMINDER.minute;
    const savedId = await AsyncStorage.getItem(ID_KEY);
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    if (!scheduled.some((n) => n.identifier === savedId)) {
      devLog('schedule missing, recreating');
      await enableDailyReminder(hour, minute);
    } else {
      await ensureAndroidChannel();
    }
  } catch (e) {
    console.error('Error resyncing daily reminder:', e);
  }
}
