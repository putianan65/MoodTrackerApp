// screens/GraphScreen.tsx
import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, FlatList, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getAllEntries } from '../utils/historyStorage';
import { MoodEntry } from '../types';
import CustomRadarChart from '../components/CustomRadarChart';
import { MoodColors } from '../src/colors';

const { width } = Dimensions.get('window');

const areEntriesEqual = (a: MoodEntry, b: MoodEntry) => {
  return (
    a.date === b.date &&
    a.morningMood === b.morningMood &&
    a.nightMood === b.nightMood &&
    (a.otherActivityScore ?? 0) === (b.otherActivityScore ?? 0) &&
    (a.otherActivityNote ?? '') === (b.otherActivityNote ?? '') &&
    (a.totalScore ?? 0) === (b.totalScore ?? 0) &&
    (a.positiveActivities?.join('|') ?? '') === (b.positiveActivities?.join('|') ?? '') &&
    (a.negativeActivities?.join('|') ?? '') === (b.negativeActivities?.join('|') ?? '')
  );
};

const MemoRadarChart: typeof CustomRadarChart = React.memo(
  CustomRadarChart as any,
  (prev, next) => areEntriesEqual(prev.entry, next.entry)
) as any;

export default function GraphScreen() {
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const data = await getAllEntries();
    const sorted = data.sort((a: MoodEntry, b: MoodEntry) => b.date.localeCompare(a.date));
    setEntries(sorted);
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        if (!active) return;
        await load();
      })();
      return () => { active = false; };
    }, [load])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const renderItem = useCallback(({ item }: { item: MoodEntry }) => {
    return (
      <View style={styles.card}>
        <Text style={styles.date}>{item.date}</Text>
        <MemoRadarChart entry={item} />
      </View>
    );
  }, []);

  const keyExtractor = useCallback((item: MoodEntry) => item.date, []);

  const empty = useMemo(() => (
    <View style={styles.empty}>
      <Text style={styles.emptyIcon}>📊</Text>
      <Text style={styles.emptyText}>ยังไม่มีข้อมูลสำหรับสร้างกราฟ</Text>
      <Text style={styles.emptySub}>เริ่มบันทึกวันนี้ แล้วกลับมาดูแนวโน้มได้เลย</Text>
    </View>
  ), []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>กราฟสรุปรายวัน</Text>
      <FlatList
        data={entries}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListEmptyComponent={empty}
        contentContainerStyle={entries.length === 0 ? styles.emptyContainer : styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={MoodColors.accent} />}
        showsVerticalScrollIndicator={false}
        initialNumToRender={4}
        maxToRenderPerBatch={6}
        windowSize={7}
        removeClippedSubviews
        ListFooterComponent={<View style={{ height: 24 }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: MoodColors.bg, padding: 16 },
  title: {
    fontSize: Math.min(24, width * 0.06),
    fontWeight: 'bold',
    color: MoodColors.accent,
    marginBottom: 12,
    textAlign: 'center',
  },
  list: { paddingBottom: 48 },
  emptyContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  date: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 8 },
  empty: { alignItems: 'center', padding: 24 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 18, color: '#666', fontWeight: '600', marginBottom: 4 },
  emptySub: { fontSize: 14, color: '#999', textAlign: 'center' },
});
