// ✅ ColorMeaningScreen.tsx — กดสีแล้วขึ้น modal พร้อมความหมายและแหล่งอ้างอิง

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { MoodColors } from '../src/colors';
import { moodMeanings } from '../utils/moodMeaningMap';
import { MoodColor } from '../utils/mapMoodToScore';

const isMoodColor = (color: string): color is MoodColor =>
  ['green', 'blue', 'yellow', 'orange', 'red', 'gray', 'black'].includes(color);

export default function ColorMeaningScreen() {
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.title}>แตะที่สีเพื่อดูความหมาย</Text>

      <View style={styles.grid}>
        {Object.entries(MoodColors).map(([colorName, colorValue]) => {
          if (['bg', 'accent', 'danger'].includes(colorName)) return null;
          return (
            <TouchableOpacity
              key={colorName}
              style={[styles.colorCircle, { backgroundColor: colorValue }]}
              onPress={() => setSelectedColor(colorName)}
            />
          );
        })}
      </View>

      <Modal visible={!!selectedColor} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedColor && isMoodColor(selectedColor) && (
              <>
                <Text style={styles.modalTitle}>{moodMeanings[selectedColor].label}</Text>
                <Text style={styles.modalText}>{moodMeanings[selectedColor].description}</Text>
                <Text style={styles.modalSource}>{moodMeanings[selectedColor].source}</Text>
              </>
            )}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setSelectedColor(null)}
            >
              <Text style={styles.closeText}>ปิด</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: MoodColors.bg },
  title: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
  },
  colorCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    margin: 8,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    maxWidth: 320,
    width: '100%',
    alignItems: 'center',
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  modalText: { fontSize: 16, color: '#333', textAlign: 'center', marginBottom: 10 },
  modalSource: { fontSize: 13, fontStyle: 'italic', color: '#666', textAlign: 'center' },
  closeButton: {
    marginTop: 20,
    backgroundColor: MoodColors.accent,
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  closeText: { color: 'white', fontWeight: 'bold' },
});
