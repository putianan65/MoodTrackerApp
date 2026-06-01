// ✅ SummaryScreen.tsx เวอร์ชันสมบูรณ์ (ใช้ Normalize System ใหม่ max 20) + Responsive

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Modal,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { MoodEntry } from '../types';
import { getAllEntries } from '../utils/historyStorage';
import CustomRadarChart from '../components/CustomRadarChart';
import { MoodColors } from '../src/colors';
import { moodToScore } from '../utils/mapMoodToScore';
import { activityScores } from '../utils/activityScoreTable';
import dayjs from 'dayjs';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function SummaryScreen({ route, navigation }: any) {
  const [moodEntry, setMoodEntry] = useState<MoodEntry | null>(null);
  const [showLowEnergyAlert, setShowLowEnergyAlert] = useState(false);
  const [energyLevel, setEnergyLevel] = useState<'ต่ำ' | 'กลาง' | 'สูง' | null>(null);

  const isSameDate = (d1: string, d2: string): boolean => {
    return dayjs(d1).format('YYYY-MM-DD') === dayjs(d2).format('YYYY-MM-DD');
  };

  const getTotalScore = (entry: MoodEntry): number => {
    const morning = moodToScore(entry.morningMood);
    const night = moodToScore(entry.nightMood);
    const allActivities = [
      ...(entry.positiveActivities || []),
      ...(entry.negativeActivities || []),
    ];
    const rawActivity = allActivities.reduce(
  (sum, act) => sum + (activityScores[act] || 0),
  0
);
const activityScore = Math.max(-3, Math.min(3, rawActivity));

    const rawOther = entry.otherActivityScore ?? 0;
    const clampedOther = Math.max(-10, Math.min(10, rawOther));
    const normalizedOther = (clampedOther / 10) * 3;
    return morning + night + activityScore + normalizedOther; // ✅ รวม max = 20
  };

  const getEnergyAnalysis = (score: number): { level: 'ต่ำ' | 'กลาง' | 'สูง'; advice: string; trend: string; icon: string; color: string } => {
    if (score < 8) return {
      level: 'ต่ำ',
      icon: '🔋',
      color: '#EF4444',
      trend: 'กราฟแสดงให้เห็นว่าคุณอาจต้องการการดูแลตนเองมากขึ้น',
      advice: 'วันนี้คุณอาจรู้สึกเหนื่อยหรือพลังใจน้อย ลองพักผ่อนให้เพียงพอ ทำสิ่งที่ชอบ หรือลองเขียนไดอารี่เพื่อปลดปล่อยความรู้สึก การออกกำลังกายเบา ๆ หรือการทำสมาธิสั้น ๆ อาจช่วยได้'
    };
    if (score <= 14) return {
      level: 'กลาง',
      icon: '⚡',
      color: '#F59E0B',
      trend: 'กราฟแสดงความสมดุลของอารมณ์ในระดับปานกลาง',
      advice: 'คุณมีพลังใจในระดับปานกลาง รักษาจังหวะด้วยกิจกรรมเล็ก ๆ ที่ทำให้คุณรู้สึกดี เช่น ดื่มน้ำให้เพียงพอ ฟังเพลงที่ชอบ หรือพูดคุยกับคนที่ไว้ใจ การออกไปเดินเล่นหรือทำกิจกรรมที่ทำให้ผ่อนคลายจะช่วยเสริมสร้างพลังงานได้'
    };
    return {
      level: 'สูง',
      icon: '✨',
      color: '#10B981',
      trend: 'กราฟแสดงว่าคุณมีพลังงานและความสุขในระดับดี',
      advice: 'พลังงานของคุณดีมาก! ใช้โอกาสนี้ทำสิ่งดี ๆ ให้ตนเองหรือแบ่งปันพลังงานนี้กับคนรอบข้าง ลองตั้งเป้าหมายเล็ก ๆ ที่จะทำให้คุณรู้สึกภูมิใจ หรือช่วยเหลือผู้อื่น'
    };
  };

  useEffect(() => {
    const load = async () => {
      const data = await getAllEntries();
      const entry = data.find((e) => e.date === route.params.date);
      if (entry) {
        setMoodEntry(entry);
        const total = getTotalScore(entry);
        const { level } = getEnergyAnalysis(total);
        setEnergyLevel(level);

        if (total < 8 && isSameDate(entry.date, dayjs().format('YYYY-MM-DD'))) {
          setShowLowEnergyAlert(true);
        }
      }
    };
    load();
  }, []);

  if (!moodEntry) {
    return (
      <View style={styles.container}>
        <Text style={styles.noData}>ไม่มีข้อมูล</Text>
      </View>
    );
  }

  const total = getTotalScore(moodEntry);
  const insight = getEnergyAnalysis(total);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>สรุปผลรายวัน</Text>
      <Text style={styles.dateText}>{dayjs(moodEntry.date).format('DD MMMM YYYY')}</Text>
      
      <View style={styles.chartContainer}>
        <CustomRadarChart entry={moodEntry} />
      </View>

      {/* 📊 การ์ดสรุปคะแนน */}
      <View style={styles.scoreCard}>
        <View style={styles.scoreHeader}>
          <Text style={styles.scoreTitle}>📊 สรุปคะแนนวันนี้</Text>
          <View style={styles.scorePercentageContainer}>
            <Text style={styles.scorePercentage}>{Math.round((total / 20) * 100)}%</Text>
            <Text style={styles.scoreRaw}>({total}/20)</Text>
          </View>
        </View>
        
        <View style={styles.breakdownContainer}>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>🌅 อารมณ์ตอนเช้า:</Text>
            <Text style={styles.breakdownValue}>{moodToScore(moodEntry.morningMood)}</Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>🌙 อารมณ์ก่อนนอน:</Text>
            <Text style={styles.breakdownValue}>{moodToScore(moodEntry.nightMood)}</Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>⚡ กิจกรรมระหว่างวัน:</Text>
            <Text style={styles.breakdownValue}>
              {[...(moodEntry.positiveActivities || []), ...(moodEntry.negativeActivities || [])]
                .reduce((sum, act) => sum + (activityScores[act] || 0), 0)}
            </Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>📝 กิจกรรมอื่น ๆ:</Text>
            <Text style={styles.breakdownValue}>
              {((Math.max(-10, Math.min(10, moodEntry.otherActivityScore ?? 0)) / 10) * 3).toFixed(1)}
            </Text>
          </View>
        </View>
      </View>

      {/* 🔍 Insight พลังงาน */}
      <View style={[styles.insightBox, { borderLeftColor: insight.color }]}>
        <View style={styles.insightHeader}>
          <Text style={styles.insightIcon}>{insight.icon}</Text>
          <Text style={styles.insightTitle}>วิเคราะห์พลังงานของคุณวันนี้</Text>
        </View>
        
        <View style={styles.levelContainer}>
          <Text style={styles.levelLabel}>ระดับพลังงาน:</Text>
          <View style={[styles.levelBadge, { backgroundColor: insight.color }]}>
            <Text style={styles.levelText}>{insight.level}</Text>
          </View>
        </View>

        <View style={styles.trendContainer}>
          <Text style={styles.trendLabel}>📊 การตีความกราฟ:</Text>
          <Text style={styles.trendText}>{insight.trend}</Text>
        </View>

        <View style={styles.adviceContainer}>
          <Text style={styles.adviceLabel}>💡 คำแนะนำ:</Text>
          <Text style={styles.adviceText}>{insight.advice}</Text>
        </View>

        <View style={styles.sourceContainer}>
          <Text style={styles.sourceText}>
            อ้างอิงจาก: กรมสุขภาพจิต กระทรวงสาธารณสุข และสำนักงานกองทุนสนับสนุนการสร้างเสริมสุขภาพ (สสส.)
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔍 กิจกรรมที่ทำ</Text>
        <View style={styles.activitiesContainer}>
          {moodEntry.positiveActivities.map((item, idx) => (
            <View key={idx} style={styles.activityItem}>
              <Text style={styles.positive}>✅ {item}</Text>
            </View>
          ))}
          {moodEntry.negativeActivities.map((item, idx) => (
            <View key={idx} style={styles.activityItem}>
              <Text style={styles.negative}>❌ {item}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📋 กิจกรรมอื่น ๆ</Text>
        <View style={styles.noteContainer}>
          <Text style={styles.noteText}>
            {moodEntry.otherActivityNote || 'ไม่มีบันทึกเพิ่มเติม'}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.navigate('Home')}
      >
        <Text style={styles.backText}>🏠 กลับหน้าหลัก</Text>
      </TouchableOpacity>

      <Modal visible={showLowEnergyAlert} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalIcon}>💙</Text>
            <Text style={styles.modalTitle}>คุณดูเหนื่อยล้า</Text>
            <Text style={styles.modalText}>
              ลองพักผ่อนให้เพียงพอ หรือทำสิ่งที่ช่วยให้คุณรู้สึกดีขึ้น อย่าลืมดูแลตนเองนะ
            </Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowLowEnergyAlert(false)}
            >
              <Text style={styles.modalButtonText}>เข้าใจแล้ว</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: screenWidth < 400 ? 16 : 20,
    backgroundColor: MoodColors.bg,
    flexGrow: 1,
    minHeight: screenHeight - 100,
  },
  title: {
    fontSize: screenWidth < 400 ? 20 : 24,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
    color: '#1F2937',
  },
  dateText: {
    fontSize: screenWidth < 400 ? 14 : 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: screenWidth < 400 ? 16 : 20,
  },
  chartContainer: {
    backgroundColor: 'white',
    borderRadius: screenWidth < 400 ? 12 : 16,
    padding: screenWidth < 400 ? 12 : 16,
    marginBottom: screenWidth < 400 ? 16 : 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    maxWidth: screenWidth - (screenWidth < 400 ? 32 : 40),
    alignSelf: 'center',
    width: '100%',
  },
  noData: {
    fontSize: screenWidth < 400 ? 16 : 18,
    color: '#888',
    textAlign: 'center',
    marginTop: 40,
  },
  scoreCard: {
    backgroundColor: 'white',
    borderRadius: screenWidth < 400 ? 12 : 16,
    padding: screenWidth < 400 ? 16 : 20,
    marginBottom: screenWidth < 400 ? 16 : 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    maxWidth: screenWidth - (screenWidth < 400 ? 32 : 40),
    alignSelf: 'center',
    width: '100%',
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  scoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: screenWidth < 400 ? 12 : 16,
    flexWrap: 'wrap',
  },
  scoreTitle: {
    fontSize: screenWidth < 400 ? 16 : 18,
    fontWeight: 'bold',
    color: '#1F2937',
    flex: 1,
    marginRight: 8,
  },
  scorePercentageContainer: {
    alignItems: 'flex-end',
  },
  scorePercentage: {
    fontSize: screenWidth < 400 ? 20 : 24,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  scoreRaw: {
    fontSize: screenWidth < 400 ? 12 : 14,
    color: '#6B7280',
    marginTop: 2,
  },
  breakdownContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: screenWidth < 400 ? 10 : 12,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    flexWrap: 'wrap',
  },
  breakdownLabel: {
    fontSize: screenWidth < 400 ? 12 : 14,
    color: '#374151',
    flex: 1,
    marginRight: 8,
  },
  breakdownValue: {
    fontSize: screenWidth < 400 ? 12 : 14,
    fontWeight: '600',
    color: '#3B82F6',
    minWidth: 30,
    textAlign: 'right',
  },
  insightBox: {
    backgroundColor: 'white',
    padding: screenWidth < 400 ? 16 : 20,
    borderRadius: screenWidth < 400 ? 12 : 16,
    marginBottom: screenWidth < 400 ? 16 : 20,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    maxWidth: screenWidth - (screenWidth < 400 ? 32 : 40),
    alignSelf: 'center',
    width: '100%',
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: screenWidth < 400 ? 12 : 16,
    flexWrap: 'wrap',
  },
  insightIcon: {
    fontSize: screenWidth < 400 ? 20 : 24,
    marginRight: 8,
  },
  insightTitle: {
    fontSize: screenWidth < 400 ? 16 : 18,
    fontWeight: 'bold',
    color: '#1F2937',
    flex: 1,
    flexWrap: 'wrap',
  },
  levelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: screenWidth < 400 ? 12 : 16,
    flexWrap: 'wrap',
  },
  levelLabel: {
    fontSize: screenWidth < 400 ? 14 : 16,
    color: '#374151',
    marginRight: 8,
  },
  levelBadge: {
    paddingHorizontal: screenWidth < 400 ? 10 : 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  levelText: {
    color: 'white',
    fontSize: screenWidth < 400 ? 12 : 14,
    fontWeight: 'bold',
  },
  trendContainer: {
    marginBottom: screenWidth < 400 ? 12 : 16,
    padding: screenWidth < 400 ? 10 : 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  trendLabel: {
    fontSize: screenWidth < 400 ? 12 : 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  trendText: {
    fontSize: screenWidth < 400 ? 12 : 14,
    color: '#6B7280',
    lineHeight: screenWidth < 400 ? 18 : 20,
  },
  adviceContainer: {
    marginBottom: screenWidth < 400 ? 12 : 16,
  },
  adviceLabel: {
    fontSize: screenWidth < 400 ? 12 : 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  adviceText: {
    fontSize: screenWidth < 400 ? 13 : 15,
    color: '#374151',
    lineHeight: screenWidth < 400 ? 20 : 22,
  },
  sourceContainer: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: screenWidth < 400 ? 10 : 12,
  },
  sourceText: {
    fontSize: screenWidth < 400 ? 10 : 12,
    fontStyle: 'italic',
    color: '#9CA3AF',
    lineHeight: screenWidth < 400 ? 14 : 16,
  },
  section: {
    marginBottom: screenWidth < 400 ? 16 : 20,
  },
  sectionTitle: {
    fontSize: screenWidth < 400 ? 16 : 18,
    fontWeight: 'bold',
    marginBottom: screenWidth < 400 ? 10 : 12,
    color: '#1F2937',
  },
  activitiesContainer: {
    backgroundColor: 'white',
    borderRadius: screenWidth < 400 ? 10 : 12,
    padding: screenWidth < 400 ? 12 : 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    maxWidth: screenWidth - (screenWidth < 400 ? 32 : 40),
    alignSelf: 'center',
    width: '100%',
  },
  activityItem: {
    marginVertical: 4,
  },
  positive: {
    color: '#059669',
    fontSize: screenWidth < 400 ? 14 : 16,
    fontWeight: '500',
    flexWrap: 'wrap',
  },
  negative: {
    color: '#DC2626',
    fontSize: screenWidth < 400 ? 14 : 16,
    fontWeight: '500',
    flexWrap: 'wrap',
  },
  noteContainer: {
    backgroundColor: 'white',
    borderRadius: screenWidth < 400 ? 10 : 12,
    padding: screenWidth < 400 ? 12 : 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    maxWidth: screenWidth - (screenWidth < 400 ? 32 : 40),
    alignSelf: 'center',
    width: '100%',
  },
  noteText: {
    fontSize: screenWidth < 400 ? 14 : 16,
    color: '#374151',
    lineHeight: screenWidth < 400 ? 20 : 22,
  },
  backButton: {
    backgroundColor: MoodColors.accent,
    paddingVertical: screenWidth < 400 ? 14 : 16,
    paddingHorizontal: screenWidth < 400 ? 20 : 24,
    borderRadius: screenWidth < 400 ? 12 : 16,
    marginTop: screenWidth < 400 ? 16 : 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    maxWidth: screenWidth - (screenWidth < 400 ? 32 : 40),
    alignSelf: 'center',
    width: '100%',
  },
  backText: {
    color: 'white',
    fontSize: screenWidth < 400 ? 16 : 18,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: screenWidth < 400 ? 16 : 20,
  },
  modalContent: {
    backgroundColor: 'white',
    padding: screenWidth < 400 ? 24 : 28,
    borderRadius: screenWidth < 400 ? 16 : 20,
    maxWidth: screenWidth < 400 ? 280 : 320,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalIcon: {
    fontSize: screenWidth < 400 ? 28 : 32,
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: screenWidth < 400 ? 18 : 20,
    fontWeight: 'bold',
    marginBottom: screenWidth < 400 ? 10 : 12,
    color: '#1F2937',
    textAlign: 'center',
  },
  modalText: {
    fontSize: screenWidth < 400 ? 14 : 16,
    textAlign: 'center',
    marginBottom: screenWidth < 400 ? 18 : 20,
    color: '#6B7280',
    lineHeight: screenWidth < 400 ? 20 : 22,
  },
  modalButton: {
    backgroundColor: MoodColors.accent,
    paddingVertical: screenWidth < 400 ? 10 : 12,
    paddingHorizontal: screenWidth < 400 ? 28 : 32,
    borderRadius: screenWidth < 400 ? 10 : 12,
  },
  modalButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: screenWidth < 400 ? 14 : 16,
  },
});