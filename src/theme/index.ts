import { Easing } from 'react-native-reanimated';

/**
 * Design language:
 * - Studio surfaces (from the creative-studio footer spec): pale lavender paper,
 *   near-black ink, off-white pill badges, spacious layout, no shadows or scrims.
 * - Mood stage (from the TOONHUB carousel spec): full-bleed mood colour, giant
 *   white display word, grain overlay, outlined circular arrow buttons.
 */
export const colors = {
  ink: '#080909',
  inkSoft: '#3B3A4A',
  muted: '#6C6A80',
  paper: '#F0EEFA',
  paperDeep: '#DFE4F2',
  badge: '#F7F8FA',
  card: '#FBFAFF',
  line: 'rgba(8, 9, 9, 0.08)',
  lineStrong: 'rgba(8, 9, 9, 0.16)',
  lavender: '#B9A8E6',
  heart: '#E882B4',
  white: '#FFFFFF',
  positive: '#3FAE5A',
  negative: '#E8586A',
  scrim: 'rgba(8, 9, 9, 0.45)',
  /** Deep navy the night theme is mixed from. */
  night: '#10143A',
  nightInk: '#E9E7FF',
  sky: '#CFE6FF',
  sun: '#FFE58A',
  dawn: '#FFD9B8',
} as const;

/**
 * Type system:
 * - Bagel Fat One — puffy, stitched-toy display face for Latin words and numbers.
 * - Mali (Cadson Demak) — rounded, hand-drawn looped Thai for headlines.
 * - IBM Plex Sans Thai Looped — traditional looped Thai for reading text.
 */
export const fonts = {
  /** Giant display words and numbers (Latin only). */
  display: 'BagelFatOne_400Regular',
  /** Latin wordmark. */
  headlineLatin: 'BagelFatOne_400Regular',
  /** Thai + Latin headlines. */
  headline: 'Mali_700Bold',
  headlineBold: 'Mali_700Bold',
  title: 'Mali_600SemiBold',
  body: 'IBMPlexSansThaiLooped_400Regular',
  bodyMedium: 'IBMPlexSansThaiLooped_500Medium',
  bodySemiBold: 'IBMPlexSansThaiLooped_600SemiBold',
} as const;

export const radii = {
  pill: 100,
  sheet: 32,
  card: 28,
  field: 20,
} as const;

/** Shared carousel/stage motion: 650ms, cubic-bezier(0.4, 0, 0.2, 1). */
export const motion = {
  duration: 650,
  easing: Easing.bezier(0.4, 0, 0.2, 1),
  fast: 150,
} as const;

export const hitSlop = { top: 10, bottom: 10, left: 10, right: 10 };
