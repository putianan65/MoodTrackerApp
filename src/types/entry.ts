export type MoodColor = 'green' | 'blue' | 'yellow' | 'orange' | 'red' | 'gray' | 'black';

export type DayPeriod = 'morning' | 'night';

/**
 * One day of tracking. The shape is persisted as-is in AsyncStorage, so it must
 * stay backwards compatible with entries saved by earlier versions of the app.
 */
export type MoodEntry = {
  /** Local calendar date, `YYYY-MM-DD`. */
  date: string;
  morningMood: MoodColor;
  nightMood: MoodColor;
  positiveActivities: string[];
  negativeActivities: string[];
  /** User-rated score for the free-text activity, clamped to −10..+10. */
  otherActivityScore: number;
  otherActivityNote: string;
  /** Total energy score on the 0–20 scale (see `domain/scoring`). */
  totalScore: number;
  /**
   * `false` while the day's check-in is still in progress (night mood not yet
   * chosen). Absent on entries saved by earlier versions, which were complete.
   */
  completed?: boolean;
};

export const isComplete = (entry: MoodEntry) => entry.completed !== false;

export type WeekData = {
  week: number;
  days: MoodEntry[];
};
