# MoodTrackerApp

แอปพลิเคชันบันทึกอารมณ์รายวัน พัฒนาเป็นโปรเจกต์จบด้วย React Native, Expo และ TypeScript ผู้ใช้สามารถบันทึกอารมณ์ช่วงเช้า กิจกรรมระหว่างวัน อารมณ์ก่อนนอน ดูสรุปรายวัน ดูประวัติย้อนหลัง และดูแนวโน้มรายสัปดาห์ผ่านกราฟได้

โปรเจกต์นี้ออกแบบมาเพื่อช่วยให้ผู้ใช้สังเกตความเปลี่ยนแปลงของอารมณ์ตนเองจากข้อมูลรายวัน โดยไม่ใช่แค่การจดบันทึก แต่มีระบบคำนวณคะแนนพลังงานใจจากอารมณ์และกิจกรรม เพื่อแสดงผลเป็น insight ที่อ่านง่าย

## จุดประสงค์ของโปรเจกต์

- สร้าง mobile application สำหรับติดตามอารมณ์และกิจกรรมในชีวิตประจำวัน
- ฝึกออกแบบ flow การใช้งานแบบต่อเนื่อง ตั้งแต่การกรอกข้อมูลจนถึงการสรุปผล
- ใช้ local storage เพื่อเก็บประวัติอารมณ์โดยไม่ต้องพึ่ง backend
- นำข้อมูลที่ผู้ใช้กรอกมาคำนวณและแสดงผลเป็นกราฟ เพื่อช่วยให้เข้าใจแนวโน้มอารมณ์ของตนเอง
- ฝึกพัฒนาแอปด้วย React Native, TypeScript, navigation, chart visualization และ notification

## ฟีเจอร์หลัก

- บันทึกอารมณ์ตอนเช้าด้วยสีแทนอารมณ์ เช่น สดชื่น สงบ เฉย ๆ เครียด หงุดหงิด ว่างเปล่า และมืดมน
- แสดงคำอธิบายความหมายของสี เพื่อช่วยให้ผู้ใช้เลือกอารมณ์ได้ง่ายขึ้น
- บันทึกกิจกรรมระหว่างวัน แยกเป็นกิจกรรมเชิงบวก กิจกรรมเชิงลบ และกิจกรรมอื่น ๆ ที่ผู้ใช้กรอกเอง
- ให้คะแนนกิจกรรมเพิ่มเติมได้ในช่วง `-10` ถึง `+10` พร้อมระบบ clamp ค่าคะแนนเพื่อป้องกันข้อมูลผิดช่วง
- บันทึกอารมณ์ก่อนนอน เพื่อเปรียบเทียบความเปลี่ยนแปลงระหว่างเช้ากับก่อนนอน
- สรุปผลรายวันด้วย radar chart และคะแนนรวมจากอารมณ์กับกิจกรรม
- วิเคราะห์ระดับพลังงานใจรายวันเป็นระดับต่ำ กลาง หรือสูง พร้อมคำแนะนำเบื้องต้น
- ดูประวัติย้อนหลังพร้อม preview กราฟของแต่ละวัน
- ดูกราฟแนวโน้มรายสัปดาห์ และปลดล็อก insight รายสัปดาห์เมื่อมีข้อมูลครบ 7 วัน
- ตั้งค่าแจ้งเตือนรายวันเวลา 17:00 น. ผ่าน Expo Notifications
- รองรับ Android notification channel และการจัดการ permission ให้เหมาะกับการ build ขึ้น Play Store

## Tech Stack

- React Native
- Expo SDK 53
- TypeScript
- React Navigation Native Stack
- AsyncStorage
- Expo Notifications
- React Native SVG
- React Native Chart Kit
- Day.js
- EAS Build

## User Flow

1. ผู้ใช้เปิดแอปจากหน้า Home
2. เลือกบันทึกอารมณ์ของวันนี้
3. เลือกสีที่แทนอารมณ์ช่วงเช้า
4. บันทึกกิจกรรมระหว่างวันและคะแนนกิจกรรมเพิ่มเติม
5. เลือกสีที่แทนอารมณ์ก่อนนอน
6. แอปคำนวณคะแนนรวมและแสดงสรุปรายวัน
7. ผู้ใช้สามารถกลับมาดูประวัติย้อนหลังหรือดูแนวโน้มรายสัปดาห์ได้

## โครงสร้างโปรเจกต์

```text
MoodTrackerApp/
├── App.tsx
├── app.json
├── components/
│   ├── CustomRadarChart.tsx
│   ├── CustomRadarChartWeekly.tsx
│   └── LineChartWeekly.tsx
├── context/
│   └── MoodContext.tsx
├── screens/
│   ├── HomeScreen.tsx
│   ├── MorningMoodScreen.tsx
│   ├── ActivityLogScreen.tsx
│   ├── NightMoodScreen.tsx
│   ├── SummaryScreen.tsx
│   ├── HistoryScreen.tsx
│   ├── WeeklyGraphScreen.tsx
│   └── ColorMeaningScreen.tsx
├── services/
│   └── NotificationService.ts
├── types/
│   └── index.ts
└── utils/
    ├── activityScoreTable.ts
    ├── historyStorage.ts
    ├── mapMoodToScore.ts
    └── moodMeaningMap.ts
```

## Data Model

ข้อมูลหลักของแต่ละวันถูกเก็บเป็น `MoodEntry`

```ts
export type MoodEntry = {
  date: string;
  morningMood: MoodColor;
  nightMood: MoodColor;
  positiveActivities: string[];
  negativeActivities: string[];
  otherActivityScore: number;
  otherActivityNote: string;
  totalScore: number;
};
```

ข้อมูลถูกจัดเก็บใน `AsyncStorage` ภายใต้ key `mood_entries` โดยมี utility สำหรับเพิ่มข้อมูลใหม่ อัปเดตข้อมูล ดึงข้อมูลตามวันที่ ดึงทั้งหมด และจัดกลุ่มข้อมูลเป็นสัปดาห์

## Scoring Logic

โปรเจกต์มีระบบแปลงอารมณ์และกิจกรรมให้เป็นคะแนนเพื่อใช้วิเคราะห์ผล

- อารมณ์ถูก map เป็นคะแนน `1-7`
  - green = 7
  - blue = 6
  - yellow = 5
  - orange = 4
  - red = 3
  - gray = 2
  - black = 1
- คะแนนกิจกรรมมาจากตาราง `activityScoreTable.ts`
- คะแนนกิจกรรมรวมถูกจำกัดช่วงเพื่อไม่ให้ส่งผลเกินไป
- คะแนนกิจกรรมอื่น ๆ ที่ผู้ใช้กรอกเองถูกจำกัดช่วง `-10` ถึง `+10` แล้ว normalize เป็นช่วงประมาณ `-3` ถึง `+3`
- คะแนนรวมรายวันคำนวณจาก:

```text
morning mood score + night mood score + activity score + normalized other activity score
```

จากนั้นนำไปแสดงเป็นเปอร์เซ็นต์และ insight รายวันหรือรายสัปดาห์

## Screens

- `HomeScreen` - หน้าแรก เลือกบันทึกวันนี้ ดูประวัติ ดูกราฟรายสัปดาห์ และเปิด/ปิดแจ้งเตือน
- `MorningMoodScreen` - เลือกอารมณ์ตอนเช้าพร้อม modal อธิบายความหมายของสี
- `ActivityLogScreen` - เลือกกิจกรรมเชิงบวก/ลบ กรอกกิจกรรมอื่น และให้คะแนนเพิ่มเติม
- `NightMoodScreen` - เลือกอารมณ์ก่อนนอนก่อนสรุปผล
- `SummaryScreen` - แสดง radar chart, breakdown คะแนน, insight และคำแนะนำรายวัน
- `HistoryScreen` - แสดงรายการประวัติย้อนหลังพร้อม preview กราฟ
- `WeeklyGraphScreen` - แสดง line chart รายสัปดาห์ ค่าเฉลี่ย แนวโน้ม และ insight เมื่อข้อมูลครบ 7 วัน
- `ColorMeaningScreen` - แสดงความหมายของสีที่ใช้แทนอารมณ์

## Notification

ระบบแจ้งเตือนอยู่ใน `services/NotificationService.ts`

- ขอ permission สำหรับ notification
- สร้าง Android notification channel
- ตั้งแจ้งเตือนรายวันเวลา 17:00 น.
- เก็บสถานะ notification และ notification id ใน AsyncStorage
- resync schedule เมื่อเปิดแอป เพื่อป้องกัน schedule หาย
- มี debug helper สำหรับตรวจสอบ permission, id, เวลา และจำนวน notification ที่ถูกตั้งไว้

## วิธีติดตั้งและรันโปรเจกต์

ติดตั้ง dependencies

```bash
npm install
```

รัน Expo development server

```bash
npm start
```

รันบน Android

```bash
npm run android
```

รันบน iOS

```bash
npm run ios
```

รัน type check

```bash
npm run typecheck
```

หมายเหตุ: โปรเจกต์นี้ใช้ Expo และ React Native บางฟีเจอร์ เช่น notification ควรทดสอบบนอุปกรณ์จริงหรือ emulator เพื่อให้เห็นพฤติกรรมใกล้เคียง production

