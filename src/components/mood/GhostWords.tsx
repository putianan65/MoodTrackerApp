import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Extrapolation, SharedValue, interpolate, useAnimatedStyle } from 'react-native-reanimated';

import { MOODS } from '../../constants/moods';
import { fonts } from '../../theme';
import type { MoodColor } from '../../types/entry';

type Props = {
  moods: readonly MoodColor[];
  progress: SharedValue<number>;
  width: number;
  /** Target font size; each word shrinks further if it would overflow. */
  fontSize: number;
  top: number;
  /** Per-mood text colour; white by default. */
  colorFor?: (mood: MoodColor) => string;
};

/** Average Bagel Fat One lowercase advance per character, in em. */
const DISPLAY_EM = 0.62;

/**
 * Giant white word behind the characters ("3D SHAPE" in the carousel spec).
 * Every mood has its own word; they cross-fade and drift with `progress`.
 */
export function GhostWords({ moods, progress, width, fontSize, top, colorFor }: Props) {
  return (
    <View pointerEvents="none" style={[styles.layer, { top }]}>
      {moods.map((mood, index) => (
        <GhostWord
          key={mood}
          word={MOODS[mood].word}
          color={colorFor?.(mood) ?? '#FFFFFF'}
          index={index}
          count={moods.length}
          progress={progress}
          width={width}
          fontSize={Math.min(fontSize, (width * 0.94) / (MOODS[mood].word.length * DISPLAY_EM))}
        />
      ))}
    </View>
  );
}

function GhostWord({
  word,
  color,
  index,
  count,
  progress,
  width,
  fontSize,
}: {
  word: string;
  color: string;
  index: number;
  count: number;
  progress: SharedValue<number>;
  width: number;
  fontSize: number;
}) {
  const style = useAnimatedStyle(() => {
    let d = (((index - progress.value) % count) + count) % count;
    if (d > count / 2) d -= count;
    return {
      opacity: interpolate(Math.abs(d), [0, 0.6], [1, 0], Extrapolation.CLAMP),
      transform: [
        { translateX: d * -width * 0.18 },
        { scale: interpolate(Math.abs(d), [0, 1], [1, 0.92], Extrapolation.CLAMP) },
      ],
    };
  });

  return (
    <Animated.Text
      numberOfLines={1}
      allowFontScaling={false}
      style={[styles.word, { color, fontSize, lineHeight: fontSize * 1.08, width }, style]}
    >
      {word}
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  layer: { position: 'absolute', left: 0, right: 0, alignItems: 'center', zIndex: 2 },
  word: {
    position: 'absolute',
    fontFamily: fonts.display,
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -1,
    includeFontPadding: false,
  },
});
