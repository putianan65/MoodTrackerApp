import AsyncStorage from '@react-native-async-storage/async-storage';
import { MoodEntry } from '../types';

const STORAGE_KEY = 'mood_entries';

// Type definition for week data
export interface WeekData {
  week: number;
  days: MoodEntry[];
}

// ✅ ดึงทั้งหมด
export const getAllEntries = async (): Promise<MoodEntry[]> => {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    return json ? JSON.parse(json) : [];
  } catch (error) {
    console.error('Error loading entries:', error);
    return [];
  }
};

// ✅ ดึงรายวัน
export const getEntryByDate = async (date: string): Promise<MoodEntry | null> => {
  const all = await getAllEntries();
  const entry = all.find(e => e.date === date);
  return entry ?? null;
};

// ✅ สร้างใหม่ (กัน Duplicate)
export const saveNewEntry = async (entry: MoodEntry): Promise<void> => {
  try {
    const all = await getAllEntries();
    const exists = all.find(e => e.date === entry.date);
    if (exists) {
      throw new Error(`Entry for date ${entry.date} already exists.`);
    }
    const updated = [...all, entry];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving new entry:', error);
  }
};

// ✅ อัปเดตข้อมูล
export const updateEntry = async (entry: MoodEntry): Promise<void> => {
  try {
    const all = await getAllEntries();
    const index = all.findIndex(e => e.date === entry.date);
    if (index === -1) {
      throw new Error(`No entry found for date ${entry.date}`);
    }
    all[index] = entry;
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch (error) {
    console.error('Error updating entry:', error);
  }
};

// ✅ เคลียร์ทั้งหมด
export const clearEntries = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing entries:', error);
  }
};

// ✅ แบ่งข้อมูลเป็นสัปดาห์ (ใหม่)
export const groupEntriesByWeek = (entries: MoodEntry[]): WeekData[] => {
  // Sort entries by date (oldest first)
  const sortedEntries = entries.sort((a, b) => {
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  const weeks: WeekData[] = [];
  
  // Group entries into weeks of 7 days each
  for (let i = 0; i < sortedEntries.length; i += 7) {
    const weekEntries = sortedEntries.slice(i, i + 7);
    weeks.push({
      week: Math.floor(i / 7) + 1,
      days: weekEntries
    });
  }

  return weeks;
};