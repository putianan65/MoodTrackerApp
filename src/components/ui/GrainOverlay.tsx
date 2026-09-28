import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

const grain = require('../../../assets/textures/grain.png');

/** Film-grain layer: 200×200 noise tile, repeated, 40% opacity, above content. */
export function GrainOverlay({ opacity = 0.4 }: { opacity?: number }) {
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity, zIndex: 50 }]}>
      <Image source={grain} resizeMode="repeat" style={styles.tile} />
    </View>
  );
}

const styles = StyleSheet.create({
  tile: { width: '100%', height: '100%' },
});
