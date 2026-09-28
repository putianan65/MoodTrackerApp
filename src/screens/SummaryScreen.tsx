import { StatusBar } from 'expo-status-bar';
import { Check, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
  interpolateColor,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RadarChart } from '../components/charts/RadarChart';
import { CHARACTER_RATIO, MoodCharacter } from '../components/mood/MoodCharacter';
import { Glow } from '../components/scenery/MoodGlow';
import { Sky } from '../components/scenery/Sky';
import { GrainOverlay } from '../components/ui/GrainOverlay';
import { Pill } from '../components/ui/Pill';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { Sheet } from '../components/ui/Sheet';
import { TopBar } from '../components/ui/TopBar';
import { Txt } from '../components/ui/Txt';
import { MOODS } from '../constants/moods';
import { formatThaiDate, todayKey } from '../domain/dates';
import {
  LOW_ENERGY_THRESHOLD,
  MAX_SCORE,
  analyzeEnergy,
  formatScore,
  rawActivityScore,
  scoreEntry,
} from '../domain/scoring';
import { useResponsive } from '../hooks/useResponsive';
import type { ScreenProps } from '../navigation/types';
import { useEntries } from '../store/EntriesProvider';
import { colors, fonts, motion, radii } from '../theme';
import { toNight } from '../theme/phase';
import { isComplete } from '../types/entry';

export default function SummaryScreen({ route, navigation }: ScreenProps<'Summary'>) {
  const { date, fresh } = route.params;
  const { getEntry, ready } = useEntries();
  const r = useResponsive();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const entry = getEntry(date);

  const [lowEnergyOpen, setLowEnergyOpen] = useState(false);
  const shift = useSharedValue(0);

  useEffect(() => {
    // Morning colour flows into the night colour: the day at a glance.
    // An unfinished day stays in daylight.
    const target = entry && isComplete(entry) ? 1 : 0;
    shift.value = withDelay(
      reduceMotion ? 0 : 500,
      withTiming(target, { duration: reduceMotion ? 0 : 2200, easing: motion.easing }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shift, reduceMotion, ready]);

  useEffect(() => {
    if (entry && isComplete(entry) && date === todayKey() && scoreEntry(entry).total < LOW_ENERGY_THRESHOLD) {
      const t = setTimeout(() => setLowEnergyOpen(true), fresh ? 1400 : 400);
      return () => clearTimeout(t);
    }
    // Show once per visit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  const morning = entry ? MOODS[entry.morningMood] : MOODS.yellow;
  const night = entry ? MOODS[entry.nightMood] : MOODS.yellow;
  // The hero plays the day out: morning colour and sunshine sink into the
  // night-tinted evening colour as the stars come out.
  const nightBg = toNight(night.palette.bg);
  const heroStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(shift.value, [0, 1], [morning.palette.bg, nightBg]),
  }));
  const daySkyStyle = useAnimatedStyle(() => ({ opacity: 1 - shift.value }));
  const nightSkyStyle = useAnimatedStyle(() => ({ opacity: shift.value }));

  const leave = () => (fresh ? navigation.popToTop() : navigation.goBack());

  if (!entry) {
    return (
      <View style={[styles.empty, { paddingTop: insets.top + 8 }]}>
        <StatusBar style="dark" />
        <View style={{ paddingHorizontal: r.gutter - 4 }}>
          <TopBar label="สรุปผลรายวัน" onBack={leave} />
        </View>
        <View style={styles.emptyBody}>
          <Txt variant="headline" align="center">
            {ready ? 'ไม่มีข้อมูล' : ''}
          </Txt>
        </View>
      </View>
    );
  }

  const score = scoreEntry(entry);
  const insight = analyzeEnergy(score.total);
  const complete = isComplete(entry);
  const inner = Math.min(r.width - r.gutter * 2, 640);
  const heroHeight = r.isWide ? Math.max(460, r.height * 0.62) : Math.min(r.height * 0.6, r.width * 1.3);
  const percentSize = r.clampVw(96, 36, 260);
  const nightSize = Math.min(r.width * (r.isWide ? 0.22 : 0.42), heroHeight * 0.44);
  const morningSize = nightSize * 0.7;
  const duoTop = heroHeight - 16 - (nightSize * CHARACTER_RATIO + 34);

  const rows = [
    { label: 'อารมณ์ตอนเช้า', value: score.morning, min: 0, max: 7, color: morning.palette.bg },
    { label: 'อารมณ์ก่อนนอน', value: score.night, min: 0, max: 7, color: night.palette.bg },
    { label: 'กิจกรรมระหว่างวัน', value: score.activity, min: -3, max: 3, color: colors.ink, raw: rawActivityScore(entry) },
    { label: 'กิจกรรมอื่น ๆ', value: score.other, min: -3, max: 3, color: colors.lavender },
  ];

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        <Animated.View style={[styles.hero, { height: heroHeight + 32 }, heroStyle]}>
          <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, daySkyStyle]}>
            <Sky phase="morning" width={r.width} height={heroHeight} reduceMotion={reduceMotion} />
          </Animated.View>
          {complete ? (
            <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, nightSkyStyle]}>
              <Glow
                color={night.palette.bg}
                cx={r.width / 2 + (morningSize + 8) / 2}
                cy={duoTop + (nightSize * CHARACTER_RATIO) / 2}
                radius={nightSize * 1.25}
                width={r.width}
                height={heroHeight + 32}
              />
              <Sky phase="night" width={r.width} height={heroHeight} reduceMotion={reduceMotion} />
            </Animated.View>
          ) : null}
          <View style={{ paddingTop: insets.top + 8, paddingHorizontal: r.gutter - 4, zIndex: 60 }}>
            <TopBar
              tone="light"
              kind={fresh ? 'close' : 'back'}
              label="Mood Tracker"
              sublabel={`สรุปผลรายวัน · ${formatThaiDate(entry.date)}`}
              onBack={leave}
            />
          </View>

          <Animated.Text
            entering={reduceMotion ? undefined : FadeInUp.duration(700)}
            allowFontScaling={false}
            style={[styles.percent, { fontSize: percentSize, lineHeight: percentSize * 1.05, top: heroHeight * 0.2 }]}
          >
            {Math.round(score.percent)}%
          </Animated.Text>

          <View style={[styles.duo, { top: duoTop }]}>
            <Animated.View entering={reduceMotion ? undefined : FadeInDown.delay(200).duration(600)} style={styles.duoItem}>
              <MoodCharacter mood={morning.key} size={morningSize} />
              <Pill tone="glass" size={12}>
                {`เช้า · ${morning.label}`}
              </Pill>
            </Animated.View>
            <Animated.View entering={reduceMotion ? undefined : FadeInDown.delay(500).duration(600)} style={styles.duoItem}>
              <MoodCharacter mood={night.key} size={nightSize} outfit="pajamas" />
              <Pill tone="glass" size={12}>
                {`ก่อนนอน · ${night.label}`}
              </Pill>
            </Animated.View>
          </View>
          <GrainOverlay />
        </Animated.View>

        <View style={[styles.sheet, { paddingHorizontal: r.gutter, paddingBottom: insets.bottom + 28 }]}>
          <View style={{ width: inner, alignSelf: 'center' }}>
            {!complete ? (
              <View style={styles.pending}>
                <Txt variant="bodyStrong" style={styles.flex}>
                  วันนี้ยังบันทึกไม่ครบ — ยังไม่ได้เลือกอารมณ์ก่อนนอน
                </Txt>
                <PrimaryButton
                  label="บันทึกต่อ"
                  tone="white"
                  onPress={() => navigation.navigate('ActivityLog', { date })}
                  style={styles.pendingButton}
                />
              </View>
            ) : null}

            <View style={styles.scoreHead}>
              <View style={styles.flex}>
                <Pill dot={insight.color}>{`ระดับพลังงาน · ${insight.level}`}</Pill>
                <Txt variant="headline" size={r.clampVw(26, 7, 34)} style={styles.scoreTitle}>
                  สรุปคะแนนวันนี้
                </Txt>
              </View>
              <View style={styles.scoreValue}>
                <Txt style={styles.scoreBig}>{formatScore(Number(score.total.toFixed(1)))}</Txt>
                <Txt variant="caption" color={colors.muted}>
                  จาก {MAX_SCORE} คะแนน
                </Txt>
              </View>
            </View>

            <View style={styles.card}>
              {rows.map((row) => (
                <BreakdownRow key={row.label} {...row} />
              ))}
            </View>

            <View style={[styles.card, styles.center]}>
              <Txt variant="title" size={17} style={styles.cardTitle}>
                ภาพรวม 5 มิติ
              </Txt>
              <RadarChart entry={entry} size={Math.min(inner - 16, 340)} />
            </View>

            <View style={[styles.card, { borderLeftWidth: 6, borderLeftColor: insight.color }]}>
              <Txt variant="overline" color={colors.muted}>
                วิเคราะห์พลังงานของคุณวันนี้
              </Txt>
              <Txt style={[styles.energyWord, { color: insight.color }]}>{insight.word} energy</Txt>
              <Txt variant="bodyStrong" style={styles.gap}>
                การตีความกราฟ
              </Txt>
              <Txt variant="body" color={colors.inkSoft}>
                {insight.trend}
              </Txt>
              <Txt variant="bodyStrong" style={styles.gap}>
                คำแนะนำ
              </Txt>
              <Txt variant="body" color={colors.inkSoft}>
                {insight.advice}
              </Txt>
              <Txt variant="caption" color={colors.muted} style={styles.source}>
                อ้างอิงจาก: กรมสุขภาพจิต กระทรวงสาธารณสุข และสำนักงานกองทุนสนับสนุนการสร้างเสริมสุขภาพ (สสส.)
              </Txt>
            </View>

            <Txt variant="title" size={18} style={styles.sectionTitle}>
              กิจกรรมที่ทำ
            </Txt>
            <View style={styles.chips}>
              {entry.positiveActivities.map((item) => (
                <View key={item} style={[styles.chip, { backgroundColor: colors.positive }]}>
                  <Check size={15} color={colors.white} strokeWidth={2.5} />
                  <Txt size={14} color={colors.white}>
                    {item}
                  </Txt>
                </View>
              ))}
              {entry.negativeActivities.map((item) => (
                <View key={item} style={[styles.chip, { backgroundColor: colors.negative }]}>
                  <X size={15} color={colors.white} strokeWidth={2.5} />
                  <Txt size={14} color={colors.white}>
                    {item}
                  </Txt>
                </View>
              ))}
              {!entry.positiveActivities.length && !entry.negativeActivities.length ? (
                <Txt color={colors.muted}>ไม่ได้เลือกกิจกรรม</Txt>
              ) : null}
            </View>

            <Txt variant="title" size={18} style={styles.sectionTitle}>
              กิจกรรมอื่น ๆ
            </Txt>
            <View style={styles.card}>
              <Txt variant="body" color={entry.otherActivityNote ? colors.ink : colors.muted}>
                {entry.otherActivityNote || 'ไม่มีบันทึกเพิ่มเติม'}
              </Txt>
            </View>

            <PrimaryButton label="กลับหน้าหลัก" onPress={() => navigation.popToTop()} style={styles.home} />
          </View>
        </View>
      </ScrollView>

      <Sheet visible={lowEnergyOpen} onClose={() => setLowEnergyOpen(false)}>
        <View style={styles.careTop}>
          <View style={[styles.careAvatar, { backgroundColor: MOODS.blue.palette.bg }]}>
            <MoodCharacter mood="blue" size={96} />
          </View>
          <Txt variant="headline" size={26} align="center" style={styles.gap}>
            คุณดูเหนื่อยล้า
          </Txt>
          <Txt variant="body" align="center" color={colors.inkSoft} style={styles.careText}>
            ลองพักผ่อนให้เพียงพอ หรือทำสิ่งที่ช่วยให้คุณรู้สึกดีขึ้น อย่าลืมดูแลตนเองนะ
          </Txt>
        </View>
        <PrimaryButton label="เข้าใจแล้ว" onPress={() => setLowEnergyOpen(false)} icon={Check} />
      </Sheet>
    </View>
  );
}

function BreakdownRow({
  label,
  value,
  min,
  max,
  color,
  raw,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  color: string;
  raw?: number;
}) {
  const bipolar = min < 0;
  const fraction = bipolar ? Math.abs(value) / max : value / max;
  return (
    <View style={styles.row}>
      <View style={styles.rowHead}>
        <Txt variant="body" size={15} style={styles.flex}>
          {label}
        </Txt>
        <Txt variant="bodyStrong" size={15}>
          {value > 0 && bipolar ? '+' : ''}
          {formatScore(Number(value.toFixed(1)))}
          <Txt variant="caption" color={colors.muted}>
            {` / ${bipolar ? '±' : ''}${max}`}
            {raw !== undefined && raw !== value ? ` (รวมจริง ${raw > 0 ? '+' : ''}${raw})` : ''}
          </Txt>
        </Txt>
      </View>
      <View style={styles.bar}>
        {bipolar ? <View style={styles.barZero} /> : null}
        <View
          style={[
            styles.barFill,
            { backgroundColor: value < 0 ? colors.negative : color, width: `${(bipolar ? fraction / 2 : fraction) * 100}%` },
            bipolar && (value < 0 ? { right: '50%' } : { left: '50%' }),
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.paper },
  flex: { flex: 1 },
  empty: { flex: 1, backgroundColor: colors.paper },
  emptyBody: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hero: { overflow: 'hidden' },
  percent: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    fontFamily: fonts.display,
    color: colors.white,
    letterSpacing: -1,
    includeFontPadding: false,
    zIndex: 2,
  },
  duo: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    gap: 8,
    zIndex: 3,
  },
  duoItem: { alignItems: 'center', gap: 6 },
  sheet: {
    marginTop: -32,
    borderTopLeftRadius: radii.sheet,
    borderTopRightRadius: radii.sheet,
    backgroundColor: colors.paper,
    paddingTop: 28,
  },
  pending: {
    backgroundColor: colors.ink,
    borderRadius: radii.card,
    padding: 18,
    gap: 12,
    marginBottom: 20,
  },
  pendingButton: { minHeight: 52 },
  scoreHead: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  scoreTitle: { marginTop: 14 },
  scoreValue: { alignItems: 'flex-end' },
  scoreBig: { fontFamily: fonts.display, fontSize: 54, lineHeight: 60, color: colors.ink },
  card: {
    marginTop: 16,
    backgroundColor: colors.card,
    borderRadius: radii.card,
    padding: 20,
  },
  center: { alignItems: 'center' },
  cardTitle: { alignSelf: 'flex-start' },
  row: { paddingVertical: 8 },
  rowHead: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 8 },
  bar: { height: 10, borderRadius: 5, backgroundColor: colors.paperDeep, overflow: 'hidden' },
  barZero: { position: 'absolute', left: '50%', width: 2, top: 0, bottom: 0, backgroundColor: colors.lineStrong },
  barFill: { position: 'absolute', top: 0, bottom: 0, borderRadius: 5 },
  energyWord: { fontFamily: fonts.display, fontSize: 40, lineHeight: 46, marginTop: 6 },
  gap: { marginTop: 14 },
  source: { marginTop: 16 },
  sectionTitle: { marginTop: 30, marginBottom: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 38,
    paddingHorizontal: 14,
    borderRadius: radii.pill,
  },
  home: { marginTop: 32 },
  careTop: { alignItems: 'center', marginBottom: 24 },
  careAvatar: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  careText: { marginTop: 8, maxWidth: 340 },
});
