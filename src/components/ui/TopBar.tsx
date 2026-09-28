import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, X } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { CircleButton } from './CircleButton';
import { Txt } from './Txt';

type Props = {
  label?: string;
  sublabel?: string;
  tone?: 'light' | 'dark';
  /** `close` shows an X and is used for modal-like flows. */
  kind?: 'back' | 'close';
  onBack?: () => void;
  right?: React.ReactNode;
};

/** Brand label on the left (uppercase, 0.18em tracking) and a round back button. */
export function TopBar({ label, sublabel, tone = 'dark', kind = 'back', onBack, right }: Props) {
  const navigation = useNavigation();
  const ink = tone === 'light' ? 'rgba(255,255,255,0.92)' : 'rgba(8,9,9,0.9)';

  return (
    <View style={styles.bar}>
      <CircleButton
        icon={kind === 'close' ? X : ArrowLeft}
        tone={tone}
        size={44}
        label={kind === 'close' ? 'ปิด' : 'ย้อนกลับ'}
        onPress={onBack ?? (() => navigation.goBack())}
      />
      <View style={styles.labels}>
        {label ? (
          <Txt variant="overline" color={ink} numberOfLines={1}>
            {label}
          </Txt>
        ) : null}
        {sublabel ? (
          <Txt variant="caption" color={ink} numberOfLines={1} style={styles.sub}>
            {sublabel}
          </Txt>
        ) : null}
      </View>
      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', minHeight: 52 },
  labels: { flex: 1, marginLeft: 14 },
  sub: { opacity: 0.8, marginTop: 1 },
  right: { flexDirection: 'row', alignItems: 'center', gap: 10 },
});
