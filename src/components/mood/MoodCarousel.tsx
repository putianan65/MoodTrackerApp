import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Extrapolation,
  SharedValue,
  DerivedValue,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

import type { MoodColor } from '../../types/entry';
import { CHARACTER_RATIO, Gaze, MoodCharacter } from './MoodCharacter';

type Props = {
  moods: readonly MoodColor[];
  /** Continuous, unbounded index of the centred mood (animated). */
  progress: SharedValue<number>;
  gaze: DerivedValue<Gaze>;
  width: number;
  height: number;
  isMobile: boolean;
  reduceMotion: boolean;
  outfit?: 'pajamas';
};

/**
 * Depth carousel: the centred mood stands large and sharp; neighbours sit
 * smaller, higher, softened with blur, and fade out towards the back. Every
 * position is derived from `progress`, so arrow presses, swipes and live
 * dragging all share one 650ms cubic-bezier(0.4, 0, 0.2, 1) motion.
 */
/** Size and feet position of the centred character, shared with gaze maths. */
export function carouselLayout(width: number, height: number, isMobile: boolean) {
  const size = isMobile ? Math.min(width * 0.78, height * 0.42) : Math.min(width * 0.34, height * 0.6);
  const baseline = isMobile ? height * 0.74 : height * 0.95;
  const itemHeight = size * CHARACTER_RATIO;
  // Eye line sits at y=104 in the character's 232-unit tall box (origin −12).
  const eyeY = baseline - itemHeight + ((104 + 12) / 232) * itemHeight;
  return { size, baseline, eyeY };
}

export function MoodCarousel({ moods, progress, gaze, width, height, isMobile, reduceMotion, outfit }: Props) {
  const count = moods.length;
  const { size, baseline } = carouselLayout(width, height, isMobile);

  const geometry = {
    x: isMobile ? [0, 0.41, 0.29, 0.12, 0] : [0, 0.23, 0.14, 0.06, 0],
    scale: isMobile ? [1, 0.36, 0.26, 0.18, 0.14] : [1, 0.3, 0.22, 0.16, 0.12],
    lift: isMobile ? [0, 0.12, 0.19, 0.23, 0.23] : [0, 0.14, 0.2, 0.22, 0.22],
    opacity: [1, 0.85, 0.7, 0, 0],
  };

  const float = useSharedValue(0);
  useEffect(() => {
    if (reduceMotion) return;
    float.value = withRepeat(withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [float, reduceMotion]);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {moods.map((mood, index) => (
        <CarouselItem
          key={mood}
          mood={mood}
          index={index}
          count={count}
          progress={progress}
          gaze={gaze}
          float={float}
          size={size}
          baseline={baseline}
          width={width}
          height={height}
          geometry={geometry}
          outfit={outfit}
        />
      ))}
    </View>
  );
}

type ItemProps = {
  mood: MoodColor;
  index: number;
  count: number;
  progress: SharedValue<number>;
  gaze: DerivedValue<Gaze>;
  float: SharedValue<number>;
  size: number;
  baseline: number;
  width: number;
  height: number;
  geometry: { x: number[]; scale: number[]; lift: number[]; opacity: number[] };
  outfit?: 'pajamas';
};

const STOPS = [0, 1, 2, 3, 3.5];

function CarouselItem({
  mood,
  index,
  count,
  progress,
  gaze,
  float,
  size,
  baseline,
  width,
  height,
  geometry,
  outfit,
}: ItemProps) {
  const itemHeight = size * CHARACTER_RATIO;

  const containerStyle = useAnimatedStyle(() => {
    // Signed distance from the centre, wrapped into (−count/2, count/2].
    let d = (((index - progress.value) % count) + count) % count;
    if (d > count / 2) d -= count;
    const a = Math.abs(d);
    const sign = d < 0 ? -1 : 1;
    const scale = interpolate(a, STOPS, geometry.scale, Extrapolation.CLAMP);
    const x = interpolate(a, STOPS, geometry.x, Extrapolation.CLAMP) * width * sign;
    const lift = interpolate(a, STOPS, geometry.lift, Extrapolation.CLAMP) * height;
    const bob = (1 - Math.min(1, a)) * float.value * -8;
    return {
      zIndex: Math.round(100 - a * 10),
      opacity: interpolate(a, STOPS, geometry.opacity, Extrapolation.CLAMP),
      transform: [
        { translateX: x },
        { translateY: (1 - scale) * (itemHeight / 2) - lift + bob },
        { scale },
      ],
    };
  });

  // Cross-fade between the sharp and the pre-blurred copy as an item leaves centre.
  const sharpStyle = useAnimatedStyle(() => {
    let d = (((index - progress.value) % count) + count) % count;
    if (d > count / 2) d -= count;
    return { opacity: interpolate(Math.abs(d), [0.3, 0.8], [1, 0], Extrapolation.CLAMP) };
  });
  const blurStyle = useAnimatedStyle(() => {
    let d = (((index - progress.value) % count) + count) % count;
    if (d > count / 2) d -= count;
    return { opacity: interpolate(Math.abs(d), [0.1, 0.5], [0, 1], Extrapolation.CLAMP) };
  });

  return (
    <Animated.View
      style={[
        styles.item,
        { width: size, height: itemHeight, left: width / 2 - size / 2, top: baseline - itemHeight },
        containerStyle,
      ]}
    >
      <Animated.View style={[StyleSheet.absoluteFill, sharpStyle]}>
        <MoodCharacter mood={mood} size={size} gaze={gaze} outfit={outfit} />
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, blurStyle]}>
        <MoodCharacter mood={mood} size={size} alive={false} blur={5} outfit={outfit} />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  item: { position: 'absolute' },
});
