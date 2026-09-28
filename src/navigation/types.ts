import type { StackScreenProps } from '@react-navigation/stack';

import type { DayPeriod } from '../types/entry';

export type RootStackParamList = {
  Home: undefined;
  MoodPicker: { period: DayPeriod; date: string };
  ActivityLog: { date: string };
  Summary: { date: string; /** Just finished today's check-in. */ fresh?: boolean };
  History: undefined;
  Weekly: undefined;
  ColorMeaning: undefined;
};

export type ScreenProps<T extends keyof RootStackParamList> = StackScreenProps<
  RootStackParamList,
  T
>;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
