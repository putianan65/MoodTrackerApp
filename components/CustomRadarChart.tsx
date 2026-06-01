import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Path, Circle, Line } from 'react-native-svg';
import { MoodEntry } from '../types';
import { moodToScore } from '../utils/mapMoodToScore';
import { activityScores } from '../utils/activityScoreTable';

const size = 240;
const center = size / 2;
const radius = size / 2 - 40;
const categories = ['Morning', 'Night', 'Activities', 'Other', 'Energy'];
const angleSlice = (2 * Math.PI) / categories.length;

const normalize = (val: number) => {
  const n = Number(val);
  if (!isFinite(n)) return 0;
  return Math.max(0, Math.min(100, n));
};

export default function CustomRadarChart({ entry }: { entry: MoodEntry }) {
  // 1. Mood (1–7)
  const moodMorning = normalize((moodToScore(entry.morningMood) / 7) * 100);
  const moodNight = normalize((moodToScore(entry.nightMood) / 7) * 100);

  // 2. Activity: รวม + และ - แล้ว clamp เป็น -3 ถึง +3
  const activityRaw = [...entry.positiveActivities, ...entry.negativeActivities].reduce(
    (sum, act) => sum + (activityScores[act] || 0),
    0
  );
  const activityClamped = Math.max(-3, Math.min(3, activityRaw));
  const activity = normalize((activityClamped / 3) * 100);

  // 3. OtherActivity: clamp จาก -10 ถึง +10 → normalize เป็น -3 ถึง +3
  const rawOther = entry.otherActivityScore ?? 0;
  const clampedOther = Math.max(-10, Math.min(10, rawOther));
  const normalizedOther = (clampedOther / 10) * 3; // ✅ normalize ให้ max = ±3
  const other = normalize((normalizedOther / 3) * 100);

  // 4. รวม Energy ทั้งหมด = mood (2–14) + activityClamped + normalizedOther
  const rawMoodScore = moodToScore(entry.morningMood) + moodToScore(entry.nightMood);
  const totalRaw = rawMoodScore + activityClamped + normalizedOther;
  const energy = normalize((totalRaw / 20) * 100);

  const values = [moodMorning, moodNight, activity, other, energy];

  const getCoord = (i: number, value: number) => {
    const angle = angleSlice * i - Math.PI / 2;
    const r = (value / 100) * radius;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return { x, y };
  };

  const getPath = (value: number) => {
    const coords = categories.map((_, i) => getCoord(i, value));
    return coords.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + ' Z';
  };

  const getPathFromValues = (data: number[]) => {
    return data
      .map((v, i) => {
        const { x, y } = getCoord(i, v);
        return `${i === 0 ? 'M' : 'L'}${x},${y}`;
      })
      .join(' ') + ' Z';
  };

  const filledPath = getPathFromValues(values);

  return (
    <View style={{ alignItems: 'center', marginVertical: 20 }}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          {[0.25, 0.5, 0.75, 1].map((f, i) => (
            <Path
              key={i}
              d={getPath(f * 100)}
              stroke="#E5E7EB"
              strokeWidth={1}
              fill="none"
            />
          ))}

          {categories.map((_, i) => {
            const { x, y } = getCoord(i, 100);
            return (
              <Line
                key={i}
                x1={center}
                y1={center}
                x2={x}
                y2={y}
                stroke="#D1D5DB"
                strokeWidth={1}
              />
            );
          })}

          <Path
            d={filledPath}
            fill="#C084FC"
            fillOpacity={0.4}
            stroke="#9333EA"
            strokeWidth={2}
          />

          {values.map((v, i) => {
            const { x, y } = getCoord(i, v);
            return <Circle key={i} cx={x} cy={y} r={4} fill="#9333EA" />;
          })}
        </Svg>

        {/* Overlay Labels */}
        {categories.map((label, i) => {
          const { x, y } = getCoord(i, 125);
          let offsetX = 0;
          let offsetY = 0;

          switch (label) {
            case 'Morning':
              offsetX = -16; offsetY = -20;
              break;
            case 'Night':
              offsetX = 10; offsetY = -2;
              break;
            case 'Activities':
              offsetX = 10; offsetY = 6;
              break;
            case 'Other':
              offsetX = -45; offsetY = 10;
              break;
            case 'Energy':
              offsetX = -45; offsetY = -6;
              break;
          }

          return (
            <View
              key={`label-${i}`}
              style={{
                position: 'absolute',
                left: x + offsetX,
                top: y + offsetY,
                maxWidth: 80,
              }}
            >
              <Text style={{ fontSize: 11, color: '#374151' }}>{label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
