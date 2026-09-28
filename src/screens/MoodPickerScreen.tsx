import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, ArrowRight, Info } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  FadeIn,
  cancelAnimation,
  interpolateColor,
  runOnJS,
  useAnimatedStyle,
  useDerivedValue,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GhostWords } from '../components/mood/GhostWords';
import { MoodCarousel, carouselLayout } from '../components/mood/MoodCarousel';
import { MoodMeaningList } from '../components/mood/MoodMeaningList';
import { CircleButton } from '../components/ui/CircleButton';
import { MoodGlow } from '../components/scenery/MoodGlow';
import { SleepyZ } from '../components/scenery/SleepyZ';
import { Sky } from '../components/scenery/Sky';
import { GrainOverlay } from '../components/ui/GrainOverlay';
import { PressableScale } from '../components/ui/PressableScale';
import { Sheet } from '../components/ui/Sheet';
import { TopBar } from '../components/ui/TopBar';
import { Txt } from '../components/ui/Txt';
import { MOOD_ORDER, MOODS } from '../constants/moods';
import { formatShortThaiDate } from '../domain/dates';
import { useResponsive } from '../hooks/useResponsive';
import type { ScreenProps } from '../navigation/types';
import { haptics } from '../services/haptics';
import { useEntries } from '../store/EntriesProvider';
import { colors, fonts, motion } from '../theme';
import { PHASES, phaseForPeriod, toNight } from '../theme/phase';
import { isComplete, type MoodEntry } from '../types/entry';

const COUNT = MOOD_ORDER.length;
const wrapIndex = (n: number) => ((Math.round(n) % COUNT) + COUNT) % COUNT;

const COPY = {
  morning: { question: 'เช้านี้คุณรู้สึกอย่างไร?', step: 'ช่วงเช้า · ขั้นตอน 1 จาก 3' },
  night: { question: 'ก่อนนอนคุณรู้สึกอย่างไร?', step: 'ก่อนนอน · ขั้นตอน 3 จาก 3' },
};

export default function MoodPickerScreen({ route, navigation }: ScreenProps<'MoodPicker'>) {
  const { period, date } = route.params;
  const { getEntry, saveEntry } = useEntries();
  const r = useResponsive();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const duration = reduceMotion ? 0 : motion.duration;

  const existing = getEntry(date);
  const phase = phaseForPeriod(period);
  const night = phase === 'night';
  const PhaseIcon = PHASES[phase].icon;
  const initialIndex = useMemo(() => {
    const current =
      period === 'morning'
        ? existing?.morningMood
        : existing && isComplete(existing)
          ? existing.nightMood
          : undefined;
    // Start from the neutral middle of the scale so the default doesn't bias the answer.
    return MOOD_ORDER.indexOf(current ?? 'yellow');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [meaningOpen, setMeaningOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const lastNavigate = useRef(0);

  const progress = useSharedValue(initialIndex);
  const dragStart = useSharedValue(initialIndex);
  const gx = useSharedValue(0);
  const gy = useSharedValue(0);
  const gaze = useDerivedValue(() => ({ x: gx.value, y: gy.value }));

  const active = MOODS[MOOD_ORDER[activeIndex]];
  const { eyeY, size: carouselSize } = carouselLayout(r.width, r.height, r.isMobile);

  // ── Motion ────────────────────────────────────────────────────────────────

  const settle = useCallback((target: number) => {
    setActiveIndex((prev) => {
      const next = wrapIndex(target);
      if (next !== prev) haptics.select();
      return next;
    });
  }, []);

  const animateTo = useCallback(
    (target: number) => {
      progress.value = withTiming(target, { duration, easing: motion.easing });
      settle(target);
    },
    [duration, progress, settle],
  );

  /** Arrow navigation, locked for the length of one transition. */
  const step = useCallback(
    (direction: 1 | -1) => {
      const now = Date.now();
      if (now - lastNavigate.current < motion.duration) return;
      lastNavigate.current = now;
      animateTo(Math.round(progress.value) + direction);
    },
    [animateTo, progress],
  );

  const idleGaze = useCallback(() => {
    if (reduceMotion) return;
    const look = (to: number, wait: number) => withDelay(wait, withTiming(to, { duration: 700 }));
    gx.value = withDelay(
      1200,
      withRepeat(withSequence(look(-0.7, 0), look(0.65, 1600), look(0, 1400), look(0, 2400)), -1),
    );
    gy.value = withDelay(
      1200,
      withRepeat(withSequence(look(0.2, 0), look(-0.35, 1600), look(0.1, 1400), look(0.1, 2400)), -1),
    );
  }, [gx, gy, reduceMotion]);

  useEffect(() => {
    idleGaze();
    return () => {
      cancelAnimation(gx);
      cancelAnimation(gy);
    };
  }, [gx, gy, idleGaze]);

  // ── Gestures: every touch is looked at; drag or swipe rotates the carousel ─

  const width = r.width;
  const pan = Gesture.Pan()
    .minDistance(0)
    .onBegin((e) => {
      cancelAnimation(gx);
      cancelAnimation(gy);
      const dx = e.x - width / 2;
      const dy = e.y - eyeY;
      const len = Math.max(1, Math.hypot(dx, dy));
      const m = Math.min(1, len / 90);
      gx.value = withTiming((dx / len) * m, { duration: 120 });
      gy.value = withTiming((dy / len) * m, { duration: 120 });
      dragStart.value = Math.round(progress.value);
    })
    .onUpdate((e) => {
      const dx = e.x - width / 2;
      const dy = e.y - eyeY;
      const len = Math.max(1, Math.hypot(dx, dy));
      const m = Math.min(1, len / 90);
      gx.value = (dx / len) * m;
      gy.value = (dy / len) * m;
      if (Math.abs(e.translationX) > 12) {
        cancelAnimation(progress);
        progress.value = dragStart.value - e.translationX / (width * 0.5);
      }
    })
    .onEnd((e) => {
      let target = dragStart.value;
      if (Math.abs(e.translationX) <= 12) {
        // Tapping a neighbour brings it to the centre.
        if (e.x < width * 0.28) target -= 1;
        else if (e.x > width * 0.72) target += 1;
      } else {
        const projected = Math.round(progress.value - e.velocityX / (width * 2.2));
        target = Math.max(dragStart.value - 2, Math.min(dragStart.value + 2, projected));
      }
      progress.value = withTiming(target, { duration, easing: motion.easing });
      runOnJS(settle)(target);
    })
    .onFinalize(() => {
      gx.value = withTiming(0, { duration: 500 });
      gy.value = withTiming(0.1, { duration: 500 });
      runOnJS(idleGaze)();
    });

  const longPress = Gesture.LongPress()
    .minDuration(450)
    .onStart(() => {
      runOnJS(setMeaningOpen)(true);
    });

  const gesture = Gesture.Simultaneous(pan, longPress);

  // Morning uses the pure mood colours; bedtime sinks each one into night navy.
  const backgrounds = useMemo(
    () => MOOD_ORDER.map((key) => (night ? toNight(MOODS[key].palette.bg) : MOODS[key].palette.bg)),
    [night],
  );
  const backgroundStyle = useAnimatedStyle(() => {
    const p = ((progress.value % COUNT) + COUNT) % COUNT;
    const i = Math.floor(p);
    return {
      backgroundColor: interpolateColor(p - i, [0, 1], [backgrounds[i], backgrounds[(i + 1) % COUNT]]),
    };
  });

  // ── Saving ────────────────────────────────────────────────────────────────

  const confirm = async () => {
    if (saving) return;
    setSaving(true);
    const mood = MOOD_ORDER[activeIndex];
    try {
      if (period === 'morning') {
        const base: MoodEntry = existing ?? {
          date,
          morningMood: mood,
          nightMood: mood,
          positiveActivities: [],
          negativeActivities: [],
          otherActivityScore: 0,
          otherActivityNote: '',
          totalScore: 0,
          completed: false,
        };
        await saveEntry({ ...base, morningMood: mood });
        haptics.success();
        navigation.navigate('ActivityLog', { date });
      } else {
        if (!existing) {
          Alert.alert('ไม่พบข้อมูลวันนี้', 'กรุณาเริ่มบันทึกใหม่ตั้งแต่ช่วงเช้า');
          navigation.popToTop();
          return;
        }
        const { completed: _drop, ...rest } = existing;
        await saveEntry({ ...rest, nightMood: mood });
        haptics.success();
        navigation.reset({
          index: 1,
          routes: [{ name: 'Home' }, { name: 'Summary', params: { date, fresh: true } }],
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const jumpTo = (index: number) => {
    setMeaningOpen(false);
    const current = Math.round(progress.value);
    let delta = index - wrapIndex(current);
    if (delta > COUNT / 2) delta -= COUNT;
    if (delta < -COUNT / 2) delta += COUNT;
    animateTo(current + delta);
  };

  // ── Layout ────────────────────────────────────────────────────────────────

  const bottom = insets.bottom + (r.isMobile ? 24 : 80);
  const side = r.isMobile ? 20 : 96;
  const ghostSize = r.clampVw(90, 28, 380);
  const ghostTop = Math.max(r.height * 0.18, insets.top + 72);
  const ctaSize = r.isMobile ? Math.min(40, r.clampVw(28, 9, 56)) : r.clampVw(20, 4, 56);

  return (
    <Animated.View style={[styles.root, backgroundStyle]}>
      <StatusBar style="light" />
      <Sky phase={phase} width={r.width} height={r.height} reduceMotion={reduceMotion} />
      {night ? (
        <MoodGlow
          moods={MOOD_ORDER}
          progress={progress}
          cx={r.width / 2}
          cy={eyeY + carouselSize * 0.1}
          radius={Math.max(r.width, carouselSize * 1.4) * 0.72}
          width={r.width}
          height={r.height}
        />
      ) : null}
      <GhostWords
        colorFor={night ? (mood) => MOODS[mood].palette.bg : undefined}
        moods={MOOD_ORDER}
        progress={progress}
        width={r.width}
        fontSize={ghostSize}
        top={ghostTop}
      />

      <GestureDetector gesture={gesture}>
        <View style={styles.stage} accessible={false}>
          <MoodCarousel
            moods={MOOD_ORDER}
            progress={progress}
            gaze={gaze}
            width={r.width}
            height={r.height}
            isMobile={r.isMobile}
            reduceMotion={reduceMotion}
            outfit={night ? 'pajamas' : undefined}
          />
          {night && !reduceMotion ? (
            <SleepyZ left={r.width / 2 + carouselSize * 0.44} top={eyeY - carouselSize * 0.5} />
          ) : null}
        </View>
      </GestureDetector>

      <View style={[styles.top, { top: insets.top + 8, left: r.gutter - 4, right: r.gutter - 4 }]}>
        <TopBar
          tone="light"
          kind="close"
          label="Mood Tracker"
          sublabel={`${COPY[period].step} · ${formatShortThaiDate(date)}`}
          onBack={() => navigation.popToTop()}
          right={
            <CircleButton icon={Info} tone="light" size={44} label="ดูความหมายของสี" onPress={() => setMeaningOpen(true)} />
          }
        />
      </View>

      <View style={[styles.bottomLeft, { bottom, left: side, maxWidth: r.isMobile ? r.width * 0.56 : 320 }]}>
        <View style={styles.phase}>
          <PhaseIcon color={colors.white} size={16} strokeWidth={2.25} />
          <Txt variant="bodyStrong" size={13} color={colors.white}>
            {PHASES[phase].greeting}
          </Txt>
        </View>
        <Txt variant="bodyStrong" size={r.isMobile ? 14 : 16} color="rgba(255,255,255,0.95)">
          {COPY[period].question}
        </Txt>
        <Animated.View key={active.key} entering={reduceMotion ? undefined : FadeIn.duration(360)}>
          <Txt variant="headline" size={r.isMobile ? 34 : 44} color={colors.white} numberOfLines={1}>
            {active.label}
          </Txt>
          {!r.isMobile ? (
            <Txt variant="body" size={14} color="rgba(255,255,255,0.85)" style={styles.description}>
              {active.description}
            </Txt>
          ) : null}
        </Animated.View>
        <View style={styles.arrows}>
          <CircleButton icon={ArrowLeft} size={r.isMobile ? 48 : 64} label="อารมณ์ก่อนหน้า" onPress={() => step(-1)} />
          <CircleButton icon={ArrowRight} size={r.isMobile ? 48 : 64} label="อารมณ์ถัดไป" onPress={() => step(1)} />
        </View>
      </View>

      <PressableScale
        onPress={confirm}
        disabled={saving}
        accessibilityLabel={`เลือกอารมณ์ ${active.label}`}
        pressedScale={1.04}
        style={[styles.cta, { bottom: bottom + (r.isMobile ? 4 : 8), right: r.isMobile ? 20 : 40 }]}
      >
        <Txt variant="caption" size={12} color="rgba(255,255,255,0.9)" style={styles.ctaCaption}>
          เลือกสีนี้
        </Txt>
        <View style={styles.ctaRow}>
          <Txt style={[styles.ctaWord, { fontSize: ctaSize, lineHeight: ctaSize }]} color={colors.white}>
            choose
          </Txt>
          <ArrowRight color={colors.white} size={ctaSize * 0.6} strokeWidth={2.25} />
        </View>
      </PressableScale>

      <GrainOverlay />

      <Sheet visible={meaningOpen} onClose={() => setMeaningOpen(false)} scroll>
        <Txt variant="headline" size={26}>
          ความหมายของสี
        </Txt>
        <Txt variant="body" size={14} color={colors.muted} style={styles.sheetLead}>
          แตะสีเพื่อเลือก · กดค้างบนตัวละครเพื่อเปิดหน้านี้
        </Txt>
        <MoodMeaningList
          highlight={active.key}
          outfit={night ? 'pajamas' : undefined}
          onSelect={(key) => jumpTo(MOOD_ORDER.indexOf(key))}
        />
      </Sheet>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, overflow: 'hidden' },
  stage: { ...StyleSheet.absoluteFillObject, zIndex: 3 },
  top: { position: 'absolute', zIndex: 60 },
  bottomLeft: { position: 'absolute', zIndex: 60 },
  description: { marginTop: 8 },
  arrows: { flexDirection: 'row', gap: 12, marginTop: 16 },
  cta: { position: 'absolute', zIndex: 60, alignItems: 'flex-end' },
  ctaCaption: { marginBottom: 2, letterSpacing: 1 },
  ctaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ctaWord: { fontFamily: fonts.display, letterSpacing: -0.6 },
  phase: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    height: 30,
    paddingHorizontal: 12,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginBottom: 8,
  },
  sheetLead: { marginTop: 4, marginBottom: 18 },
});
