import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedProps, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Defs, G, Line, LinearGradient, Path, Stop, Text as SvgText } from 'react-native-svg';

import { MOODS } from '../../constants/moods';
import { activityScore, clamp, moodToScore, otherScore, scoreEntry } from '../../domain/scoring';
import { useSvgId } from '../../hooks/useSvgId';
import { colors, fonts, motion } from '../../theme';
import type { MoodEntry } from '../../types/entry';

const AnimatedPath = Animated.createAnimatedComponent(Path);

const AXES = ['เช้า', 'ก่อนนอน', 'กิจกรรม', 'อื่น ๆ', 'พลังงาน'];

/** Five axes on a 0–100 scale, matching the original thesis chart. */
export function radarValues(entry: MoodEntry) {
  return [
    (moodToScore(entry.morningMood) / 7) * 100,
    (moodToScore(entry.nightMood) / 7) * 100,
    (activityScore(entry) / 3) * 100,
    (otherScore(entry) / 3) * 100,
    scoreEntry(entry).percent,
  ].map((v) => clamp(v, 0, 100));
}

type Props = { entry: MoodEntry; size: number };

export function RadarChart({ entry, size }: Props) {
  const reduceMotion = useReducedMotion();
  const values = radarValues(entry);
  const center = size / 2;
  const radius = size / 2 - 44;
  const n = AXES.length;
  const slice = (Math.PI * 2) / n;
  const grow = useSharedValue(0);
  const uid = useSvgId();

  useEffect(() => {
    grow.value = withTiming(1, { duration: reduceMotion ? 0 : 900, easing: motion.easing });
  }, [grow, reduceMotion]);

  const point = (i: number, value: number) => {
    const angle = slice * i - Math.PI / 2;
    const r = (value / 100) * radius;
    return { x: center + r * Math.cos(angle), y: center + r * Math.sin(angle) };
  };
  const ring = (value: number) =>
    AXES.map((_, i) => point(i, value))
      .map((p, i) => `${i ? 'L' : 'M'}${p.x},${p.y}`)
      .join(' ') + ' Z';

  const animatedProps = useAnimatedProps(() => {
    let d = '';
    for (let i = 0; i < n; i++) {
      const angle = slice * i - Math.PI / 2;
      const r = (values[i] / 100) * radius * grow.value;
      d += `${i ? 'L' : 'M'}${center + r * Math.cos(angle)},${center + r * Math.sin(angle)} `;
    }
    return { d: d + 'Z' };
  });

  const from = MOODS[entry.morningMood].palette.bg;
  const to = MOODS[entry.nightMood].palette.bg;

  return (
    <View accessibilityLabel={`กราฟเรดาร์: ${AXES.map((a, i) => `${a} ${Math.round(values[i])}`).join(', ')}`}>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id={`radar${uid}`} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={from} />
            <Stop offset="1" stopColor={to} />
          </LinearGradient>
        </Defs>
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <Path key={f} d={ring(f * 100)} stroke={colors.lineStrong} strokeWidth={1} fill="none" />
        ))}
        {AXES.map((_, i) => {
          const p = point(i, 100);
          return <Line key={i} x1={center} y1={center} x2={p.x} y2={p.y} stroke={colors.line} strokeWidth={1} />;
        })}
        <AnimatedPath
          animatedProps={animatedProps}
          fill={`url(#radar${uid})`}
          fillOpacity={0.55}
          stroke={colors.ink}
          strokeWidth={2.5}
          strokeLinejoin="round"
        />
        <G>
          {values.map((v, i) => {
            const p = point(i, v);
            return <Circle key={i} cx={p.x} cy={p.y} r={4.5} fill={colors.white} stroke={colors.ink} strokeWidth={2} />;
          })}
        </G>
        {AXES.map((label, i) => {
          const p = point(i, 122);
          const anchor = Math.abs(p.x - center) < 4 ? 'middle' : p.x > center ? 'start' : 'end';
          return (
            <SvgText
              key={label}
              x={p.x}
              y={p.y + 4}
              fontSize={13}
              fontFamily={fonts.bodySemiBold}
              fill={colors.inkSoft}
              textAnchor={anchor}
            >
              {label}
            </SvgText>
          );
        })}
      </Svg>
    </View>
  );
}
