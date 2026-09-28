import { ChevronRight } from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MoodCharacter } from '../components/mood/MoodCharacter';
import { PaperScreen } from '../components/ui/PaperScreen';
import { Pill } from '../components/ui/Pill';
import { PressableScale } from '../components/ui/PressableScale';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { TopBar } from '../components/ui/TopBar';
import { Txt } from '../components/ui/Txt';
import { MOODS } from '../constants/moods';
import { dayOfMonth, formatMonthShort, formatWeekday, todayKey } from '../domain/dates';
import { scoreEntry } from '../domain/scoring';
import { useResponsive } from '../hooks/useResponsive';
import type { ScreenProps } from '../navigation/types';
import { sortByDateDesc } from '../storage/entries';
import { useEntries } from '../store/EntriesProvider';
import { colors, fonts, radii } from '../theme';
import { toNight } from '../theme/phase';
import { isComplete, type MoodEntry } from '../types/entry';

export default function HistoryScreen({ navigation }: ScreenProps<'History'>) {
  const { entries, refresh } = useEntries();
  const r = useResponsive();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const sorted = useMemo(() => sortByDateDesc(entries), [entries]);

  const columns = r.width >= 900 ? 2 : 1;
  const inner = Math.min(r.width - r.gutter * 2, columns === 2 ? 980 : 640);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const open = useCallback(
    (entry: MoodEntry) =>
      isComplete(entry)
        ? navigation.navigate('Summary', { date: entry.date })
        : navigation.navigate('ActivityLog', { date: entry.date }),
    [navigation],
  );

  const renderItem = useCallback(
    ({ item, index }: { item: MoodEntry; index: number }) => (
      <Animated.View
        entering={FadeInDown.delay(Math.min(index, 8) * 50).duration(450)}
        style={columns === 2 ? { width: (inner - 12) / 2 } : undefined}
      >
        <HistoryCard entry={item} onPress={() => open(item)} />
      </Animated.View>
    ),
    [columns, inner, open],
  );

  return (
    <PaperScreen>
      <View style={{ paddingHorizontal: r.gutter - 4, paddingTop: 8 }}>
        <TopBar label="Mood Tracker" sublabel="ประวัติย้อนหลัง" />
      </View>
      <FlatList
        key={columns}
        data={sorted}
        numColumns={columns}
        keyExtractor={(item) => item.date}
        renderItem={renderItem}
        columnWrapperStyle={columns === 2 ? styles.columns : undefined}
        contentContainerStyle={[
          styles.list,
          { paddingHorizontal: (r.width - inner) / 2, paddingBottom: insets.bottom + 32 },
        ]}
        ListHeaderComponent={
          <View style={styles.header}>
            <Txt variant="headline" size={r.clampVw(28, 8, 40)}>
              ประวัติย้อนหลัง
            </Txt>
            <Pill tone="ink">{`${entries.length} วัน`}</Pill>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={[styles.emptyAvatar, { backgroundColor: MOODS.gray.palette.bg }]}>
              <MoodCharacter mood="gray" size={120} />
            </View>
            <Txt variant="headline" size={24} align="center">
              ยังไม่มีข้อมูลย้อนหลัง
            </Txt>
            <Txt variant="body" color={colors.muted} align="center">
              เริ่มบันทึกอารมณ์ของคุณวันนี้
            </Txt>
            <PrimaryButton
              label="เริ่มบันทึก"
              onPress={() => navigation.navigate('MoodPicker', { period: 'morning', date: todayKey() })}
              style={styles.emptyButton}
            />
          </View>
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.ink} />}
        showsVerticalScrollIndicator={false}
        initialNumToRender={8}
        windowSize={7}
      />
    </PaperScreen>
  );
}

const HistoryCard = React.memo(function HistoryCard({ entry, onPress }: { entry: MoodEntry; onPress: () => void }) {
  const morning = MOODS[entry.morningMood];
  const night = MOODS[entry.nightMood];
  const complete = isComplete(entry);
  const percent = Math.round(scoreEntry(entry).percent);

  return (
    <PressableScale
      onPress={onPress}
      accessibilityLabel={`${formatWeekday(entry.date)} ${dayOfMonth(entry.date)} ${formatMonthShort(entry.date)}, เช้า ${morning.label}${
        complete ? `, ก่อนนอน ${night.label}, พลังงาน ${percent}%` : ', ยังบันทึกไม่ครบ'
      }`}
      pressedScale={0.98}
      style={styles.card}
    >
      <View style={styles.date}>
        <Txt style={styles.day}>{dayOfMonth(entry.date)}</Txt>
        <Txt variant="caption" color={colors.muted} numberOfLines={1}>
          {formatMonthShort(entry.date)}
        </Txt>
      </View>

      <View style={styles.middle}>
        <Txt variant="bodyStrong" size={15} numberOfLines={1}>
          {formatWeekday(entry.date)}
        </Txt>
        <View style={styles.moods}>
          <MoodDot mood={entry.morningMood} caption="เช้า" />
          {complete ? <MoodDot mood={entry.nightMood} caption="ก่อนนอน" night /> : <Pill size={12}>ยังไม่ครบ</Pill>}
        </View>
        {complete ? (
          <View style={styles.bar}>
            <View
              style={[
                styles.barFill,
                { width: `${Math.max(4, percent)}%`, backgroundColor: night.palette.bg },
              ]}
            />
          </View>
        ) : null}
      </View>

      <View style={styles.right}>
        {complete ? <Txt style={styles.percent}>{percent}%</Txt> : null}
        <ChevronRight color={colors.muted} size={20} />
      </View>
    </PressableScale>
  );
});

function MoodDot({ mood, caption, night }: { mood: MoodEntry['morningMood']; caption: string; night?: boolean }) {
  const def = MOODS[mood];
  return (
    <View style={styles.moodDot}>
      <View style={[styles.avatar, { backgroundColor: night ? toNight(def.palette.bg) : def.palette.bg }]}>
        <MoodCharacter mood={mood} size={30} alive={false} outfit={night ? 'pajamas' : undefined} />
      </View>
      <Txt variant="caption" size={12} color={colors.inkSoft} numberOfLines={1}>
        {caption} · {def.label}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  list: { paddingTop: 8, gap: 12 },
  columns: { gap: 12 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radii.card,
    padding: 16,
    gap: 14,
  },
  date: { width: 58, alignItems: 'center' },
  day: { fontFamily: fonts.display, fontSize: 40, lineHeight: 46, color: colors.ink },
  middle: { flex: 1, gap: 8 },
  moods: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, alignItems: 'center' },
  moodDot: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  bar: { height: 6, borderRadius: 3, backgroundColor: colors.paperDeep, overflow: 'hidden' },
  barFill: { height: 6, borderRadius: 3 },
  right: { alignItems: 'flex-end', gap: 4 },
  percent: { fontFamily: fonts.headlineLatin, fontSize: 20, color: colors.ink },
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
