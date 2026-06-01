import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Polygon, Line, Circle, Text as SvgText } from 'react-native-svg';

const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CustomRadarChartWeekly({ data }: { data: { label: string, values: number[], color: string }[] }) {
  const size = Dimensions.get('window').width - 40;
  const center = size / 2;
  const levels = 5;
  const maxValue = 100;
  const angleSlice = (Math.PI * 2) / days.length;
  const radius = size / 2 - 50;

  const normalizeScore = (value: number) => Number(Math.min(Math.max(value, 0), 100).toFixed(2));

  const getPoint = (value: number, i: number) => {
    const angle = i * angleSlice - Math.PI / 2;
    const distance = (value / maxValue) * radius;
    const x = center + distance * Math.cos(angle);
    const y = center + distance * Math.sin(angle);
    return { x, y };
  };

  const renderLevels = () => {
    const levelsArray = [];
    for (let level = 1; level <= levels; level++) {
      const points = days
        .map((_, i) => {
          const angle = i * angleSlice - Math.PI / 2;
          const distance = (level / levels) * radius;
          const x = center + distance * Math.cos(angle);
          const y = center + distance * Math.sin(angle);
          return `${x},${y}`;
        })
        .join(' ');
      levelsArray.push(
        <Polygon
          key={`level-${level}`}
          points={points}
          stroke="#ccc"
          strokeWidth="1"
          fill="none"
        />
      );
    }
    return levelsArray;
  };

  const renderAxes = () => {
    return days.map((_, i) => {
      const angle = i * angleSlice - Math.PI / 2;
      const x = center + radius * Math.cos(angle);
      const y = center + radius * Math.sin(angle);
      return (
        <Line
          key={`axis-${i}`}
          x1={center}
          y1={center}
          x2={x}
          y2={y}
          stroke="#ccc"
          strokeWidth="1"
        />
      );
    });
  };

  const renderLabels = () => {
    return days.map((day, i) => {
      const angle = i * angleSlice - Math.PI / 2;
      const x = center + (radius + 20) * Math.cos(angle);
      const y = center + (radius + 20) * Math.sin(angle);
      return (
        <SvgText
          key={`label-${i}`}
          x={x}
          y={y}
          fill="#333"
          fontSize="12"
          fontWeight="bold"
          textAnchor="middle"
          alignmentBaseline="middle"
        >
          {day}
        </SvgText>
      );
    });
  };

  const renderData = () => {
    return data.map((week, index) => {
      const pointsArray = week.values.map((v, i) => getPoint(normalizeScore(v), i));
      const points = pointsArray.map(p => `${p.x},${p.y}`).join(' ');

      return (
        <React.Fragment key={`week-${index}`}>
          <Polygon
            points={points}
            fill={week.color}
            stroke={week.color}
            strokeWidth="2"
            fillOpacity="0.15"
          />
          {pointsArray.map((p, i) => (
            <Circle
              key={`dot-${index}-${i}`}
              cx={p.x}
              cy={p.y}
              r="3"
              fill={week.color}
            />
          ))}
        </React.Fragment>
      );
    });
  };

  return (
    <View style={styles.container}>
      <Svg width={size} height={size}>
        {renderLevels()}
        {renderAxes()}
        {renderLabels()}
        {renderData()}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 10,
  },
});