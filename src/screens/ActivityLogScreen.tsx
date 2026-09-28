import { Sun } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActivityChip } from '../components/activity/ActivityChip';
import { ScoreSlider } from '../components/activity/ScoreSlider';
import { MoodCharacter } from '../components/mood/MoodCharacter';
import { Sky } from '../components/scenery/Sky';
import { PaperScreen } from '../components/ui/PaperScreen';
import { Pill } from '../components/ui/Pill';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { TopBar } from '../components/ui/TopBar';
import { Txt } from '../components/ui/Txt';
import { ACTIVITY_SCORES, NEGATIVE_ACTIVITIES, POSITIVE_ACTIVITIES } from '../constants/activities';
import { MOODS } from '../constants/moods';
import { formatShortThaiDate } from '../domain/dates';
import { activityScore, formatScore, otherScore } from '../domain/scoring';
import { useResponsive } from '../hooks/useResponsive';
import type { ScreenProps } from '../navigation/types';
import { useEntries } from '../store/EntriesProvider';
import { colors, fonts, radii } from '../theme';

const toggle = (list: string[], item: string) =>
  list.includes(item) ? list.filter((i) => i !== item) : [...list, item];

export default function ActivityLogScreen({ route, navigation }: ScreenProps<'ActivityLog'>) {
  const { date } = route.params;
  const { getEntry, saveEntry } = useEntries();
  const r = useResponsive();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const entry = getEntry(date);

  const [positive, setPositive] = useState<string[]>(entry?.positiveActivities ?? []);
  const [negative, setNegative] = useState<string[]>(entry?.negativeActivities ?? []);
  const [otherActivity, setOtherActivity] = useState(entry?.otherActivityNote ?? '');
  const [score, setScore] = useState(Math.round(entry?.otherActivityScore ?? 0));
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!entry) {
      Alert.alert('ไม่พบข้อมูลวันที่เลือก', 'กรุณาเริ่มบันทึกจากช่วงเช้า');
      navigation.goBack();
    }
    // Only validate once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const live = useMemo(() => {
    const act = activityScore({ positiveActivities: positive, negativeActivities: negative });
    const other = otherScore({ otherActivityScore: score });
    return act + other;
  }, [positive, negative, score]);

  const save = async () => {
    if (!entry || saving) return;
    setSaving(true);
    try {
      await saveEntry({
        ...entry,
        positiveActivities: positive,
        negativeActivities: negative,
        otherActivityNote: otherActivity.trim() + (note.trim() ? ` (${note.trim()})` : ''),
        otherActivityScore: score,
      });
      navigation.navigate('MoodPicker', { period: 'night', date });
    } finally {
      setSaving(false);
    }
  };

  const width = Math.min(r.width - r.gutter * 2, 640);
  const skyHeight = Math.min(420, r.height * 0.5);
  const morning = entry ? MOODS[entry.morningMood] : null;

  return (
    <PaperScreen
      backdrop={
        <View style={{ height: skyHeight }}>
          <Sky phase="day" width={r.width} height={skyHeight} reduceMotion={reduceMotion} />
        </View>
      }
    >
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ paddingHorizontal: r.gutter - 4, paddingTop: 8 }}>
          <TopBar label="Mood Tracker" sublabel={`ระหว่างวัน · ขั้นตอน 2 จาก 3 · ${formatShortThaiDate(date)}`} />
          <Steps current={1} />
        </View>

        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingHorizontal: r.gutter }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={{ width }}>
            <Animated.View entering={FadeInDown.duration(500)} style={styles.header}>
              <View style={styles.headerCopy}>
                <Pill icon={Sun}>สวัสดีตอนกลางวัน</Pill>
                <Txt variant="headline" size={r.clampVw(26, 7.4, 36)} style={styles.headline}>
                  {'วันนี้ทำอะไร\nไปบ้าง?'}
                </Txt>
              </View>
              {morning ? (
                <View style={[styles.morningBadge, { backgroundColor: morning.palette.bg }]}>
                  <MoodCharacter mood={morning.key} size={62} alive={false} />
                  <Txt variant="caption" size={11} color={colors.white} style={styles.morningLabel}>
                    เช้านี้ · {morning.label}
                  </Txt>
                </View>
              ) : null}
            </Animated.View>

            <View style={styles.live}>
              <Txt variant="body" size={14} color={colors.inkSoft}>
                คะแนนกิจกรรมที่นับรวม (สูงสุด ±6)
              </Txt>
              <Txt style={[styles.liveValue, { color: live > 0 ? colors.positive : live < 0 ? colors.negative : colors.ink }]}>
                {live > 0 ? '+' : ''}
                {formatScore(Number(live.toFixed(1)))}
              </Txt>
            </View>

            <Section index={0} title="กิจกรรมเชิงบวก" hint="กิจกรรมที่ทำให้คุณรู้สึกดี" dot={colors.positive}>
              <View style={styles.chips}>
                {POSITIVE_ACTIVITIES.map((item) => (
                  <ActivityChip
                    key={item}
                    label={item}
                    weight={ACTIVITY_SCORES[item]}
                    accent={colors.positive}
                    selected={positive.includes(item)}
                    onToggle={() => setPositive((list) => toggle(list, item))}
                  />
                ))}
              </View>
            </Section>

            <Section index={1} title="กิจกรรมเชิงลบ" hint="กิจกรรมที่อาจส่งผลเสียต่อความรู้สึก" dot={colors.negative}>
              <View style={styles.chips}>
                {NEGATIVE_ACTIVITIES.map((item) => (
                  <ActivityChip
                    key={item}
                    label={item}
                    weight={ACTIVITY_SCORES[item]}
                    accent={colors.negative}
                    selected={negative.includes(item)}
                    onToggle={() => setNegative((list) => toggle(list, item))}
                  />
                ))}
              </View>
            </Section>

            <Section index={2} title="กิจกรรมอื่น (ถ้ามี)" hint="กิจกรรมพิเศษที่คุณทำเพิ่มเติม" dot={colors.lavender}>
              <TextInput
                placeholder="ระบุสิ่งที่คุณทำเพิ่มเติม…"
                placeholderTextColor={colors.muted}
                value={otherActivity}
                onChangeText={setOtherActivity}
                style={styles.input}
                returnKeyType="done"
                accessibilityLabel="กิจกรรมอื่น"
              />
              <View style={styles.sliderCard}>
                <Txt variant="bodyStrong" size={15}>
                  ให้คะแนนกิจกรรมนี้
                </Txt>
                <ScoreSlider value={score} onChange={setScore} />
              </View>
            </Section>

            <Section index={3} title="โน้ตสั้น ๆ สำหรับวันนี้" hint="บันทึกความรู้สึกหรือเหตุการณ์พิเศษ (ไม่บังคับ)" dot={colors.heart}>
              <TextInput
                placeholder="วันนี้คุณรู้สึกอย่างไร? มีอะไรพิเศษบ้างไหม?"
                placeholderTextColor={colors.muted}
                value={note}
                onChangeText={setNote}
                multiline
                style={[styles.input, styles.note]}
                accessibilityLabel="โน้ตสั้น ๆ"
              />
            </Section>
          </View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 14, paddingHorizontal: r.gutter }]}>
          <PrimaryButton
            label="ถัดไป · อารมณ์ก่อนนอน"
            onPress={save}
            loading={saving}
            style={{ width, alignSelf: 'center' }}
          />
        </View>
      </KeyboardAvoidingView>
    </PaperScreen>
  );
}

export function Steps({ current }: { current: number }) {
  return (
    <View style={styles.steps} accessibilityLabel={`ขั้นตอน ${current + 1} จาก 3`}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={[styles.step, i <= current && styles.stepDone]} />
      ))}
    </View>
  );
}

function Section({
  index,
  title,
  hint,
  dot,
  children,
}: {
  index: number;
  title: string;
  hint: string;
  dot: string;
  children: React.ReactNode;
}) {
  return (
    <Animated.View entering={FadeInDown.delay(120 + index * 80).duration(500)} style={styles.section}>
      <View style={styles.sectionHead}>
        <View style={[styles.dot, { backgroundColor: dot }]} />
        <Txt variant="title" size={18}>
          {title}
        </Txt>
      </View>
      <Txt variant="body" size={14} color={colors.muted} style={styles.hint}>
        {hint}
      </Txt>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { alignItems: 'center', paddingBottom: 32 },
  header: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 12, gap: 12 },
  headerCopy: { flex: 1 },
  headline: { marginTop: 16 },
  morningBadge: {
    width: 92,
    borderRadius: 24,
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 8,
    overflow: 'hidden',
  },
  morningLabel: { marginTop: 2 },
  live: {
    marginTop: 24,
    borderRadius: radii.card,
    backgroundColor: colors.card,
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  liveValue: { fontFamily: fonts.display, fontSize: 34, lineHeight: 40 },
  section: { marginTop: 34 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  hint: { marginTop: 2, marginBottom: 14 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  input: {
    minHeight: 56,
    borderRadius: radii.field,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.line,
    paddingHorizontal: 18,
    paddingVertical: 14,
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.ink,
  },
  note: { minHeight: 120, textAlignVertical: 'top' },
  sliderCard: {
    marginTop: 12,
    borderRadius: radii.card,
    backgroundColor: colors.card,
    padding: 18,
    gap: 12,
  },
  footer: { paddingTop: 12, backgroundColor: colors.paper },
  steps: { flexDirection: 'row', gap: 6, marginTop: 8, marginBottom: 4 },
  step: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.paperDeep },
  stepDone: { backgroundColor: colors.ink },
});
