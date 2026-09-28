import { Check, Lock, Minus, TrendingDown, TrendingUp } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { LayoutChangeEvent, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EnergyLineChart } from '../components/charts/EnergyLineChart';
import { ProgressRing } from '../components/charts/ProgressRing';
import { MoodCharacter } from '../components/mood/MoodCharacter';
import { GrainOverlay } from '../components/ui/GrainOverlay';
import { PaperScreen } from '../components/ui/PaperScreen';
import { Pill } from '../components/ui/Pill';
import { PressableScale } from '../components/ui/PressableScale';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { TopBar } from '../components/ui/TopBar';
import { Txt } from '../components/ui/Txt';
import { MOODS } from '../constants/moods';
import { chartLabel, todayKey } from '../domain/dates';
import { analyzeWeek, scoreColor, scoreEntry, scoreText } from '../domain/scoring';
import { useResponsive } from '../hooks/useResponsive';
import type { ScreenProps } from '../navigation/types';
import { groupEntriesByWeek } from '../storage/entries';
import { useEntries } from '../store/EntriesProvider';
import { colors, fonts, radii } from '../theme';

export default function WeeklyScreen({ navigation }: ScreenProps<'Weekly'>) {
  const { entries } = useEntries();
  const r = useResponsive();
  const insets = useSafeAreaInsets();
  const weeks = useMemo(() => groupEntriesByWeek(entries), [entries]);
  const [selected, setSelected] = useState<number | null>(null);
  const [chartWidth, setChartWidth] = useState(0);

  const index = selected ?? weeks.length - 1;
  const week = weeks[index];
  const inner = Math.min(r.width - r.gutter * 2, 720);

  const { scores, labels, dots } = useMemo(() => {
    const days = week?.days ?? [];
    return {
      scores: days.map((d) => scoreEntry(d).percent),
      labels: days.map((d) => chartLabel(d.date)),
      dots: days.map((d) => MOODS[d.nightMood].palette.bg),
    };
  }, [week]);

  const average = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  const insight = analyzeWeek(scores);
  const dayCount = week?.days.length ?? 0;

  const onChartLayout = (e: LayoutChangeEvent) => setChartWidth(e.nativeEvent.layout.width);

  return (
    <PaperScreen>
      <View style={{ paddingHorizontal: r.gutter - 4, paddingTop: 8 }}>
        <TopBar label="Mood Tracker" sublabel="สรุปรายสัปดาห์" />
      </View>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ width: inner }}>
          <Txt variant="headline" size={r.clampVw(28, 8, 40)} style={styles.title}>
            {'พลังงานใน\nแต่ละสัปดาห์'}
          </Txt>
          <Txt variant="body" color={colors.muted} style={styles.lead}>
            เปรียบเทียบแนวโน้มความรู้สึกทุก 7 วันที่บันทึก
          </Txt>
        </View>

        {weeks.length ? (
          <>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={[styles.tabs, { paddingHorizontal: (r.width - inner) / 2 }]}
              style={styles.tabsWrap}
            >
              {weeks.map((w, i) => {
                const active = i === index;
                const done = w.days.length >= 7;
                return (
                  <PressableScale
                    key={w.week}
                    onPress={() => setSelected(i)}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={`สัปดาห์ที่ ${w.week}${done ? ' ครบแล้ว' : ` ${w.days.length} จาก 7 วัน`}`}
                    style={[styles.tab, active && styles.tabActive]}
                  >
                    <Txt variant="bodyStrong" size={15} color={active ? colors.white : colors.ink}>
                      สัปดาห์ที่ {w.week}
                    </Txt>
                    {done ? (
                      <View style={[styles.tabCheck, active && { backgroundColor: colors.white }]}>
                        <Check size={12} strokeWidth={3} color={active ? colors.ink : colors.white} />
                      </View>
                    ) : (
                      <Txt variant="caption" color={active ? 'rgba(255,255,255,0.75)' : colors.muted}>
                        {w.days.length}/7
                      </Txt>
                    )}
                  </PressableScale>
                );
              })}
            </ScrollView>

            <View style={{ width: inner }}>
              <Animated.View key={`hero-${index}`} entering={FadeIn.duration(400)} style={styles.hero}>
                <View style={styles.heroCopy}>
                  <Txt variant="overline" color="rgba(255,255,255,0.7)">
                    คะแนนเฉลี่ย · สัปดาห์ที่ {week.week}
                  </Txt>
                  <Txt style={styles.heroValue}>{Math.round(average)}%</Txt>
                  <View style={styles.heroTags}>
                    <Pill tone="glass" dot={scoreColor(average)}>
                      {scoreText(average)}
                    </Pill>
                    <Pill tone="glass">{`บันทึก ${dayCount} วัน`}</Pill>
                  </View>
                </View>
                <Txt style={styles.heroGhost} numberOfLines={1}>
                  W{week.week}
                </Txt>
                <GrainOverlay opacity={0.3} />
              </Animated.View>

              <View style={styles.card} onLayout={onChartLayout}>
                <Txt variant="title" size={17}>
                  เส้นพลังงานรายวัน
                </Txt>
                <Txt variant="caption" color={colors.muted} style={styles.cardLead}>
                  จุดแต่ละจุดคือสีอารมณ์ก่อนนอนของวันนั้น
                </Txt>
                {chartWidth > 0 ? (
                  <EnergyLineChart data={scores} labels={labels} dotColors={dots} width={chartWidth - 40} />
                ) : null}
              </View>

              <View style={styles.card}>
                <Txt variant="title" size={17}>
                  คะแนนคำนวณจากอะไร?
                </Txt>
                {[
                  ['อารมณ์ (เช้า + ก่อนนอน)', 'สูงสุด 14 คะแนน'],
                  ['กิจกรรมระหว่างวัน', 'สูงสุด 3 คะแนน'],
                  ['ปัจจัยอื่น ๆ', 'สูงสุด 3 คะแนน'],
                ].map(([k, v]) => (
                  <View key={k} style={styles.explainRow}>
                    <Txt variant="body" size={15} style={styles.flex}>
                      {k}
                    </Txt>
                    <Txt variant="bodyStrong" size={15}>
                      {v}
                    </Txt>
                  </View>
                ))}
                <Txt variant="caption" color={colors.muted} style={styles.explainNote}>
                  รวมกันเป็นคะแนน 0–20 แล้วแปลงเป็นเปอร์เซ็นต์พลังงาน
                </Txt>
              </View>

              {insight ? (
                <Animated.View
                  key={`insight-${index}`}
                  entering={FadeInDown.duration(500)}
                  style={[styles.card, { borderLeftWidth: 6, borderLeftColor: insight.color }]}
                >
                  <Pill tone="ink">ปลดล็อกแล้ว · ครบ 7 วัน</Pill>
                  <Txt variant="headline" size={24} style={styles.insightTitle}>
                    สรุปผลเชิงจิตวิทยา
                  </Txt>
                  <View style={styles.insightRow}>
                    <Txt variant="body" style={styles.flex}>
                      ระดับสุขภาพจิต
                    </Txt>
                    <Pill dot={insight.color}>{scoreText(insight.averageScore)}</Pill>
                  </View>
                  <View style={styles.insightRow}>
                    {insight.trend.kind === 'improving' ? (
                      <TrendingUp color={insight.trend.color} size={22} />
                    ) : insight.trend.kind === 'declining' ? (
                      <TrendingDown color={insight.trend.color} size={22} />
                    ) : (
                      <Minus color={insight.trend.color} size={22} />
                    )}
                    <Txt variant="bodyStrong" color={insight.trend.color} style={styles.flex}>
                      {insight.trend.text}
                    </Txt>
                  </View>
                  <View style={styles.insightRow}>
                    <Txt variant="body" style={styles.flex}>
                      ความผันผวนอารมณ์
                    </Txt>
                    <Txt variant="bodyStrong">{insight.volatility}</Txt>
                  </View>
                  <Txt variant="bodyStrong" style={styles.recTitle}>
                    คำแนะนำเฉพาะคุณ
                  </Txt>
                  {insight.recommendations.map((rec, i) => (
                    <View key={rec} style={styles.rec}>
                      <Txt style={styles.recIndex}>{String(i + 1).padStart(2, '0')}</Txt>
                      <Txt variant="body" color={colors.inkSoft} style={styles.flex}>
                        {rec}
                      </Txt>
                    </View>
                  ))}
                  <Txt variant="caption" color={colors.muted} style={styles.source}>
                    อ้างอิงจาก: หลักการความฉลาดทางอารมณ์ (EQ), พฤติกรรมบำบัด, และงานวิจัยด้านสุขภาพจิตไทย
                  </Txt>
                </Animated.View>
              ) : (
                <Animated.View key={`locked-${index}`} entering={FadeInDown.duration(500)} style={[styles.card, styles.locked]}>
                  <View style={styles.lockedHead}>
                    <Lock size={18} color={colors.ink} />
                    <Txt variant="title" size={17}>
                      การวิเคราะห์เชิงจิตวิทยา
                    </Txt>
                  </View>
                  <ProgressRing size={170} progress={dayCount / 7} color={colors.ink}>
                    <Txt style={styles.ringValue}>{dayCount}/7</Txt>
                    <Txt variant="caption" color={colors.muted}>
                      วัน
                    </Txt>
                  </ProgressRing>
                  <Txt variant="bodyStrong" align="center">
                    เหลืออีก {7 - dayCount} วัน จะได้รายงานเชิงจิตวิทยาแบบเต็ม!
                  </Txt>
                  <View style={styles.features}>
                    {[
                      'การวิเคราะห์ระดับสุขภาพจิต',
                      'แนวโน้มอารมณ์รายสัปดาห์',
                      'คำแนะนำเฉพาะบุคคล',
                      'รายงานสุขภาพจิตเชิงลึก',
                    ].map((f) => (
                      <Pill key={f} dot={colors.lavender}>
                        {f}
                      </Pill>
                    ))}
                  </View>
                </Animated.View>
              )}
            </View>
          </>
        ) : (
          <View style={[styles.empty, { width: inner }]}>
            <View style={[styles.emptyAvatar, { backgroundColor: MOODS.blue.palette.bg }]}>
              <MoodCharacter mood="blue" size={120} />
            </View>
            <Txt variant="headline" size={24} align="center">
              ยังไม่มีข้อมูลสำหรับสร้างกราฟ
            </Txt>
            <Txt variant="body" color={colors.muted} align="center">
              เริ่มบันทึกอารมณ์เพื่อดูแนวโน้มและการวิเคราะห์
            </Txt>
            <PrimaryButton
              label="เริ่มบันทึก"
              onPress={() => navigation.navigate('MoodPicker', { period: 'morning', date: todayKey() })}
              style={styles.emptyButton}
            />
          </View>
        )}
      </ScrollView>
    </PaperScreen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { alignItems: 'center' },
  title: { marginTop: 8 },
  lead: { marginTop: 6 },
  tabsWrap: { flexGrow: 0, alignSelf: 'stretch', marginTop: 20 },
  tabs: { gap: 8 },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: radii.pill,
    backgroundColor: colors.badge,
  },
  tabActive: { backgroundColor: colors.ink },
  tabCheck: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.positive,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: {
    marginTop: 18,
    borderRadius: radii.sheet,
    backgroundColor: colors.ink,
    padding: 24,
    overflow: 'hidden',
    minHeight: 200,
  },
  heroCopy: { zIndex: 2 },
  heroValue: { fontFamily: fonts.display, fontSize: 88, lineHeight: 96, color: colors.white, marginTop: 4 },
  heroTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  heroGhost: {
    position: 'absolute',
    right: -8,
    bottom: -34,
    fontFamily: fonts.display,
    fontSize: 170,
    lineHeight: 180,
    color: 'rgba(255,255,255,0.07)',
  },
  card: {
    marginTop: 14,
    backgroundColor: colors.card,
    borderRadius: radii.card,
    padding: 20,
  },
  cardLead: { marginTop: 2, marginBottom: 8 },
  explainRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  explainNote: { marginTop: 14 },
  insightTitle: { marginTop: 14, marginBottom: 6 },
  insightRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  recTitle: { marginTop: 20, marginBottom: 4 },
  rec: { flexDirection: 'row', gap: 12, marginTop: 10 },
  recIndex: { fontFamily: fonts.display, fontSize: 18, color: colors.muted, width: 26 },
  source: { marginTop: 18 },
  locked: { alignItems: 'center', gap: 16 },
  lockedHead: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start' },
  ringValue: { fontFamily: fonts.display, fontSize: 44, lineHeight: 50, color: colors.ink },
  features: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  empty: { alignItems: 'center', gap: 10, paddingTop: 40 },
  emptyAvatar: {
    width: 170,
    height: 170,
    borderRadius: 85,
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'hidden',
    marginBottom: 12,
  },
  emptyButton: { marginTop: 18, alignSelf: 'stretch' },
});
