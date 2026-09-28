import type { MoodColor } from '../types/entry';

export type MoodFace = 'joy' | 'calm' | 'flat' | 'worried' | 'grumpy' | 'blank' | 'sad';

export type MoodDefinition = {
  key: MoodColor;
  /** 7 (best) → 1 (worst). Used by every score calculation. */
  score: number;
  label: string;
  /** Display word set in Bagel Fat One behind the carousel. */
  word: string;
  emoji: string;
  description: string;
  source: string;
  face: MoodFace;
  palette: {
    /** Full-screen background while this mood is active. */
    bg: string;
    /** Lighter panel tone of the background. */
    panel: string;
    /** Character body highlight and shadow. */
    body: string;
    shade: string;
    /** Ink used for the face and for text sitting on `bg`. */
    face: string;
    onBg: string;
  };
};

export const MOOD_ORDER: readonly MoodColor[] = [
  'green',
  'blue',
  'yellow',
  'orange',
  'red',
  'gray',
  'black',
];

export const MOODS: Record<MoodColor, MoodDefinition> = {
  green: {
    key: 'green',
    score: 7,
    label: 'สดชื่น',
    word: 'fresh',
    emoji: '😄',
    description: 'สีเขียวให้ความรู้สึกมีชีวิตชีวา สดชื่น และพร้อมเริ่มต้นใหม่',
    source: 'อ้างอิง: สสส. / ม.มหิดล งานวิจัยสีเพื่อสุขภาพจิต',
    face: 'joy',
    palette: {
      bg: '#6BBF7A',
      panel: '#85CC92',
      body: '#C3F2C9',
      shade: '#4C9E5B',
      face: '#0B2A12',
      onBg: '#FFFFFF',
    },
  },
  blue: {
    key: 'blue',
    score: 6,
    label: 'สงบ',
    word: 'calm',
    emoji: '🙂',
    description: 'สีฟ้าเกี่ยวข้องกับความสบายใจ ความมั่นคง และการควบคุมอารมณ์',
    source: 'อ้างอิง: มูลนิธิสุขภาพไทย / โรงพยาบาลราชวิถี',
    face: 'calm',
    palette: {
      bg: '#6EB5FF',
      panel: '#8DC4FF',
      body: '#D2E8FF',
      shade: '#4A8FDB',
      face: '#0A2240',
      onBg: '#FFFFFF',
    },
  },
  yellow: {
    key: 'yellow',
    score: 5,
    label: 'เฉย ๆ',
    word: 'neutral',
    emoji: '😐',
    description: 'สีเหลืองแสดงถึงความเป็นกลาง ไม่สุขไม่ทุกข์ อยู่ในจุดพักอารมณ์',
    source: 'อ้างอิง: คณะจิตวิทยา ม.มหิดล',
    face: 'flat',
    palette: {
      bg: '#F2BE3D',
      panel: '#F6CF6A',
      body: '#FFF0B8',
      shade: '#D19A1C',
      face: '#3A2A04',
      onBg: '#FFFFFF',
    },
  },
  orange: {
    key: 'orange',
    score: 4,
    label: 'เครียด',
    word: 'stressed',
    emoji: '😞',
    description: 'สีส้มบ่งชี้ถึงภาวะกังวล เครียด หรือความสับสนเล็กน้อย',
    source: 'อ้างอิง: กรมสุขภาพจิต (คู่มือสุขภาพจิตระดับต้น)',
    face: 'worried',
    palette: {
      bg: '#F4845F',
      panel: '#F79B7F',
      body: '#FFD3C2',
      shade: '#D9603B',
      face: '#3D1407',
      onBg: '#FFFFFF',
    },
  },
  red: {
    key: 'red',
    score: 3,
    label: 'หงุดหงิด',
    word: 'grumpy',
    emoji: '😣',
    description: 'สีแดงแสดงถึงความโกรธ ความตึงเครียด หรือการแปรปรวนทางอารมณ์',
    source: 'อ้างอิง: รายงานสุขภาพจิตแห่งชาติ (สสส.)',
    face: 'grumpy',
    palette: {
      bg: '#E8586A',
      panel: '#EE7A89',
      body: '#FFC2CA',
      shade: '#C23A4D',
      face: '#3A0710',
      onBg: '#FFFFFF',
    },
  },
  gray: {
    key: 'gray',
    score: 2,
    label: 'ว่างเปล่า',
    word: 'empty',
    emoji: '😶',
    description: 'สีเทาให้ความรู้สึกเฉยชา ไร้อารมณ์ และหมดพลังใจ',
    source: 'อ้างอิง: Thai Mental Health Report 2020 / โครงการผู้สูงอายุ',
    face: 'blank',
    palette: {
      bg: '#8E96A8',
      panel: '#A5ACBB',
      body: '#E1E4EB',
      shade: '#6B7285',
      face: '#1D2130',
      onBg: '#FFFFFF',
    },
  },
  black: {
    key: 'black',
    score: 1,
    label: 'มืดมน',
    word: 'gloomy',
    emoji: '😔',
    description: 'สีดำสะท้อนภาวะเศร้า ซึม หรือความสิ้นหวังลึก',
    source: 'อ้างอิง: กรมสุขภาพจิต / รพ.ศรีธัญญา แบบวาดภาพอารมณ์',
    face: 'sad',
    palette: {
      bg: '#2A2B3D',
      panel: '#3A3C52',
      body: '#8487AE',
      shade: '#34365A',
      face: '#F4F3FF',
      onBg: '#FFFFFF',
    },
  },
};

export const isMoodColor = (value: unknown): value is MoodColor =>
  typeof value === 'string' && (MOOD_ORDER as readonly string[]).includes(value);
