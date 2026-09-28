import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, G, Line, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

import { useSvgId } from '../../hooks/useSvgId';
import { colors } from '../../theme';
import type { Phase } from '../../theme/phase';

type Props = {
  phase: Phase;
  width: number;
  height: number;
  reduceMotion?: boolean;
};

/**
 * Decorative sky behind a scene. Morning: dawn glow, turning sun, drifting
 * clouds. Day: blue sky wash with clouds. Night: twinkling stars, glowing
 * crescent moon and an occasional shooting star. Never intercepts touches.
 */
export function Sky({ phase, width, height, reduceMotion = false }: Props) {
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { zIndex: 1 }]}>
      {phase === 'night' ? (
        <NightSky width={width} height={height} reduceMotion={reduceMotion} />
      ) : (
        <DaySky phase={phase} width={width} height={height} reduceMotion={reduceMotion} />
      )}
    </View>
  );
}

// ─── Day / morning ──────────────────────────────────────────────────────────

function DaySky({ phase, width, height, reduceMotion }: Props) {
  const morning = phase === 'morning';
  const uid = useSvgId();
  const sunSize = Math.min(width * (morning ? 0.34 : 0.3), 220);
  // Daytime: tucked into the top-right corner, partly off-screen.
  const sunX = morning ? width * 0.8 - sunSize / 2 : width - sunSize * 0.62;
  const sunY = morning ? height * 0.1 - sunSize / 2 + 40 : -sunSize * 0.38;

  return (
    <>
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id={`glow${uid}`} cx="80%" cy={morning ? '14%' : '6%'} r="70%">
            <Stop offset="0" stopColor={morning ? colors.dawn : '#FFFFFF'} stopOpacity={morning ? 0.7 : 0.5} />
            <Stop offset="1" stopColor={morning ? colors.dawn : '#FFFFFF'} stopOpacity={0} />
          </RadialGradient>
          <LinearGradient id={`day${uid}`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.sky} stopOpacity={1} />
            <Stop offset="0.55" stopColor={colors.sky} stopOpacity={0.6} />
            <Stop offset="1" stopColor={colors.sky} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        {!morning ? <Rect x={0} y={0} width={width} height={height} fill={`url(#day${uid})`} /> : null}
        <Rect x={0} y={0} width={width} height={height} fill={`url(#glow${uid})`} />
      </Svg>
      <Sun size={sunSize} left={sunX} top={sunY} reduceMotion={reduceMotion} />
      <Cloud width={width * 0.36} top={height * (morning ? 0.08 : 0.18)} span={width} duration={46000} delay={0} reduceMotion={reduceMotion} />
      <Cloud width={width * 0.24} top={height * (morning ? 0.3 : 0.52)} span={width} duration={62000} delay={-24000} reduceMotion={reduceMotion} opacity={0.7} />
      {!morning ? (
        <Cloud width={width * 0.2} top={height * 0.04} span={width} duration={54000} delay={-40000} reduceMotion={reduceMotion} opacity={0.8} />
      ) : null}
    </>
  );
}

function Sun({ size, left, top, reduceMotion }: { size: number; left: number; top: number; reduceMotion?: boolean }) {
  const spin = useSharedValue(0);
  useEffect(() => {
    if (reduceMotion) return;
    spin.value = withRepeat(withTiming(1, { duration: 60000, easing: Easing.linear }), -1);
    return () => cancelAnimation(spin);
  }, [spin, reduceMotion]);
  const rays = useAnimatedStyle(() => ({ transform: [{ rotate: `${spin.value * 360}deg` }] }));

  const c = size / 2;
  return (
    <View style={{ position: 'absolute', left, top, width: size, height: size }}>
      <Animated.View style={[StyleSheet.absoluteFill, rays]}>
        <Svg width={size} height={size}>
          {Array.from({ length: 12 }, (_, i) => {
            const a = (i / 12) * Math.PI * 2;
            return (
              <Line
                key={i}
                x1={c + Math.cos(a) * c * 0.56}
                y1={c + Math.sin(a) * c * 0.56}
                x2={c + Math.cos(a) * c * 0.86}
                y2={c + Math.sin(a) * c * 0.86}
                stroke={colors.sun}
                strokeWidth={size * 0.045}
                strokeLinecap="round"
                opacity={0.9}
              />
            );
          })}
        </Svg>
      </Animated.View>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={c} cy={c} r={c * 0.44} fill="#FFF6D2" />
        <Circle cx={c} cy={c} r={c * 0.36} fill={colors.sun} />
      </Svg>
    </View>
  );
}

function Cloud({
  width,
  top,
  span,
  duration,
  delay,
  reduceMotion,
  opacity = 0.92,
}: {
  width: number;
  top: number;
  span: number;
  duration: number;
  delay: number;
  reduceMotion?: boolean;
  opacity?: number;
}) {
  // `delay` < 0 starts the cloud part-way through its journey.
  const x = useSharedValue((-delay / duration) % 1);
  useEffect(() => {
    if (reduceMotion) return;
    const start = x.value;
    x.value = withSequence(
      withTiming(1, { duration: (1 - start) * duration, easing: Easing.linear }),
      withRepeat(withSequence(withTiming(0, { duration: 0 }), withTiming(1, { duration, easing: Easing.linear })), -1),
    );
    return () => cancelAnimation(x);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduceMotion]);
  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: -width + x.value * (span + width) }],
  }));
  const h = width * 0.5;
  return (
    <Animated.View style={[{ position: 'absolute', top, left: 0, opacity }, style]}>
      <Svg width={width} height={h} viewBox="0 0 110 55">
        <G fill="#FFFFFF">
          <Circle cx={30} cy={32} r={18} />
          <Circle cx={56} cy={22} r={22} />
          <Circle cx={82} cy={32} r={17} />
          <Rect x={12} y={30} width={88} height={20} rx={10} />
        </G>
      </Svg>
    </Animated.View>
  );
}

// ─── Night ──────────────────────────────────────────────────────────────────

function seeded(n: number) {
  let s = 20260928;
  const rnd = () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
  return Array.from({ length: n }, () => ({ x: rnd(), y: rnd(), r: 0.6 + rnd() * 1.6, group: Math.floor(rnd() * 3) }));
}

function NightSky({ width, height, reduceMotion }: Omit<Props, 'phase'>) {
  const uid = useSvgId();
  const stars = useMemo(() => seeded(64), []);
  const moon = Math.min(width * 0.2, 130);
  const mx = width * 0.8;
  const my = Math.max(90, height * 0.11) + moon * 0.2;

  return (
    <>
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id={`moon${uid}`} cx={mx} cy={my} r={moon * 1.6} gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor="#FFF4C8" stopOpacity={0.35} />
            <Stop offset="1" stopColor="#FFF4C8" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={mx} cy={my} r={moon * 1.6} fill={`url(#moon${uid})`} />
        <Path
          d={`M${mx} ${my - moon / 2} A${moon / 2} ${moon / 2} 0 1 0 ${mx} ${my + moon / 2} A${moon * 0.62} ${moon * 0.62} 0 0 1 ${mx} ${my - moon / 2} Z`}
          fill="#FFF1C1"
          transform={`rotate(-20 ${mx} ${my})`}
        />
      </Svg>
      {[0, 1, 2].map((group) => (
        <StarGroup
          key={group}
          stars={stars.filter((s) => s.group === group)}
          width={width}
          height={height * 0.7}
          delay={group * 900}
          reduceMotion={reduceMotion}
        />
      ))}
      {!reduceMotion ? <ShootingStar width={width} height={height} /> : null}
    </>
  );
}

function StarGroup({
  stars,
  width,
  height,
  delay,
  reduceMotion,
}: {
  stars: { x: number; y: number; r: number }[];
  width: number;
  height: number;
  delay: number;
  reduceMotion?: boolean;
}) {
  const o = useSharedValue(1);
  useEffect(() => {
    if (reduceMotion) return;
    o.value = withDelay(
      delay,
      withRepeat(withSequence(withTiming(0.25, { duration: 1400 }), withTiming(1, { duration: 1400 })), -1),
    );
    return () => cancelAnimation(o);
  }, [o, delay, reduceMotion]);
  const style = useAnimatedStyle(() => ({ opacity: o.value }));
  return (
    <Animated.View style={[StyleSheet.absoluteFill, style]}>
      <Svg width={width} height={height}>
        {stars.map((s, i) => (
          <Circle key={i} cx={s.x * width} cy={s.y * height} r={s.r} fill="#FFFFFF" />
        ))}
      </Svg>
    </Animated.View>
  );
}

function ShootingStar({ width, height }: { width: number; height: number }) {
  const uid = useSvgId();
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withRepeat(
      withSequence(withDelay(5200, withTiming(1, { duration: 900, easing: Easing.out(Easing.quad) })), withTiming(0, { duration: 0 })),
      -1,
    );
    return () => cancelAnimation(t);
  }, [t]);
  const style = useAnimatedStyle(() => ({
    opacity: t.value === 0 ? 0 : Math.sin(t.value * Math.PI),
    transform: [{ translateX: -t.value * width * 0.45 }, { translateY: t.value * height * 0.16 }, { rotate: '-20deg' }],
  }));
  return (
    <Animated.View style={[{ position: 'absolute', left: width * 0.62, top: height * 0.06 }, style]}>
      <Svg width={90} height={4}>
        <Defs>
          <LinearGradient id={`trail${uid}`} x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity={1} />
            <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Rect x={0} y={0} width={90} height={3} rx={1.5} fill={`url(#trail${uid})`} />
      </Svg>
    </Animated.View>
  );
}
