import React from 'react';
import { StyleSheet, View } from 'react-native';

import { MOOD_ORDER, MOODS } from '../../constants/moods';
import { colors, fonts, radii } from '../../theme';
import type { MoodColor } from '../../types/entry';
import { PressableScale } from '../ui/PressableScale';
import { Txt } from '../ui/Txt';
import { MoodCharacter } from './MoodCharacter';

type Props = {
  highlight?: MoodColor;
  onSelect?: (mood: MoodColor) => void;
  outfit?: 'pajamas';
};

/** The 7 colours with their meaning and research source. */
export function MoodMeaningList({ highlight, onSelect, outfit }: Props) {
  return (
    <View style={styles.list}>
      {MOOD_ORDER.map((key) => {
        const mood = MOODS[key];
        const active = key === highlight;
        return (
          <PressableScale
            key={key}
            disabled={!onSelect}
            onPress={() => onSelect?.(key)}
            accessibilityLabel={`${mood.label}: ${mood.description}`}
            style={[styles.row, active && { backgroundColor: mood.palette.bg }]}
          >
            <View style={[styles.avatar, { backgroundColor: mood.palette.bg }]}>
              <MoodCharacter mood={key} size={50} alive={false} outfit={outfit} />
            </View>
            <View style={styles.copy}>
              <View style={styles.titleRow}>
                <Txt variant="title" size={18} color={active ? colors.white : colors.ink}>
                  {mood.label}
                </Txt>
                <Txt
                  style={styles.word}
                  size={15}
                  color={active ? 'rgba(255,255,255,0.8)' : colors.muted}
                >
                  {mood.word}
                </Txt>
              </View>
              <Txt variant="body" size={14} color={active ? colors.white : colors.inkSoft}>
                {mood.description}
              </Txt>
              <Txt variant="caption" size={12} color={active ? 'rgba(255,255,255,0.75)' : colors.muted}>
                {mood.source}
              </Txt>
            </View>
          </PressableScale>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: radii.card,
    backgroundColor: colors.card,
    gap: 14,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'hidden',
    paddingBottom: 2,
  },
  copy: { flex: 1, gap: 2 },
  titleRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  word: { fontFamily: fonts.display, letterSpacing: 0.6 },
});
