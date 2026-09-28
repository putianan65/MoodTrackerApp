import React, { useEffect, useMemo } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedProps, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop, Text as SvgText } from 'react-native-svg';

import { useSvgId } from '../../hooks/useSvgId';
import { colors, fonts, motion } from '../../theme';
import { Txt } from '../ui/Txt';

const AnimatedPath = Animated.createAnimatedComponent(Path);

type Props = {
  /** 0–100 per day. */
  data: number[];
  labels: string[];
  /** Dot colour per day (e.g. that night's mood). */
  dotColors?: string[];
  width: number;
  height?: number;
};

const PAD = { top: 18, right: 18, bottom: 34, left: 36 };

/** Catmull-Rom → cubic Bézier for a smooth line through every point. */
function smoothPath(points: { x: number; y: number }[]) {
  if (points.length < 2) return '';
  let d = `M${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
    const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
    d += ` C${c1.x},${c1.y} ${c2.x},${c2.y} ${p2.x},${p2.y}`;
  }
  return d;
}

export function EnergyLineChart({ data, labels, dotColors, width, height = 220 }: Props) {
  const reduceMotion = useReducedMotion();
  const draw = useSharedValue(0);
  const uid = useSvgId();

  const geometry = useMemo(() => {
    const innerW = width - PAD.left - PAD.right;
    const innerH = height - PAD.top - PAD.bottom;
    const stepX = innerW / Math.max(data.length - 1, 1);
    const y = (v: number) => PAD.top + ((100 - v) / 100) * innerH;
    const points = data.map((v, i) => ({
      x: data.length === 1 ? PAD.left + innerW / 2 : PAD.left + i * stepX,
      y: y(v),
    }));
    const line = smoothPath(points);
    const area = line
      ? `${line} L${points[points.length - 1].x},${PAD.top + innerH} L${points[0].x},${PAD.top + innerH} Z`
      : '';
    let length = 0;
    for (let i = 1; i < points.length; i++) {
      length += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
    }
    return { points, line, area, y, length: length * 1.15 + 1 };
  }, [data, width, height]);

  useEffect(() => {
    draw.value = 0;
    draw.value = withTiming(1, { duration: reduceMotion ? 0 : 1100, easing: motion.easing });
  }, [geometry, draw, reduceMotion]);

  const lineProps = useAnimatedProps(() => ({
    strokeDashoffset: geometry.length * (1 - draw.value),
  }));

  if (!data.length) {
    return (
      <View style={{ height, alignItems: 'center', justifyContent: 'center' }}>
        <Txt color={colors.muted}>ไม่มีข้อมูล</Txt>
      </View>
    );
  }

  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id={`energy${uid}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={colors.lavender} stopOpacity={0.55} />
          <Stop offset="1" stopColor={colors.lavender} stopOpacity={0} />
        </LinearGradient>
      </Defs>
      {[0, 25, 50, 75, 100].map((v) => (
        <React.Fragment key={v}>
          <Line
            x1={PAD.left}
            x2={width - PAD.right}
            y1={geometry.y(v)}
            y2={geometry.y(v)}
            stroke={colors.lineStrong}
            strokeDasharray="3 5"
          />
          <SvgText x={PAD.left - 10} y={geometry.y(v) + 4} fontSize={11} fill={colors.muted} textAnchor="end" fontFamily={fonts.body}>
            {v}
          </SvgText>
        </React.Fragment>
      ))}
      {geometry.area ? <Path d={geometry.area} fill={`url(#energy${uid})`} /> : null}
      {geometry.line ? (
        <AnimatedPath
          d={geometry.line}
          stroke={colors.ink}
          strokeWidth={3}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${geometry.length} ${geometry.length}`}
          animatedProps={lineProps}
        />
      ) : null}
      {geometry.points.map((p, i) => (
        <Circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={7}
          fill={dotColors?.[i] ?? colors.ink}
          stroke={colors.white}
          strokeWidth={3}
        />
      ))}
      {labels.map((label, i) => (
        <SvgText
          key={i}
          x={geometry.points[i]?.x ?? 0}
          y={height - 10}
          fontSize={12}
          fill={colors.inkSoft}
          textAnchor="middle"
          fontFamily={fonts.body}
        >
          {label}
        </SvgText>
      ))}
    </Svg>
  );
}
