import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '../../theme';
import { GrainOverlay } from './GrainOverlay';

/**
 * Lavender "studio paper" surface shared by the non-stage screens. `backdrop`
 * is drawn full-bleed behind the content, from the very top edge.
 */
export function PaperScreen({ children, backdrop }: { children: React.ReactNode; backdrop?: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      {backdrop ? <View style={styles.backdrop}>{backdrop}</View> : null}
      {children}
      <GrainOverlay opacity={0.22} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.paper },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0 },
});
