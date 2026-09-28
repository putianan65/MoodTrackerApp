import { Pencil, Sparkle } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  SharedValue,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Rect } from 'react-native-svg';

import { MOOD_ORDER, MOODS } from '../../constants/moods';
import { colors } from '../../theme';
import type { MoodColor } from '../../types/entry';
import { MoodCharacter } from '../mood/MoodCharacter';

export type MenuMascotKind = 'history' | 'weekly' | 'meaning' | 'edit' | 'latest';

const MOOD_FOR: Record<Exclude<MenuMascotKind, 'meaning'>, MoodColor> = {
  history: 'blue',
  weekly: 'green',
  edit: 'orange',
  latest: 'yellow',
};

type Props = {
  kind: MenuMascotKind;
  size?: number;
  /** Bumped by the parent tile on press to make the character hop. */
  jump?: SharedValue<number>;
  reduceMotion?: boolean;
};

/**
 * Animated menu art: a mood character peeking out of a coloured bubble with a
 * small prop that explains the destination. Purely decorative.
 */
export function MenuMascot({ kind, size = 60, jump, reduceMotion = false }: Props) {
  const [mood, setMood] = useState<MoodColor>(kind === 'meaning' ? 'green' : MOOD_FOR[kind]);
  const bob = useSharedValue(0);

  // "Colour meaning" cycles through all seven moods.
  useEffect(() => {
    if (kind !== 'meaning' || reduceMotion) return;
    const id = setInterval(() => {
      setMood((m) => MOOD_ORDER[(MOOD_ORDER.indexOf(m) + 1) % MOOD_ORDER.length]);
    }, 1600);
    return () => clearInterval(id);
  }, [kind, reduceMotion]);

  useEffect(() => {
    if (reduceMotion) return;
    const offset = { history: 0, weekly: 300, meaning: 600, edit: 900, latest: 900 }[kind];
    bob.value = withDelay(
      offset,
      withRepeat(withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.sin) }), -1, true),
    );
    return () => cancelAnimation(bob);
  }, [bob, kind, reduceMotion]);

  const characterStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: size * 0.1 - bob.value * 3 - (jump?.value ?? 0) * size * 0.18 }],
  }));

  const character = size * 0.84;
  return (
    <View
      style={{ width: size, height: size }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <View style={[styles.bubble, { width: size, height: size, borderRadius: size / 2, backgroundColor: MOODS[mood].palette.bg }]}>
        <Animated.View style={characterStyle}>
          <Animated.View key={mood} entering={kind === 'meaning' ? FadeIn.duration(400) : undefined}>
            <MoodCharacter mood={mood} size={character} alive={!reduceMotion} />
          </Animated.View>
        </Animated.View>
      </View>
      {kind === 'history' ? <CalendarProp size={size} reduceMotion={reduceMotion} /> : null}
      {kind === 'weekly' ? <BarsProp size={size} reduceMotion={reduceMotion} /> : null}
      {kind === 'edit' ? <PencilProp size={size} reduceMotion={reduceMotion} /> : null}
      {kind === 'latest' ? <SparkleProp size={size} reduceMotion={reduceMotion} /> : null}
    </View>
  );
}

/** Loops a 0→1→0 value forever. */
function useLoop(duration: number, reduceMotion: boolean, delay = 0) {
  const t = useSharedValue(0);
  useEffect(() => {
    if (reduceMotion) return;
    t.value = withDelay(delay, withRepeat(withTiming(1, { duration, easing: Easing.inOut(Easing.sin) }), -1, true));
    return () => cancelAnimation(t);
  }, [t, duration, reduceMotion, delay]);
  return t;
}

function CalendarProp({ size, reduceMotion }: { size: number; reduceMotion: boolean }) {
  const t = useLoop(900, reduceMotion);
  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${-14 + t.value * 22}deg` }] }));
  const s = size * 0.42;
  return (
    <Animated.View style={[styles.prop, { right: -s * 0.3, top: -s * 0.2 }, style]}>
      <Svg width={s} height={s} viewBox="0 0 24 24">
        <Rect x={2} y={3} width={20} height={19} rx={4} fill={colors.white} stroke={colors.ink} strokeWidth={1.6} />
        <Rect x={2} y={3} width={20} height={6} rx={3} fill={colors.negative} />
        <Rect x={6} y={12} width={3} height={3} rx={1} fill={colors.ink} />
        <Rect x={11} y={12} width={3} height={3} rx={1} fill={colors.ink} />
        <Rect x={16} y={12} width={3} height={3} rx={1} fill={MOODS.blue.palette.bg} />
        <Rect x={6} y={16.5} width={3} height={3} rx={1} fill={colors.ink} />
      </Svg>
    </Animated.View>
  );
}

function Bar({ height, delay, reduceMotion, color }: { height: number; delay: number; reduceMotion: boolean; color: string }) {
  const t = useLoop(800, reduceMotion, delay);
  const style = useAnimatedStyle(() => ({ height: height * (0.35 + t.value * 0.65) }));
  return <Animated.View style={[styles.bar, { backgroundColor: color }, style]} />;
}

function BarsProp({ size, reduceMotion }: { size: number; reduceMotion: boolean }) {
  const h = size * 0.42;
  return (
    <View style={[styles.prop, styles.bars, { right: -size * 0.16, bottom: 0, height: h, padding: 3 }]}>
      <Bar height={h * 0.55} delay={0} reduceMotion={reduceMotion} color={MOODS.yellow.palette.bg} />
      <Bar height={h * 0.8} delay={200} reduceMotion={reduceMotion} color={MOODS.blue.palette.bg} />
      <Bar height={h} delay={400} reduceMotion={reduceMotion} color={colors.positive} />
    </View>
  );
}

function PencilProp({ size, reduceMotion }: { size: number; reduceMotion: boolean }) {
  const t = useLoop(380, reduceMotion);
  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: -2 + t.value * 4 }, { rotate: `${-18 + t.value * 16}deg` }],
  }));
  const s = size * 0.4;
  return (
    <Animated.View style={[styles.prop, styles.chip, { width: s, height: s, borderRadius: s / 2, right: -s * 0.3, top: -s * 0.15 }, style]}>
      <Pencil color={colors.ink} size={s * 0.55} strokeWidth={2.4} />
    </Animated.View>
  );
}

function Twinkle({ s, delay, reduceMotion, pos }: { s: number; delay: number; reduceMotion: boolean; pos: object }) {
  const t = useLoop(700, reduceMotion, delay);
  const style = useAnimatedStyle(() => ({ opacity: 0.35 + t.value * 0.65, transform: [{ scale: 0.6 + t.value * 0.5 }, { rotate: `${t.value * 45}deg` }] }));
  return (
    <Animated.View style={[styles.prop, pos, style]}>
      <Sparkle color={colors.heart} fill={colors.heart} size={s} strokeWidth={1.5} />
    </Animated.View>
  );
}

function SparkleProp({ size, reduceMotion }: { size: number; reduceMotion: boolean }) {
  return (
    <>
      <Twinkle s={size * 0.34} delay={0} reduceMotion={reduceMotion} pos={{ right: -size * 0.18, top: -size * 0.1 }} />
      <Twinkle s={size * 0.22} delay={350} reduceMotion={reduceMotion} pos={{ left: -size * 0.12, top: size * 0.05 }} />
    </>
  );
}

const styles = StyleSheet.create({
  bubble: { overflow: 'hidden', alignItems: 'center', justifyContent: 'flex-end' },
  prop: { position: 'absolute' },
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    backgroundColor: colors.white,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.ink,
  },
  bar: { width: 5, borderRadius: 2 },
  chip: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
