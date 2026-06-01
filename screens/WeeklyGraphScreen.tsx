// ✅ WeeklyGraphScreen.tsx (Enhanced - ต้องครบ 7 วันถึงจะแสดงการวิเคราะห์เชิงจิตวิทยา) - Fixed Duplicate UI

import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Dimensions, Animated } from 'react-native';
import { getAllEntries, groupEntriesByWeek, WeekData } from '../utils/historyStorage';
import { MoodEntry } from '../types';
import { moodToScore } from '../utils/mapMoodToScore';
import { activityScores } from '../utils/activityScoreTable';
import LineChartWeekly from '../components/LineChartWeekly';
import { MoodColors } from '../src/colors';
import dayjs from 'dayjs';

const { width, height } = Dimensions.get('window');
const isTablet = width >= 768;
const isLandscape = width > height;

export default function WeeklyGraphScreen({ navigation }: any) {
  const [weeks, setWeeks] = useState<WeekData[]>([]);
  const [selectedWeekIndex, setSelectedWeekIndex] = useState<number>(0);
  const [scores, setScores] = useState<number[]>([]);
  const [labels, setLabels] = useState<string[]>([]);
  const [pulseAnim] = useState(new Animated.Value(1));
  const [progressAnim] = useState(new Animated.Value(0));
  const [fadeInAnim] = useState(new Animated.Value(0));

  const normalize = (val: number) => {
    const n = Number(val);
    return !isFinite(n) ? 0 : Math.max(0, Math.min(100, n));
  };

  // Animation effects
  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeInAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // Pulse animation for incomplete weeks
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();

    return () => pulseAnimation.stop();
  }, []);

  useEffect(() => {
    const load = async () => {
      const data = await getAllEntries();
      const weeksData = groupEntriesByWeek(data);
      
      setWeeks(weeksData);
      
      if (weeksData.length > 0) {
        const latestWeekIndex = weeksData.length - 1;
        setSelectedWeekIndex(latestWeekIndex);
        processWeekData(weeksData[latestWeekIndex]);
        
        // Progress animation
        const currentWeek = weeksData[latestWeekIndex];
        const progress = currentWeek.days.length / 7;
        Animated.timing(progressAnim, {
          toValue: progress,
          duration: 1000,
          useNativeDriver: false,
        }).start();
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (weeks.length > 0 && selectedWeekIndex >= 0 && selectedWeekIndex < weeks.length) {
      processWeekData(weeks[selectedWeekIndex]);
      
      // Update progress animation when switching weeks
      const currentWeek = weeks[selectedWeekIndex];
      const progress = currentWeek.days.length / 7;
      Animated.timing(progressAnim, {
        toValue: progress,
        duration: 600,
        useNativeDriver: false,
      }).start();
    }
  }, [selectedWeekIndex, weeks]);

  const processWeekData = (weekData: WeekData) => {
    const s: number[] = [];
    const l: string[] = [];

    for (const entry of weekData.days) {
      const moodScore = moodToScore(entry.morningMood) + moodToScore(entry.nightMood);
      const activityScore = [...(entry.positiveActivities || []), ...(entry.negativeActivities || [])]
        .reduce((sum, act) => sum + (activityScores[act] || 0), 0);
      const otherRaw = entry.otherActivityScore ?? 0;
      const clampedOther = Math.max(-10, Math.min(10, otherRaw));
      const normalizedOther = (clampedOther / 10) * 3;
      const total = moodScore + activityScore + normalizedOther;
      const normalizedScore = normalize((total / 20) * 100);

      s.push(normalizedScore);
      l.push(dayjs(entry.date).format('dd D'));
    }

    setScores(s);
    setLabels(l);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10B981';
    if (score >= 60) return '#F59E0B';
    if (score >= 40) return '#EF4444';
    return '#DC2626';
  };

  const getScoreText = (score: number) => {
    if (score >= 80) return 'ดีเยี่ยม';
    if (score >= 60) return 'ดี';
    if (score >= 40) return 'ปานกลาง';
    return 'ต้องปรับปรุง';
  };

  // วิเคราะห์แนวโน้ม - เฉพาะเมื่อมีข้อมูลครบ 7 วัน
  const analyzeTrend = () => {
    if (scores.length < 7) return null;
    
    const recentThree = scores.slice(-3);
    const earlyThree = scores.slice(0, 3);
    const recentAvg = recentThree.reduce((a, b) => a + b, 0) / recentThree.length;
    const earlyAvg = earlyThree.reduce((a, b) => a + b, 0) / earlyThree.length;
    
    const diff = recentAvg - earlyAvg;
    
    if (diff > 10) return 'improving';
    if (diff < -10) return 'declining';
    return 'stable';
  };

  // สรุปผลเชิงจิตวิทยา - เฉพาะเมื่อครบ 7 วัน
  const getWeeklyPsychologicalInsight = () => {
    // ต้องมีข้อมูลครบ 7 วัน
    if (scores.length < 7) return null;
    
    const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const trend = analyzeTrend();
    const volatility = Math.sqrt(scores.reduce((sum, score) => sum + Math.pow(score - averageScore, 2), 0) / scores.length);
    
    const getInsightLevel = (): 'excellent' | 'good' | 'moderate' | 'needsAttention' => {
      if (averageScore >= 80) return 'excellent';
      if (averageScore >= 60) return 'good';
      if (averageScore >= 40) return 'moderate';
      return 'needsAttention';
    };

    const getTrendAnalysis = () => {
      switch (trend) {
        case 'improving':
          return {
            icon: '📈',
            text: 'กราฟแสดงแนวโน้มที่ดีขึ้นอย่างต่อเนื่อง',
            color: '#10B981'
          };
        case 'declining':
          return {
            icon: '📉',
            text: 'กราฟแสดงแนวโน้มที่ลดลง ควรให้ความสนใจ',
            color: '#EF4444'
          };
        default:
          return {
            icon: '📊',
            text: 'กราฟแสดงความมั่นคงในระดับปัจจุบัน',
            color: '#6B7280'
          };
      }
    };

    const getVolatilityAnalysis = () => {
      if (volatility > 25) return 'อารมณ์มีความผันผวนสูง';
      if (volatility > 15) return 'อารมณ์มีความผันผวนปานกลาง';
      return 'อารมณ์มีความสมดุล';
    };

    const level = getInsightLevel();
    const trendAnalysis = getTrendAnalysis();
    const volatilityText = getVolatilityAnalysis();

    const recommendations = {
      excellent: [
        '✨ คุณมีสุขภาพจิตที่ดีเยี่ยม รักษาสมดุลนี้ต่อไป',
        '🎯 ใช้พลังงานบวกนี้ในการพัฒนาทักษะใหม่ หรือช่วยเหลือผู้อื่น',
        '🌱 ลองท้าทายตนเองด้วยเป้าหมายใหม่ที่สร้างสรรค์'
      ],
      good: [
        '👍 คุณมีสุขภาพจิตในระดับดี แต่ยังมีพื้นที่ปรับปรุง',
        '🔄 สร้างกิจวัตรประจำวันที่ช่วยเสริมสร้างพลังงานบวก',
        '💪 ฝึกการจัดการความเครียดด้วยเทคนิคหายใจลึก หรือสมาธิ'
      ],
      moderate: [
        '⚖️ อารมณ์ของคุณอยู่ในระดับปานกลาง ต้องการความใส่ใจ',
        '🌊 ลองหากิจกรรมที่ช่วยผ่อนคลาย เช่น ฟังเพลง อ่านหนังสือ',
        '🤝 การพูดคุยกับคนใกล้ชิดจะช่วยบรรเทาความรู้สึกได้'
      ],
      needsAttention: [
        '💙 คุณอาจกำลังเผชิญกับความท้าทาย ขอให้ใจเย็นและดูแลตนเอง',
        '🛌 ให้ความสำคัญกับการพักผ่อนและการนอนหลับที่เพียงพอ',
        '🩺 หากรู้สึกท้อแท้ต่อเนื่อง ควรปรึกษาผู้เชี่ยวชาญด้านสุขภาพจิต'
      ]
    };

    return {
      level,
      averageScore,
      trend: trendAnalysis,
      volatility: volatilityText,
      recommendations: recommendations[level],
      color: getScoreColor(averageScore)
    };
  };

  const currentWeek = weeks[selectedWeekIndex];
  const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  const weeklyInsight = getWeeklyPsychologicalInsight();
  const dayCount = currentWeek?.days.length || 0;
  const isWeekComplete = dayCount >= 7;

  // สร้าง Week Chips/Tabs
  const renderWeekTabs = () => {
    if (weeks.length === 0) return null;

    return (
      <Animated.View style={[styles.weekTabsContainer, { opacity: fadeInAnim }]}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.weekTabsContent}
        >
          {weeks.map((week, index) => {
            const isSelected = selectedWeekIndex === index;
            const isLatestWeek = index === weeks.length - 1;
            const dayCount = week.days.length;
            const isComplete = dayCount >= 7;
            
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.weekTab,
                  isSelected && styles.weekTabSelected,
                  isTablet && styles.weekTabTablet,
                  isComplete && styles.weekTabComplete
                ]}
                onPress={() => setSelectedWeekIndex(index)}
                activeOpacity={0.7}
              >
                <View style={styles.weekTabContent}>
                  <Text style={[
                    styles.weekTabText,
                    isSelected && styles.weekTabTextSelected,
                    isTablet && styles.weekTabTextTablet
                  ]}>
                    สัปดาห์ที่ {index + 1}
                  </Text>
                  {isLatestWeek && dayCount < 7 && (
                    <Text style={[
                      styles.weekTabSubtext,
                      isSelected && styles.weekTabSubtextSelected,
                      isTablet && styles.weekTabSubtextTablet
                    ]}>
                      ({dayCount}/7 วัน)
                    </Text>
                  )}
                  {isComplete && (
                    <View style={styles.completeIndicator}>
                      <Text style={styles.completeIcon}>✓</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </Animated.View>
    );
  };

  // Progress Ring Component
  const renderProgressRing = () => {
    const progress = dayCount / 7;
    const circumference = 2 * Math.PI * 30;
    
    return (
      <View style={styles.progressRingContainer}>
        <Animated.View style={[
          styles.progressRing,
          {
            transform: [{ scale: pulseAnim }]
          }
        ]}>
          <Text style={styles.progressRingText}>
            {dayCount}/7
          </Text>
          <Text style={styles.progressRingSubtext}>วัน</Text>
        </Animated.View>
        <Animated.View 
          style={[
            styles.progressBar,
            {
              width: progressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%']
              })
            }
          ]} 
        />
      </View>
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Animated.View style={[styles.header, { opacity: fadeInAnim }]}>
        <Text style={styles.title}>พลังงานในแต่ละสัปดาห์</Text>
        <Text style={styles.subtitle}>เปรียบเทียบแนวโน้มความรู้สึกแต่ละสัปดาห์</Text>
      </Animated.View>

      {/* Week Selection Tabs */}
      {renderWeekTabs()}

      {weeks.length > 0 && currentWeek ? (
        <>
          <Animated.View style={[styles.chartContainer, { opacity: fadeInAnim }]}>
            <LineChartWeekly data={scores} labels={labels} />
          </Animated.View>

          {/* คำอธิบายการคำนวดคะแนน */}
          <Animated.View style={[
            styles.explanationCard,
            { opacity: fadeInAnim, transform: [{ translateY: fadeInAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [20, 0]
            }) }] }
          ]}>
            <Text style={styles.explanationTitle}>💡 คะแนนคำนวดจากอะไร?</Text>
            <Text style={styles.explanationText}>
              • <Text style={styles.bold}>อารมณ์ (เช้า + ค่ำ)</Text>: สูงสุด 14 คะแนน{'\n'}
              • <Text style={styles.bold}>กิจกรรมระหว่างวัน</Text>: สูงสุด 3 คะแนน{'\n'}
              • <Text style={styles.bold}>ปัจจัยอื่น ๆ</Text>: สูงสุด 3 คะแนน{'\n'}
              {'\n'}รวมกันเป็นคะแนน 0–20 แปลงเป็นเปอร์เซ็นต์พลังงาน
            </Text>
          </Animated.View>

          {/* สรุปภาพรวมพื้นฐาน */}
          <Animated.View style={[
            styles.summaryCard,
            { opacity: fadeInAnim, transform: [{ translateY: fadeInAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [30, 0]
            }) }] }
          ]}>
            <Text style={styles.summaryTitle}>📊 สรุปภาพรวม</Text>
            <View style={[styles.summaryRow, isTablet && styles.summaryRowTablet]}>
              <View style={[styles.summaryItem, isTablet && styles.summaryItemTablet]}>
                <Text style={styles.summaryLabel}>คะแนนเฉลี่ย</Text>
                <Text style={[styles.summaryValue, { color: getScoreColor(averageScore) }]}>
                  {averageScore.toFixed(1)}
                </Text>
                <Text style={[styles.summaryStatus, { color: getScoreColor(averageScore) }]}>
                  {getScoreText(averageScore)}
                </Text>
              </View>
              <View style={[styles.summaryItem, isTablet && styles.summaryItemTablet]}>
                <Text style={styles.summaryLabel}>จำนวนวัน</Text>
                <Text style={styles.summaryValue}>{scores.length}</Text>
                <Text style={styles.summaryStatus}>วันที่บันทึก</Text>
              </View>
            </View>
          </Animated.View>

          {/* สรุปผลเชิงจิตวิทยา - แสดงเฉพาะเมื่อครบ 7 วัน */}
          {isWeekComplete && weeklyInsight ? (
            <Animated.View style={[
              styles.weeklyInsightCard, 
              { 
                borderLeftColor: weeklyInsight.color,
                opacity: fadeInAnim,
                transform: [{ translateY: fadeInAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [40, 0]
                }) }]
              }
            ]}>
              <View style={styles.unlockHeader}>
                <Text style={styles.unlockIcon}>🎉</Text>
                <Text style={styles.weeklyInsightTitle}>🧠 สรุปผลเชิงจิตวิทยา</Text>
                <Text style={styles.unlockSubtitle}>ปลดล็อกแล้ว! คุณบันทึกครบ 7 วัน</Text>
              </View>
              
              <View style={styles.insightSection}>
                <View style={[styles.insightRow, isTablet && styles.insightRowTablet]}>
                  <Text style={styles.insightLabel}>ระดับสุขภาพจิต:</Text>
                  <View style={[styles.levelBadge, { backgroundColor: weeklyInsight.color }]}>
                    <Text style={styles.levelBadgeText}>{getScoreText(weeklyInsight.averageScore)}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.insightSection}>
                <Text style={styles.insightLabel}>📈 การวิเคราะห์แนวโน้ม:</Text>
                <View style={styles.trendContainer}>
                  <Text style={styles.trendIcon}>{weeklyInsight.trend.icon}</Text>
                  <Text style={[styles.trendText, { color: weeklyInsight.trend.color }]}>
                    {weeklyInsight.trend.text}
                  </Text>
                </View>
              </View>

              <View style={styles.insightSection}>
                <Text style={styles.insightLabel}>🎭 ความผันผวนอารมณ์:</Text>
                <Text style={styles.volatilityText}>{weeklyInsight.volatility}</Text>
              </View>

              <View style={styles.recommendationsSection}>
                <Text style={styles.recommendationsTitle}>💡 คำแนะนำเฉพาะคุณ:</Text>
                {weeklyInsight.recommendations.map((rec, index) => (
                  <Text key={index} style={styles.recommendationItem}>{rec}</Text>
                ))}
              </View>

              <View style={styles.sourceSection}>
                <Text style={styles.sourceText}>
                  อ้างอิงจาก: หลักการความฉลาดทางอารมณ์ (EQ), พฤติกรรมบำบัด, และงานวิจัยด้านสุขภาพจิตไทย
                </Text>
              </View>
            </Animated.View>
          ) : (
            /* การ์ดรอการปลดล็อก - รวมทุกฟีเจอร์เป็นการ์ดเดียว */
            <Animated.View style={[
              styles.lockedInsightCard,
              {
                opacity: fadeInAnim,
                transform: [
                  { scale: pulseAnim },
                  { translateY: fadeInAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [40, 0]
                    })
                  }
                ]
              }
            ]}>
              <View style={styles.lockedHeader}>
                <Text style={styles.lockedIcon}>🔒</Text>
                <Text style={styles.lockedTitle}>การวิเคราะห์เชิงจิตวิทยา</Text>
                <Text style={styles.lockedSubtitle}>ต้องบันทึกครบ 7 วันเพื่อปลดล็อก</Text>
              </View>

              {renderProgressRing()}

              <View style={styles.lockedFeatures}>
                <Text style={styles.lockedFeatureTitle}>🎁 สิ่งที่จะได้เมื่อปลดล็อก:</Text>
                <View style={styles.featureList}>
                  <Text style={styles.featureItem}>🧠 การวิเคราะห์ระดับสุขภาพจิต</Text>
                  <Text style={styles.featureItem}>📈 แนวโน้มอารมณ์รายสัปดาห์</Text>
                  <Text style={styles.featureItem}>🎯 คำแนะนำเฉพาะบุคคล</Text>
                  <Text style={styles.featureItem}>📋 รายงานสุขภาพจิตเชิงลึก</Text>
                </View>
              </View>

              <View style={styles.motivationSection}>
                <Text style={styles.motivationText}>
                  💪 เหลืออีก {7 - dayCount} วัน จะได้รายงานเชิงจิตวิทยาแบบเต็ม!
                </Text>
              </View>
            </Animated.View>
          )}
        </>
      ) : (
        /* ไม่มีข้อมูล */
        <Animated.View style={[styles.emptyState, { opacity: fadeInAnim }]}>
          <Text style={styles.emptyIcon}>📊</Text>
          <Text style={styles.emptyTitle}>ยังไม่มีข้อมูลสำหรับสร้างกราฟ</Text>
          <Text style={styles.emptyText}>เริ่มบันทึกอารมณ์เพื่อดูแนวโน้มและการวิเคราะห์</Text>
        </Animated.View>
      )}

      <Animated.View style={{ opacity: fadeInAnim }}>
        <TouchableOpacity 
          style={styles.button} 
          onPress={() => navigation.navigate('Home')}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonIcon}>🏠</Text>
          <Text style={styles.buttonText}>กลับหน้าหลัก</Text>
        </TouchableOpacity>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: isTablet ? (isLandscape ? width * 0.08 : width * 0.05) : width * 0.05,
    backgroundColor: MoodColors.bg,
    minHeight: '100%',
    paddingHorizontal: isTablet ? (isLandscape ? width * 0.12 : width * 0.08) : width * 0.05,
  },
  header: {
    alignItems: 'center',
    marginBottom: isTablet ? 30 : 20,
    paddingHorizontal: isTablet ? 40 : 0,
  },
  title: {
    fontSize: isTablet ? 36 : (width < 350 ? 24 : 28),
    fontWeight: 'bold',
    color: MoodColors.accent,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: isTablet ? 20 : (width < 350 ? 14 : 16),
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  weekTabsContainer: {
    marginBottom: isTablet ? 30 : 20,
  },
  weekTabsContent: {
    paddingHorizontal: isTablet ? 20 : 10,
    alignItems: 'center',
  },
  weekTab: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: isTablet ? 20 : 16,
    paddingVertical: isTablet ? 12 : 10,
    borderRadius: isTablet ? 16 : 12,
    marginHorizontal: isTablet ? 8 : 6,
    minWidth: isTablet ? 120 : 100,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  weekTabSelected: {
    backgroundColor: MoodColors.accent,
    borderColor: '#C084FC',
    shadowColor: MoodColors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  weekTabComplete: {
    backgroundColor: '#10B981',
    borderColor: '#059669',
  },
  weekTabTablet: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    minWidth: 140,
  },
  weekTabContent: {
    alignItems: 'center',
    position: 'relative',
  },
  weekTabText: {
    fontSize: isTablet ? 16 : (width < 350 ? 12 : 14),
    fontWeight: '600',
    color: '#374151',
  },
  weekTabTextSelected: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  weekTabTextTablet: {
    fontSize: 18,
  },
  weekTabSubtext: {
    fontSize: isTablet ? 12 : (width < 350 ? 10 : 11),
    color: '#9CA3AF',
    marginTop: 2,
  },
  weekTabSubtextSelected: {
    color: '#E5E7EB',
  },
  weekTabSubtextTablet: {
    fontSize: 14,
  },
  completeIndicator: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#059669',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeIcon: {
    fontSize: 12,
    color: 'white',
    fontWeight: 'bold',
  },
  chartContainer: {
    backgroundColor: '#fff',
    borderRadius: isTablet ? 20 : 16,
    padding: isTablet ? 30 : (width < 350 ? 16 : 20),
    marginBottom: isTablet ? 30 : 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginHorizontal: isTablet && isLandscape ? width * 0.05 : 0,
  },
  explanationCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: isTablet ? 16 : 12,
    padding: isTablet ? 24 : (width < 350 ? 12 : 16),
    marginBottom: isTablet ? 30 : 20,
    borderLeftWidth: isTablet ? 6 : 4,
    borderLeftColor: MoodColors.accent,
    marginHorizontal: isTablet && isLandscape ? width * 0.05 : 0,
  },
  explanationTitle: {
    fontSize: isTablet ? 20 : (width < 350 ? 14 : 16),
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: isTablet ? 12 : 8,
  },
  explanationText: {
    fontSize: isTablet ? 16 : (width < 350 ? 13 : 14),
    color: '#374151',
    lineHeight: isTablet ? 24 : (width < 350 ? 18 : 20),
  },
  bold: {
    fontWeight: '600',
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: isTablet ? 20 : 16,
    padding: isTablet ? 30 : (width < 350 ? 16 : 20),
    marginBottom: isTablet ? 30 : 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginHorizontal: isTablet && isLandscape ? width * 0.05 : 0,
  },
  summaryTitle: {
    fontSize: isTablet ? 22 : (width < 350 ? 16 : 18),
    fontWeight: 'bold',
    marginBottom: isTablet ? 20 : 15,
    textAlign: 'center',
    color: '#1F2937',
  },
  summaryRow: {
    flexDirection: isTablet ? 'row' : (width < 350 ? 'column' : 'row'),
    justifyContent: 'space-around',
    alignItems: width < 350 ? 'stretch' : 'flex-start',
  },
  summaryRowTablet: {
    justifyContent: 'space-evenly',
    paddingHorizontal: 40,
  },
  summaryItem: {
    alignItems: 'center',
    flex: width < 350 ? 0 : 1,
    marginBottom: width < 350 ? 15 : 0,
    paddingVertical: width < 350 ? 10 : 0,
  },
  summaryItemTablet: {
    paddingVertical: 20,
    minWidth: 150,
  },
  summaryLabel: {
    fontSize: isTablet ? 16 : (width < 350 ? 13 : 14),
    color: '#6B7280',
    marginBottom: isTablet ? 12 : 8,
  },
  summaryValue: {
    fontSize: isTablet ? 32 : (width < 350 ? 20 : 24),
    fontWeight: 'bold',
    marginBottom: isTablet ? 6 : 4,
  },
  summaryStatus: {
    fontSize: isTablet ? 14 : (width < 350 ? 11 : 12),
    fontWeight: '600',
  },
  weeklyInsightCard: {
    backgroundColor: '#fff',
    borderRadius: isTablet ? 20 : 16,
    padding: isTablet ? 30 : (width < 350 ? 16 : 20),
    marginBottom: isTablet ? 30 : 20,
    borderLeftWidth: isTablet ? 6 : 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginHorizontal: isTablet && isLandscape ? width * 0.05 : 0,
  },
  unlockHeader: {
    alignItems: 'center',
    marginBottom: isTablet ? 24 : 16,
    paddingBottom: isTablet ? 16 : 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  unlockIcon: {
    fontSize: isTablet ? 32 : 24,
    marginBottom: isTablet ? 8 : 6,
  },
  weeklyInsightTitle: {
    fontSize: isTablet ? 22 : (width < 350 ? 16 : 18),
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: isTablet ? 6 : 4,
    textAlign: 'center',
  },
  unlockSubtitle: {
    fontSize: isTablet ? 14 : (width < 350 ? 11 : 12),
    color: '#10B981',
    fontWeight: '600',
  },
  insightSection: {
    marginBottom: isTablet ? 24 : 16,
  },
  insightRow: {
    flexDirection: width < 400 ? 'column' : 'row',
    alignItems: width < 400 ? 'flex-start' : 'center',
    justifyContent: 'space-between',
  },
  insightRowTablet: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  insightLabel: {
    fontSize: isTablet ? 16 : (width < 350 ? 13 : 14),
    fontWeight: '600',
    color: '#374151',
    marginBottom: isTablet ? 8 : 6,
    marginRight: width < 400 ? 0 : 10,
  },
  levelBadge: {
    paddingHorizontal: isTablet ? 16 : 12,
    paddingVertical: isTablet ? 6 : 4,
    borderRadius: isTablet ? 16 : 12,
    marginTop: width < 400 ? 8 : 0,
    alignSelf: width < 400 ? 'flex-start' : 'flex-end',
  },
  levelBadgeText: {
    color: 'white',
    fontSize: isTablet ? 14 : (width < 350 ? 11 : 12),
    fontWeight: 'bold',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: isTablet ? 16 : (width < 350 ? 8 : 10),
    borderRadius: isTablet ? 12 : 8,
  },
  trendIcon: {
    fontSize: isTablet ? 20 : 16,
    marginRight: isTablet ? 12 : 8,
  },
  trendText: {
    fontSize: isTablet ? 16 : (width < 350 ? 13 : 14),
    flex: 1,
    fontWeight: '500',
    flexWrap: 'wrap',
  },
  volatilityText: {
    fontSize: isTablet ? 16 : (width < 350 ? 13 : 14),
    color: '#6B7280',
    backgroundColor: '#F9FAFB',
    padding: isTablet ? 12 : 8,
    borderRadius: isTablet ? 8 : 6,
  },
  recommendationsSection: {
    marginBottom: isTablet ? 24 : 16,
  },
  recommendationsTitle: {
    fontSize: isTablet ? 16 : (width < 350 ? 13 : 14),
    fontWeight: '600',
    color: '#374151',
    marginBottom: isTablet ? 12 : 8,
  },
  recommendationItem: {
    fontSize: isTablet ? 16 : (width < 350 ? 13 : 14),
    color: '#374151',
    lineHeight: isTablet ? 24 : (width < 350 ? 18 : 20),
    marginBottom: isTablet ? 8 : 6,
  },
  sourceSection: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: isTablet ? 16 : 12,
  },
  sourceText: {
    fontSize: isTablet ? 14 : (width < 350 ? 11 : 12),
    fontStyle: 'italic',
    color: '#9CA3AF',
    lineHeight: isTablet ? 20 : 16,
  },
  lockedInsightCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: isTablet ? 20 : 16,
    padding: isTablet ? 30 : (width < 350 ? 16 : 20),
    marginBottom: isTablet ? 30 : 20,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    marginHorizontal: isTablet && isLandscape ? width * 0.05 : 0,
  },
  lockedHeader: {
    alignItems: 'center',
    marginBottom: isTablet ? 24 : 16,
    paddingBottom: isTablet ? 16 : 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  lockedIcon: {
    fontSize: isTablet ? 32 : 24,
    marginBottom: isTablet ? 8 : 6,
    opacity: 0.6,
  },
  lockedTitle: {
    fontSize: isTablet ? 22 : (width < 350 ? 16 : 18),
    fontWeight: 'bold',
    color: '#64748B',
    marginBottom: isTablet ? 6 : 4,
    textAlign: 'center',
  },
  lockedSubtitle: {
    fontSize: isTablet ? 14 : (width < 350 ? 11 : 12),
    color: '#94A3B8',
    fontWeight: '500',
  },
  progressRingContainer: {
    alignItems: 'center',
    marginBottom: isTablet ? 24 : 16,
  },
  progressRing: {
    width: isTablet ? 100 : 80,
    height: isTablet ? 100 : 80,
    borderRadius: isTablet ? 50 : 40,
    backgroundColor: '#EEF2FF',
    borderWidth: isTablet ? 6 : 4,
    borderColor: MoodColors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: isTablet ? 16 : 12,
  },
  progressRingText: {
    fontSize: isTablet ? 20 : 16,
    fontWeight: 'bold',
    color: MoodColors.accent,
  },
  progressRingSubtext: {
    fontSize: isTablet ? 12 : 10,
    color: '#64748B',
    marginTop: 2,
  },
  progressBar: {
    height: isTablet ? 8 : 6,
    backgroundColor: MoodColors.accent,
    borderRadius: isTablet ? 4 : 3,
    width: '60%',
    maxWidth: 200,
  },
  lockedFeatures: {
    marginBottom: isTablet ? 24 : 16,
  },
  lockedFeatureTitle: {
    fontSize: isTablet ? 16 : (width < 350 ? 13 : 14),
    fontWeight: '600',
    color: '#475569',
    marginBottom: isTablet ? 12 : 8,
    textAlign: 'center',
  },
  featureList: {
    backgroundColor: '#FFFFFF',
    borderRadius: isTablet ? 12 : 8,
    padding: isTablet ? 16 : 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  featureItem: {
    fontSize: isTablet ? 15 : (width < 350 ? 12 : 13),
    color: '#64748B',
    marginBottom: isTablet ? 8 : 6,
    paddingLeft: isTablet ? 8 : 4,
  },
  motivationSection: {
    backgroundColor: '#FEF3C7',
    borderRadius: isTablet ? 12 : 8,
    padding: isTablet ? 16 : 12,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  motivationText: {
    fontSize: isTablet ? 15 : (width < 350 ? 12 : 13),
    color: '#92400E',
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: isTablet ? 60 : 40,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    fontSize: isTablet ? 64 : (width < 350 ? 40 : 48),
    marginBottom: isTablet ? 20 : 16,
  },
  emptyTitle: {
    fontSize: isTablet ? 22 : (width < 350 ? 16 : 18),
    color: '#374151',
    fontWeight: '600',
    marginBottom: isTablet ? 12 : 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: isTablet ? 16 : (width < 350 ? 13 : 14),
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  button: {
    backgroundColor: MoodColors.accent,
    padding: isTablet ? 24 : (width < 350 ? 16 : 18),
    borderRadius: isTablet ? 20 : 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginHorizontal: isTablet && isLandscape ? width * 0.05 : 0,
    maxWidth: isTablet ? 400 : '100%',
    alignSelf: 'center',
    marginTop: 10,
  },
  buttonIcon: {
    fontSize: isTablet ? 24 : (width < 350 ? 18 : 20),
    marginRight: isTablet ? 12 : 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: isTablet ? 20 : (width < 350 ? 16 : 18),
    fontWeight: 'bold',
  },
});