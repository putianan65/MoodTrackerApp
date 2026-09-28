import AsyncStorage from '@react-native-async-storage/async-storage';

import { isMoodColor } from '../constants/moods';
import type { MoodEntry, WeekData } from '../types/entry';

const STORAGE_KEY = 'mood_entries';

const sanitize = (raw: any): MoodEntry | null => {
  if (!raw || typeof raw.date !== 'string') return null;
  return {
    date: raw.date,
    morningMood: isMoodColor(raw.morningMood) ? raw.morningMood : 'yellow',
    nightMood: isMoodColor(raw.nightMood) ? raw.nightMood : 'yellow',
    positiveActivities: Array.isArray(raw.positiveActivities) ? raw.positiveActivities : [],
    negativeActivities: Array.isArray(raw.negativeActivities) ? raw.negativeActivities : [],
    otherActivityScore: Number(raw.otherActivityScore) || 0,
    otherActivityNote: typeof raw.otherActivityNote === 'string' ? raw.otherActivityNote : '',
    totalScore: Number(raw.totalScore) || 0,
    ...(raw.completed === false ? { completed: false } : null),
  };
};

export const loadEntries = async (): Promise<MoodEntry[]> => {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    if (!json) return [];
    const parsed = JSON.parse(json);
    return Array.isArray(parsed)
      ? parsed.map(sanitize).filter((e): e is MoodEntry => e !== null)
      : [];
  } catch (error) {
    console.error('Error loading entries:', error);
    return [];
  }
};

export const persistEntries = async (entries: MoodEntry[]): Promise<void> => {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
};

export const clearEntries = async (): Promise<void> => {
  await AsyncStorage.removeItem(STORAGE_KEY);
};

/** Newest first. */
export const sortByDateDesc = (entries: MoodEntry[]) =>
  [...entries].sort((a, b) => b.date.localeCompare(a.date));

/**
 * Groups recorded days into consecutive blocks of 7 (oldest first). A "week" is
 * seven check-ins rather than a calendar week, so the weekly analysis unlocks
 * after every seven days of logging.
 */
export const groupEntriesByWeek = (entries: MoodEntry[]): WeekData[] => {
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const weeks: WeekData[] = [];
  for (let i = 0; i < sorted.length; i += 7) {
    weeks.push({ week: i / 7 + 1, days: sorted.slice(i, i + 7) });
  }
  return weeks;
};
