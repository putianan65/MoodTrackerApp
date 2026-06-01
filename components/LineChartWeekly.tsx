// ✅ LineChartWeekly.tsx (ปรับปรุง: แก้ไขปัญหาและทำให้ดีขึ้น)

import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Line, Circle, Text as SvgText, Polyline, Defs, LinearGradient, Stop, Path } from 'react-native-svg';

const chartWidth = 320;
const chartHeight = 180;
const padding = 32;

export default function LineChartWeekly({ data, labels }: { data: number[]; labels: string[] }) {
  // ป้องกันกรณีข้อมูลว่าง
  if (!data || data.length === 0) {
    return (
      <View style={{ alignItems: 'center' }}>
        <Text style={{ color: '#666', fontSize: 14 }}>ไม่มีข้อมูล</Text>
      </View>
    );
  }

  const maxValue = 100;
  const stepX = (chartWidth - padding * 2) / Math.max(data.length - 1, 1);

  const getY = (value: number) =>
    padding + ((maxValue - value) / maxValue) * (chartHeight - padding * 2);

  const points = data.map((v, i) => `${padding + i * stepX},${getY(v)}`).join(' ');

  const fillPath = data.length > 1
    ? data.map((v, i) => {
        const x = padding + i * stepX;
        const y = getY(v);
        return `${i === 0 ? 'M' : 'L'}${x},${y}`;
      }).join(' ') + ` L${padding + (data.length - 1) * stepX},${chartHeight - padding} L${padding},${chartHeight - padding} Z`
    : '';

  const yTicks = [0, 25, 50, 75, 100];

  return (
    <View style={{ alignItems: 'center' }}>
      <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: 10, height: 10, backgroundColor: '#9333EA', borderRadius: 5, marginRight: 6 }} />
          <Text style={{ color: '#333', fontSize: 12 }}>พลังงานของคุณ</Text>
        </View>
      </View>

      <Svg width={chartWidth} height={chartHeight}>
        {/* เส้นแกน Y + label */}
        {yTicks.map((v, i) => {
          const y = getY(v);
          return (
            <React.Fragment key={i}>
              <Line
                x1={padding}
                y1={y}
                x2={chartWidth - padding}
                y2={y}
                stroke="#E5E7EB"
                strokeWidth={1}
                strokeDasharray="4"
              />
              <SvgText
                x={padding - 8}
                y={y + 4}
                fontSize="10"
                fill="#888"
                textAnchor="end"
              >
                {v}
              </SvgText>
            </React.Fragment>
          );
        })}

        {/* พื้นกราฟ gradient */}
        <Defs>
          <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#C084FC" stopOpacity={0.3} />
            <Stop offset="100%" stopColor="#C084FC" stopOpacity={0} />
          </LinearGradient>
        </Defs>

        {fillPath && (
          <Path d={fillPath} fill="url(#grad)" />
        )}

        {/* เส้นกราฟแบบไม่มีจุด */}
        <Polyline
          points={points}
          fill="none"
          stroke="#9333EA"
          strokeWidth={3}
        />

        {/* จุด (วาดเฉพาะตรงนี้ เพื่อหลีกเลี่ยงการซ้ำซ้อน) */}
        {data.map((v, i) => (
          <Circle
            key={i}
            cx={padding + i * stepX}
            cy={getY(v)}
            r={5}
            fill="#9333EA"
          />
        ))}

        {/* Label แกน X */}
        {labels.map((label, i) => (
          <SvgText
            key={i}
            x={padding + i * stepX}
            y={chartHeight - padding + 16}
            fontSize="12"
            fill="#374151"
            textAnchor="middle"
          >
            {label}
          </SvgText>
        ))}
      </Svg>
    </View>
  );
}