/**
 * WeeklyChart — Vertical bar chart for 7 days of focus data
 */
import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { Colors, Spacing, FontSize } from '../../constants/colors';

export interface DayData {
  day: string;
  minutes: number;
}

interface WeeklyChartProps {
  data: DayData[];
}

const CHART_HEIGHT = 150;
const BAR_GAP = 6;

const AnimatedRect = Animated.createAnimatedComponent(Rect);

function AnimatedBar({
  x,
  width,
  maxHeight,
  targetHeight,
  index,
}: {
  x: number;
  width: number;
  maxHeight: number;
  targetHeight: number;
  index: number;
}) {
  const animatedHeight = useSharedValue(0);

  useEffect(() => {
    animatedHeight.value = withDelay(
      index * 80,
      withTiming(targetHeight, {
        duration: 600,
        easing: Easing.out(Easing.cubic),
      })
    );
  }, [targetHeight, index]);

  const animatedProps = useAnimatedProps(() => {
    return {
      height: animatedHeight.value,
      y: maxHeight - animatedHeight.value,
    };
  });

  return (
    <AnimatedRect
      x={x}
      rx={4}
      ry={4}
      width={width}
      fill={Colors.primary}
      animatedProps={animatedProps}
    />
  );
}

export function WeeklyChart({ data }: WeeklyChartProps) {
  const maxMinutes = Math.max(...data.map((d) => d.minutes), 1);

  const barCount = data.length;
  // We compute bar width dynamically; SVG viewBox width is 100%
  // Use a fixed internal width for calculations
  const svgWidth = 320;
  const totalGaps = (barCount - 1) * BAR_GAP;
  const barWidth = (svgWidth - totalGaps) / barCount;

  return (
    <View style={styles.container}>
      <View style={styles.chartWrapper}>
        <Svg width="100%" height={CHART_HEIGHT} viewBox={`0 0 ${svgWidth} ${CHART_HEIGHT}`}>
          {/* Background bars (track) */}
          {data.map((_, i) => {
            const x = i * (barWidth + BAR_GAP);
            return (
              <Rect
                key={`bg-${i}`}
                x={x}
                y={0}
                width={barWidth}
                height={CHART_HEIGHT}
                rx={4}
                ry={4}
                fill={Colors.primaryMuted}
              />
            );
          })}

          {/* Animated fill bars */}
          {data.map((d, i) => {
            const x = i * (barWidth + BAR_GAP);
            const barHeight = (d.minutes / maxMinutes) * (CHART_HEIGHT - 8);
            return (
              <AnimatedBar
                key={`bar-${i}`}
                x={x}
                width={barWidth}
                maxHeight={CHART_HEIGHT}
                targetHeight={barHeight}
                index={i}
              />
            );
          })}
        </Svg>
      </View>

      {/* Day labels */}
      <View style={styles.labels}>
        {data.map((d, i) => (
          <View key={`label-${i}`} style={[styles.labelWrapper, { width: `${100 / barCount}%` }]}>
            <Text style={styles.dayLabel}>{d.day}</Text>
            {d.minutes > 0 && (
              <Text style={styles.minuteLabel}>{d.minutes}m</Text>
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: Spacing.sm,
  },
  chartWrapper: {
    height: CHART_HEIGHT,
    paddingHorizontal: Spacing.xs,
  },
  labels: {
    flexDirection: 'row',
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  labelWrapper: {
    alignItems: 'center',
  },
  dayLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: '500',
  },
  minuteLabel: {
    color: Colors.textMuted,
    fontSize: 9,
    marginTop: 2,
  },
});
