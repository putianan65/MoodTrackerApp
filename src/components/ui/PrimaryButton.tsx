import { ArrowRight, type LucideIcon } from 'lucide-react-native';
import React from 'react';
import { ActivityIndicator, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { colors, radii } from '../../theme';
import { PressableScale } from './PressableScale';
import { Txt } from './Txt';

type Props = {
  label: string;
  onPress: () => void;
  icon?: LucideIcon;
  tone?: 'ink' | 'paper' | 'white';
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Full-width pill CTA with a circular arrow cap. */
export function PrimaryButton({
  label,
  onPress,
  icon: Icon = ArrowRight,
  tone = 'ink',
  disabled,
  loading,
  style,
}: Props) {
  const palette = tones[tone];
  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityLabel={label}
      pressedScale={0.97}
      style={[styles.button, { backgroundColor: palette.bg, opacity: disabled ? 0.35 : 1 }, style]}
    >
      <Txt variant="title" size={17} color={palette.text} numberOfLines={1} style={styles.label}>
        {label}
      </Txt>
      <View style={[styles.cap, { backgroundColor: palette.cap }]}>
        {loading ? (
          <ActivityIndicator color={palette.capIcon} size="small" />
        ) : (
          <Icon color={palette.capIcon} size={22} strokeWidth={2.25} />
        )}
      </View>
    </PressableScale>
  );
}

const tones = {
  ink: { bg: colors.ink, text: colors.white, cap: colors.white, capIcon: colors.ink },
  paper: { bg: colors.badge, text: colors.ink, cap: colors.ink, capIcon: colors.white },
  white: { bg: colors.white, text: colors.ink, cap: colors.ink, capIcon: colors.white },
} as const;

const styles = StyleSheet.create({
  button: {
    minHeight: 64,
    borderRadius: radii.pill,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 26,
    paddingRight: 8,
  },
  label: { flex: 1 },
  cap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
