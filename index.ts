import { registerRootComponent } from 'expo';

import App from './App';

export type MoodColor =
  | 'green'
  | 'blue'
  | 'yellow'
  | 'orange'
  | 'red'
  | 'black'
  | 'gray';

export type ActivityType =
  | 'ออกกำลังกาย 15-30 นาที'
  | 'ทำกิจกรรมผ่อนคลาย 30 นาที'
  | 'พักสายตา 15 นาที'
  | 'ทำงานหนักโหม'
  | 'กินข้าวไม่ตรงเวลา'
  | 'อยู่ท่าเดิมเป็นเวลานาน ไม่ขยับตัว'
  | 'อื่น ๆ';

export type MoodEntry = {
  date: string;
  morningMoodColor: MoodColor;
  nightMoodColor: MoodColor;
  activityPositive: ActivityType[];
  activityNegative: ActivityType[];
  otherActivityScore: number;
  otherActivityNote: string;
  total: number;
};
registerRootComponent(App);
