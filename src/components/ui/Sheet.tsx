import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useResponsive } from '../../hooks/useResponsive';
import { colors, radii } from '../../theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Scrollable body for long content. */
  scroll?: boolean;
  background?: string;
};

/** Bottom sheet on phones, centred card on wide screens. */
export function Sheet({ visible, onClose, children, scroll, background = colors.paper }: Props) {
  const insets = useSafeAreaInsets();
  const { isWide, height } = useResponsive();

  const Body = scroll ? ScrollView : View;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Animated.View entering={FadeIn.duration(200)} style={[styles.scrim, isWide && styles.center]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="ปิด" />
        <Animated.View
          entering={SlideInDown.duration(420).springify().damping(18)}
          style={[
            styles.sheet,
            { backgroundColor: background, maxHeight: height * 0.86, paddingBottom: insets.bottom + 20 },
            isWide && styles.card,
          ]}
        >
          <View style={styles.grabber} />
          <Body showsVerticalScrollIndicator={false} bounces={false}>
            {children}
          </Body>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: colors.scrim, justifyContent: 'flex-end' },
  center: { justifyContent: 'center', alignItems: 'center' },
  sheet: {
    borderTopLeftRadius: radii.sheet,
    borderTopRightRadius: radii.sheet,
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  card: { width: 520, borderRadius: radii.sheet },
  grabber: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.lineStrong,
    marginBottom: 20,
  },
});
