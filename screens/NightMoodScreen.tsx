// ✅ โค้ดเต็มไฟล์: screens/NightMoodScreen.tsx (เวอร์ชัน Clean Color Selection + ใช้ moodMeaningMap กลาง)

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Animated, Modal, ScrollView, Dimensions } from 'react-native';
import { MoodColors } from '../src/colors';
import { MoodColor } from '../utils/mapMoodToScore';
import { MoodEntry } from '../types';
import { getEntryByDate, updateEntry } from '../utils/historyStorage';
import { moodMeanings } from '../utils/moodMeaningMap'; // ✅ ใช้แหล่งเดียว

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const isMoodColor = (color: string): color is MoodColor =>
  ['green', 'blue', 'yellow', 'orange', 'red', 'gray', 'black'].includes(color);

export default function NightMoodScreen({ route, navigation }: any) {
  const { date } = route.params || {};
  const [selectedMood, setSelectedMood] = useState<MoodColor | null>(null);
  const [scale] = useState(new Animated.Value(1));
  const [fadeAnim] = useState(new Animated.Value(0));
  const [colorMeaningVisible, setColorMeaningVisible] = useState(false);
  const [selectedColorMeaning, setSelectedColorMeaning] = useState<MoodColor | null>(null);

  useEffect(() => {
    // Fade in animation on component mount
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    if (!date) {
      Alert.alert('ไม่พบวันที่ กรุณาเริ่มใหม่');
      navigation.navigate('Home');
    }
  }, []);

  const moodOptions: { color: MoodColor; hex: string }[] = [
    { color: 'green', hex: MoodColors.green },
    { color: 'blue', hex: MoodColors.blue },
    { color: 'yellow', hex: MoodColors.yellow },
    { color: 'orange', hex: MoodColors.orange },
    { color: 'red', hex: MoodColors.red },
    { color: 'gray', hex: MoodColors.gray },
    { color: 'black', hex: MoodColors.black },
  ];

  const handleSelect = (color: MoodColor) => {
    setSelectedMood(color);
    Animated.spring(scale, {
      toValue: 1.2,
      useNativeDriver: true,
    }).start(() => {
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    });
  };

  const handleColorMeaning = (color: MoodColor) => {
    setSelectedColorMeaning(color);
    setColorMeaningVisible(true);
  };

  const handleNext = async () => {
    if (!selectedMood) {
      Alert.alert('กรุณาเลือกอารมณ์ของคุณ');
      return;
    }

    const entry: MoodEntry | null = await getEntryByDate(date);
    if (!entry) {
      Alert.alert('ไม่พบข้อมูลวันนี้ กรุณาเริ่มใหม่');
      navigation.navigate('Home');
      return;
    }

    const updatedEntry: MoodEntry = {
      ...entry,
      nightMood: selectedMood,
    };

    await updateEntry(updatedEntry);
    navigation.navigate('Summary', { date });
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.contentContainer, { opacity: fadeAnim }]}>
          <View style={styles.headerContainer}>
            <Text style={styles.greeting}>ราตรีสวัสดิ์ 🌙</Text>
            <Text style={styles.title}>ก่อนนอนคุณรู้สึกอย่างไร?</Text>
            <Text style={styles.subtitle}>เลือกสีที่ตรงกับอารมณ์ของคุณในตอนนี้</Text>
            <TouchableOpacity 
              style={styles.infoButton}
              onPress={() => setColorMeaningVisible(true)}
            >
              <Text style={styles.infoButtonText}>ℹ️ ดูความหมายของสี</Text>
            </TouchableOpacity>
          </View>

          {/* Selected Mood Display */}
          {selectedMood && (
            <Animated.View 
              style={[
                styles.selectedMoodDisplay,
                {
                  opacity: fadeAnim,
                  transform: [{ scale }]
                }
              ]}
            >
              <View style={[styles.selectedMoodCircle, { backgroundColor: MoodColors[selectedMood] }]}>
                <Text style={styles.selectedMoodEmoji}>
                  {moodMeanings[selectedMood].emoji}
                </Text>
              </View>
              <Text style={styles.selectedMoodLabel}>
                {moodMeanings[selectedMood].label}
              </Text>
            </Animated.View>
          )}

          <View style={styles.moodContainer}>
            {moodOptions.map((mood) => (
              <Animated.View 
                key={mood.color} 
                style={[
                  styles.moodItem,
                  { 
                    opacity: fadeAnim,
                    transform: [{
                      translateY: fadeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [30, 0],
                      })
                    }]
                  }
                ]}
              >
                <TouchableOpacity 
                  onPress={() => handleSelect(mood.color)}
                  onLongPress={() => handleColorMeaning(mood.color)}
                  style={styles.moodTouchable}
                  activeOpacity={0.7}
                >
                  <Animated.View
                    style={[
                      styles.moodButton,
                      { backgroundColor: mood.hex },
                      selectedMood === mood.color && styles.selectedBorder,
                      selectedMood === mood.color && { 
                        elevation: 10,
                        shadowColor: mood.hex,
                        shadowOffset: { width: 0, height: 6 },
                        shadowOpacity: 0.4,
                        shadowRadius: 10,
                      },
                    ]}
                  >
                    {/* แสดงเฉพาะเมื่อเลือกแล้ว */}
                    {selectedMood === mood.color && (
                      <View style={styles.checkMark}>
                        <Text style={styles.checkMarkText}>✓</Text>
                      </View>
                    )}
                  </Animated.View>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>

          <View style={styles.instructionContainer}>
            <Text style={styles.instructionText}>
              แตะเพื่อเลือก • กดค้างเพื่อดูความหมาย
            </Text>
          </View>

          <TouchableOpacity 
            style={[
              styles.nextButton,
              selectedMood && styles.nextButtonActive
            ]} 
            onPress={handleNext}
            disabled={!selectedMood}
          >
            <Text style={[
              styles.nextText,
              selectedMood && styles.nextTextActive
            ]}>
              ถัดไป →
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>

      {/* Color Meaning Modal */}
      <Modal visible={colorMeaningVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>ความหมายของสี</Text>
            
            <ScrollView style={styles.colorGrid} showsVerticalScrollIndicator={false}>
              {moodOptions.map((mood) => (
                <TouchableOpacity
                  key={mood.color}
                  style={styles.colorMeaningItem}
                  onPress={() => handleColorMeaning(mood.color)}
                >
                  <View style={[styles.colorCircle, { backgroundColor: mood.hex }]}>
                    <Text style={styles.colorEmoji}>{moodMeanings[mood.color].emoji}</Text>
                  </View>
                  <View style={styles.colorInfo}>
                    <Text style={styles.colorLabel}>{moodMeanings[mood.color].label}</Text>
                    <Text style={styles.colorDescription}>
                      {moodMeanings[mood.color].description}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setColorMeaningVisible(false)}
            >
              <Text style={styles.closeText}>ปิด</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Individual Color Detail Modal */}
      <Modal visible={!!selectedColorMeaning && colorMeaningVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.detailModalContent}>
            {selectedColorMeaning && (
              <>
                <View style={[
                  styles.detailColorCircle, 
                  { backgroundColor: MoodColors[selectedColorMeaning] }
                ]}>
                  <Text style={styles.detailEmoji}>
                    {moodMeanings[selectedColorMeaning].emoji}
                  </Text>
                </View>
                <Text style={styles.detailTitle}>
                  {moodMeanings[selectedColorMeaning].label}
                </Text>
                <Text style={styles.detailDescription}>
                  {moodMeanings[selectedColorMeaning].description}
                </Text>
                <Text style={styles.detailSource}>
                  {moodMeanings[selectedColorMeaning].source}
                </Text>
              </>
            )}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setSelectedColorMeaning(null)}
            >
              <Text style={styles.closeText}>ปิด</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: MoodColors.bg,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: Math.max(20, screenWidth * 0.05),
    paddingVertical: 20,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: screenHeight * 0.8,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: screenHeight * 0.04,
    paddingHorizontal: 20,
  },
  greeting: {
    fontSize: Math.min(18, screenWidth * 0.045),
    color: '#666',
    marginBottom: 8,
    fontWeight: '500',
  },
  title: { 
    fontSize: Math.min(28, screenWidth * 0.07),
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: Math.min(16, screenWidth * 0.04),
    color: '#888',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 15,
  },
  infoButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 10,
  },
  infoButtonText: {
    fontSize: Math.min(14, screenWidth * 0.035),
    color: '#666',
    fontWeight: '500',
  },
  // Selected Mood Display
  selectedMoodDisplay: {
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 15,
  },
  selectedMoodCircle: {
    width: Math.min(100, screenWidth * 0.22),
    height: Math.min(100, screenWidth * 0.22),
    borderRadius: Math.min(50, screenWidth * 0.11),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 3,
    borderColor: '#fff',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  selectedMoodEmoji: {
    fontSize: Math.min(40, screenWidth * 0.1),
  },
  selectedMoodLabel: {
    fontSize: Math.min(20, screenWidth * 0.05),
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  moodContainer: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'center',
    paddingHorizontal: 10,
    marginBottom: 20,
    maxWidth: screenWidth * 0.9,
  },
  moodItem: { 
    alignItems: 'center', 
    margin: Math.max(8, screenWidth * 0.02),
    minWidth: Math.min(70, screenWidth * 0.18),
  },
  moodTouchable: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodButton: { 
    width: Math.min(70, screenWidth * 0.16), 
    height: Math.min(70, screenWidth * 0.16), 
    borderRadius: Math.min(35, screenWidth * 0.08), 
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    position: 'relative',
  },
  selectedBorder: { 
    borderWidth: 4, 
    borderColor: '#333',
    elevation: 10,
  },
  checkMark: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -10 }, { translateY: -12 }],
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMarkText: {
    color: '#333',
    fontSize: Math.min(14, screenWidth * 0.035),
    fontWeight: 'bold',
  },
  instructionContainer: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  instructionText: {
    fontSize: Math.min(14, screenWidth * 0.035),
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  nextButton: { 
    marginTop: 20, 
    backgroundColor: '#ddd',
    paddingVertical: 18, 
    paddingHorizontal: Math.max(60, screenWidth * 0.15), 
    borderRadius: 30,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    minWidth: Math.min(200, screenWidth * 0.5),
    alignItems: 'center',
  },
  nextButtonActive: {
    backgroundColor: MoodColors.accent,
    elevation: 6,
    shadowColor: MoodColors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  nextText: { 
    color: '#999', 
    fontSize: Math.min(18, screenWidth * 0.045), 
    fontWeight: 'bold',
    textAlign: 'center',
  },
  nextTextActive: {
    color: '#fff',
  },
  // Modal styles
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
    borderRadius: 16,
    maxWidth: Math.min(380, screenWidth * 0.9),
    width: '100%',
    maxHeight: screenHeight * 0.8,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: Math.min(22, screenWidth * 0.055),
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  colorGrid: {
    maxHeight: screenHeight * 0.5,
    width: '100%',
  },
  colorMeaningItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  colorCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  colorEmoji: {
    fontSize: 24,
  },
  colorInfo: {
    flex: 1,
  },
  colorLabel: {
    fontSize: Math.min(16, screenWidth * 0.04),
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  colorDescription: {
    fontSize: Math.min(14, screenWidth * 0.035),
    color: '#666',
    lineHeight: 18,
  },
  detailModalContent: {
    backgroundColor: 'white',
    padding: 30,
    borderRadius: 20,
    maxWidth: Math.min(350, screenWidth * 0.85),
    width: '100%',
    alignItems: 'center',
  },
  detailColorCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 3,
    borderColor: '#e5e7eb',
  },
  detailEmoji: {
    fontSize: 36,
  },
  detailTitle: {
    fontSize: Math.min(24, screenWidth * 0.06),
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  detailDescription: {
    fontSize: Math.min(16, screenWidth * 0.04),
    color: '#555',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 12,
  },
  detailSource: {
    fontSize: Math.min(13, screenWidth * 0.032),
    fontStyle: 'italic',
    color: '#888',
    textAlign: 'center',
    lineHeight: 18,
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: MoodColors.accent,
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  closeText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: Math.min(16, screenWidth * 0.04),
  },
});
