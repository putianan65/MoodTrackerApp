import React from 'react';
import { Pressable, PressableProps, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { hitSlop, motion } from '../../theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = Omit<PressableProps, 'style'> & {
  style?: StyleProp<ViewStyle>;
  /** Scale while pressed. The carousel spec uses 1.08 for its arrow buttons. */
  pressedScale?: number;
  /** Background shown while pressed. */
  pressedColor?: string;
};

export function PressableScale({
  style,
  pressedScale = 0.96,
  pressedColor,
  onPressIn,
  onPressOut,
  disabled,
  ...rest
}: Props) {
  const pressed = useSharedValue(0);
  // Press tint fades from the element's own background, not from transparent.
  const restColor = (StyleSheet.flatten(style)?.backgroundColor as string | undefined) ?? 'rgba(255,255,255,0)';

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + (pressedScale - 1) * pressed.value }],
    ...(pressedColor
      ? { backgroundColor: interpolateColor(pressed.value, [0, 1], [restColor, pressedColor]) }
      : null),
  }));

  return (
    <AnimatedPressable
      hitSlop={hitSlop}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPressIn={(e) => {
        pressed.value = withTiming(1, { duration: motion.fast });
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        pressed.value = withTiming(0, { duration: motion.fast });
        onPressOut?.(e);
      }}
      style={[style, animatedStyle]}
      {...rest}
    />
  );
}
