// ✅ ActivityLogScreen.tsx (Safe numeric parsing + clamped range -10..+10)

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import { MoodEntry } from '../types';
import { getEntryByDate, updateEntry } from '../utils/historyStorage';
import { MoodColors } from '../src/colors';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const positiveOptions = ['เดินเล่น', 'ออกกำลังกาย', 'ฟังเพลง', 'นั่งสมาธิ', 'อ่านหนังสือ'];
const negativeOptions = ['ใช้โซเชียลมากเกินไป', 'ทะเลาะ', 'นอนดึก', 'งานเยอะเกินไป'];

// ✅ แปลง string → number อย่างปลอดภัย และบังคับช่วง -10..+10
const parseScore = (raw: string): number => {
  if (raw == null) return 0;
  // รองรับลูกน้ำเป็นทศนิยม และกันอักขระแปลก
  const cleaned = String(raw).replace(',', '.').trim();
  const n = Number(cleaned);
  if (!Number.isFinite(n)) return 0;
  // clamp
  const clamped = Math.max(-10, Math.min(10, n));
  // เก็บความละเอียดทศนิยมพอเหมาะ (เช่น 1 ตำแหน่ง) ถ้าต้องการ integer ให้ใช้ Math.round(clamped)
  return Number(clamped.toFixed(1));
};

export default function ActivityLogScreen({ route, navigation }: any) {
  const { date } = route.params || {};
  const [positiveSelected, setPositiveSelected] = useState<string[]>([]);
  const [negativeSelected, setNegativeSelected] = useState<string[]>([]);
  const [otherActivity, setOtherActivity] = useState('');
  const [otherScore, setOtherScore] = useState('0');
  const [note, setNote] = useState('');
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    const load = async () => {
      const entry = await getEntryByDate(date);
      if (!entry) {
        Alert.alert('ไม่พบข้อมูลวันที่เลือก');
        navigation.goBack();
      }
    };
    load();
  }, []);

  const toggleItem = useCallback((item: string, selected: string[], setter: (v: string[]) => void) => {
    if (selected.includes(item)) {
      setter(selected.filter(i => i !== item));
    } else {
      setter([...selected, item]);
    }
  }, []);

  const handleSave = useCallback(async () => {
    const entry: MoodEntry | null = await getEntryByDate(date);
    if (!entry) return;

    const safeOther = parseScore(otherScore);

    const updatedEntry: MoodEntry = {
      ...entry,
      positiveActivities: positiveSelected,
      negativeActivities: negativeSelected,
      otherActivityNote: otherActivity + (note ? ` (${note})` : ''),
      otherActivityScore: safeOther,
    };

    await updateEntry(updatedEntry);
    navigation.navigate('NightMood', { date });
  }, [date, otherScore, otherActivity, note, positiveSelected, negativeSelected, navigation]);

  const handleOtherScoreBlur = useCallback(() => {
    const n = parseScore(otherScore);
    setOtherScore(String(n));
  }, [otherScore]);

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <View style={styles.header}>
          <Text style={styles.title}>📝 บันทึกกิจกรรมของคุณ</Text>
          <Text style={styles.subtitle}>เลือกกิจกรรมที่คุณทำระหว่างวัน</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>✨ กิจกรรมเชิงบวก</Text>
          <Text style={styles.sectionDescription}>กิจกรรมที่ทำให้คุณรู้สึกดี</Text>
          <View style={styles.buttonGroup}>
            {positiveOptions.map((item) => (
              <TouchableOpacity
                key={item}
                style={[
                  styles.button,
                  styles.positiveButton,
                  positiveSelected.includes(item) && styles.positiveButtonSelected
                ]}
                onPress={() => toggleItem(item, positiveSelected, setPositiveSelected)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.buttonText,
                  positiveSelected.includes(item) && styles.selectedButtonText
                ]}>
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚡ กิจกรรมเชิงลบ</Text>
          <Text style={styles.sectionDescription}>กิจกรรมที่อาจส่งผลเสียต่อความรู้สึก</Text>
          <View style={styles.buttonGroup}>
            {negativeOptions.map((item) => (
              <TouchableOpacity
                key={item}
                style={[
                  styles.button,
                  styles.negativeButton,
                  negativeSelected.includes(item) && styles.negativeButtonSelected
                ]}
                onPress={() => toggleItem(item, negativeSelected, setNegativeSelected)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.buttonText,
                  negativeSelected.includes(item) && styles.selectedButtonText
                ]}>
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎯 กิจกรรมอื่น (ถ้ามี)</Text>
          <Text style={styles.sectionDescription}>กิจกรรมพิเศษที่คุณทำเพิ่มเติม</Text>
          <TextInput
            placeholder="ระบุสิ่งที่คุณทำเพิ่มเติม..."
            style={styles.input}
            value={otherActivity}
            onChangeText={setOtherActivity}
            placeholderTextColor="#999"
          />

          <Text style={styles.sectionSub}>⭐ ให้คะแนนกิจกรรมนี้ (−10 ถึง +10)</Text>
          <TextInput
            placeholder="0"
            style={styles.scoreInput}
            keyboardType="numeric"
            value={otherScore}
            onChangeText={setOtherScore}
            onBlur={handleOtherScoreBlur}
            placeholderTextColor="#999"
            textAlign="center"
            maxLength={5} // เช่น "-10.0"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💭 โน้ตสั้น ๆ สำหรับวันนี้</Text>
          <Text style={styles.sectionDescription}>บันทึกความรู้สึกหรือเหตุการณ์พิเศษ (ไม่บังคับ)</Text>
          <TextInput
            placeholder="วันนี้คุณรู้สึกอย่างไร? มีอะไรพิเศษบ้างไหม?"
            style={styles.inputNote}
            multiline
            value={note}
            onChangeText={setNote}
            placeholderTextColor="#999"
          />
        </View>

        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          activeOpacity={0.8}
        >
          <Text style={styles.saveText}>ถัดไป →</Text>
        </TouchableOpacity>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: MoodColors.bg,
    paddingHorizontal: screenWidth * 0.05,
    paddingVertical: screenHeight * 0.04,
    minHeight: screenHeight,
  },
  content: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: screenHeight * 0.04,
  },
  title: {
    fontSize: Math.min(screenWidth * 0.065, 28),
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
    paddingHorizontal: screenWidth * 0.05,
  },
  subtitle: {
    fontSize: Math.min(screenWidth * 0.04, 16),
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: screenWidth * 0.05,
  },
  section: {
    marginBottom: screenHeight * 0.035,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: screenWidth * 0.05,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  sectionTitle: {
    fontSize: Math.min(screenWidth * 0.05, 20),
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: Math.min(screenWidth * 0.035, 14),
    color: '#666',
    marginBottom: 15,
    lineHeight: 20,
  },
  sectionSub: {
    fontSize: Math.min(screenWidth * 0.04, 16),
    fontWeight: '600',
    marginTop: 15,
    marginBottom: 10,
    color: '#444',
  },
  buttonGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 5,
    justifyContent: 'flex-start',
  },
  button: {
    paddingHorizontal: screenWidth * 0.04,
    paddingVertical: screenHeight * 0.015,
    borderRadius: 20,
    marginRight: screenWidth * 0.025,
    marginBottom: screenHeight * 0.015,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    minWidth: screenWidth * 0.25,
    alignItems: 'center',
  },
  positiveButton: {
    backgroundColor: '#f0f9ff',
    borderWidth: 2,
    borderColor: '#e0f2fe',
  },
  positiveButtonSelected: {
    backgroundColor: '#22c55e',
    borderColor: '#16a34a',
  },
  negativeButton: {
    backgroundColor: '#fef2f2',
    borderWidth: 2,
    borderColor: '#fecaca',
  },
  negativeButtonSelected: {
    backgroundColor: '#ef4444',
    borderColor: '#dc2626',
  },
  buttonText: {
    color: '#333',
    fontWeight: '600',
    fontSize: Math.min(screenWidth * 0.035, 14),
    textAlign: 'center',
  },
  selectedButtonText: {
    color: '#fff',
  },
  input: {
    borderWidth: 2,
    borderColor: '#e5e7eb',
    padding: screenWidth * 0.04,
    borderRadius: 12,
    fontSize: Math.min(screenWidth * 0.04, 16),
    backgroundColor: '#f9fafb',
    minHeight: screenHeight * 0.06,
  },
  scoreInput: {
    borderWidth: 2,
    borderColor: '#e5e7eb',
    padding: screenWidth * 0.04,
    borderRadius: 12,
    fontSize: Math.min(screenWidth * 0.045, 18),
    fontWeight: 'bold',
    backgroundColor: '#f9fafb',
    width: screenWidth * 0.25,
    alignSelf: 'center',
    minHeight: screenHeight * 0.06,
  },
  inputNote: {
    borderWidth: 2,
    borderColor: '#e5e7eb',
    padding: screenWidth * 0.04,
    borderRadius: 12,
    minHeight: screenHeight * 0.12,
    textAlignVertical: 'top',
    fontSize: Math.min(screenWidth * 0.04, 16),
    backgroundColor: '#f9fafb',
    lineHeight: 22,
  },
  saveButton: {
    backgroundColor: MoodColors.accent,
    paddingVertical: screenHeight * 0.022,
    borderRadius: 25,
    marginTop: screenHeight * 0.025,
    marginBottom: screenHeight * 0.03,
    alignItems: 'center',
    elevation: 4,
    shadowColor: MoodColors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    minHeight: screenHeight * 0.06,
    justifyContent: 'center',
  },
  saveText: {
    color: '#fff',
    fontSize: Math.min(screenWidth * 0.045, 18),
    fontWeight: 'bold',
  },
});
