/**
 * CircularProgress — Animated circular progress ring
 *
 * Uses react-native-svg for crisp vector rendering and
 * react-native-reanimated for smooth progress transitions.
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedProps,
  useDerivedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { Colors } from '../../constants/colors';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface CircularProgressProps {
  /** Outer diameter of the ring (px) */
  size: number;
  /** Thickness of the ring stroke */
  strokeWidth: number;
  /** Progress value from 0 → 1 */
  progress: number;
  /** Content rendered in the centre of the ring */
  children?: React.ReactNode;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  size,
  strokeWidth,
  progress,
  children,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  // Smooth animated progress value
  const animatedProgress = useDerivedValue(() =>
    withTiming(progress, { duration: 400, easing: Easing.out(Easing.cubic) }),
  );

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - animatedProgress.value),
  }));

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {/* Background track */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={Colors.border}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Foreground progress arc */}
        <AnimatedCircle
          cx={center}
          cy={center}
          r={radius}
          stroke={Colors.primary}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          // Rotate –90° so the arc starts from the top
          transform={`rotate(-90, ${center}, ${center})`}
        />
      </Svg>

      {/* Centre content overlay */}
      <View style={[StyleSheet.absoluteFill, styles.childrenContainer]}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  childrenContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
