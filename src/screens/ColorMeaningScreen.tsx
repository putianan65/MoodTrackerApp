import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MoodMeaningList } from '../components/mood/MoodMeaningList';
import { PaperScreen } from '../components/ui/PaperScreen';
import { Pill } from '../components/ui/Pill';
import { TopBar } from '../components/ui/TopBar';
import { Txt } from '../components/ui/Txt';
import { useResponsive } from '../hooks/useResponsive';
import { colors } from '../theme';

export default function ColorMeaningScreen() {
  const r = useResponsive();
  const insets = useSafeAreaInsets();
  const inner = Math.min(r.width - r.gutter * 2, 640);

  return (
    <PaperScreen>
      <View style={{ paddingHorizontal: r.gutter - 4, paddingTop: 8 }}>
        <TopBar label="Mood Tracker" sublabel="ความหมายของสี" />
      </View>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ width: inner }}>
          <Pill>7 สี · 7 อารมณ์</Pill>
          <Txt variant="headline" size={r.clampVw(28, 8, 40)} style={styles.title}>
            {'ทุกความรู้สึก\nมีสีของมัน'}
          </Txt>
          <Txt variant="body" color={colors.muted} style={styles.lead}>
            เรียงจากพลังบวกมากที่สุด (7 คะแนน) ไปจนถึงน้อยที่สุด (1 คะแนน) อ้างอิงจากงานวิจัยด้านสีและสุขภาพจิตในประเทศไทย
          </Txt>
          <MoodMeaningList />
        </View>
      </ScrollView>
    </PaperScreen>
  );
}

const styles = StyleSheet.create({
  scroll: { alignItems: 'center', paddingTop: 12 },
  title: { marginTop: 16 },
  lead: { marginTop: 8, marginBottom: 22 },
});
