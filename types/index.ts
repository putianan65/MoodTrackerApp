import type { MoodColor } from '../utils/mapMoodToScore';

export type MoodEntry = {
  date: string;
  morningMood: MoodColor;
  nightMood: MoodColor;
  positiveActivities: string[];
  negativeActivities: string[];
  otherActivityScore: number;
  otherActivityNote: string;
  totalScore: number;
};
