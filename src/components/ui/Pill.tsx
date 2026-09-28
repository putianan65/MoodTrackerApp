import type { LucideIcon } from 'lucide-react-native';
import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { colors, radii } from '../../theme';
import { Txt } from './Txt';

type Props = {
  children: React.ReactNode;
  /** `paper` sits on lavender surfaces, `glass` on a mood colour. */
  tone?: 'paper' | 'glass' | 'ink';
  dot?: string;
  icon?: LucideIcon;
  size?: number;
  style?: StyleProp<ViewStyle>;
};

/** Rounded badge from the studio spec: #f7f8fa pill, 100px radius, nowrap. */
export function Pill({ children, tone = 'paper', dot, icon: Icon, size = 14, style }: Props) {
  const toneStyle = tones[tone];
  return (
    <View style={[styles.pill, { height: Math.round(size * 2.15) }, toneStyle.box, style]}>
      {dot ? <View style={[styles.dot, { backgroundColor: dot }]} /> : null}
      {Icon ? <Icon color={toneStyle.text} size={size + 2} strokeWidth={2.25} style={styles.icon} /> : null}
      <Txt variant="body" size={size} color={toneStyle.text} numberOfLines={1} style={styles.text}>
        {children}
      </Txt>
    </View>
  );
}

const tones = {
  paper: { box: { backgroundColor: colors.badge }, text: colors.ink },
  glass: { box: { backgroundColor: 'rgba(255,255,255,0.22)' }, text: colors.white },
  ink: { box: { backgroundColor: colors.ink }, text: colors.white },
} as const;

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.pill,
    paddingHorizontal: 11,
  },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 7 },
  icon: { marginRight: 6 },
  text: { includeFontPadding: false },
});
