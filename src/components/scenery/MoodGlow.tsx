import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Extrapolation, SharedValue, interpolate, useAnimatedStyle } from 'react-native-reanimated';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

import { MOODS } from '../../constants/moods';
import { useSvgId } from '../../hooks/useSvgId';
import type { MoodColor } from '../../types/entry';

type GlowProps = { color: string; cx: number; cy: number; radius: number; width: number; height: number };

/** Soft "night-light" pool of colour. */
export function Glow({ color, cx, cy, radius, width, height }: GlowProps) {
  const uid = useSvgId();
  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
      <Defs>
        <RadialGradient id={`glow${uid}`} cx={cx} cy={cy} r={radius} gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor={color} stopOpacity={0.75} />
          <Stop offset="0.45" stopColor={color} stopOpacity={0.32} />
          <Stop offset="1" stopColor={color} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Circle cx={cx} cy={cy} r={radius} fill={`url(#glow${uid})`} />
    </Svg>
  );
}

type Props = {
  moods: readonly MoodColor[];
  progress: SharedValue<number>;
  cx: number;
  cy: number;
  radius: number;
  width: number;
  height: number;
};

/**
 * Night picker: the scene stays navy and the active mood's colour glows behind
 * its character, cross-fading with the carousel position.
 */
export function MoodGlow({ moods, progress, ...geo }: Props) {
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { zIndex: 1 }]}>
      {moods.map((mood, index) => (
        <GlowLayer key={mood} index={index} count={moods.length} progress={progress} color={MOODS[mood].palette.bg} {...geo} />
      ))}
    </View>
  );
}

function GlowLayer({
  index,
  count,
  progress,
  ...glow
}: GlowProps & { index: number; count: number; progress: SharedValue<number> }) {
  const style = useAnimatedStyle(() => {
    let d = (((index - progress.value) % count) + count) % count;
    if (d > count / 2) d -= count;
    return { opacity: interpolate(Math.abs(d), [0, 0.8], [1, 0], Extrapolation.CLAMP) };
  });
  return (
    <Animated.View style={[StyleSheet.absoluteFill, style]}>
      <Glow {...glow} />
    </Animated.View>
  );
}
