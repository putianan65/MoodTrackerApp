import type { StackCardInterpolationProps, StackNavigationOptions } from '@react-navigation/stack';
import { Animated, Easing } from 'react-native';

import { colors } from '../theme';

const ease = Easing.bezier(0.2, 0.8, 0.2, 1);
const clamp = 'clamp' as const;

const timing = (duration: number) => ({
  animation: 'timing' as const,
  config: { duration, easing: ease },
});

/** Shared "scene below" behaviour: the covered screen recedes a little. */
const recede = (next: StackCardInterpolationProps['next'], shift: number) =>
  next
    ? [
        { translateX: next.progress.interpolate({ inputRange: [0, 1], outputRange: [0, shift], extrapolate: clamp }) },
        { scale: next.progress.interpolate({ inputRange: [0, 1], outputRange: [1, 0.94], extrapolate: clamp }) },
      ]
    : [];

/** Slide in from the right while the page underneath drifts left and shrinks. */
function forParallaxSlide({ current, next, inverted, layouts: { screen } }: StackCardInterpolationProps) {
  const translateX = Animated.multiply(
    current.progress.interpolate({ inputRange: [0, 1], outputRange: [screen.width, 0], extrapolate: clamp }),
    inverted,
  );
  return {
    cardStyle: { transform: [{ translateX }, ...recede(next, -screen.width * 0.25)] },
    overlayStyle: {
      opacity: current.progress.interpolate({ inputRange: [0, 1], outputRange: [0, 0.3], extrapolate: clamp }),
    },
  };
}

/** Rise from the bottom and settle to full size — used to start a check-in. */
function forRise({ current, next, layouts: { screen } }: StackCardInterpolationProps) {
  return {
    cardStyle: {
      transform: [
        {
          translateY: current.progress.interpolate({
            inputRange: [0, 1],
            outputRange: [screen.height * 0.6, 0],
            extrapolate: clamp,
          }),
        },
        { scale: current.progress.interpolate({ inputRange: [0, 1], outputRange: [0.86, 1], extrapolate: clamp }) },
        ...recede(next, 0),
      ],
      opacity: current.progress.interpolate({ inputRange: [0, 0.35, 1], outputRange: [0, 1, 1], extrapolate: clamp }),
    },
    overlayStyle: {
      opacity: current.progress.interpolate({ inputRange: [0, 1], outputRange: [0, 0.45], extrapolate: clamp }),
    },
  };
}

/**
 * Nightfall: the daytime page sinks into navy while the night scene fades in
 * from a gentle zoom, like the lights going down.
 */
function forNightfall({ current, next }: StackCardInterpolationProps) {
  return {
    cardStyle: {
      opacity: current.progress.interpolate({ inputRange: [0, 0.45, 1], outputRange: [0, 0.2, 1], extrapolate: clamp }),
      transform: [
        { scale: current.progress.interpolate({ inputRange: [0, 1], outputRange: [1.12, 1], extrapolate: clamp }) },
        ...recede(next, 0),
      ],
    },
    overlayStyle: {
      backgroundColor: colors.night,
      opacity: current.progress.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0.95, 0.95], extrapolate: clamp }),
    },
  };
}

const base: StackNavigationOptions = {
  animation: 'default',
  cardOverlayEnabled: true,
  gestureDirection: 'horizontal',
};

export const transitions = {
  slide: {
    ...base,
    cardStyleInterpolator: forParallaxSlide,
    transitionSpec: { open: timing(520), close: timing(420) },
  },
  rise: {
    ...base,
    gestureEnabled: false,
    cardStyleInterpolator: forRise,
    transitionSpec: { open: timing(620), close: timing(420) },
  },
  nightfall: {
    ...base,
    gestureEnabled: false,
    cardStyleInterpolator: forNightfall,
    transitionSpec: { open: timing(1100), close: timing(500) },
  },
} satisfies Record<string, StackNavigationOptions>;
