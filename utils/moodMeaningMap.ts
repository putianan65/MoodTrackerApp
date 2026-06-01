// ✅ utils/moodMeaningMap.ts
// แหล่งความจริง (single source of truth) สำหรับความหมายของสีอารมณ์
// ใช้ได้ทั้ง Morning/Night/ColorMeaning screens

export const moodMeanings = {
  green: {
    label: 'สดชื่น',
    description: 'สีเขียวให้ความรู้สึกมีชีวิตชีวา สดชื่น และพร้อมเริ่มต้นใหม่',
    source: 'อ้างอิง: สสส. / ม.มหิดล งานวิจัยสีเพื่อสุขภาพจิต',
    emoji: '😄',
  },
  blue: {
    label: 'สงบ',
    description: 'สีฟ้าเกี่ยวข้องกับความสบายใจ ความมั่นคง และการควบคุมอารมณ์',
    source: 'อ้างอิง: มูลนิธิสุขภาพไทย / โรงพยาบาลราชวิถี',
    emoji: '🙂',
  },
  yellow: {
    label: 'เฉย ๆ',
    description: 'สีเหลืองแสดงถึงความเป็นกลาง ไม่สุขไม่ทุกข์ อยู่ในจุดพักอารมณ์',
    source: 'อ้างอิง: คณะจิตวิทยา ม.มหิดล',
    emoji: '😐',
  },
  orange: {
    label: 'เครียด',
    description: 'สีส้มบ่งชี้ถึงภาวะกังวล เครียด หรือความสับสนเล็กน้อย',
    source: 'อ้างอิง: กรมสุขภาพจิต (คู่มือสุขภาพจิตระดับต้น)',
    emoji: '😞',
  },
  red: {
    label: 'หงุดหงิด',
    description: 'สีแดงแสดงถึงความโกรธ ความตึงเครียด หรือการแปรปรวนทางอารมณ์',
    source: 'อ้างอิง: รายงานสุขภาพจิตแห่งชาติ (สสส.)',
    emoji: '😣',
  },
  gray: {
    label: 'ว่างเปล่า',
    description: 'สีเทาให้ความรู้สึกเฉยชา ไร้อารมณ์ และหมดพลังใจ',
    source: 'อ้างอิง: Thai Mental Health Report 2020 / โครงการผู้สูงอายุ',
    emoji: '😶',
  },
  black: {
    label: 'มืดมน',
    description: 'สีดำสะท้อนภาวะเศร้า ซึม หรือความสิ้นหวังลึก',
    source: 'อ้างอิง: กรมสุขภาพจิต / รพ.ศรีธัญญา แบบวาดภาพอารมณ์',
    emoji: '😔',
  },
} as const;

// ลำดับสี (ถ้าต้องการใช้แสดงผลตามลำดับเดิม)
export const moodOrder = ['green', 'blue', 'yellow', 'orange', 'red', 'gray', 'black'] as const;
export type MoodKey = keyof typeof moodMeanings;
