import { Check, Plus } from 'lucide-react-native';
import React from 'react';
import { StyleSheet } from 'react-native';

import { haptics } from '../../services/haptics';
import { colors, radii } from '../../theme';
import { PressableScale } from '../ui/PressableScale';
import { Txt } from '../ui/Txt';

type Props = {
  label: string;
  selected: boolean;
  accent: string;
  weight: number;
  onToggle: () => void;
};

export function ActivityChip({ label, selected, accent, weight, onToggle }: Props) {
  const Icon = selected ? Check : Plus;
  return (
    <PressableScale
      onPress={() => {
        haptics.tap();
        onToggle();
      }}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={`${label} (${weight > 0 ? '+' : ''}${weight} คะแนน)`}
      pressedScale={0.95}
      style={[styles.chip, selected ? { backgroundColor: accent, borderColor: accent } : null]}
    >
      <Icon color={selected ? colors.white : colors.ink} size={16} strokeWidth={2.5} />
      <Txt variant="body" size={15} color={selected ? colors.white : colors.ink}>
        {label}
      </Txt>
      <Txt variant="caption" size={12} color={selected ? 'rgba(255,255,255,0.85)' : colors.muted}>
        {weight > 0 ? `+${weight}` : weight}
      </Txt>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: radii.pill,
    backgroundColor: colors.badge,
    borderWidth: 1.5,
    borderColor: colors.line,
  },
});
