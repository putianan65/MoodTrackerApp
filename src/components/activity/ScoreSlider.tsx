import { Minus, Plus } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolateColor,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { haptics } from '../../services/haptics';
import { colors, fonts, motion } from '../../theme';
import { CircleButton } from '../ui/CircleButton';
import { Txt } from '../ui/Txt';

type Props = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
};

const THUMB = 30;

/** Draggable −10..+10 rating with step buttons and screen-reader adjust actions. */
export function ScoreSlider({ value, onChange, min = -10, max = 10 }: Props) {
  const [trackWidth, setTrackWidth] = useState(0);
  const range = max - min;
  const pos = useSharedValue((value - min) / range);
  const width = useSharedValue(0);

  useEffect(() => {
    pos.value = withTiming((value - min) / range, { duration: 180, easing: motion.easing });
  }, [value, min, range, pos]);

  const commit = (next: number) => {
    const clamped = Math.max(min, Math.min(max, Math.round(next)));
    if (clamped !== value) {
      haptics.select();
      onChange(clamped);
    }
  };

  const fromX = (x: number) => {
    'worklet';
    const usable = Math.max(1, width.value - THUMB);
    return Math.min(1, Math.max(0, (x - THUMB / 2) / usable));
  };

  const pan = Gesture.Pan()
    .activeOffsetX([-6, 6])
    .failOffsetY([-12, 12])
    .onUpdate((e) => {
      pos.value = fromX(e.x);
      runOnJS(commit)(min + pos.value * range);
    });
  const tap = Gesture.Tap().onEnd((e) => {
    runOnJS(commit)(min + fromX(e.x) * range);
  });

  const onLayout = (e: LayoutChangeEvent) => {
    setTrackWidth(e.nativeEvent.layout.width);
    width.value = e.nativeEvent.layout.width;
  };

  const zero = 0.5 * (trackWidth - THUMB) + THUMB / 2;

  const fillStyle = useAnimatedStyle(() => {
    const x = pos.value * (width.value - THUMB) + THUMB / 2;
    const center = 0.5 * (width.value - THUMB) + THUMB / 2;
    return {
      left: Math.min(x, center),
      width: Math.abs(x - center),
      backgroundColor: interpolateColor(pos.value, [0, 0.5, 1], [colors.negative, colors.inkSoft, colors.positive]),
    };
  });
  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: pos.value * (width.value - THUMB) }],
  }));

  const tone = value > 0 ? colors.positive : value < 0 ? colors.negative : colors.ink;

  return (
    <View>
      <View style={styles.readout}>
        <CircleButton icon={Minus} tone="dark" size={44} label="ลดคะแนน" onPress={() => commit(value - 1)} disabled={value <= min} />
        <View style={styles.value}>
          <Txt style={[styles.number, { color: tone }]}>{value > 0 ? `+${value}` : String(value)}</Txt>
          <Txt variant="caption" color={colors.muted}>
            คะแนน (−10 ถึง +10)
          </Txt>
        </View>
        <CircleButton icon={Plus} tone="dark" size={44} label="เพิ่มคะแนน" onPress={() => commit(value + 1)} disabled={value >= max} />
      </View>

      <GestureDetector gesture={Gesture.Race(pan, tap)}>
        <View
          onLayout={onLayout}
          style={styles.hit}
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel="ให้คะแนนกิจกรรมนี้"
          accessibilityValue={{ min, max, now: value }}
          accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
          onAccessibilityAction={(e) => commit(value + (e.nativeEvent.actionName === 'increment' ? 1 : -1))}
        >
          <View style={styles.track} />
          {trackWidth > 0 ? <View style={[styles.zero, { left: zero - 1 }]} /> : null}
          <Animated.View style={[styles.fill, fillStyle]} />
          <Animated.View style={[styles.thumb, thumbStyle]} />
        </View>
      </GestureDetector>
      <View style={styles.scale}>
        <Txt variant="caption" color={colors.muted}>−10 แย่มาก</Txt>
        <Txt variant="caption" color={colors.muted}>0</Txt>
        <Txt variant="caption" color={colors.muted}>+10 ดีมาก</Txt>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  readout: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  value: { alignItems: 'center' },
  number: { fontFamily: fonts.display, fontSize: 52, lineHeight: 58 },
  hit: { height: 48, justifyContent: 'center', marginTop: 10 },
  track: { height: 8, borderRadius: 4, backgroundColor: colors.paperDeep, marginHorizontal: THUMB / 2 },
  zero: { position: 'absolute', width: 2, height: 18, borderRadius: 1, backgroundColor: colors.lineStrong },
  fill: { position: 'absolute', height: 8, borderRadius: 4 },
  thumb: {
    position: 'absolute',
    left: 0,
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    backgroundColor: colors.white,
    borderWidth: 3,
    borderColor: colors.ink,
  },
  scale: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 },
});
