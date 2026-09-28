import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { fonts } from '../../theme';

/** Three "z"s drifting up and fading, beside a sleepy character's cap. */
export function SleepyZ({ left, top }: { left: number; top: number }) {
  return (
    <View pointerEvents="none" style={[styles.anchor, { left, top }]}>
      <Z size={22} delay={0} />
      <Z size={30} delay={900} />
      <Z size={38} delay={1800} />
    </View>
  );
}

function Z({ size, delay }: { size: number; delay: number }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withDelay(delay, withRepeat(withTiming(1, { duration: 2700, easing: Easing.out(Easing.quad) }), -1));
    return () => cancelAnimation(t);
  }, [t, delay]);
  const style = useAnimatedStyle(() => ({
    opacity: t.value < 0.2 ? t.value * 5 : 1 - (t.value - 0.2) / 0.8,
    transform: [{ translateX: t.value * 26 }, { translateY: -t.value * 90 }, { rotate: `${-12 + t.value * 18}deg` }],
  }));
  return <Animated.Text style={[styles.z, { fontSize: size, lineHeight: size * 1.2 }, style]}>z</Animated.Text>;
}

const styles = StyleSheet.create({
  anchor: { position: 'absolute', width: 1, height: 1, zIndex: 30 },
  z: { position: 'absolute', left: 0, top: 0, fontFamily: fonts.display, color: '#FFFFFF' },
});
