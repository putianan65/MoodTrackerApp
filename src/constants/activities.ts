/**
 * Activity weights based on CBT, WHO guidance and the Thai Department of Mental
 * Health. Keys are the Thai labels stored on each entry, so they must not change.
 */
export const ACTIVITY_SCORES: Record<string, number> = {
  // Positive
  'เดินเล่น': 3,
  'ออกกำลังกาย': 3,
  'ฟังเพลง': 2,
  'นั่งสมาธิ': 2,
  'ทำอาหาร': 2,
  'อ่านหนังสือ': 2,
  'เล่นกับสัตว์เลี้ยง': 3,

  // Neutral
  'ทำงาน': 0,
  'เรียน': 0,
  'ขับรถ': 0,

  // Negative
  'ใช้โซเชียลมากเกินไป': -2,
  'นอนดึก': -2,
  'ทะเลาะ': -5,
  'งานเยอะเกินไป': -3,
  'รู้สึกหมดพลัง': -4,
};

export const POSITIVE_ACTIVITIES = ['เดินเล่น', 'ออกกำลังกาย', 'ฟังเพลง', 'นั่งสมาธิ', 'อ่านหนังสือ'];
export const NEGATIVE_ACTIVITIES = ['ใช้โซเชียลมากเกินไป', 'ทะเลาะ', 'นอนดึก', 'งานเยอะเกินไป'];

export const OTHER_SCORE_MIN = -10;
export const OTHER_SCORE_MAX = 10;
