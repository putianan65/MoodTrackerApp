import type { LucideIcon } from 'lucide-react-native';
import React from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';

import { colors } from '../../theme';
import { PressableScale } from './PressableScale';

type Props = {
  icon: LucideIcon;
  onPress: () => void;
  label: string;
  /** `light` = white outline on a mood colour, `dark` = ink outline on paper. */
  tone?: 'light' | 'dark' | 'solid';
  size?: number;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * Outlined circular button: transparent fill, 2px border, 26px icon with a
 * 2.25 stroke. Press feedback is the 1.08 scale plus a faint white wash.
 */
export function CircleButton({
  icon: Icon,
  onPress,
  label,
  tone = 'light',
  size = 48,
  disabled,
  style,
}: Props) {
  const ink = tone === 'light' ? colors.white : tone === 'solid' ? colors.white : colors.ink;
  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={label}
      pressedScale={1.08}
      pressedColor={tone === 'dark' ? 'rgba(8,9,9,0.06)' : 'rgba(255,255,255,0.12)'}
      style={[
        styles.button,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: tone === 'solid' ? colors.ink : ink,
          opacity: disabled ? 0.4 : 1,
        },
        tone === 'solid' && { backgroundColor: colors.ink },
        style,
      ]}
    >
      <Icon color={ink} size={Math.round(size * 0.46)} strokeWidth={2.25} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  button: {
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
