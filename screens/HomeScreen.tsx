// screens/HomeScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { MoodColors } from '../src/colors';

import {
  enableDailyNotifications,
  disableDailyNotifications,
  isNotificationEnabled,
  handleNotificationResponse,
  debugNotificationStatus, // เพิ่มฟังก์ชันดีบัก
} from '../services/NotificationService';

export default function HomeScreen({ navigation }: any) {
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const enabled = await isNotificationEnabled();
      setNotifEnabled(enabled);
      
      // Debug notification status เมื่อเปิดหน้า
      await debugNotificationStatus();
    })();
    
    // Setup notification response handler
    const subscription = handleNotificationResponse(navigation);
    
    // Cleanup subscription when component unmounts
    return () => subscription?.remove?.();
  }, [navigation]);

  const toggleNotification = async () => {
    if (loading) return;
    
    setLoading(true);
    try {
      if (notifEnabled) {
        // ปิดการแจ้งเตือน
        const success = await disableDailyNotifications();
        if (success) {
          setNotifEnabled(false);
          Alert.alert(
            'ปิดการแจ้งเตือนแล้ว',
            'คุณจะไม่ได้รับการแจ้งเตือนเวลา 17:00 อีกต่อไป',
            [{ text: 'ตกลง' }]
          );
        }
      } else {
        // เปิดการแจ้งเตือน
        const success = await enableDailyNotifications(17, 0);
        if (success) {
          setNotifEnabled(true);
          Alert.alert(
            'เปิดการแจ้งเตือนแล้ว ✅',
            'คุณจะได้รับการแจ้งเตือนทุกวันเวลา 17:00 น.',
            [{ text: 'ตกลง' }]
          );
        } else {
          // แสดงข้อความเมื่อไม่ได้รับอนุญาต
          Alert.alert(
            'ไม่สามารถเปิดการแจ้งเตือนได้',
            'กรุณาอนุญาตการแจ้งเตือนในการตั้งค่าของแอป',
            [
              { text: 'ยกเลิก' },
              {
                text: 'ไปที่การตั้งค่า',
                onPress: () => {
                  // สำหรับการไปที่การตั้งค่า (ต้องใช้ Linking)
                  // import { Linking } from 'react-native';
                  // Linking.openSettings();
                }
              }
            ]
          );
        }
      }
      
      // อัปเดต state ตามสถานะจริงใน storage
      const currentEnabled = await isNotificationEnabled();
      setNotifEnabled(currentEnabled);
      
    } catch (error) {
      console.error('Error toggling notification:', error);
      Alert.alert(
        'เกิดข้อผิดพลาด',
        'ไม่สามารถเปลี่ยนการตั้งค่าการแจ้งเตือนได้',
        [{ text: 'ตกลง' }]
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.backgroundDecoration} />
      <View style={styles.backgroundDecoration2} />
      
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Mood Tracker</Text>
          <View style={styles.titleUnderline} />
        </View>
        <Text style={styles.subtitle}>ติดตามอารมณ์ของคุณทุกวัน</Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.primaryButton]} 
          onPress={() => navigation.navigate('MorningMood')}
        >
          <View style={styles.buttonGlow} />
          <View style={styles.buttonContent}>
            <View style={styles.iconContainer}>
              <Text style={styles.buttonIcon}>➕</Text>
            </View>
            <Text style={styles.buttonText}>บันทึกอารมณ์วันนี้</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.secondaryButton]} 
          onPress={() => navigation.navigate('History')}
        >
          <View style={styles.buttonGlow} />
          <View style={styles.buttonContent}>
            <View style={styles.iconContainer}>
              <Text style={styles.buttonIcon}>📊</Text>
            </View>
            <Text style={styles.buttonText}>ประวัติย้อนหลัง</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.tertiaryButton]} 
          onPress={() => navigation.navigate('WeeklyGraph')}
        >
          <View style={styles.buttonGlow} />
          <View style={styles.buttonContent}>
            <View style={styles.iconContainer}>
              <Text style={styles.buttonIcon}>📈</Text>
            </View>
            <Text style={styles.buttonText}>สรุปรายสัปดาห์</Text>
          </View>
        </TouchableOpacity>

        {/* ✅ ปุ่มแจ้งเตือน - แก้ไขให้ทำงานได้ */}
        <TouchableOpacity 
          style={[
            styles.notificationContainer, 
            notifEnabled && styles.notificationActive,
            loading && styles.notificationLoading
          ]} 
          onPress={toggleNotification}
          activeOpacity={0.7}
          disabled={loading}
        >
          <View style={[styles.notificationGlow, notifEnabled && styles.notificationGlowActive]} />
          <View style={styles.notificationContent}>
            <View style={styles.notificationInfo}>
              <View style={[styles.notificationIconContainer, notifEnabled && styles.notificationIconActive]}>
                <Text style={styles.notificationIcon}>🔔</Text>
              </View>
              <View style={styles.notificationTextContainer}>
                <Text style={styles.notificationTitle}>การแจ้งเตือน</Text>
                <Text style={[styles.notificationSubtitle, notifEnabled && styles.notificationSubtitleActive]}>
                  {notifEnabled ? 'เปิดอยู่ - เวลา 17:00 น.' : 'ปิดอยู่'}
                </Text>
              </View>
            </View>
            
            {loading ? (
              <ActivityIndicator size="small" color={notifEnabled ? "#10B981" : "#B8C5D1"} />
            ) : (
              <View style={[styles.toggleSwitch, notifEnabled && styles.toggleSwitchActive]}>
                <View style={[styles.toggleThumb, notifEnabled && styles.toggleThumbActive]} />
              </View>
            )}
          </View>
        </TouchableOpacity>

        {/* ✅ ปุ่มดีบัก (สามารถลบออกได้เมื่อทดสอบเสร็จ) */}
        {__DEV__ && (
          <TouchableOpacity 
            style={styles.debugButton}
            onPress={debugNotificationStatus}
          >
            <Text style={styles.debugButtonText}>🐛 Debug Notifications</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#1A1D29',
    justifyContent: 'center', 
    alignItems: 'center',
    paddingHorizontal: 20,
    position: 'relative',
  },
  backgroundDecoration: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    backgroundColor: MoodColors.accent,
    borderRadius: 150,
    opacity: 0.05,
  },
  backgroundDecoration2: {
    position: 'absolute',
    bottom: -80,
    left: -80,
    width: 200,
    height: 200,
    backgroundColor: '#4A90E2',
    borderRadius: 100,
    opacity: 0.03,
  },
  header: { alignItems: 'center', marginBottom: 60 },
  titleContainer: { alignItems: 'center', marginBottom: 8 },
  title: { 
    fontSize: 42, 
    fontWeight: '800', 
    color: '#FFFFFF',
    textAlign: 'center', 
    letterSpacing: 1,
    textShadowColor: MoodColors.accent, 
    textShadowOffset: { width: 0, height: 0 }, 
    textShadowRadius: 20,
  },
  titleUnderline: {
    width: 60, 
    height: 4, 
    backgroundColor: MoodColors.accent, 
    borderRadius: 2, 
    marginTop: 8,
    shadowColor: MoodColors.accent, 
    shadowOffset: { width: 0, height: 0 }, 
    shadowOpacity: 0.8, 
    shadowRadius: 10,
  },
  subtitle: { 
    fontSize: 16, 
    color: '#B8C5D1', 
    textAlign: 'center', 
    opacity: 0.9, 
    fontWeight: '400', 
    letterSpacing: 0.5 
  },
  buttonContainer: { width: '100%', alignItems: 'center' },
  button: {
    paddingVertical: 20, 
    paddingHorizontal: 32, 
    borderRadius: 25, 
    marginVertical: 10, 
    width: '88%',
    position: 'relative', 
    overflow: 'hidden', 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, 
    shadowRadius: 16, 
    elevation: 12,
  },
  buttonGlow: { 
    position: 'absolute', 
    top: 0, 
    left: 0, 
    right: 0, 
    bottom: 0, 
    backgroundColor: 'rgba(255, 255, 255, 0.1)', 
    borderRadius: 25 
  },
  primaryButton: { 
    backgroundColor: MoodColors.accent, 
    borderWidth: 1, 
    borderColor: 'rgba(255, 255, 255, 0.1)' 
  },
  secondaryButton: { 
    backgroundColor: '#4A90E2', 
    borderWidth: 1, 
    borderColor: 'rgba(255, 255, 255, 0.1)' 
  },
  tertiaryButton: { 
    backgroundColor: '#7B68EE', 
    borderWidth: 1, 
    borderColor: 'rgba(255, 255, 255, 0.1)' 
  },
  buttonContent: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    position: 'relative', 
    zIndex: 1 
  },
  iconContainer: { 
    width: 40, 
    height: 40, 
    backgroundColor: 'rgba(255, 255, 255, 0.2)', 
    borderRadius: 20, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 16 
  },
  buttonIcon: { fontSize: 20 },
  buttonText: { 
    color: '#FFFFFF', 
    fontSize: 18, 
    fontWeight: '700', 
    textAlign: 'center', 
    letterSpacing: 0.5, 
    textShadowColor: 'rgba(0, 0, 0, 0.3)', 
    textShadowOffset: { width: 0, height: 1 }, 
    textShadowRadius: 2 
  },
  notificationContainer: {
    marginTop: 20, 
    paddingVertical: 16, 
    paddingHorizontal: 20, 
    borderRadius: 20, 
    width: '88%',
    backgroundColor: '#2A2F3A', 
    borderWidth: 1, 
    borderColor: 'rgba(255, 255, 255, 0.1)',
    position: 'relative', 
    overflow: 'hidden', 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, 
    shadowRadius: 8, 
    elevation: 6,
  },
  notificationActive: { 
    backgroundColor: '#1E3A2E', 
    borderColor: 'rgba(16, 185, 129, 0.3)', 
    shadowColor: '#10B981', 
    shadowOpacity: 0.3 
  },
  notificationLoading: {
    opacity: 0.7
  },
  notificationGlow: { 
    position: 'absolute', 
    top: 0, 
    left: 0, 
    right: 0, 
    bottom: 0, 
    backgroundColor: 'rgba(255, 255, 255, 0.05)', 
    borderRadius: 20 
  },
  notificationGlowActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  notificationContent: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    position: 'relative', 
    zIndex: 1 
  },
  notificationInfo: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    flex: 1 
  },
  notificationIconContainer: { 
    width: 36, 
    height: 36, 
    backgroundColor: 'rgba(255, 255, 255, 0.15)', 
    borderRadius: 18, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 12 
  },
  notificationIconActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  notificationIcon: { fontSize: 18, opacity: 0.9 },
  notificationTextContainer: { flex: 1 },
  notificationTitle: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: '#FFFFFF', 
    marginBottom: 2, 
    letterSpacing: 0.3 
  },
  notificationSubtitle: { 
    fontSize: 13, 
    color: '#B8C5D1', 
    opacity: 0.8, 
    fontWeight: '400' 
  },
  notificationSubtitleActive: {
    color: '#10B981',
    opacity: 1,
  },
  toggleSwitch: { 
    width: 48, 
    height: 28, 
    backgroundColor: '#404854', 
    borderRadius: 14, 
    padding: 2, 
    justifyContent: 'center', 
    borderWidth: 1, 
    borderColor: 'rgba(255, 255, 255, 0.1)' 
  },
  toggleSwitchActive: { 
    backgroundColor: '#10B981', 
    borderColor: 'rgba(16, 185, 129, 0.3)', 
    shadowColor: '#10B981', 
    shadowOffset: { width: 0, height: 0 }, 
    shadowOpacity: 0.4, 
    shadowRadius: 8 
  },
  toggleThumb: {
    width: 22, 
    height: 22, 
    backgroundColor: '#FFFFFF', 
    borderRadius: 11, 
    alignSelf: 'flex-start',
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.2, 
    shadowRadius: 4, 
    elevation: 3,
  },
  toggleThumbActive: { 
    alignSelf: 'flex-end', 
    backgroundColor: '#FFFFFF' 
  },
  // Debug button styles (สำหรับการทดสอบ)
  debugButton: {
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#FF6B6B',
    borderRadius: 20,
  },
  debugButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
});