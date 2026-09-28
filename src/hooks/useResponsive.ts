import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';

/** Width above which the wide (tablet / desktop-style) layouts are used. */
export const WIDE_BREAKPOINT = 700;
/** Matches the carousel spec's `isMobile` breakpoint. */
export const MOBILE_BREAKPOINT = 640;

export type Responsive = {
  width: number;
  height: number;
  isCompact: boolean;
  isMobile: boolean;
  isWide: boolean;
  isLandscape: boolean;
  /** Horizontal page gutter. */
  gutter: number;
  /** Max width for reading columns on large screens. */
  contentWidth: number;
  /** `n` percent of the window width. */
  vw: (n: number) => number;
  /** CSS-style clamp(min, n vw, max). */
  clampVw: (min: number, n: number, max: number) => number;
};

export function useResponsive(): Responsive {
  const { width, height } = useWindowDimensions();

  return useMemo(() => {
    const vw = (n: number) => (width * n) / 100;
    const isWide = width > WIDE_BREAKPOINT;
    const gutter = width < 360 ? 18 : isWide ? Math.max(40, vw(6)) : 24;
    return {
      width,
      height,
      isCompact: width < 360 || height < 640,
      isMobile: width < MOBILE_BREAKPOINT,
      isWide,
      isLandscape: width > height,
      gutter,
      contentWidth: Math.min(width - gutter * 2, 720),
      vw,
      clampVw: (min, n, max) => Math.min(max, Math.max(min, vw(n))),
    };
  }, [width, height]);
}
