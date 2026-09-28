import { ACTIVITY_SCORES, OTHER_SCORE_MAX, OTHER_SCORE_MIN } from '../constants/activities';
import { MOODS } from '../constants/moods';
import type { MoodColor, MoodEntry } from '../types/entry';

/**
 * Energy score model (0–20):
 *   morning mood (1–7) + night mood (1–7)
 *   + daily activities, clamped to −3..+3
 *   + other activity, −10..+10 normalised to −3..+3
 */
export const MAX_SCORE = 20;

export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, Number.isFinite(value) ? value : 0));

export const moodToScore = (color: MoodColor): number => MOODS[color]?.score ?? 5;

export const rawActivityScore = (entry: Pick<MoodEntry, 'positiveActivities' | 'negativeActivities'>) =>
  [...(entry.positiveActivities ?? []), ...(entry.negativeActivities ?? [])].reduce(
    (sum, activity) => sum + (ACTIVITY_SCORES[activity] ?? 0),
    0,
  );

export const activityScore = (entry: Pick<MoodEntry, 'positiveActivities' | 'negativeActivities'>) =>
  clamp(rawActivityScore(entry), -3, 3);

export const otherScore = (entry: Pick<MoodEntry, 'otherActivityScore'>) =>
  (clamp(entry.otherActivityScore ?? 0, OTHER_SCORE_MIN, OTHER_SCORE_MAX) / 10) * 3;

export type ScoreBreakdown = {
  morning: number;
  night: number;
  activity: number;
  other: number;
  total: number;
  /** `total` as 0–100. */
  percent: number;
};

export const scoreEntry = (entry: MoodEntry): ScoreBreakdown => {
  const morning = moodToScore(entry.morningMood);
  const night = moodToScore(entry.nightMood);
  const activity = activityScore(entry);
  const other = otherScore(entry);
  const total = morning + night + activity + other;
  return {
    morning,
    night,
    activity,
    other,
    total,
    percent: clamp((total / MAX_SCORE) * 100, 0, 100),
  };
};

/** Parses user input for the free-text activity score into −10..+10 with one decimal. */
export const parseOtherScore = (raw: string): number => {
  const n = Number(String(raw ?? '').replace(',', '.').trim());
  if (!Number.isFinite(n)) return 0;
  return Number(clamp(n, OTHER_SCORE_MIN, OTHER_SCORE_MAX).toFixed(1));
};

export const formatScore = (value: number) =>
  Number.isInteger(value) ? String(value) : value.toFixed(1);

// ─── Daily energy analysis ──────────────────────────────────────────────────

export type EnergyLevel = 'ต่ำ' | 'กลาง' | 'สูง';

export type EnergyAnalysis = {
  level: EnergyLevel;
  word: string;
  color: string;
  trend: string;
  advice: string;
};

export const analyzeEnergy = (total: number): EnergyAnalysis => {
  if (total < 8) {
    return {
      level: 'ต่ำ',
      word: 'low',
      color: '#E8586A',
      trend: 'กราฟแสดงให้เห็นว่าคุณอาจต้องการการดูแลตนเองมากขึ้น',
      advice:
        'วันนี้คุณอาจรู้สึกเหนื่อยหรือพลังใจน้อย ลองพักผ่อนให้เพียงพอ ทำสิ่งที่ชอบ หรือลองเขียนไดอารี่เพื่อปลดปล่อยความรู้สึก การออกกำลังกายเบา ๆ หรือการทำสมาธิสั้น ๆ อาจช่วยได้',
    };
  }
  if (total <= 14) {
    return {
      level: 'กลาง',
      word: 'steady',
      color: '#F2A93D',
      trend: 'กราฟแสดงความสมดุลของอารมณ์ในระดับปานกลาง',
      advice:
        'คุณมีพลังใจในระดับปานกลาง รักษาจังหวะด้วยกิจกรรมเล็ก ๆ ที่ทำให้คุณรู้สึกดี เช่น ดื่มน้ำให้เพียงพอ ฟังเพลงที่ชอบ หรือพูดคุยกับคนที่ไว้ใจ การออกไปเดินเล่นหรือทำกิจกรรมที่ทำให้ผ่อนคลายจะช่วยเสริมสร้างพลังงานได้',
    };
  }
  return {
    level: 'สูง',
    word: 'high',
    color: '#3FAE5A',
    trend: 'กราฟแสดงว่าคุณมีพลังงานและความสุขในระดับดี',
    advice:
      'พลังงานของคุณดีมาก! ใช้โอกาสนี้ทำสิ่งดี ๆ ให้ตนเองหรือแบ่งปันพลังงานนี้กับคนรอบข้าง ลองตั้งเป้าหมายเล็ก ๆ ที่จะทำให้คุณรู้สึกภูมิใจ หรือช่วยเหลือผู้อื่น',
  };
};

export const LOW_ENERGY_THRESHOLD = 8;

// ─── Weekly analysis (percent scale) ────────────────────────────────────────

export const scoreColor = (percent: number) => {
  if (percent >= 80) return '#3FAE5A';
  if (percent >= 60) return '#F2A93D';
  if (percent >= 40) return '#E8586A';
  return '#C02E45';
};

export const scoreText = (percent: number) => {
  if (percent >= 80) return 'ดีเยี่ยม';
  if (percent >= 60) return 'ดี';
  if (percent >= 40) return 'ปานกลาง';
  return 'ต้องปรับปรุง';
};

export type Trend = 'improving' | 'declining' | 'stable';

export type WeeklyInsight = {
  averageScore: number;
  trend: { kind: Trend; text: string; color: string };
  volatility: string;
  recommendations: string[];
  color: string;
};

const RECOMMENDATIONS = {
  excellent: [
    'คุณมีสุขภาพจิตที่ดีเยี่ยม รักษาสมดุลนี้ต่อไป',
    'ใช้พลังงานบวกนี้ในการพัฒนาทักษะใหม่ หรือช่วยเหลือผู้อื่น',
    'ลองท้าทายตนเองด้วยเป้าหมายใหม่ที่สร้างสรรค์',
  ],
  good: [
    'คุณมีสุขภาพจิตในระดับดี แต่ยังมีพื้นที่ปรับปรุง',
    'สร้างกิจวัตรประจำวันที่ช่วยเสริมสร้างพลังงานบวก',
    'ฝึกการจัดการความเครียดด้วยเทคนิคหายใจลึก หรือสมาธิ',
  ],
  moderate: [
    'อารมณ์ของคุณอยู่ในระดับปานกลาง ต้องการความใส่ใจ',
    'ลองหากิจกรรมที่ช่วยผ่อนคลาย เช่น ฟังเพลง อ่านหนังสือ',
    'การพูดคุยกับคนใกล้ชิดจะช่วยบรรเทาความรู้สึกได้',
  ],
  needsAttention: [
    'คุณอาจกำลังเผชิญกับความท้าทาย ขอให้ใจเย็นและดูแลตนเอง',
    'ให้ความสำคัญกับการพักผ่อนและการนอนหลับที่เพียงพอ',
    'หากรู้สึกท้อแท้ต่อเนื่อง ควรปรึกษาผู้เชี่ยวชาญด้านสุขภาพจิต',
  ],
};

const average = (values: number[]) =>
  values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;

export const analyzeTrend = (scores: number[]): Trend | null => {
  if (scores.length < 7) return null;
  const diff = average(scores.slice(-3)) - average(scores.slice(0, 3));
  if (diff > 10) return 'improving';
  if (diff < -10) return 'declining';
  return 'stable';
};

/** Psychological weekly summary. Only available once a week has all 7 days. */
export const analyzeWeek = (scores: number[]): WeeklyInsight | null => {
  if (scores.length < 7) return null;
  const averageScore = average(scores);
  const kind = analyzeTrend(scores) ?? 'stable';
  const volatility = Math.sqrt(average(scores.map((s) => (s - averageScore) ** 2)));

  const level =
    averageScore >= 80
      ? 'excellent'
      : averageScore >= 60
        ? 'good'
        : averageScore >= 40
          ? 'moderate'
          : 'needsAttention';

  const trend = {
    improving: { kind, text: 'กราฟแสดงแนวโน้มที่ดีขึ้นอย่างต่อเนื่อง', color: '#3FAE5A' },
    declining: { kind, text: 'กราฟแสดงแนวโน้มที่ลดลง ควรให้ความสนใจ', color: '#E8586A' },
    stable: { kind, text: 'กราฟแสดงความมั่นคงในระดับปัจจุบัน', color: '#5B5A6E' },
  }[kind];

  return {
    averageScore,
    trend,
    volatility:
      volatility > 25
        ? 'อารมณ์มีความผันผวนสูง'
        : volatility > 15
          ? 'อารมณ์มีความผันผวนปานกลาง'
          : 'อารมณ์มีความสมดุล',
    recommendations: RECOMMENDATIONS[level],
    color: scoreColor(averageScore),
  };
};
