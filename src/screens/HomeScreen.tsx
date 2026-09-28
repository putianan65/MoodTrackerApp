import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Linking, Platform, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MascotVideo, useMascotGaze } from '../components/mascot/GazeMascot';
import type { MenuMascotKind } from '../components/mascot/MenuMascot';
import { Wordmark } from '../components/mascot/Wordmark';
import { Pill } from '../components/ui/Pill';
import { MenuTile } from '../components/ui/MenuTile';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { Toggle } from '../components/ui/Toggle';
import { Txt } from '../components/ui/Txt';
import { todayKey } from '../domain/dates';
import { scoreEntry } from '../domain/scoring';
import { useResponsive } from '../hooks/useResponsive';
import type { RootStackParamList, ScreenProps } from '../navigation/types';
import {
  disableDailyReminder,
  enableDailyReminder,
  isReminderEnabled,
} from '../services/notifications';
import { sortByDateDesc } from '../storage/entries';
import { useEntries } from '../store/EntriesProvider';
import { colors } from '../theme';
import { PHASES, phaseNow } from '../theme/phase';
import { isComplete } from '../types/entry';

type NavItem = { label: string; hint: string; mascot: MenuMascotKind; onPress?: () => void };

export default function HomeScreen({ navigation }: ScreenProps<'Home'>) {
  const r = useResponsive();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const { entries, getEntry } = useEntries();

  // Landscape tablets get the three-column studio layout with the video behind.
  const studio = r.isWide && r.isLandscape;
  const gaze = useMascotGaze({ mode: studio ? 'scrub' : 'loop', reduceMotion });

  // ── Today ──────────────────────────────────────────────────────────────────
  const today = todayKey();
  const entry = getEntry(today);
  const status = !entry ? 'none' : isComplete(entry) ? 'done' : 'progress';
  const latest = sortByDateDesc(entries).find(isComplete);

  const badge = {
    none: 'วันนี้เป็นยังไงบ้าง?',
    progress: 'บันทึกค้างอยู่ · ไปต่อกันเลย',
    done: `วันนี้บันทึกแล้ว · ${entry ? Math.round(scoreEntry(entry).percent) : 0}%`,
  }[status];

  const cta = {
    none: { label: 'บันทึกอารมณ์วันนี้', go: () => navigation.navigate('MoodPicker', { period: 'morning', date: today }) },
    progress: { label: 'บันทึกต่อจากเดิม', go: () => navigation.navigate('ActivityLog', { date: today }) },
    done: { label: 'ดูสรุปวันนี้', go: () => navigation.navigate('Summary', { date: today }) },
  }[status];

  const go = (route: keyof RootStackParamList) => () => navigation.navigate(route as never);
  const nav: NavItem[] = [
    { label: 'ประวัติย้อนหลัง', hint: `บันทึกไว้ ${entries.length} วัน`, mascot: 'history', onPress: go('History') },
    { label: 'สรุปรายสัปดาห์', hint: 'กราฟและบทวิเคราะห์', mascot: 'weekly', onPress: go('Weekly') },
    { label: 'ความหมายสี', hint: '7 สี 7 อารมณ์', mascot: 'meaning', onPress: go('ColorMeaning') },
    status === 'done'
      ? {
          label: 'แก้ไขวันนี้',
          hint: 'เปลี่ยนคำตอบของวันนี้',
          mascot: 'edit',
          onPress: () => navigation.navigate('MoodPicker', { period: 'morning', date: today }),
        }
      : {
          label: 'สรุปล่าสุด',
          hint: latest ? 'ผลของวันล่าสุด' : 'ยังไม่มีข้อมูล',
          mascot: 'latest',
          onPress: latest ? () => navigation.navigate('Summary', { date: latest.date }) : undefined,
        },
  ];

  // ── Reminder ───────────────────────────────────────────────────────────────
  const [reminderOn, setReminderOn] = useState(false);
  const [reminderBusy, setReminderBusy] = useState(false);

  useEffect(() => {
    isReminderEnabled().then(setReminderOn);
  }, []);

  const toggleReminder = useCallback(async () => {
    if (reminderBusy) return;
    if (Platform.OS === 'web') {
      Alert.alert('การแจ้งเตือน', 'ใช้งานได้บนแอปมือถือเท่านั้น');
      return;
    }
    setReminderBusy(true);
    try {
      if (reminderOn) {
        if (await disableDailyReminder()) {
          Alert.alert('ปิดการแจ้งเตือนแล้ว', 'คุณจะไม่ได้รับการแจ้งเตือนเวลา 17:00 อีกต่อไป');
        }
      } else if (await enableDailyReminder()) {
        Alert.alert('เปิดการแจ้งเตือนแล้ว', 'คุณจะได้รับการแจ้งเตือนทุกวันเวลา 17:00 น.');
      } else {
        Alert.alert('ไม่สามารถเปิดการแจ้งเตือนได้', 'กรุณาอนุญาตการแจ้งเตือนในการตั้งค่าของอุปกรณ์', [
          { text: 'ยกเลิก', style: 'cancel' },
          { text: 'ไปที่การตั้งค่า', onPress: () => Linking.openSettings() },
        ]);
      }
      setReminderOn(await isReminderEnabled());
    } catch (error) {
      console.error('Error toggling reminder:', error);
      Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถเปลี่ยนการตั้งค่าการแจ้งเตือนได้');
    } finally {
      setReminderBusy(false);
    }
  }, [reminderBusy, reminderOn]);

  // ── Blocks shared by both layouts ──────────────────────────────────────────
  const inner = Math.min(r.width - r.gutter * 2, 640);
  const columnWidth = studio ? r.vw(25) : inner;
  const type = studio
    ? {
        badge: Math.max(13, r.vw(0.88) * 1.35),
        headline: Math.max(22, r.vw(1.66) * 1.45),
        note: Math.max(12, r.vw(0.733) * 1.5),
        logo: Math.max(30, r.vw(2.6)),
      }
    : {
        badge: 14,
        headline: r.clampVw(22, 6.3, 30),
        note: 14,
        logo: Math.min(40, r.vw(9.6)),
      };

  const left = (
    <View>
      <Pill
        size={type.badge}
        icon={status === 'none' ? PHASES[phaseNow()].icon : undefined}
        dot={status === 'done' ? colors.positive : status === 'progress' ? colors.heart : undefined}
      >
        {badge}
      </Pill>
      <Txt variant="headline" size={type.headline} style={styles.headline}>
        {'ทุกความรู้สึก\nมีสีของมัน'}
      </Txt>
      <PrimaryButton label={cta.label} onPress={cta.go} style={styles.cta} />
      <Txt variant="bodyStrong" size={14} color={colors.muted} style={styles.menuTitle}>
        เมนู
      </Txt>
      <View style={styles.nav}>
        {nav.map((item, i) => (
          <Animated.View
            key={item.label}
            entering={reduceMotion ? undefined : FadeInDown.delay(120 + i * 70).duration(450)}
            style={{ width: (columnWidth - 12) / 2, flexDirection: 'column' }}
          >
            <MenuTile
              mascot={item.mascot}
              label={item.label}
              hint={item.hint}
              onPress={item.onPress}
              compact={studio || r.isCompact}
            />
          </Animated.View>
        ))}
      </View>
    </View>
  );

  const right = (
    <View>
      <Pill size={type.badge}>แจ้งเตือนรายวัน</Pill>
      <Txt variant="headline" size={type.headline} style={styles.headline}>
        {'เช็คอินทุกวัน\nเวลา 17:00 น.*'}
      </Txt>
      <Txt variant="body" size={type.note} color={colors.inkSoft} style={[styles.note, { maxWidth: studio ? 360 : 340 }]}>
        *ความรู้สึกดี ๆ เริ่มจากการสังเกตตัวเอง วันละหนึ่งนาทีก็พอ
      </Txt>
      <View style={styles.reminderRow}>
        <Toggle value={reminderOn} onChange={toggleReminder} disabled={reminderBusy} label="การแจ้งเตือนรายวัน เวลา 17:00" />
        <Txt variant="bodyStrong" size={type.note + 1}>
          {reminderOn ? 'เปิดอยู่' : 'ปิดอยู่'}
        </Txt>
      </View>
    </View>
  );

  if (studio) {
    return (
      <View style={styles.studio} {...gaze.touchHandlers}>
        <StatusBar style="dark" />
        <MascotVideo gaze={gaze} style={StyleSheet.absoluteFill} />
        <View style={{ position: 'absolute', left: r.vw(8.65), top: r.vw(6.54) + insets.top * 0.5, width: r.vw(25) }}>
          {left}
        </View>
        <View style={{ position: 'absolute', left: r.vw(40.33), top: r.vw(7.7) + insets.top * 0.5, width: r.vw(19) }}>
          <Wordmark size={type.logo} angle={gaze.angle} engaged={gaze.engaged} />
        </View>
        <View style={{ position: 'absolute', left: r.vw(70), top: r.vw(6.54) + insets.top * 0.5, width: r.vw(26) }}>
          {right}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root} {...gaze.touchHandlers}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={[styles.stack, { paddingTop: insets.top + 32, paddingHorizontal: r.gutter }]}
        showsVerticalScrollIndicator={false}
        onScroll={gaze.measure}
        scrollEventThrottle={32}
      >
        <View style={[styles.column, { width: inner }]}>
          <View style={styles.logo}>
            <Wordmark size={type.logo} angle={gaze.angle} engaged={gaze.engaged} />
          </View>
          {left}
        </View>
        {/* The mascot sits mid-page on phones so it is visible without scrolling. */}
        <MascotVideo
          gaze={gaze}
          style={[styles.video, { width: r.width, height: Math.min((r.width * 3) / 4, 520) }]}
        />
        <View style={[styles.column, { width: inner, paddingBottom: insets.bottom + 48 }]}>{right}</View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.paper },
  studio: { flex: 1, backgroundColor: colors.paperDeep, overflow: 'hidden' },
  stack: { alignItems: 'center' },
  column: { gap: 36 },
  logo: { alignSelf: 'flex-start', marginBottom: 4 },
  headline: { marginTop: 19 },
  cta: { marginTop: 22 },
  menuTitle: { marginTop: 26, marginBottom: 10 },
  nav: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  note: { marginTop: 16 },
  reminderRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 20, minHeight: 44 },
  video: { marginTop: 12, marginBottom: 24 },
});
