// moodToScore.ts — ใช้คะแนนแบบ 1–7 เรียงจากดี → แย่

export type MoodColor =
  | 'green'
  | 'blue'
  | 'yellow'
  | 'orange'
  | 'red'
  | 'gray'
  | 'black';

export const MoodColors: Record<MoodColor, string> = {
  green: '#4ADE80',  // 7: สดชื่น
  blue: '#60A5FA',   // 6: สงบ
  yellow: '#FACC15', // 5: เฉย ๆ
  orange: '#FB923C', // 4: เครียด
  red: '#F43F5E',    // 3: หงุดหงิด
  gray: '#9CA3AF',   // 2: ว่างเปล่า
  black: '#111827',  // 1: มืดมน
};

export const moodToScore = (color: MoodColor): number => {
  switch (color) {
    case 'green': return 7;
    case 'blue': return 6;
    case 'yellow': return 5;
    case 'orange': return 4;
    case 'red': return 3;
    case 'gray': return 2;
    case 'black': return 1;
    default: return 5;
  }
};

export const moodMeanings: Record<MoodColor, { label: string; description: string; source: string }> = {
  green: {
    label: 'สดชื่น',
    description: 'สีเขียวให้ความรู้สึกมีชีวิตชีวา สดชื่น และพร้อมเริ่มต้นใหม่',
    source: 'อ้างอิง: สสส. / ม.มหิดล งานวิจัยสีเพื่อสุขภาพจิต'
  },
  blue: {
    label: 'สงบ',
    description: 'สีฟ้าเกี่ยวข้องกับความสบายใจ ความมั่นคง และการควบคุมอารมณ์',
    source: 'อ้างอิง: มูลนิธิสุขภาพไทย / โรงพยาบาลราชวิถี'
  },
  yellow: {
    label: 'เฉย ๆ',
    description: 'สีเหลืองแสดงถึงความเป็นกลาง ไม่สุขไม่ทุกข์ อยู่ในจุดพักอารมณ์',
    source: 'อ้างอิง: คณะจิตวิทยา ม.มหิดล'
  },
  orange: {
    label: 'เครียด',
    description: 'สีส้มบ่งชี้ถึงภาวะกังวล เครียด หรือความสับสนเล็กน้อย',
    source: 'อ้างอิง: กรมสุขภาพจิต (คู่มือสุขภาพจิตระดับต้น)'
  },
  red: {
    label: 'หงุดหงิด',
    description: 'สีแดงแสดงถึงความโกรธ ความตึงเครียด หรือการแปรปรวนทางอารมณ์',
    source: 'อ้างอิง: รายงานสุขภาพจิตแห่งชาติ (สสส.)'
  },
  gray: {
    label: 'ว่างเปล่า',
    description: 'สีเทาให้ความรู้สึกเฉยชา ไร้อารมณ์ และหมดพลังใจ',
    source: 'อ้างอิง: Thai Mental Health Report 2020 / โครงการผู้สูงอายุ'
  },
  black: {
    label: 'มืดมน',
    description: 'สีดำสะท้อนภาวะเศร้า ซึม หรือความสิ้นหวังลึก',
    source: 'อ้างอิง: กรมสุขภาพจิต / รพ.ศรีธัญญา แบบวาดภาพอารมณ์'
  },
};
