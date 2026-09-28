import React from 'react';
import { StyleSheet, Text, TextProps } from 'react-native';

import { colors, fonts } from '../../theme';

export type TxtVariant =
  | 'display'
  | 'headline'
  | 'title'
  | 'body'
  | 'bodyStrong'
  | 'label'
  | 'caption'
  | 'overline';

type Props = TextProps & {
  variant?: TxtVariant;
  color?: string;
  size?: number;
  align?: 'left' | 'center' | 'right';
};

/**
 * Typography primitive. Thai glyphs carry marks above and below the line, so
 * line heights here are slightly taller than the Latin reference specs.
 */
export function Txt({ variant = 'body', color = colors.ink, size, align, style, ...rest }: Props) {
  const base = variants[variant];
  const fontSize = size ?? base.fontSize;
  // Wide tracking suits Latin overlines but breaks up Thai syllables.
  const text = Array.isArray(rest.children) ? rest.children.join('') : rest.children;
  const thaiOverline = variant === 'overline' && typeof text === 'string' && THAI.test(text);
  return (
    <Text
      {...rest}
      style={[
        base,
        { color, fontSize, lineHeight: Math.round(fontSize * lineRatio[variant]) },
        thaiOverline && { letterSpacing: 0.2 },
        align && { textAlign: align },
        style,
      ]}
    />
  );
}

const THAI = /[฀-๿]/;

const lineRatio: Record<TxtVariant, number> = {
  display: 1,
  headline: 1.55,
  title: 1.6,
  body: 1.55,
  bodyStrong: 1.5,
  label: 1.4,
  caption: 1.5,
  overline: 1.3,
};

const variants = StyleSheet.create({
  display: { fontFamily: fonts.display, fontSize: 56, letterSpacing: -0.5, includeFontPadding: false },
  headline: { fontFamily: fonts.headline, fontSize: 28, letterSpacing: 0 },
  title: { fontFamily: fonts.title, fontSize: 19 },
  body: { fontFamily: fonts.body, fontSize: 16 },
  bodyStrong: { fontFamily: fonts.bodySemiBold, fontSize: 16 },
  label: { fontFamily: fonts.body, fontSize: 17 },
  caption: { fontFamily: fonts.body, fontSize: 13 },
  overline: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    letterSpacing: 2.2,
    textTransform: 'uppercase',
  },
});
