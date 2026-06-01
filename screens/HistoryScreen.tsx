// screens/HistoryScreen.tsx
import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  FlatList,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { MoodColors } from '../src/colors';                  // ⬅️ แก้ path
import { MoodEntry } from '../types';                         // ⬅️ แก้ path (มีไฟล์ให้ด้านล่าง)
import { getAllEntries } from '../utils/historyStorage';      // ⬅️ แก้ path
import CustomRadarChart from '../components/CustomRadarChart';// ⬅️ แก้ path

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function HistoryScreen({ navigation }: any) {
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadEntries = useCallback(async () => {
    const data = await getAllEntries();
    const sorted = data.sort(
      (a: MoodEntry, b: MoodEntry) => b.date.localeCompare(a.date) // ⬅️ ใส่ชนิดชัดเจน
    );
    setEntries(sorted);
  }, []);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      (async () => {
        if (!isActive) return;
        await loadEntries();
      })();
      return () => { isActive = false; };
    }, [loadEntries])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadEntries();
    setRefreshing(false);
  }, [loadEntries]);

  const goToSummary = useCallback(
    (date: string) => navigation.navigate('Summary', { date }),
    [navigation]
  );

  const renderItem = useCallback(
    ({ item }: { item: MoodEntry }) => (
      <TouchableOpacity
        style={styles.card}
        onPress={() => goToSummary(item.date)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.dateSection}>
            <Text style={styles.dateText}>{item.date}</Text>
            <Text style={styles.tapHint}>แตะเพื่อดูรายละเอียด</Text>
          </View>

          <View style={styles.moodSection}>
            <Text style={styles.moodLabel}>อารมณ์</Text>
            <View style={styles.moodRow}>
              <View style={styles.moodIndicator}>
                <View
                  style={[
                    styles.colorCircle,
                    { backgroundColor: MoodColors[item.morningMood] },
                  ]}
                />
                <Text style={styles.moodTime}>เช้า</Text>
              </View>
              <View style={styles.moodIndicator}>
                <View
                  style={[
                    styles.colorCircle,
                    { backgroundColor: MoodColors[item.nightMood] },
                  ]}
                />
                <Text style={styles.moodTime}>เย็น</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.chartPreview}>
          <CustomRadarChart entry={item} />
        </View>
      </TouchableOpacity>
    ),
    [goToSummary]
  );

  const keyExtractor = useCallback((item: MoodEntry) => item.date, []);

  const listEmpty = useMemo(
    () => (
      <View style={styles.emptyState}>
        <Text style={styles.emptyIcon}>📝</Text>
        <Text style={styles.noData}>ยังไม่มีข้อมูลย้อนหลัง</Text>
        <Text style={styles.noDataSubtitle}>เริ่มบันทึกอารมณ์ของคุณวันนี้</Text>
      </View>
    ),
    []
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>ประวัติย้อนหลัง</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{entries.length} วัน</Text>
        </View>
      </View>

      <FlatList
        data={entries}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={entries.length === 0 ? styles.emptyContainer : styles.listContainer}
        ListEmptyComponent={listEmpty}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={MoodColors.accent} />
        }
        showsVerticalScrollIndicator={false}
        initialNumToRender={5}
        maxToRenderPerBatch={8}
        windowSize={7}
        removeClippedSubviews
        ListFooterComponent={<View style={{ height: 24 }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MoodColors.bg,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },
  title: {
    fontSize: Math.min(28, screenWidth * 0.07),
    fontWeight: 'bold',
    color: MoodColors.accent,
  },
  countBadge: {
    backgroundColor: MoodColors.accent,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  countText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flexGrow: 1,
    paddingBottom: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    paddingBottom: 50,
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 20,
  },
  noData: {
    fontSize: 20,
    color: '#666',
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 8,
  },
  noDataSubtitle: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  dateSection: { flexShrink: 1 },
  dateText: {
    fontSize: Math.min(18, screenWidth * 0.045),
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  tapHint: { fontSize: 12, color: '#888' },
  moodSection: { alignItems: 'flex-end' },
  moodLabel: { fontSize: 12, color: '#666', marginBottom: 8 },
  moodRow: { flexDirection: 'row' },
  moodIndicator: { alignItems: 'center', marginLeft: 12 },
  colorCircle: {
    width: Math.min(20, screenWidth * 0.05),
    height: Math.min(20, screenWidth * 0.05),
    borderRadius: 999,
    marginBottom: 4,
    borderWidth: 2,
    borderColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  moodTime: { fontSize: 12, color: '#555' },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 14 },
  chartPreview: { alignItems: 'center' },
});
