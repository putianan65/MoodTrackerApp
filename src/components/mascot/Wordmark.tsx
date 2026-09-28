import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { SharedValue, useAnimatedStyle } from 'react-native-reanimated';

import { colors, fonts } from '../../theme';

type Props = {
  size: number;
  angle: SharedValue<number>;
  engaged: SharedValue<number>;
};

/**
 * "mood tracker" wordmark set in Bagel Fat One; the two o's are googly eyes
 * that look the same way as the mascot while a finger is steering it.
 */
export function Wordmark({ size, angle, engaged }: Props) {
  const eye = size * 0.62;
  return (
    <View
      style={styles.row}
      accessible
      accessibilityRole="header"
      accessibilityLabel="Mood Tracker"
    >
      <Text style={[styles.word, { fontSize: size, lineHeight: size * 1.05 }]}>m</Text>
      <GooglyEye size={eye} angle={angle} engaged={engaged} baseline={size * 0.08} />
      <GooglyEye size={eye} angle={angle} engaged={engaged} baseline={size * 0.08} />
      <Text style={[styles.word, { fontSize: size, lineHeight: size * 1.05 }]}>d</Text>
      <Text style={[styles.word, styles.tracker, { fontSize: size, lineHeight: size * 1.05 }]}> tracker</Text>
    </View>
  );
}

function GooglyEye({
  size,
  angle,
  engaged,
  baseline,
}: {
  size: number;
  angle: SharedValue<number>;
  engaged: SharedValue<number>;
  baseline: number;
}) {
  const pupil = size * 0.5;
  const travel = (size - pupil) / 2 - size * 0.08;
  const pupilStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: Math.cos(angle.value) * travel * engaged.value },
      // Idle: resting slightly low, like the mascot.
      { translateY: Math.sin(angle.value) * travel * engaged.value + travel * 0.45 * (1 - engaged.value) },
    ],
  }));

  return (
    <View
      style={[
        styles.eye,
        { width: size, height: size, borderRadius: size / 2, borderWidth: size * 0.11, marginBottom: baseline },
      ]}
    >
      <Animated.View
        style={[styles.pupil, { width: pupil, height: pupil, borderRadius: pupil / 2 }, pupilStyle]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', flexWrap: 'nowrap' },
  word: { fontFamily: fonts.headlineLatin, color: colors.ink, letterSpacing: -1 },
  tracker: { color: colors.ink },
  eye: {
    backgroundColor: colors.white,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 1,
  },
  pupil: { backgroundColor: colors.ink },
});
