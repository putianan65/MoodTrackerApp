import { ArrowUpRight } from 'lucide-react-native';
import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useReducedMotion, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';

import { MenuMascot, type MenuMascotKind } from '../mascot/MenuMascot';

import { colors, radii } from '../../theme';
import { PressableScale } from './PressableScale';
import { Txt } from './Txt';

type Props = {
  mascot: MenuMascotKind;
  label: string;
  hint: string;
  onPress?: () => void;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * Tappable menu card: an animated mascot, title, short hint and an arrow
 * button, so it reads as a control rather than as text. The mascot hops on press.
 */
export function MenuTile({ mascot, label, hint, onPress, compact, style }: Props) {
  const disabled = !onPress;
  const reduceMotion = useReducedMotion();
  const jump = useSharedValue(0);
  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={`${label} — ${hint}`}
      accessibilityHint={disabled ? undefined : 'แตะเพื่อเปิด'}
      pressedScale={0.95}
      pressedColor={colors.paperDeep}
      onPressIn={() => {
        if (!reduceMotion) jump.value = withSequence(withTiming(1, { duration: 140 }), withTiming(0, { duration: 320 }));
      }}
      style={[styles.tile, compact && styles.compact, disabled && styles.disabled, style]}
    >
      <View style={styles.top}>
        <MenuMascot kind={mascot} size={compact ? 50 : 60} jump={jump} reduceMotion={reduceMotion} />
        <View style={styles.go}>
          <ArrowUpRight color={colors.ink} size={16} strokeWidth={2.5} />
        </View>
      </View>
      <View>
        <Txt variant="title" size={compact ? 15 : 17} numberOfLines={2}>
          {label}
        </Txt>
        <Txt variant="caption" size={compact ? 12 : 13} color={colors.muted} numberOfLines={2}>
          {hint}
        </Txt>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    minHeight: 124,
    justifyContent: 'space-between',
    gap: 12,
    padding: 16,
    borderRadius: radii.card,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.line,
  },
  compact: { minHeight: 108, padding: 13, gap: 10 },
  disabled: { opacity: 0.45 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  go: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
