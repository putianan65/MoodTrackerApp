import { Moon, Sun, Sunrise, type LucideIcon } from 'lucide-react-native';

import type { DayPeriod } from '../types/entry';
import { colors } from './index';

/** Time-of-day theme: morning check-in → daytime activities → bedtime check-in. */
export type Phase = 'morning' | 'day' | 'night';

export const PHASES: Record<Phase, { label: string; greeting: string; icon: LucideIcon }> = {
  morning: { label: 'ช่วงเช้า', greeting: 'อรุณสวัสดิ์', icon: Sunrise },
  day: { label: 'ระหว่างวัน', greeting: 'สวัสดีตอนกลางวัน', icon: Sun },
  night: { label: 'ก่อนนอน', greeting: 'ราตรีสวัสดิ์', icon: Moon },
};

export const phaseForPeriod = (period: DayPeriod): Phase => (period === 'night' ? 'night' : 'morning');

/** Phase of the current clock time, for greetings. */
export const phaseNow = (date = new Date()): Phase => {
  const h = date.getHours();
  if (h >= 5 && h < 11) return 'morning';
  if (h >= 11 && h < 18) return 'day';
  return 'night';
};

const toRgb = (hex: string) => {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

/** Linear mix of two hex colours; `t` = share of `b`. */
export const mix = (a: string, b: string, t: number) => {
  const ca = toRgb(a);
  const cb = toRgb(b);
  return (
    '#' +
    ca
      .map((v, i) => Math.round(v + (cb[i] - v) * t).toString(16).padStart(2, '0'))
      .join('')
  );
};

/**
 * Night version of a mood colour: deep navy with only a hint of the hue. The
 * mood colour itself shows up as a glow (see `MoodGlow`), since mixing warm
 * colours straight into navy turns them muddy brown.
 */
export const toNight = (hex: string) => mix(hex, colors.night, 0.86);
